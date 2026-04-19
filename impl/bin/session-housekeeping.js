#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(os.homedir(), '.openclaw', 'agents', 'main', 'sessions');
const STATE_DIR = path.join(process.env.OPENCLAW_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace'), 'state', 'sessions');
const REPORT_FILE = path.join(STATE_DIR, 'housekeeping-report.json');
const DAYS_TO_KEEP_AUX = Number(process.env.OPENCLAW_SESSION_AUX_DAYS || 3);

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function ageDays(stat) { return (Date.now() - stat.mtimeMs) / 86400000; }
function listFiles() {
  if (!fs.existsSync(ROOT)) return [];
  return fs.readdirSync(ROOT).map(name => {
    const file = path.join(ROOT, name);
    const stat = fs.statSync(file);
    return { name, file, stat, ageDays: ageDays(stat) };
  });
}
function classify(name) {
  if (name === 'sessions.json') return 'index';
  if (name.endsWith('.jsonl')) return 'session';
  if (name.includes('.checkpoint.')) return 'checkpoint';
  if (name.includes('.reset.')) return 'reset';
  if (name.endsWith('.jsonl.lock')) return 'lock';
  if (name.endsWith('.codex-app-server.json')) return 'sidecar';
  return 'other';
}
function summary(files) {
  const counts = {};
  for (const f of files) counts[classify(f.name)] = (counts[classify(f.name)] || 0) + 1;
  return counts;
}
function cleanup(files) {
  const removed = [];
  for (const f of files) {
    const kind = classify(f.name);
    const removable = kind === 'checkpoint' || kind === 'reset';
    if (removable && f.ageDays >= DAYS_TO_KEEP_AUX) {
      fs.unlinkSync(f.file);
      removed.push({ name: f.name, kind, ageDays: Number(f.ageDays.toFixed(2)) });
    }
  }
  return removed;
}
function report() {
  const files = listFiles();
  const payload = {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    keepAuxDays: DAYS_TO_KEEP_AUX,
    totalFiles: files.length,
    counts: summary(files),
    oldestAuxDays: Math.max(0, ...files.filter(f => ['checkpoint','reset'].includes(classify(f.name))).map(f => f.ageDays), 0)
  };
  ensureDir(STATE_DIR);
  fs.writeFileSync(REPORT_FILE, JSON.stringify(payload, null, 2));
  return payload;
}
function run() {
  const before = listFiles();
  const removed = cleanup(before);
  const after = report();
  console.log(JSON.stringify({ ok: true, removed, report: after }, null, 2));
}
function status() {
  console.log(JSON.stringify(report(), null, 2));
}
const cmd = process.argv[2] || 'status';
if (cmd === 'run') run();
else status();
