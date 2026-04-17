#!/usr/bin/env node
/**
 * Brief Tool (SendUserMessage) - 基于 Claude Code BriefTool
 * 
 * 用户消息发送：
 *   - 发送用户会阅读的消息
 *   - 支持 markdown 和附件
 *   - 区分 normal/proactive 状态
 * 
 * Usage:
 *   node brief-tool.js send <message> [status] [attachments]
 *   node brief-tool.js proactive <message>
 *   node brief-tool.js ack <message>
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'brief');
const HISTORY_FILE = path.join(STATE_DIR, 'message-history.json');

const BRIEF_TOOL_NAME = 'SendUserMessage';
const LEGACY_BRIEF_TOOL_NAME = 'Brief';

const MESSAGE_STATUS = {
  normal: 'replying to user request',
  proactive: 'initiating conversation (scheduled task, blocker, etc)',
  ack: 'acknowledgment before work'
};

function loadMessageHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return { messages: [], totalSent: 0 };
  }
  
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return { messages: [], totalSent: 0 };
  }
}

function saveMessageHistory(history) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function sendMessage(message, status = 'normal', attachments = []) {
  if (!MESSAGE_STATUS[status]) {
    status = 'normal';
  }
  
  const msg = {
    id: `brief_${Date.now()}`,
    tool: BRIEF_TOOL_NAME,
    message,
    status,
    statusDescription: MESSAGE_STATUS[status],
    attachments,
    timestamp: Date.now(),
    timestampIso: new Date().toISOString()
  };
  
  // Add to history
  const history = loadMessageHistory();
  history.messages.push(msg);
  history.totalSent++;
  
  // Keep only last 100 messages
  if (history.messages.length > 100) {
    history.messages = history.messages.slice(-100);
  }
  
  saveMessageHistory(history);
  
  // In real implementation, would call message tool here
  return {
    sent: true,
    message: msg,
    historyCount: history.messages.length,
    note: 'In real use, this would route to Feishu/Discord/Slack'
  };
}

function sendProactiveMessage(message, reason = '') {
  return sendMessage(message, 'proactive', []);
}

function sendAckMessage(message) {
  // Short ack before work
  const ackMsg = message.length > 50 ? message.slice(0, 50) + '...' : message;
  return sendMessage(ackMsg, 'ack', []);
}

function getRecentMessages(limit = 20) {
  const history = loadMessageHistory();
  
  return {
    messages: history.messages.slice(-limit),
    total: history.messages.length,
    lastSent: history.messages.length > 0 
      ? history.messages[history.messages.length - 1].timestampIso 
      : null
  };
}

function getProactiveMessages() {
  const history = loadMessageHistory();
  
  return {
    messages: history.messages.filter(m => m.status === 'proactive'),
    count: history.messages.filter(m => m.status === 'proactive').length
  };
}

function getAckMessages() {
  const history = loadMessageHistory();
  
  return {
    messages: history.messages.filter(m => m.status === 'ack'),
    count: history.messages.filter(m => m.status === 'ack').length
  };
}

function getMessageStats() {
  const history = loadMessageHistory();
  
  const byStatus = {};
  for (const msg of history.messages) {
    byStatus[msg.status] = (byStatus[msg.status] || 0) + 1;
  }
  
  return {
    total: history.totalSent,
    inHistory: history.messages.length,
    byStatus,
    recentCount: history.messages.slice(-10).length
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'stats';
  
  switch (command) {
    case 'send':
      const message = args[1] || '';
      const status = args[2] || 'normal';
      const attachments = args[3] ? args[3].split(',') : [];
      console.log(JSON.stringify(sendMessage(message, status, attachments), null, 2));
      break;
    case 'proactive':
      const proactiveMsg = args[1] || '';
      const reason = args[2] || '';
      console.log(JSON.stringify(sendProactiveMessage(proactiveMsg, reason), null, 2));
      break;
    case 'ack':
      const ackMsg = args[1] || 'On it';
      console.log(JSON.stringify(sendAckMessage(ackMsg), null, 2));
      break;
    case 'history':
      const limit = parseInt(args[1], 10) || 20;
      console.log(JSON.stringify(getRecentMessages(limit), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getMessageStats(), null, 2));
      break;
    default:
      console.log('Usage: node brief-tool.js [send|proactive|ack|history|stats]');
      process.exit(1);
  }
}

main();

module.exports = {
  sendMessage,
  sendProactiveMessage,
  sendAckMessage,
  getRecentMessages,
  getMessageStats,
  BRIEF_TOOL_NAME,
  MESSAGE_STATUS
};