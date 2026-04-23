#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const SESSIONS_JSON = path.join(os.homedir(), '.openclaw', 'agents', 'main', 'sessions', 'sessions.json');
const WARN = Number(process.env.OPENCLAW_SESSION_WARN_PCT || 50);
const ALERT = Number(process.env.OPENCLAW_SESSION_ALERT_PCT || 70);
const CRIT = Number(process.env.OPENCLAW_SESSION_CRIT_PCT || 85);

function load() {
  if (!fs.existsSync(SESSIONS_JSON)) return null;
  return JSON.parse(fs.readFileSync(SESSIONS_JSON, 'utf8'));
}

function extractSessions(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.sessions)) return data.sessions;
  if (Array.isArray(data.items)) return data.items;
  if (typeof data === 'object') {
    return Object.entries(data).map(([key, value]) => ({
      key,
      ...(value && typeof value === 'object' ? value : {})
    }));
  }
  return [];
}

function pct(item) {
  const total = item.contextWindow || item.maxContextTokens || item.maxTokens || 128000;
  // sessions.json only stores session metadata for many entries; totalTokens/contextTokens
  // can be absent or hold placeholder values (for example 200000 for a model limit),
  // which creates false 100%+ pressure alerts. Prefer explicit usage fields and ignore
  // impossible/placeholder values that are >= total context window.
  const candidates = [
    item.tokensUsed,
    item.usageTokens,
    item.promptTokens,
    item.completionTokens && item.promptTokens ? item.completionTokens + item.promptTokens : null,
    item.totalTokensFresh,
    item.contextTokens,
    item.totalTokens,
    item.tokens
  ].filter((v) => Number.isFinite(v) && v >= 0);

  const used = candidates.find((v) => v > 0 && v < total) || 0;
  if (!total) return null;
  return Math.round((used / total) * 100);
}

function level(p) {
  if (p == null) return 'unknown';
  if (p >= CRIT) return 'critical';
  if (p >= ALERT) return 'alert';
  if (p >= WARN) return 'warn';
  return 'ok';
}

const data = load();
const sessions = extractSessions(data)
  .map((s) => {
    const p = pct(s);
    return {
      key: s.key || s.sessionKey || s.id || 'unknown',
      sessionId: s.sessionId || null,
      model: s.model || s.modelId || null,
      provider: s.modelProvider || null,
      totalTokens: s.tokensUsed || s.usageTokens || s.promptTokens || s.contextTokens || s.totalTokensFresh || 0,
      compactionCount: s.compactionCount || 0,
      updatedAt: s.updatedAt || null,
      usedPct: p,
      level: level(p)
    };
  })
  .sort((a, b) => (b.usedPct || 0) - (a.usedPct || 0));

console.log(JSON.stringify({
  thresholds: { warn: WARN, alert: ALERT, critical: CRIT },
  sessions,
  hot: sessions.filter((s) => s.level !== 'ok' && s.level !== 'unknown')
}, null, 2));
