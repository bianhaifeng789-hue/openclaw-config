#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const HEARTBEAT_STATE = path.join(WORKSPACE, 'memory', 'heartbeat-state.json');
const SESSION_PRESSURE = path.join(WORKSPACE, 'impl', 'bin', 'session-pressure.js');

function run(command, opts = {}) {
  try {
    const out = execSync(command, {
      encoding: 'utf8',
      cwd: WORKSPACE,
      timeout: opts.timeout || 30000,
      env: { ...process.env, OPENCLAW_WORKSPACE: WORKSPACE }
    });
    return { ok: true, output: (out || '').trim() };
  } catch (e) {
    return {
      ok: false,
      output: ((e.stdout || e.stderr || e.message || '') + '').trim()
    };
  }
}

function loadJson(file, fallback = null) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function summarizeGateway() {
  const res = run('openclaw gateway status', { timeout: 10000 });
  const text = res.output || '';
  return {
    ok: res.ok,
    state: (text.match(/state\s+(\w+)/i) || [])[1] || null,
    pid: Number((text.match(/pid\s+(\d+)/i) || [])[1] || 0) || null,
    port: Number((text.match(/port\s+(\d+)/i) || [])[1] || 0) || null,
    rpcProbe: (text.match(/RPC probe:\s*(\w+)/i) || [])[1] || null,
    summary: text.split('\n').slice(0, 8).join('\n')
  };
}

function summarizeSessionPressure() {
  const res = run(`node "${SESSION_PRESSURE}"`, { timeout: 10000 });
  if (!res.ok) {
    return { ok: false, hotCount: null, hottest: [], error: res.output };
  }

  try {
    const data = JSON.parse(res.output);
    const sessions = Array.isArray(data.sessions) ? data.sessions : [];
    const hot = Array.isArray(data.hot) ? data.hot : [];
    return {
      ok: true,
      thresholds: data.thresholds || null,
      sessionCount: sessions.length,
      hotCount: hot.length,
      hottest: sessions.slice(0, 3).map((s) => ({
        key: s.key,
        usedPct: s.usedPct,
        level: s.level,
        compactionCount: s.compactionCount,
        updatedAt: s.updatedAt
      }))
    };
  } catch {
    return { ok: false, hotCount: null, hottest: [], error: 'invalid session-pressure output' };
  }
}

function summarizeHeartbeatState() {
  const data = loadJson(HEARTBEAT_STATE, null);
  if (!data) {
    return { ok: false, exists: false };
  }

  return {
    ok: true,
    exists: true,
    lastChecks: data.lastChecks || {},
    lastNotices: data.lastNotices || {},
    notes: data.notes || {}
  };
}

function summarizeDoctor() {
  const res = run('openclaw doctor --non-interactive', { timeout: 60000 });
  return {
    ok: res.ok,
    summary: (res.output || '').split('\n').slice(-20).join('\n')
  };
}

function buildOverall(gateway, sessionPressure) {
  if (!gateway.ok) return 'needs_attention';
  if ((gateway.state && gateway.state !== 'active') || (gateway.rpcProbe && gateway.rpcProbe !== 'ok')) return 'needs_attention';
  if (sessionPressure.ok && (sessionPressure.hotCount || 0) > 0) return 'watch';
  return 'ok';
}

function main() {
  const includeDoctor = process.argv.includes('--doctor');

  const gateway = summarizeGateway();
  const sessionPressure = summarizeSessionPressure();
  const heartbeat = summarizeHeartbeatState();
  const doctor = includeDoctor ? summarizeDoctor() : { skipped: true };

  const result = {
    generatedAt: new Date().toISOString(),
    workspace: WORKSPACE,
    mode: includeDoctor ? 'full-lite' : 'lite',
    overall: buildOverall(gateway, sessionPressure),
    gateway,
    sessionPressure,
    heartbeat,
    doctor
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
