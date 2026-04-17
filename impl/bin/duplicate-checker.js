#!/usr/bin/env node
/**
 * Duplicate Message Checker - Prevent sending duplicate messages
 *
 * Purpose: Check before sending to enforce "One Card Principle"
 *
 * Rules:
 * - Same message within 60s → block (duplicate)
 * - Card + text within same task → block
 * - Progress report (manual) → block (let heartbeat send)
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const STATE_FILE = path.join(WORKSPACE, 'state', 'send-history.json');

class DuplicateChecker {
  constructor() {
    this.history = this.loadHistory();
    this.duplicateWindowMs = 60000; // 60 seconds
  }

  loadHistory() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch {
      // ignore
    }
    return {
      recentSends: [],
      taskMessages: {},
      stats: {
        total: 0,
        blocked: 0
      }
    };
  }

  saveHistory() {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.history, null, 2));
  }

  /**
   * Record a send attempt
   */
  recordSend(messageType, content, taskId) {
    const now = Date.now();
    
    this.history.recentSends.push({
      time: now,
      messageType,
      content: content.slice(0, 100), // First 100 chars
      taskId
    });
    
    // Keep only last 20 sends
    if (this.history.recentSends.length > 20) {
      this.history.recentSends = this.history.recentSends.slice(-20);
    }
    
    // Track by task
    if (taskId) {
      if (!this.history.taskMessages[taskId]) {
        this.history.taskMessages[taskId] = [];
      }
      this.history.taskMessages[taskId].push({
        time: now,
        messageType,
        content: content.slice(0, 100)
      });
      
      // Clean old tasks (>1h)
      const oneHourAgo = now - 3600000;
      for (const tid in this.history.taskMessages) {
        if (this.history.taskMessages[tid][0].time < oneHourAgo) {
          delete this.history.taskMessages[tid];
        }
      }
    }
    
    this.history.stats.total++;
    this.saveHistory();
  }

  /**
   * Check if this send should be blocked
   */
  shouldBlock(messageType, content, taskId) {
    const now = Date.now();
    
    // Check 1: Duplicate content within 60s
    const recentDuplicate = this.history.recentSends.find(send => {
      const age = now - send.time;
      return age < this.duplicateWindowMs && 
             send.content === content.slice(0, 100) &&
             send.messageType === messageType;
    });
    
    if (recentDuplicate) {
      this.history.stats.blocked++;
      this.saveHistory();
      return {
        blocked: true,
        reason: 'duplicate_content',
        message: `内容重复（${Math.round((now - recentDuplicate.time) / 1000)}秒前已发送）`
      };
    }
    
    // Check 2: Card + text within same task (within 5min)
    if (taskId && this.history.taskMessages[taskId]) {
      const taskSends = this.history.taskMessages[taskId];
      const recentTaskSend = taskSends.find(send => {
        const age = now - send.time;
        return age < 300000; // 5 minutes
      });
      
      if (recentTaskSend) {
        // Already sent for this task recently
        this.history.stats.blocked++;
        this.saveHistory();
        return {
          blocked: true,
          reason: 'task_duplicate',
          message: `任务「${taskId}」已发送消息，遵守一张卡片原则`
        };
      }
    }
    
    // Check 3: Manual progress report (let heartbeat send)
    if (messageType === 'progress' && content.includes('进度')) {
      this.history.stats.blocked++;
      this.saveHistory();
      return {
        blocked: true,
        reason: 'manual_progress',
        message: '进度报告由心跳自动发送，不手动发送'
      };
    }
    
    return { blocked: false };
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.history.stats,
      blockRate: this.history.stats.blocked / this.history.stats.total || 0,
      recentSendsCount: this.history.recentSends.length,
      activeTasks: Object.keys(this.history.taskMessages).length
    };
  }

  /**
   * Clear history
   */
  clear() {
    this.history = {
      recentSends: [],
      taskMessages: {},
      stats: {
        total: 0,
        blocked: 0
      }
    };
    this.saveHistory();
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const checker = new DuplicateChecker();

switch (command) {
  case 'check':
    const messageType = args[1] || 'text';
    const content = args[2] || '';
    const taskId = args[3] || null;
    const blockResult = checker.shouldBlock(messageType, content, taskId);
    console.log(JSON.stringify(blockResult, null, 2));
    break;

  case 'record':
    const recType = args[1] || 'text';
    const recContent = args[2] || '';
    const recTaskId = args[3] || null;
    checker.recordSend(recType, recContent, recTaskId);
    console.log(JSON.stringify({ recorded: true }, null, 2));
    break;

  case 'stats':
    console.log(JSON.stringify(checker.getStats(), null, 2));
    break;

  case 'clear':
    checker.clear();
    console.log(JSON.stringify({ cleared: true }, null, 2));
    break;

  case 'test':
    // Test duplicate detection
    checker.recordSend('card', '天气预报网站开发完成', 'weather-app');
    
    const check1 = checker.shouldBlock('text', '天气预报网站已完成！', 'weather-app');
    console.log('Check 1 (task duplicate):', check1);
    
    const check2 = checker.shouldBlock('card', '天气预报网站开发完成', 'weather-app');
    console.log('Check 2 (content duplicate):', check2);
    
    console.log('Stats:', checker.getStats());
    
    checker.clear();
    break;

  default:
    console.log('Usage: duplicate-checker.js [check|record|stats|clear|test]');
    console.log('');
    console.log('Commands:');
    console.log('  check <type> <content> <taskId> - Check if should block');
    console.log('  record <type> <content> <taskId> - Record send');
    console.log('  stats - Get stats');
    console.log('  clear - Clear history');
    console.log('  test - Test duplicate detection');
}

module.exports = { DuplicateChecker };