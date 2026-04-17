#!/usr/bin/env node
/**
 * Notifier Service - 基于 Claude Code notifier.ts
 * 
 * 通知服务：
 *   - 统一通知接口
 *   - 多渠道通知（Feishu/Discord/Slack）
 *   - 通知历史和去重
 * 
 * Usage:
 *   node notifier-service.js send <type> <title> <message> [channel]
 *   node notifier-service.js history
 *   node notifier-service.js pending
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const NOTIFIER_DIR = path.join(WORKSPACE, 'state', 'notifier');
const HISTORY_FILE = path.join(NOTIFIER_DIR, 'history.json');
const PENDING_FILE = path.join(NOTIFIER_DIR, 'pending.json');

// Notification types
const NOTIF_TYPES = {
  info: { priority: 1, icon: 'ℹ️' },
  warning: { priority: 2, icon: '⚠️' },
  error: { priority: 3, icon: '❌' },
  success: { priority: 1, icon: '✅' },
  milestone: { priority: 2, icon: '🎉' },
  reminder: { priority: 2, icon: '🔔' }
};

// Channels (from OpenClaw config)
const CHANNELS = ['feishu', 'discord', 'slack', 'telegram', 'signal'];

function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return { notifications: [], lastSent: null };
  }
  
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return { notifications: [], lastSent: null };
  }
}

function saveHistory(history) {
  fs.mkdirSync(NOTIFIER_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function loadPending() {
  if (!fs.existsSync(PENDING_FILE)) {
    return [];
  }
  
  try {
    return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function savePending(pending) {
  fs.mkdirSync(NOTIFIER_DIR, { recursive: true });
  fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
}

function deduplicate(notif) {
  const history = loadHistory();
  const recentNotifications = history.notifications.slice(-50);
  
  // Check for duplicate in last hour
  const oneHourAgo = Date.now() - 3600000;
  for (const prev of recentNotifications) {
    if (prev.timestamp > oneHourAgo &&
        prev.type === notif.type &&
        prev.title === notif.title) {
      return { duplicate: true, previous: prev };
    }
  }
  
  return { duplicate: false };
}

function sendNotification(type, title, message, channel = 'feishu', metadata = {}) {
  const typeInfo = NOTIF_TYPES[type] || NOTIF_TYPES.info;
  
  const notif = {
    id: `${type}_${Date.now()}`,
    type,
    title,
    message,
    channel,
    priority: typeInfo.priority,
    icon: typeInfo.icon,
    metadata,
    timestamp: Date.now(),
    status: 'pending'
  };
  
  // Deduplicate
  const dedup = deduplicate(notif);
  if (dedup.duplicate) {
    return {
      sent: false,
      reason: 'duplicate',
      previous: dedup.previous
    };
  }
  
  // Add to pending queue
  const pending = loadPending();
  pending.push(notif);
  savePending(pending);
  
  // In real implementation, would call message tool here
  // For now, simulate sending
  notif.status = 'sent';
  
  // Add to history
  const history = loadHistory();
  history.notifications.push(notif);
  history.lastSent = Date.now();
  
  // Keep only last 200
  if (history.notifications.length > 200) {
    history.notifications = history.notifications.slice(-200);
  }
  
  saveHistory(history);
  
  // Remove from pending
  const updatedPending = pending.filter(p => p.id !== notif.id);
  savePending(updatedPending);
  
  return {
    sent: true,
    notification: notif,
    channel,
    historyCount: history.notifications.length
  };
}

function getPendingNotifications() {
  const pending = loadPending();
  
  return {
    count: pending.length,
    pending,
    oldest: pending.length > 0 ? pending[0] : null,
    newest: pending.length > 0 ? pending[pending.length - 1] : null
  };
}

function getNotificationHistory(limit = 50) {
  const history = loadHistory();
  
  return {
    notifications: history.notifications.slice(-limit),
    total: history.notifications.length,
    lastSent: history.lastSent
  };
}

function clearPendingNotifications() {
  savePending([]);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function getNotificationStats() {
  const history = loadHistory();
  const pending = loadPending();
  
  const byType = {};
  const byChannel = {};
  
  for (const notif of history.notifications) {
    byType[notif.type] = (byType[notif.type] || 0) + 1;
    byChannel[notif.channel] = (byChannel[notif.channel] || 0) + 1;
  }
  
  return {
    totalSent: history.notifications.length,
    pending: pending.length,
    byType,
    byChannel,
    lastSent: history.lastSent
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'stats';
  
  switch (command) {
    case 'send':
      const type = args[1] || 'info';
      const title = args[2] || '';
      const message = args[3] || '';
      const channel = args[4] || 'feishu';
      console.log(JSON.stringify(sendNotification(type, title, message, channel), null, 2));
      break;
    case 'history':
      const limit = parseInt(args[1], 10) || 50;
      console.log(JSON.stringify(getNotificationHistory(limit), null, 2));
      break;
    case 'pending':
      console.log(JSON.stringify(getPendingNotifications(), null, 2));
      break;
    case 'clear-pending':
      console.log(JSON.stringify(clearPendingNotifications(), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getNotificationStats(), null, 2));
      break;
    default:
      console.log('Usage: node notifier-service.js [send|history|pending|clear-pending|stats]');
      process.exit(1);
  }
}

main();

module.exports = {
  sendNotification,
  getPendingNotifications,
  getNotificationHistory,
  getNotificationStats,
  deduplicate
};