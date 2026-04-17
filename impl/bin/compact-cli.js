#!/usr/bin/env node
/**
 * Compact CLI - 统一压缩管理器
 * 
 * 借鉴 Claude Code 的多层压缩机制：
 *   Level 0: TimeBasedMC (时间触发微压缩) - 清理旧 tool results
 *   Level 1: MicroCompact (选择性清理) - 保留重要内容
 *   Level 2: SessionMemoryCompact (会话记忆压缩) - MEMORY.md 压缩
 *   Level 3: SummaryCompact (总结压缩) - 最后手段
 * 
 * Constants from Claude Code:
 *   - AUTOCOMPACT_BUFFER_TOKENS = 13_000
 *   - MAX_OUTPUT_TOKENS_FOR_SUMMARY = 20_000
 *   - WARNING_THRESHOLD_BUFFER = 20_000
 *   - MAX_RETRY_ATTEMPTS = 3
 *   - COMPACT_TIMEOUT_MS = 30_000
 * 
 * Usage:
 *   node compact-cli.js status <model>
 *   node compact-cli.js check <model>
 *   node compact-cli.js run <model> [--level=0|1|2|3]
 *   node compact-cli.js auto <model>
 *   node compact-cli.js memory
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BIN_DIR = __dirname;
const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');

// Claude Code Constants
const MAX_OUTPUT_TOKENS_FOR_SUMMARY = 20_000;
const AUTOCOMPACT_BUFFER_TOKENS = 13_000;
const WARNING_THRESHOLD_BUFFER = 20_000;
const ERROR_THRESHOLD_BUFFER = 20_000;
const MAX_RETRY_ATTEMPTS = 3;
const COMPACT_TIMEOUT_MS = 30_000;

// ========================================
// Harness Engineering 补充移植功能
// ========================================

// 角色差异化压缩保留比例（来自 Harness Engineering - context.py）
const ROLE_RETENTION = {
  'evaluator': 0.50,  // Evaluator需要跨轮对比，保留50%
  'builder': 0.20,    // Builder旧调试无用，只保留20%
  'default': 0.30     // 默认保留30%
};

// 角色特定摘要指令（来自 Harness Engineering - context.py）
const ROLE_SUMMARIZE_INSTRUCTIONS = {
  'evaluator': 'Preserve: all scores given, bugs found, quality assessments, and cross-round comparisons. The evaluator needs this history to track improvement trends.',
  'builder': 'Preserve: files created/modified, current architecture decisions, and the latest error states. Discard intermediate debugging steps and superseded code.',
  'default': 'Preserve: key decisions, files created/modified, current progress, and errors encountered.'
};

// Context windows per model
const CONTEXT_WINDOWS = {
  'claude-3-5-sonnet-20241022': 200_000,
  'claude-opus-4-20250514': 200_000,
  'claude-sonnet-4-20250514': 200_000,
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
  'gpt-5.4': 200_000,
  'glm-5': 200_000,
  'default': 200_000
};

// Script registry
const SCRIPTS = {
  'auto-compact-service': path.join(BIN_DIR, 'auto-compact-service.js'),
  'compact-threshold': path.join(BIN_DIR, 'compact-threshold.js'),
  'session-memory-compact': path.join(BIN_DIR, 'session-memory-compact.js'),
  'compact-warning-hook': path.join(BIN_DIR, 'compact-warning-hook.js'),
  'post-compact-cleanup': path.join(BIN_DIR, 'post-compact-cleanup.js'),
  'time-based-mc-config': path.join(BIN_DIR, 'time-based-mc-config.js')
};

function runScript(scriptName, args = []) {
  const scriptPath = SCRIPTS[scriptName];
  if (!scriptPath || !fs.existsSync(scriptPath)) {
    return { error: `script not found: ${scriptName}`, path: scriptPath };
  }
  
  try {
    const result = execSync(`node "${scriptPath}" ${args.join(' ')}`, {
      encoding: 'utf8',
      timeout: COMPACT_TIMEOUT_MS
    });
    return JSON.parse(result);
  } catch (e) {
    return { rawOutput: e.stdout || e.message, error: e.stderr };
  }
}

function getContextWindow(model) {
  const baseModel = model.split('/').pop() || model;
  return CONTEXT_WINDOWS[baseModel] || CONTEXT_WINDOWS['default'];
}

function getEffectiveContextWindow(model) {
  const contextWindow = getContextWindow(model);
  return contextWindow - MAX_OUTPUT_TOKENS_FOR_SUMMARY;
}

function getAutoCompactThreshold(model) {
  return getEffectiveContextWindow(model) - AUTOCOMPACT_BUFFER_TOKENS;
}

function getWarningThreshold(model) {
  return getEffectiveContextWindow(model) - WARNING_THRESHOLD_BUFFER;
}

function getErrorThreshold(model) {
  return getEffectiveContextWindow(model) - ERROR_THRESHOLD_BUFFER;
}

// ========================================
// safe_split_index - 避免破坏 tool_call/tool_result 配对
// 来源：Harness Engineering - context.py _safe_split_index()
// ========================================

/**
 * 找到安全的分割点，避免破坏 tool_call/tool_result 配对
 * OpenAI API要求tool results必须紧跟在请求它们的assistant消息后面
 * 
 * @param {Array} messages - 消息列表
 * @param {number} targetIdx - 目标分割索引
 * @returns {number} 安全的分割索引
 */
function safeSplitIndex(messages, targetIdx) {
  let idx = Math.max(0, Math.min(targetIdx, messages.length));
  
  // 向后扫描直到不在 tool_call/tool 配对中
  while (idx > 0 && idx < messages.length) {
    const msg = messages[idx];
    
    // 如果是tool响应，必须与前面的assistant消息配对
    if (msg.role === 'tool') {
      idx -= 1;
    } 
    // 如果是assistant消息且有tool_calls，其tool响应紧随其后
    else if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
      idx -= 1;
    } 
    else {
      break;
    }
  }
  
  return idx;
}

/**
 * 角色感知压缩 - 不同角色保留不同比例
 * 来源：Harness Engineering - context.py compact_messages()
 * 
 * @param {Array} messages - 消息列表
 * @param {string} role - 角色类型 (evaluator/builder/default)
 * @returns {Object} 压缩配置
 */
function getRoleBasedCompactConfig(messages, role) {
  const retention = ROLE_RETENTION[role] || ROLE_RETENTION['default'];
  const systemMessages = messages.filter(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  
  // 计算保留数量（至少4条）
  const keepCount = Math.max(4, Math.floor(nonSystemMessages.length * retention));
  
  // 计算分割点（使用safe_split_index）
  const splitIdx = safeSplitIndex(nonSystemMessages, nonSystemMessages.length - keepCount);
  
  // 旧消息（待压缩）和最近消息（保留）
  const oldMessages = nonSystemMessages.slice(0, splitIdx);
  const recentMessages = nonSystemMessages.slice(splitIdx);
  
  return {
    role,
    retention,
    totalMessages: messages.length,
    systemMessages: systemMessages.length,
    nonSystemMessages: nonSystemMessages.length,
    keepCount,
    splitIdx,
    oldMessagesCount: oldMessages.length,
    recentMessagesCount: recentMessages.length,
    summarizeInstruction: ROLE_SUMMARIZE_INSTRUCTIONS[role] || ROLE_SUMMARIZE_INSTRUCTIONS['default'],
    safeSplitApplied: splitIdx !== (nonSystemMessages.length - keepCount)
  };
}

function calculateTokenState(currentTokens, model) {
  const autoThreshold = getAutoCompactThreshold(model);
  const warningThreshold = getWarningThreshold(model);
  const errorThreshold = getErrorThreshold(model);
  const effectiveWindow = getEffectiveContextWindow(model);
  
  const percentUsed = Math.round((currentTokens / effectiveWindow) * 100);
  
  let level = 'ok';
  let needsCompact = false;
  let urgency = 0;
  
  if (currentTokens >= errorThreshold) {
    level = 'critical';
    needsCompact = true;
    urgency = 3;
  } else if (currentTokens >= warningThreshold) {
    level = 'warning';
    needsCompact = true;
    urgency = 2;
  } else if (currentTokens >= autoThreshold) {
    level = 'auto';
    needsCompact = true;
    urgency = 1;
  }
  
  return {
    currentTokens,
    autoThreshold,
    warningThreshold,
    errorThreshold,
    effectiveWindow,
    contextWindow: getContextWindow(model),
    percentUsed,
    level,
    needsCompact,
    urgency,
    remainingTokens: effectiveWindow - currentTokens,
    strategy: needsCompact ? getCompactStrategy(urgency) : null
  };
}

function getCompactStrategy(urgency) {
  switch (urgency) {
    case 3:
      return ['time_based', 'micro', 'session_memory', 'summary'];
    case 2:
      return ['time_based', 'micro', 'session_memory'];
    case 1:
      return ['time_based', 'micro'];
    default:
      return [];
  }
}

function runLevelCompact(level, model) {
  const results = {};
  
  switch (level) {
    case 0:
      // TimeBasedMC - 时间触发微压缩
      results.timeBasedMC = runScript('time-based-mc-config', ['check', Date.now()]);
      break;
      
    case 1:
      // MicroCompact - 清理旧 tool results
      results.microCompact = { 
        status: 'simulated',
        message: '清理超过 60min 的 tool results',
        config: runScript('time-based-mc-config', ['get'])
      };
      break;
      
    case 2:
      // SessionMemoryCompact - 会话记忆压缩
      results.sessionMemory = runScript('session-memory-compact', ['check']);
      break;
      
    case 3:
      // SummaryCompact - 总结压缩（最后手段）
      results.summary = {
        status: 'simulated',
        message: '生成对话摘要',
        warning: '这是最后手段，会丢失部分上下文'
      };
      break;
      
    default:
      results.error = `Unknown level: ${level}`;
  }
  
  return {
    level,
    strategy: getCompactStrategy(level),
    results,
    timestamp: Date.now()
  };
}

function runAutoCompact(model) {
  // 检查当前状态
  const thresholdCheck = runScript('compact-threshold', ['calculate', model]);
  
  // 检查会话记忆
  const memoryCheck = runScript('session-memory-compact', ['check']);
  
  // 检查压缩警告状态
  const warningCheck = runScript('compact-warning-hook', ['status']);
  
  // 决定压缩策略
  const strategies = [];
  
  if (thresholdCheck.needsCompact) {
    strategies.push({
      level: thresholdCheck.urgency,
      name: 'threshold_based',
      triggered: true
    });
  }
  
  if (memoryCheck.needsCompact) {
    strategies.push({
      level: 2,
      name: 'memory_based',
      triggered: true
    });
  }
  
  // 执行最合适的压缩
  let executed = null;
  if (strategies.length > 0) {
    const highestUrgency = Math.max(...strategies.map(s => s.level));
    executed = runLevelCompact(highestUrgency, model);
  }
  
  return {
    thresholdCheck,
    memoryCheck,
    warningCheck,
    strategies,
    executed,
    needsAction: strategies.length > 0,
    timestamp: Date.now()
  };
}

function compactMemory() {
  const memoryPath = path.join(WORKSPACE, 'MEMORY.md');
  
  if (!fs.existsSync(memoryPath)) {
    return { error: 'MEMORY.md not found', path: memoryPath };
  }
  
  const content = fs.readFileSync(memoryPath, 'utf8');
  const lines = content.split('\n');
  
  // 估算 tokens (CJK: 1 token per char, English: 4 chars per token)
  const cjkChars = (content.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const englishChars = content.length - cjkChars;
  const estimatedTokens = Math.ceil(cjkChars + englishChars / 4);
  
  // 检查是否需要压缩（超过 25k tokens）
  const needsCompact = estimatedTokens > 25_000;
  
  return {
    path: memoryPath,
    exists: true,
    lines: lines.length,
    characters: content.length,
    estimatedTokens,
    needsCompact,
    maxTokens: 25_000,
    percentUsed: Math.round((estimatedTokens / 25_000) * 100),
    recommendation: needsCompact ? '建议压缩 AUTO_UPDATE 区块，保留关键内容' : '无需压缩'
  };
}

function getCompactStatus(model) {
  const threshold = runScript('compact-threshold', ['calculate', model]);
  const memory = compactMemory();
  const timeBasedMC = runScript('time-based-mc-config', ['get']);
  
  return {
    model,
    threshold,
    memory,
    timeBasedMC,
    scripts: Object.keys(SCRIPTS).map(name => ({
      name,
      exists: fs.existsSync(SCRIPTS[name])
    })),
    workspace: WORKSPACE,
    timestamp: Date.now()
  };
}

// Main CLI
const command = process.argv[2] || 'status';
const modelArg = process.argv[3] || 'glm-5';
const levelArg = process.argv[4] || '';

async function main() {
  try {
    switch (command) {
      case 'status':
        console.log(JSON.stringify(getCompactStatus(modelArg), null, 2));
        break;
        
      case 'check':
        // 从 session_status 获取当前 tokens（模拟）
        const currentTokens = 125_000; // 模拟值
        console.log(JSON.stringify(calculateTokenState(currentTokens, modelArg), null, 2));
        break;
        
      case 'run':
        const level = parseInt(levelArg.replace('--level=', '')) || 0;
        console.log(JSON.stringify(runLevelCompact(level, modelArg), null, 2));
        break;
        
      case 'auto':
        console.log(JSON.stringify(runAutoCompact(modelArg), null, 2));
        break;
        
      case 'memory':
        console.log(JSON.stringify(compactMemory(), null, 2));
        break;
        
      case 'threshold':
        console.log(JSON.stringify({
          model: modelArg,
          contextWindow: getContextWindow(modelArg),
          effectiveWindow: getEffectiveContextWindow(modelArg),
          autoThreshold: getAutoCompactThreshold(modelArg),
          warningThreshold: getWarningThreshold(modelArg),
          errorThreshold: getErrorThreshold(modelArg),
          percentages: {
            auto: `${Math.round((getAutoCompactThreshold(modelArg) / getEffectiveContextWindow(modelArg)) * 100)}%`,
            warning: `${Math.round((getWarningThreshold(modelArg) / getEffectiveContextWindow(modelArg)) * 100)}%`,
            error: `${Math.round((getErrorThreshold(modelArg) / getEffectiveContextWindow(modelArg)) * 100)}%`
          }
        }, null, 2));
        break;
        
      case 'role-config':
        // 新增：角色感知压缩配置
        const role = process.argv[4] || 'default';
        // 模拟消息列表（实际应从session获取）
        const mockMessages = [
          {role: 'system', content: 'You are an assistant'},
          {role: 'user', content: 'Task 1'},
          {role: 'assistant', content: 'Response 1', tool_calls: [{id: 'tc1', function: {name: 'test'}}]},
          {role: 'tool', tool_call_id: 'tc1', content: 'Tool result'},
          {role: 'user', content: 'Task 2'},
          {role: 'assistant', content: 'Response 2'},
          {role: 'user', content: 'Task 3'},
          {role: 'assistant', content: 'Response 3'}
        ];
        console.log(JSON.stringify(getRoleBasedCompactConfig(mockMessages, role), null, 2));
        break;
        
      case 'safe-split':
        // 新增：测试 safe_split_index
        const testMessages = [
          {role: 'user', content: 'Task'},
          {role: 'assistant', content: 'Resp', tool_calls: [{id: 'tc1'}]},
          {role: 'tool', tool_call_id: 'tc1', content: 'Result'},
          {role: 'user', content: 'Task2'},
          {role: 'assistant', content: 'Resp2'}
        ];
        const testTargetIdx = 2;
        const safeIdx = safeSplitIndex(testMessages, testTargetIdx);
        console.log(JSON.stringify({
          targetIdx: testTargetIdx,
          safeSplitIdx: safeIdx,
          messageAtTarget: testMessages[testTargetIdx]?.role,
          messageAtSafe: testMessages[safeIdx]?.role,
          explanation: safeIdx !== testTargetIdx ? 'Adjusted to avoid breaking tool_call/tool pair' : 'No adjustment needed'
        }, null, 2));
        break;
        
      default:
        console.log('Unknown command:', command);
        console.log('');
        console.log('Available commands:');
        console.log('  status <model>      - 显示压缩系统状态');
        console.log('  check <model>       - 检查当前 token 状态');
        console.log('  run <model> --level=N - 执行指定层级的压缩 (0-3)');
        console.log('  auto <model>        - 自动选择并执行压缩');
        console.log('  memory              - 检查 MEMORY.md 压缩状态');
        console.log('  threshold <model>   - 显示阈值配置');
        process.exit(1);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();