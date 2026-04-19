#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const SESSIONS_JSON = path.join(os.homedir(), '.openclaw', 'agents', 'main', 'sessions', 'sessions.json');
const WARN = Number(process.env.OPENCLAW_SESSION_WARN_PCT || 50);
const ALERT = Number(process.env.OPENCLAW_SESSION_ALERT_PCT || 70);
const CRIT = Number(process.env.OPENCLAW_SESSION_CRIT_PCT || 85);
const NOW = Date.now();

function load() {
  if (!fs.existsSync(SESSIONS_JSON)) return {};
  return JSON.parse(fs.readFileSync(SESSIONS_JSON, 'utf8'));
}
function toSessions(data) {
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data).map(([key, value]) => ({ key, ...(value || {}) }));
}
function pct(s) {
  const total = s.contextWindow || s.maxContextTokens || s.maxTokens || 128000;
  const used = s.totalTokens || s.contextTokens || s.totalTokensFresh || 0;
  return total ? Math.round((used / total) * 100) : null;
}
function minutesSince(ts) {
  return ts ? Math.round((NOW - ts) / 60000) : null;
}
function recommend(s) {
  const usedPct = pct(s);
  const idleMin = minutesSince(s.updatedAt);
  const compactions = s.compactionCount || 0;
  const actions = [];
  let level = 'ok';

  if (usedPct == null) {
    actions.push('无法判断上下文占用，建议人工检查 sessions.json 字段。');
    level = 'unknown';
  } else if (usedPct >= CRIT) {
    level = 'critical';
    actions.push('建议立刻结束当前长线程，转入新 session。');
    actions.push('建议先生成简短 summary，再继续后续任务。');
  } else if (usedPct >= ALERT) {
    level = 'alert';
    actions.push('建议尽快收束当前话题，避免继续在同一 session 拉长。');
    actions.push('如需继续深排障，建议切到新 session。');
  } else if (usedPct >= WARN) {
    level = 'warn';
    actions.push('已进入预警区，建议减少重复背景描述。');
  } else {
    actions.push('当前 session 压力可接受。');
  }

  if (compactions >= 2) {
    actions.push('该 session 已多次 compaction，后续继续堆叠的收益会变差。');
  }
  if (idleMin != null && idleMin > 180) {
    actions.push('该 session 已空闲较久，恢复旧线程前建议重新开一个新 session。');
  }

  return {
    key: s.key,
    sessionId: s.sessionId || null,
    model: s.model || null,
    provider: s.modelProvider || null,
    totalTokens: s.totalTokens || s.contextTokens || s.totalTokensFresh || 0,
    usedPct,
    compactionCount: compactions,
    idleMinutes: idleMin,
    level,
    actions
  };
}

const sessions = toSessions(load()).map(recommend).sort((a,b) => (b.usedPct||0) - (a.usedPct||0));
const primary = sessions[0] || null;
console.log(JSON.stringify({ thresholds: { warn: WARN, alert: ALERT, critical: CRIT }, primary, sessions }, null, 2));
