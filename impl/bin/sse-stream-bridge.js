#!/usr/bin/env node
/**
 * SSE Streaming Bridge - Real-time response updates
 *
 * Purpose: Provide SSE-like streaming for real-time updates
 *
 * Borrowed from: DeerFlow SSE streaming mechanism
 *
 * Key concepts:
 * - Real-time progress updates (not full SSE but simulated)
 * - Feishu message updates
 * - Task progress streaming
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const STREAM_STATE_FILE = path.join(WORKSPACE, 'state', 'sse-stream-state.json');

class SSEStreamBridge {
  constructor() {
    this.state = this.loadState();
    this.updateInterval = 2000; // 2 seconds
  }

  loadState() {
    try {
      if (fs.existsSync(STREAM_STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STREAM_STATE_FILE, 'utf8'));
      }
    } catch {
      // ignore
    }
    return {
      activeStreams: [],
      lastUpdate: null
    };
  }

  saveState() {
    fs.mkdirSync(path.dirname(STREAM_STATE_FILE), { recursive: true });
    fs.writeFileSync(STREAM_STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  /**
   * Start a stream for a task
   */
  startStream(taskId, taskName, estimatedMinutes) {
    const stream = {
      taskId,
      taskName,
      estimatedMinutes,
      startedAt: Date.now(),
      lastUpdate: Date.now(),
      status: 'running',
      progress: 0,
      currentStep: '开始',
      updates: []
    };

    this.state.activeStreams.push(stream);
    this.saveState();

    return stream;
  }

  /**
   * Update stream progress
   */
  updateProgress(taskId, progress, currentStep) {
    const stream = this.state.activeStreams.find(s => s.taskId === taskId);
    if (!stream) return null;

    stream.progress = progress;
    stream.currentStep = currentStep;
    stream.lastUpdate = Date.now();
    stream.updates.push({
      time: Date.now(),
      progress,
      currentStep
    });

    this.saveState();

    return {
      taskId,
      progress,
      currentStep,
      elapsedMinutes: Math.round((Date.now() - stream.startedAt) / 60000)
    };
  }

  /**
   * Should send update? (Every 2 seconds)
   */
  shouldSendUpdate(taskId) {
    const stream = this.state.activeStreams.find(s => s.taskId === taskId);
    if (!stream) return false;

    const elapsed = Date.now() - stream.lastUpdate;
    return elapsed >= this.updateInterval;
  }

  /**
   * Complete stream
   */
  completeStream(taskId) {
    const stream = this.state.activeStreams.find(s => s.taskId === taskId);
    if (!stream) return null;

    stream.status = 'completed';
    stream.progress = 100;
    stream.completedAt = Date.now();
    stream.elapsedMinutes = Math.round((stream.completedAt - stream.startedAt) / 60000);

    this.saveState();

    return stream;
  }

  /**
   * Get active streams
   */
  getActiveStreams() {
    return this.state.activeStreams.filter(s => s.status === 'running');
  }

  /**
   * Clear completed streams
   */
  clearCompletedStreams() {
    this.state.activeStreams = this.state.activeStreams.filter(s => s.status !== 'completed');
    this.saveState();
  }

  /**
   * Generate Feishu update message
   */
  generateFeishuUpdate(stream) {
    const elapsed = Math.round((Date.now() - stream.startedAt) / 60000);
    const remaining = Math.max(0, stream.estimatedMinutes - elapsed);

    return {
      message: `🔄 进度更新：${stream.progress}% (${stream.currentStep}) 已用时${elapsed}分钟，预估剩余${remaining}分钟`,
      shouldSendCard: stream.progress % 25 === 0 // Send card every 25% progress
    };
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const bridge = new SSEStreamBridge();

switch (command) {
  case 'start':
    const startTaskId = args[1] || `stream-${Date.now()}`;
    const startTaskName = args[2] || '未命名任务';
    const startEstimated = parseInt(args[3]) || 10;
    const startStream = bridge.startStream(startTaskId, startTaskName, startEstimated);
    console.log(JSON.stringify(startStream, null, 2));
    break;

  case 'update':
    const updateTaskId = args[1];
    const updateProgress = parseInt(args[2]) || 0;
    const updateStep = args[3] || '执行中';
    const updateResult = bridge.updateProgress(updateTaskId, updateProgress, updateStep);
    console.log(JSON.stringify(updateResult, null, 2));
    break;

  case 'check':
    const checkTaskId = args[1];
    const checkResult = bridge.shouldSendUpdate(checkTaskId);
    console.log(JSON.stringify({ shouldSend: checkResult }, null, 2));
    break;

  case 'complete':
    const completeTaskId = args[1];
    const completeResult = bridge.completeStream(completeTaskId);
    console.log(JSON.stringify(completeResult, null, 2));
    break;

  case 'active':
    const activeStreams = bridge.getActiveStreams();
    console.log(JSON.stringify(activeStreams, null, 2));
    break;

  case 'clear':
    bridge.clearCompletedStreams();
    console.log(JSON.stringify({ cleared: true }, null, 2));
    break;

  case 'test':
    // Test SSE streaming
    const testStream = bridge.startStream('test-sse', 'SSE测试任务', 5);
    console.log('Stream started:', testStream);

    // Simulate progress updates
    setTimeout(() => {
      bridge.updateProgress('test-sse', 25, '分析阶段');
      console.log('Update 1:', bridge.generateFeishuUpdate(testStream));
    }, 1000);

    setTimeout(() => {
      bridge.updateProgress('test-sse', 50, '执行阶段');
      console.log('Update 2:', bridge.generateFeishuUpdate(testStream));
    }, 2000);

    setTimeout(() => {
      bridge.updateProgress('test-sse', 75, '验证阶段');
      console.log('Update 3:', bridge.generateFeishuUpdate(testStream));
    }, 3000);

    setTimeout(() => {
      const completed = bridge.completeStream('test-sse');
      console.log('Stream completed:', completed);
      bridge.clearCompletedStreams();
    }, 4000);
    break;

  default:
    console.log('Usage: sse-stream-bridge.js [start|update|check|complete|active|clear|test]');
    console.log('');
    console.log('Commands:');
    console.log('  start <taskId> <taskName> <estimatedMinutes> - Start stream');
    console.log('  update <taskId> <progress> <step> - Update progress');
    console.log('  check <taskId> - Check if should send update');
    console.log('  complete <taskId> - Complete stream');
    console.log('  active - Get active streams');
    console.log('  clear - Clear completed streams');
    console.log('  test - Test SSE streaming');
}

module.exports = { SSEStreamBridge };