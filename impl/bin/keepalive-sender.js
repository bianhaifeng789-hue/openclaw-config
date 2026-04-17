#!/usr/bin/env node
/**
 * Keepalive Sender - Prevent "offline" perception during long tasks
 *
 * Purpose: Send periodic keepalive messages to prevent Feishu input state fading
 *
 * Rules:
 * - Task duration > 30s → start keepalive
 * - Every 30s → send brief message: "继续执行中..."
 * - Task complete → stop keepalive
 * - Max keepalive: 30min (timeout warning)
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const STATE_FILE = path.join(WORKSPACE, 'state', 'keepalive-state.json');

class KeepaliveSender {
  constructor() {
    this.state = this.loadState();
    this.interval = 30000; // 30 seconds
    this.maxKeepalive = 30 * 60 * 1000; // 30 minutes
  }

  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch {
      // ignore
    }
    return {
      active: false,
      taskId: null,
      taskName: null,
      startedAt: null,
      lastKeepalive: null,
      keepaliveCount: 0,
      messages: []
    };
  }

  saveState() {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  /**
   * Start keepalive for a task
   */
  start(taskId, taskName) {
    this.state = {
      active: true,
      taskId,
      taskName,
      startedAt: Date.now(),
      lastKeepalive: Date.now(),
      keepaliveCount: 0,
      messages: []
    };
    this.saveState();
    
    return {
      started: true,
      message: `收到！开始执行「${taskName}」，我会定期报告进度。`
    };
  }

  /**
   * Should send keepalive?
   */
  shouldSend() {
    if (!this.state.active) return false;
    
    const elapsed = Date.now() - this.state.lastKeepalive;
    return elapsed >= this.interval;
  }

  /**
   * Generate keepalive message
   */
  generateMessage() {
    const elapsed = Math.round((Date.now() - this.state.startedAt) / 60000);
    const count = this.state.keepaliveCount + 1;
    
    // Different messages based on elapsed time
    let message;
    if (elapsed < 2) {
      message = `继续执行中... (${count})`;
    } else if (elapsed < 5) {
      message = `继续执行中... 已用时 ${elapsed} 分钟`;
    } else if (elapsed < 10) {
      message = `仍在执行「${this.state.taskName}」，已用时 ${elapsed} 分钟`;
    } else if (elapsed < 20) {
      message = `任务较长，继续执行中... 已用时 ${elapsed} 分钟`;
    } else {
      message = `⚠️ 任务执行超过 ${elapsed} 分钟，仍在继续...`;
    }
    
    // Update state
    this.state.lastKeepalive = Date.now();
    this.state.keepaliveCount = count;
    this.state.messages.push({
      time: Date.now(),
      message
    });
    this.saveState();
    
    return message;
  }

  /**
   * Stop keepalive
   */
  stop() {
    const elapsed = Math.round((Date.now() - this.state.startedAt) / 60000);
    const summary = {
      stopped: true,
      taskId: this.state.taskId,
      taskName: this.state.taskName,
      elapsedMinutes: elapsed,
      keepaliveCount: this.state.keepaliveCount
    };
    
    this.state = {
      active: false,
      taskId: null,
      taskName: null,
      startedAt: null,
      lastKeepalive: null,
      keepaliveCount: 0,
      messages: []
    };
    this.saveState();
    
    return summary;
  }

  /**
   * Check timeout
   */
  checkTimeout() {
    if (!this.state.active) return { timeout: false };
    
    const elapsed = Date.now() - this.state.startedAt;
    if (elapsed >= this.maxKeepalive) {
      return {
        timeout: true,
        elapsedMinutes: Math.round(elapsed / 60000),
        message: `⚠️ 任务「${this.state.taskName}」执行超过 30 分钟，可能需要人工介入`
      };
    }
    
    return { timeout: false };
  }

  /**
   * Get status
   */
  getStatus() {
    if (!this.state.active) {
      return { active: false };
    }
    
    const elapsed = Math.round((Date.now() - this.state.startedAt) / 60000);
    const nextKeepalive = Math.round((this.interval - (Date.now() - this.state.lastKeepalive)) / 1000);
    
    return {
      active: true,
      taskId: this.state.taskId,
      taskName: this.state.taskName,
      elapsedMinutes: elapsed,
      keepaliveCount: this.state.keepaliveCount,
      nextKeepaliveSeconds: Math.max(0, nextKeepalive)
    };
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const sender = new KeepaliveSender();

switch (command) {
  case 'start':
    const taskId = args[1] || `task-${Date.now()}`;
    const taskName = args[2] || '未命名任务';
    const startResult = sender.start(taskId, taskName);
    console.log(JSON.stringify(startResult, null, 2));
    break;

  case 'check':
    const checkResult = sender.shouldSend();
    const timeoutResult = sender.checkTimeout();
    console.log(JSON.stringify({
      shouldSend: checkResult,
      timeout: timeoutResult,
      status: sender.getStatus()
    }, null, 2));
    break;

  case 'message':
    if (sender.shouldSend()) {
      const msg = sender.generateMessage();
      console.log(JSON.stringify({ message: msg }, null, 2));
    } else {
      console.log(JSON.stringify({ shouldSend: false }, null, 2));
    }
    break;

  case 'stop':
    const stopResult = sender.stop();
    console.log(JSON.stringify(stopResult, null, 2));
    break;

  case 'status':
    console.log(JSON.stringify(sender.getStatus(), null, 2));
    break;

  case 'test':
    // Test keepalive
    sender.start('test-task', '测试任务');
    console.log('Started:', sender.getStatus());
    
    // Simulate 30s elapsed
    sender.state.lastKeepalive = Date.now() - 35000;
    sender.saveState();
    
    console.log('Should send:', sender.shouldSend());
    console.log('Message:', sender.generateMessage());
    
    sender.stop();
    console.log('Stopped');
    break;

  default:
    console.log('Usage: keepalive-sender.js [start|check|message|stop|status|test]');
    console.log('');
    console.log('Commands:');
    console.log('  start <taskId> <taskName> - Start keepalive for task');
    console.log('  check - Check if should send keepalive');
    console.log('  message - Generate keepalive message');
    console.log('  stop - Stop keepalive');
    console.log('  status - Get keepalive status');
    console.log('  test - Test keepalive');
}

module.exports = { KeepaliveSender };