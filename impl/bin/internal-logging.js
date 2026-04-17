#!/usr/bin/env node
/**
 * Internal Logging - 基于 Claude Code internalLogging.ts
 * 
 * 内部日志管理：
 *   - 结构化日志记录
 *   - 日志分级（error/warn/info/debug）
 *   - 日志导出和清理
 * 
 * Usage:
 *   node internal-logging.js log <level> <message> [metadata]
 *   node internal-logging.js export
 *   node internal-logging.js stats
 *   node internal-logging.js clear
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const LOG_DIR = path.join(WORKSPACE, 'state', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'internal.log.jsonl');

const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_ENTRIES = 10000;

function log(level, message, metadata = {}) {
  if (!LOG_LEVELS.includes(level)) {
    level = 'info';
  }
  
  const entry = {
    level,
    message,
    metadata,
    timestamp: Date.now(),
    timestampIso: new Date().toISOString(),
    pid: process.pid
  };
  
  fs.mkdirSync(LOG_DIR, { recursive: true });
  
  // Append to log file
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  
  // Check size limits
  checkLogLimits();
  
  return entry;
}

function checkLogLimits() {
  if (!fs.existsSync(LOG_FILE)) {
    return;
  }
  
  const stat = fs.statSync(LOG_FILE);
  if (stat.size > MAX_LOG_SIZE) {
    rotateLog();
  }
  
  // Check entry count
  const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(l => l);
  if (lines.length > MAX_LOG_ENTRIES) {
    // Keep last half
    const keep = lines.slice(-Math.floor(MAX_LOG_ENTRIES / 2));
    fs.writeFileSync(LOG_FILE, keep.join('\n') + '\n');
  }
}

function rotateLog() {
  const timestamp = Date.now();
  const rotatedFile = path.join(LOG_DIR, `internal.${timestamp}.log.jsonl`);
  
  fs.renameSync(LOG_FILE, rotatedFile);
  
  // Create new empty log
  fs.writeFileSync(LOG_FILE, '');
  
  return {
    rotated: true,
    oldFile: rotatedFile,
    newSize: 0
  };
}

function getLogStats() {
  if (!fs.existsSync(LOG_FILE)) {
    return {
      entries: 0,
      size: 0,
      levels: { error: 0, warn: 0, info: 0, debug: 0 },
      oldestEntry: null,
      newestEntry: null
    };
  }
  
  const content = fs.readFileSync(LOG_FILE, 'utf8');
  const lines = content.split('\n').filter(l => l);
  
  const levels = { error: 0, warn: 0, info: 0, debug: 0 };
  let oldest = null;
  let newest = null;
  
  for (const line of lines.slice(0, 100)) { // Sample first 100
    try {
      const entry = JSON.parse(line);
      levels[entry.level] = (levels[entry.level] || 0) + 1;
      if (!oldest || entry.timestamp < oldest.timestamp) {
        oldest = entry;
      }
      if (!newest || entry.timestamp > newest.timestamp) {
        newest = entry;
      }
    } catch {
      // Skip malformed
    }
  }
  
  return {
    entries: lines.length,
    size: fs.statSync(LOG_FILE).size,
    levels,
    oldestEntry: oldest ? { timestamp: oldest.timestampIso, message: oldest.message.slice(0, 50) } : null,
    newestEntry: newest ? { timestamp: newest.timestampIso, message: newest.message.slice(0, 50) } : null
  };
}

function exportLogs(outputPath, format = 'json') {
  if (!fs.existsSync(LOG_FILE)) {
    return { error: 'no logs to export' };
  }
  
  const content = fs.readFileSync(LOG_FILE, 'utf8');
  const lines = content.split('\n').filter(l => l);
  
  if (format === 'json') {
    const entries = lines.map(l => JSON.parse(l));
    const output = JSON.stringify(entries, null, 2);
    
    if (outputPath) {
      fs.writeFileSync(outputPath, output);
    }
    
    return {
      exported: true,
      format,
      entries: entries.length,
      outputPath
    };
  } else if (format === 'text') {
    const text = lines.map(l => {
      const entry = JSON.parse(l);
      return `[${entry.timestampIso}] ${entry.level.toUpperCase()}: ${entry.message}`;
    }).join('\n');
    
    if (outputPath) {
      fs.writeFileSync(outputPath, text);
    }
    
    return {
      exported: true,
      format,
      entries: lines.length,
      outputPath
    };
  }
  
  return { error: 'unknown format' };
}

function clearLogs() {
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
  }
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function searchLogs(query, limit = 100) {
  if (!fs.existsSync(LOG_FILE)) {
    return { results: [], query };
  }
  
  const content = fs.readFileSync(LOG_FILE, 'utf8');
  const lines = content.split('\n').filter(l => l);
  
  const results = [];
  for (const line of lines.slice(-1000)) { // Search last 1000
    try {
      const entry = JSON.parse(line);
      if (entry.message.includes(query) || 
          JSON.stringify(entry.metadata).includes(query)) {
        results.push(entry);
        if (results.length >= limit) {
          break;
        }
      }
    } catch {
      // Skip malformed
    }
  }
  
  return {
    results,
    query,
    searched: Math.min(lines.length, 1000),
    found: results.length
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'stats';
  
  switch (command) {
    case 'log':
      const level = args[1] || 'info';
      const message = args[2] || '';
      const metadata = args[3] ? JSON.parse(args[3]) : {};
      const entry = log(level, message, metadata);
      console.log(JSON.stringify(entry, null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getLogStats(), null, 2));
      break;
    case 'export':
      const outputPath = args[1];
      const format = args[2] || 'json';
      console.log(JSON.stringify(exportLogs(outputPath, format), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearLogs(), null, 2));
      break;
    case 'search':
      const query = args[1] || '';
      const limit = parseInt(args[2], 10) || 100;
      console.log(JSON.stringify(searchLogs(query, limit), null, 2));
      break;
    case 'rotate':
      console.log(JSON.stringify(rotateLog(), null, 2));
      break;
    default:
      console.log('Usage: node internal-logging.js [log|stats|export|clear|search|rotate]');
      process.exit(1);
  }
}

main();

module.exports = {
  log,
  getLogStats,
  exportLogs,
  clearLogs,
  searchLogs,
  rotateLog
};