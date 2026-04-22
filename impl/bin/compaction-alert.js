#!/usr/bin/env node
/**
 * Compaction Alert Monitor
 * 
 * 监控 gateway 日志中的 compaction 事件，触发时立刻通知用户。
 * 
 * 两种运行模式：
 *   1. cron 定期扫描：node compaction-alert.js scan
 *   2. 一次性检查：node compaction-alert.js check
 * 
 * 检测事件：
 *   - auto-compaction succeeded → session 过重预警
 *   - timeout-compaction → session 严重过重，即将卡死
 *   - compaction-safeguard → 压缩循环，需要立刻 /new
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_FILE = path.join(os.homedir(), '.openclaw', 'logs', 'gateway.log');
const STATE_FILE = path.join(os.homedir(), '.openclaw', 'workspace', 'memory', 'compaction-alert-state.json');

const PATTERNS = [
  {
    regex: /\[timeout-compaction\]/,
    level: 'critical',
    message: '⚠️ Session 超时压缩触发，当前会话严重过重，建议立刻 /new 开新会话'
  },
  {
    regex: /\[compaction-safeguard\].*suppress re-trigger loop/,
    level: 'critical', 
    message: '🔴 压缩循环触发，session 已无法通过压缩恢复，必须 /new'
  },
  {
    regex: /auto-compaction succeeded/,
    level: 'warning',
    message: '⚡ Session 自动压缩触发，会话开始变重，注意观察'
  }
];

// 冷却时间：同级别告警 10 分钟内不重复
const COOLDOWN_MS = 10 * 60 * 1000;

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {}
  return { lastScanOffset: 0, lastAlerts: {} };
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function scanLog(state) {
  if (!fs.existsSync(LOG_FILE)) {
    return { events: [], newOffset: 0 };
  }

  const content = fs.readFileSync(LOG_FILE, 'utf8');
  const startOffset = state.lastScanOffset || 0;
  
  // 如果日志被轮转（变小了），从头开始
  const searchContent = content.length < startOffset ? content : content.slice(startOffset);
  const newOffset = content.length;

  const events = [];
  const lines = searchContent.split('\n');
  
  for (const line of lines) {
    for (const pattern of PATTERNS) {
      if (pattern.regex.test(line)) {
        // 提取时间戳
        const tsMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        const timestamp = tsMatch ? tsMatch[1] : new Date().toISOString();
        
        events.push({
          level: pattern.level,
          message: pattern.message,
          timestamp,
          line: line.slice(0, 200)
        });
        break; // 一行只匹配一个 pattern
      }
    }
  }

  return { events, newOffset };
}

function filterByCooldown(events, state) {
  const now = Date.now();
  const lastAlerts = state.lastAlerts || {};
  
  return events.filter(evt => {
    const key = evt.level;
    const lastTime = lastAlerts[key] || 0;
    if (now - lastTime < COOLDOWN_MS) return false;
    lastAlerts[key] = now;
    return true;
  });
}

function run() {
  const command = process.argv[2] || 'check';
  const state = loadState();

  if (command === 'check' || command === 'scan') {
    const { events, newOffset } = scanLog(state);
    state.lastScanOffset = newOffset;

    if (events.length === 0) {
      saveState(state);
      console.log(JSON.stringify({ status: 'ok', events: 0 }));
      return;
    }

    // 按严重程度排序，critical 优先
    events.sort((a, b) => {
      const order = { critical: 0, warning: 1 };
      return (order[a.level] || 2) - (order[b.level] || 2);
    });

    const filtered = filterByCooldown(events, state);
    saveState(state);

    if (filtered.length === 0) {
      console.log(JSON.stringify({ status: 'cooldown', totalEvents: events.length, filtered: 0 }));
      return;
    }

    // 输出需要告警的事件
    const worst = filtered[0];
    const output = {
      status: 'alert',
      level: worst.level,
      totalEvents: events.length,
      alerts: filtered.map(e => ({
        level: e.level,
        message: e.message,
        timestamp: e.timestamp
      }))
    };

    console.log(JSON.stringify(output, null, 2));
  } else if (command === 'reset') {
    saveState({ lastScanOffset: 0, lastAlerts: {} });
    console.log('State reset.');
  } else {
    console.error(`Unknown command: ${command}. Use: check, scan, reset`);
    process.exit(1);
  }
}

run();
