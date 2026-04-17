#!/usr/bin/env node
/**
 * Auto Dream Gates - 基于 Claude Code 的 gate 机制
 * 
 * Gates (cheapest first):
 *   1. Time: hours since lastConsolidatedAt >= minHours (default 24h)
 *   2. Sessions: transcript count with mtime > lastConsolidatedAt >= minSessions (default 5)
 *   3. Lock: no other process mid-consolidation
 * 
 * Usage:
 *   node auto-dream-gates.js check
 *   node auto-dream-gates.js status
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'dreams');
const LOCK_FILE = path.join(STATE_DIR, 'consolidation.lock');
const META_FILE = path.join(STATE_DIR, 'consolidation.meta.json');

// Default config
const DEFAULTS = {
  minHours: 24,
  minSessions: 5
};

function getConfig() {
  // TODO: 从 OpenClaw 配置读取
  return DEFAULTS;
}

function readLastConsolidatedAt() {
  if (!fs.existsSync(META_FILE)) {
    return null;
  }
  try {
    const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
    return meta.lastConsolidatedAt || null;
  } catch {
    return null;
  }
}

function writeLastConsolidatedAt(timestamp) {
  const meta = {
    lastConsolidatedAt: timestamp,
    lastCheckTime: Date.now(),
    sessionsConsolidated: 0
  };
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
}

function countSessionsSince(sinceTimestamp) {
  // Count sessions with mtime > sinceTimestamp
  const sessionDir = path.join(WORKSPACE, 'state', 'session-memory');
  if (!fs.existsSync(sessionDir)) {
    return 0;
  }
  
  const sessions = fs.readdirSync(sessionDir).filter(f => f.endsWith('.json'));
  let count = 0;
  
  for (const session of sessions) {
    const sessionPath = path.join(sessionDir, session);
    try {
      const stat = fs.statSync(sessionPath);
      if (sinceTimestamp && stat.mtimeMs > sinceTimestamp) {
        count++;
      } else if (!sinceTimestamp) {
        count++;
      }
    } catch {
      // ignore
    }
  }
  
  return count;
}

function tryAcquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const lockStat = fs.statSync(LOCK_FILE);
    const lockAge = Date.now() - lockStat.mtimeMs;
    
    // Lock expires after 1 hour (stale lock cleanup)
    if (lockAge > 3600000) {
      fs.unlinkSync(LOCK_FILE);
    } else {
      return false; // Lock is active
    }
  }
  
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(LOCK_FILE, JSON.stringify({
    acquiredAt: Date.now(),
    pid: process.pid
  }));
  
  return true;
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (e) {
    // Ignore lock release errors
  }
}

function checkGates() {
  const config = getConfig();
  const lastConsolidatedAt = readLastConsolidatedAt();
  const now = Date.now();
  
  // Gate 1: Time
  const hoursSince = lastConsolidatedAt 
    ? (now - lastConsolidatedAt) / (1000 * 60 * 60)
    : Infinity;
  
  const timeGateOpen = hoursSince >= config.minHours;
  
  // Gate 2: Sessions
  const sessionsCount = countSessionsSince(lastConsolidatedAt);
  const sessionGateOpen = sessionsCount >= config.minSessions;
  
  // Gate 3: Lock
  const lockGateOpen = tryAcquireLock();
  
  const allGatesOpen = timeGateOpen && sessionGateOpen && lockGateOpen;
  
  return {
    config,
    lastConsolidatedAt,
    hoursSince: hoursSince === Infinity ? 'never consolidated' : hoursSince.toFixed(2),
    sessionsCount,
    gates: {
      time: { open: timeGateOpen, threshold: config.minHours, current: hoursSince === Infinity ? '∞' : hoursSince.toFixed(2) },
      sessions: { open: sessionGateOpen, threshold: config.minSessions, current: sessionsCount },
      lock: { open: lockGateOpen }
    },
    allGatesOpen,
    action: allGatesOpen ? 'READY_TO_CONSOLIDATE' : 'WAITING'
  };
}

function printStatus() {
  const result = checkGates();
  
  console.log('=== Auto Dream Gates Status ===');
  console.log(`Last consolidated: ${result.lastConsolidatedAt ? new Date(result.lastConsolidatedAt).toISOString() : 'never'}`);
  console.log(`Hours since: ${result.hoursSince}`);
  console.log(`Sessions since: ${result.sessionsCount}`);
  console.log('');
  console.log('Gates:');
  console.log(`  Time gate: ${result.gates.time.open ? 'OPEN ✓' : 'CLOSED ✗'} (threshold: ${result.gates.time.threshold}h, current: ${result.gates.time.current}h)`);
  console.log(`  Session gate: ${result.gates.sessions.open ? 'OPEN ✓' : 'CLOSED ✗'} (threshold: ${result.gates.sessions.threshold}, current: ${result.gates.sessions.current})`);
  console.log(`  Lock gate: ${result.gates.lock.open ? 'ACQUIRED ✓' : 'BLOCKED ✗'}`);
  console.log('');
  console.log(`Action: ${result.action}`);
  
  if (result.allGatesOpen) {
    console.log('');
    console.log('>>> READY TO CONSOLIDATE <<<');
    console.log('Run: node auto-dream-cycle.js --run');
  }
  
  // Release lock if we acquired it just for checking
  if (result.gates.lock.open) {
    releaseLock();
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  switch (command) {
    case 'check':
      const result = checkGates();
      console.log(JSON.stringify(result, null, 2));
      if (result.gates.lock.open) {
        releaseLock();
      }
      break;
    case 'status':
      printStatus();
      break;
    case 'release-lock':
      releaseLock();
      console.log('Lock released');
      break;
    default:
      console.log('Usage: node auto-dream-gates.js [check|status|release-lock]');
      process.exit(1);
  }
}

main();