#!/usr/bin/env node
/**
 * Loop Detection - 检测Agent重复派发
 * 
 * 借鉴 DeerFlow 的 LoopDetectionMiddleware
 * 功能：
 * - 3次相同派发 → 注入警告消息
 * - 5次相同派发 → 强制禁止，直接返回
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(process.env.HOME, '.openclaw/workspace/state/loop-detection.json');

// 阈值配置（借鉴DeerFlow）
const WARN_THRESHOLD = 3;  // 3次警告
const HARD_LIMIT = 5;      // 5次强制停止
const WINDOW_SIZE = 20;    // 滑动窗口大小

// 读取状态文件
function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { 
    threads: {},
    stats: { warnCount: 0, hardStopCount: 0, totalCalls: 0 }
  };
}

// 写入状态文件
function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// 生成稳定key（借鉴DeerFlow的_stable_tool_key）
function generateKey(agentId, task) {
  // 提取任务的关键字段
  const salientFields = ['功能', '模块', 'API', '页面', '目标'];
  let keyParts = [agentId];
  
  for (const field of salientFields) {
    if (task.includes(field)) {
      // 提取该字段的值（简化版）
      const match = task.match(new RegExp(field + '[：:]\\s*([^\\n]+)'));
      if (match) {
        keyParts.push(match[1].trim().substring(0, 50));
      }
    }
  }
  
  // 如果没有提取到关键字段，使用任务的hash
  if (keyParts.length === 1) {
    keyParts.push(require('crypto').createHash('md5').update(task).digest('hex').substring(0, 16));
  }
  
  return keyParts.join(':');
}

// 检测重复派发
function checkLoop(threadId, agentId, task) {
  const state = readState();
  const key = generateKey(agentId, task);
  
  // 初始化线程记录
  if (!state.threads[threadId]) {
    state.threads[threadId] = {
      calls: [],
      warnedKeys: []
    };
  }
  
  const thread = state.threads[threadId];
  const now = Date.now();
  
  // 添加新调用
  thread.calls.push({ key, agentId, task, timestamp: now });
  
  // 保持滑动窗口
  if (thread.calls.length > WINDOW_SIZE) {
    thread.calls = thread.calls.slice(-WINDOW_SIZE);
  }
  
  // 统计相同key的出现次数
  const count = thread.calls.filter(c => c.key === key).length;
  
  // 更新统计
  state.stats.totalCalls++;
  
  let result = {
    count,
    shouldWarn: false,
    shouldStop: false,
    message: null
  };
  
  // 检查阈值
  if (count >= HARD_LIMIT) {
    result.shouldStop = true;
    result.message = `🚫 强制停止：你已重复派发 ${agentId} 执行相同任务 ${count} 次\n请换一种方案或直接返回"无法完成"`;
    state.stats.hardStopCount++;
    
    // 添加到已警告列表
    if (!thread.warnedKeys.includes(key)) {
      thread.warnedKeys.push(key);
    }
  } else if (count >= WARN_THRESHOLD && !thread.warnedKeys.includes(key)) {
    result.shouldWarn = true;
    result.message = `⚠️ 警告：你已重复派发 ${agentId} 执行相同任务 ${count} 次\n建议换一种方案或检查任务是否有问题`;
    thread.warnedKeys.push(key);
    state.stats.warnCount++;
  }
  
  writeState(state);
  return result;
}

// 清理线程记录（任务完成后调用）
function clearThread(threadId) {
  const state = readState();
  if (state.threads[threadId]) {
    delete state.threads[threadId];
    writeState(state);
  }
}

// 重置所有记录
function resetAll() {
  writeState({ 
    threads: {},
    stats: { warnCount: 0, hardStopCount: 0, totalCalls: 0 }
  });
}

// 获取状态摘要
function status() {
  const state = readState();
  return {
    totalThreads: Object.keys(state.threads).length,
    stats: state.stats,
    activeThreads: Object.entries(state.threads).map(([id, t]) => ({
      threadId: id,
      callCount: t.calls.length,
      warnedKeys: t.warnedKeys.length
    }))
  };
}

// CLI入口
const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === 'check') {
  const threadId = args[1] || 'default';
  const agentId = args[2] || 'unknown';
  const task = args[3] || '';
  
  const result = checkLoop(threadId, agentId, task);
  console.log(JSON.stringify(result, null, 2));
} else if (cmd === 'clear') {
  const threadId = args[1];
  if (threadId) {
    clearThread(threadId);
    console.log(`✅ 已清理线程 ${threadId} 的记录`);
  } else {
    console.log('❌ 请提供线程ID');
  }
} else if (cmd === 'reset') {
  resetAll();
  console.log('✅ 已重置所有记录');
} else if (cmd === 'status') {
  console.log(JSON.stringify(status(), null, 2));
} else {
  console.log(`
用法:
  node loop-detector.js check <threadId> <agentId> <task>  # 检测重复
  node loop-detector.js clear <threadId>                   # 清理线程
  node loop-detector.js reset                              # 重置所有
  node loop-detector.js status                              # 查看状态
`);
}

module.exports = { checkLoop, clearThread, resetAll, status };