#!/usr/bin/env node
/**
 * Subagent Limiter - 限制并发派发数量
 * 
 * 借鉴 DeerFlow 的 SubagentLimitMiddleware
 * 功能：
 * - PM最多同时派发3个Agent
 * - 超过限制时警告并禁止派发
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(process.env.HOME, '.openclaw/workspace/state/subagent-limit.json');

const MAX_CONCURRENT = 3;  // 最大并发数
const TIMEOUT_MS = 60000;  // 60秒超时（一个派发超过60秒认为完成）

function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { activeDispatches: {} };
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// 开始派发
function startDispatch(threadId, agentId, task) {
  const state = readState();
  const now = Date.now();
  
  // 清理超时的派发
  for (const [key, dispatch] of Object.entries(state.activeDispatches)) {
    if (now - dispatch.startTime > TIMEOUT_MS) {
      delete state.activeDispatches[key];
    }
  }
  
  // 检查当前并发数
  const activeCount = Object.keys(state.activeDispatches).length;
  
  const result = {
    activeCount,
    canDispatch: activeCount < MAX_CONCURRENT,
    message: null
  };
  
  if (!result.canDispatch) {
    result.message = `🚫 并发限制：当前已有 ${activeCount} 个Agent在执行，超过最大限制 ${MAX_CONCURRENT}\n请等待现有Agent返回后再派发`;
  } else {
    // 记录新派发
    const key = `${threadId}:${agentId}:${now}`;
    state.activeDispatches[key] = {
      threadId,
      agentId,
      task: task.substring(0, 100),
      startTime: now
    };
    writeState(state);
  }
  
  return result;
}

// 完成派发
function endDispatch(threadId, agentId) {
  const state = readState();
  const now = Date.now();
  
  // 找到并删除对应的派发记录
  for (const [key, dispatch] of Object.entries(state.activeDispatches)) {
    if (dispatch.threadId === threadId && dispatch.agentId === agentId) {
      delete state.activeDispatches[key];
      break;
    }
  }
  
  // 清理超时的派发
  for (const [key, dispatch] of Object.entries(state.activeDispatches)) {
    if (now - dispatch.startTime > TIMEOUT_MS) {
      delete state.activeDispatches[key];
    }
  }
  
  writeState(state);
  
  return {
    activeCount: Object.keys(state.activeDispatches).length
  };
}

// 获取状态
function status() {
  const state = readState();
  const now = Date.now();
  
  // 清理超时的派发
  for (const [key, dispatch] of Object.entries(state.activeDispatches)) {
    if (now - dispatch.startTime > TIMEOUT_MS) {
      delete state.activeDispatches[key];
    }
  }
  
  return {
    activeCount: Object.keys(state.activeDispatches).length,
    maxConcurrent: MAX_CONCURRENT,
    activeDispatches: Object.entries(state.activeDispatches).map(([key, d]) => ({
      threadId: d.threadId,
      agentId: d.agentId,
      task: d.task,
      elapsed: Math.round((now - d.startTime) / 1000) + 's'
    }))
  };
}

// 重置
function reset() {
  writeState({ activeDispatches: {} });
}

// CLI入口
const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === 'start') {
  const threadId = args[1] || 'default';
  const agentId = args[2] || 'unknown';
  const task = args[3] || '';
  
  const result = startDispatch(threadId, agentId, task);
  console.log(JSON.stringify(result, null, 2));
} else if (cmd === 'end') {
  const threadId = args[1] || 'default';
  const agentId = args[2] || 'unknown';
  const result = endDispatch(threadId, agentId);
  console.log(JSON.stringify(result, null, 2));
} else if (cmd === 'status') {
  console.log(JSON.stringify(status(), null, 2));
} else if (cmd === 'reset') {
  reset();
  console.log('✅ 已重置所有派发记录');
} else {
  console.log(`
用法:
  node subagent-limiter.js start <threadId> <agentId> "<task>"  # 开始派发
  node subagent-limiter.js end <threadId> <agentId>             # 结束派发
  node subagent-limiter.js status                               # 查看状态
  node subagent-limiter.js reset                                 # 重置
`);
}

module.exports = { startDispatch, endDispatch, status };