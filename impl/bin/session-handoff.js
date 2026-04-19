#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const SESSIONS_JSON = path.join(os.homedir(), '.openclaw', 'agents', 'main', 'sessions', 'sessions.json');
const OUT_DIR = path.join(process.env.OPENCLAW_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace'), 'state', 'sessions');
const OUT_FILE = path.join(OUT_DIR, 'session-handoff.md');
const TARGET_KEY = process.env.OPENCLAW_SESSION_KEY || 'agent:main:main';
const MAX_LINES = Number(process.env.OPENCLAW_HANDOFF_LINES || 80);

function readJson(p, fallback = null) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function loadSessionMeta() {
  const data = readJson(SESSIONS_JSON, {});
  const meta = data[TARGET_KEY];
  if (!meta) throw new Error(`Session key not found: ${TARGET_KEY}`);
  return { key: TARGET_KEY, ...meta };
}
function tailLines(file, maxLines) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.trim().split('\n');
  return lines.slice(-maxLines);
}
function parseRecords(lines) {
  const out = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      out.push(obj);
    } catch {}
  }
  return out;
}
function textFromContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(part => {
      if (typeof part === 'string') return part;
      if (part && typeof part.text === 'string') return part.text;
      return '';
    }).filter(Boolean).join('\n');
  }
  return '';
}
function collect(records) {
  const recentUser = [];
  const recentAssistant = [];
  const toolNames = [];
  for (const r of records) {
    const msg = r.message || r;
    const role = msg.role;
    if (role === 'user') {
      const t = textFromContent(msg.content).trim();
      if (t) recentUser.push(t);
    } else if (role === 'assistant') {
      const t = textFromContent(msg.content).trim();
      if (t) recentAssistant.push(t);
    } else if (role === 'toolResult') {
      if (msg.toolName) toolNames.push(msg.toolName);
    }
  }
  return {
    recentUser: recentUser.slice(-6),
    recentAssistant: recentAssistant.slice(-6),
    tools: [...new Set(toolNames)].slice(-12)
  };
}
function build(meta, collected) {
  const usedPct = Math.round(((meta.totalTokens || meta.contextTokens || meta.totalTokensFresh || 0) / 128000) * 100);
  const lines = [];
  lines.push('# Session Handoff');
  lines.push('');
  lines.push(`- Key: ${meta.key}`);
  lines.push(`- Session ID: ${meta.sessionId || 'unknown'}`);
  lines.push(`- Model: ${meta.modelProvider || 'unknown'}/${meta.model || 'unknown'}`);
  lines.push(`- Tokens: ${meta.totalTokens || meta.contextTokens || meta.totalTokensFresh || 0} / 128000 (~${usedPct}%)`);
  lines.push(`- Compactions: ${meta.compactionCount || 0}`);
  lines.push(`- Updated: ${meta.updatedAt ? new Date(meta.updatedAt).toISOString() : 'unknown'}`);
  lines.push('');
  lines.push('## Current state');
  if (usedPct >= 85) lines.push('- Session is in critical pressure zone; switch to a new session immediately.');
  else if (usedPct >= 70) lines.push('- Session is in alert zone; wrap up and switch if continuing deep work.');
  else if (usedPct >= 50) lines.push('- Session is in warning zone; avoid repeating context.');
  else lines.push('- Session pressure is acceptable.');
  if ((meta.compactionCount || 0) >= 2) lines.push('- This session has already compacted multiple times; continuity quality may degrade.');
  lines.push('');
  lines.push('## Recent user requests');
  for (const t of collected.recentUser) lines.push(`- ${t.replace(/\n+/g, ' ').slice(0, 240)}`);
  lines.push('');
  lines.push('## Recent assistant work');
  for (const t of collected.recentAssistant) lines.push(`- ${t.replace(/\n+/g, ' ').slice(0, 240)}`);
  lines.push('');
  lines.push('## Tools touched recently');
  for (const t of collected.tools) lines.push(`- ${t}`);
  lines.push('');
  lines.push('## Suggested next step');
  if (usedPct >= 70) {
    lines.push('- Start a fresh session and paste this handoff summary.');
    lines.push('- Continue only the next concrete task, not the entire prior discussion.');
  } else {
    lines.push('- Continuing in the current session is acceptable, but keep scope narrow.');
  }
  return lines.join('\n') + '\n';
}

const meta = loadSessionMeta();
const records = parseRecords(tailLines(meta.sessionFile, MAX_LINES));
const collected = collect(records);
const md = build(meta, collected);
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, md);
console.log(md);
