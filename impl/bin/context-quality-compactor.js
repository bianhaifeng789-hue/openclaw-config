#!/usr/bin/env node
/**
 * Context Quality Compactor - 上下文质量压缩器
 * 
 * 功能：
 * 1. 角色感知压缩（不同角色保留不同比例）
 * 2. Safe Split Index（避免破坏 tool_call/tool_result 配对）
 * 3. 质量检查 + 回滚机制
 * 
 * 用法：
 *   node context-quality-compactor.js compact <session-file> [--role=evaluator|builder]
 *   node context-quality-compactor.js validate <summary-file>
 *   node context-quality-compactor.js stats
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  workspace: '/Users/mar2game/.openclaw/workspace',
  stateFile: 'state/context-quality-compactor-state.json',
  
  // 角色感知保留比例（来自 Harness Engineering）
  roleRetention: {
    evaluator: 0.50,  // Evaluator 需要跨轮对比
    builder: 0.20,    // Builder 旧调试无用
    default: 0.30
  },
  
  // 角色特定摘要指令
  roleInstructions: {
    evaluator: 'Preserve: all scores given, bugs found, quality assessments, and cross-round comparisons. The evaluator needs this history to track improvement trends.',
    builder: 'Preserve: files created/modified, current architecture decisions, and the latest error states. Discard intermediate debugging steps and superseded code.',
    default: 'Preserve: key decisions, files created/modified, current progress, and errors encountered.'
  },
  
  // 质量检查配置
  qualityCheck: {
    minKeyInfo: 3,  // 至少保留 3 个关键信息
    maxLossRate: 0.3  // 信息丢失率不超过 30%
  }
};

// 加载状态
function loadState() {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  }
  return {
    totalCompactions: 0,
    rollbackCount: 0,
    qualityScores: [],
    roleStats: { evaluator: 0, builder: 0, default: 0 }
  };
}

// 保存状态
function saveState(state) {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

/**
 * Safe Split Index - 避免破坏 tool_call/tool_result 配对
 * OpenAI API 要求 tool results 必须紧跟在请求它们的 assistant 消息后面
 */
function safeSplitIndex(messages, targetIdx) {
  let idx = Math.max(0, Math.min(targetIdx, messages.length));
  
  // 向后扫描直到不在 tool_call/tool 配对中
  while (idx > 0 && idx < messages.length) {
    const msg = messages[idx];
    
    // 如果是 tool 响应，必须与前面的 assistant 消息配对
    if (msg.role === 'tool') {
      idx -= 1;
    } 
    // 如果是 assistant 消息且有 tool_calls，其 tool 响应紧随其后
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
 * 角色感知压缩
 */
function compactWithRole(messages, role = 'default') {
  const retention = CONFIG.roleRetention[role] || CONFIG.roleRetention.default;
  const instruction = CONFIG.roleInstructions[role] || CONFIG.roleInstructions.default;
  
  // 分离 system 消息
  const systemMessages = messages.filter(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  
  // 计算保留数量（至少 4 条）
  const keepCount = Math.max(4, Math.floor(nonSystemMessages.length * retention));
  
  // 使用 safe_split_index 计算分割点
  const splitIdx = safeSplitIndex(nonSystemMessages, nonSystemMessages.length - keepCount);
  
  // 旧消息（待压缩）和最近消息（保留）
  const oldMessages = nonSystemMessages.slice(0, splitIdx);
  const recentMessages = nonSystemMessages.slice(splitIdx);
  
  // 生成摘要
  const summary = generateSummary(oldMessages, instruction);
  
  // 质量检查
  const qualityCheck = validateCompression(oldMessages, summary);
  
  if (!qualityCheck.passed) {
    // 回滚：保留更多消息
    console.log(`质量检查失败: ${qualityCheck.reason}`);
    console.log('回滚：保留更多消息...');
    
    const fallbackKeepCount = Math.max(8, Math.floor(nonSystemMessages.length * (retention + 0.1)));
    const fallbackSplitIdx = safeSplitIndex(nonSystemMessages, nonSystemMessages.length - fallbackKeepCount);
    
    const fallbackOldMessages = nonSystemMessages.slice(0, fallbackSplitIdx);
    const fallbackRecentMessages = nonSystemMessages.slice(fallbackSplitIdx);
    const fallbackSummary = generateSummary(fallbackOldMessages, instruction);
    
    return {
      role,
      retention: retention + 0.1,
      systemMessages,
      summaryMessage: {
        role: 'assistant',
        content: `[压缩摘要 - ${role}]\n${fallbackSummary}`,
        _compressed: true,
        _role: role
      },
      recentMessages: fallbackRecentMessages,
      qualityCheck: { ...qualityCheck, rolledBack: true },
      safeSplitApplied: fallbackSplitIdx !== (nonSystemMessages.length - fallbackKeepCount)
    };
  }
  
  return {
    role,
    retention,
    systemMessages,
    summaryMessage: {
      role: 'assistant',
      content: `[压缩摘要 - ${role}]\n${summary}`,
      _compressed: true,
      _role: role
    },
    recentMessages,
    qualityCheck,
    safeSplitApplied: splitIdx !== (nonSystemMessages.length - keepCount)
  };
}

/**
 * 生成摘要
 */
function generateSummary(messages, instruction) {
  // 提取关键信息
  const keyInfo = [];
  
  // 1. 用户输入（去重）
  const userInputs = [...new Set(
    messages.filter(m => m.role === 'user')
      .map(m => (m.content || '').slice(0, 100))
      .filter(c => c.length > 10)
  )].slice(0, 3);
  
  if (userInputs.length > 0) {
    keyInfo.push(`用户输入: ${userInputs.join('; ')}`);
  }
  
  // 2. 工具调用
  const toolCalls = messages.filter(m => m.role === 'assistant' && m.tool_calls)
    .flatMap(m => m.tool_calls.map(t => t.function?.name))
    .filter(Boolean);
  
  const uniqueToolCalls = [...new Set(toolCalls)].slice(0, 5);
  if (uniqueToolCalls.length > 0) {
    keyInfo.push(`工具调用: ${uniqueToolCalls.join(', ')}`);
  }
  
  // 3. 错误信息
  const errors = messages.filter(m => {
    const content = (m.content || '').toLowerCase();
    return content.includes('error') || content.includes('failed') || content.includes('exception');
  }).length;
  
  if (errors > 0) {
    keyInfo.push(`错误数量: ${errors}`);
  }
  
  // 4. 文件操作
  const fileOps = messages.filter(m => {
    const content = m.content || '';
    return content.includes('created') || content.includes('modified') || 
           content.includes('deleted') || content.includes('文件');
  }).length;
  
  if (fileOps > 0) {
    keyInfo.push(`文件操作: ${fileOps}`);
  }
  
  return `${instruction}

原始消息: ${messages.length} 条
${keyInfo.join('\n')}
压缩时间: ${new Date().toISOString()}`;
}

/**
 * 验证压缩质量
 */
function validateCompression(originalMessages, summary) {
  // 检查关键信息数量
  const keyInfoCount = (summary.match(/:/g) || []).length;
  
  if (keyInfoCount < CONFIG.qualityCheck.minKeyInfo) {
    return {
      passed: false,
      reason: `关键信息不足: ${keyInfoCount} < ${CONFIG.qualityCheck.minKeyInfo}`,
      keyInfoCount
    };
  }
  
  // 检查信息丢失率（通过摘要长度估算）
  const originalLength = JSON.stringify(originalMessages).length;
  const summaryLength = summary.length;
  const lossRate = 1 - (summaryLength / originalLength);
  
  if (lossRate > CONFIG.qualityCheck.maxLossRate) {
    return {
      passed: false,
      reason: `信息丢失率过高: ${Math.round(lossRate * 100)}% > ${Math.round(CONFIG.qualityCheck.maxLossRate * 100)}%`,
      lossRate,
      keyInfoCount
    };
  }
  
  return {
    passed: true,
    lossRate,
    keyInfoCount
  };
}

/**
 * 压缩会话
 */
function compactSession(sessionFile, role = 'default') {
  console.log(`=== 压缩会话: ${path.basename(sessionFile)} ===\n`);
  console.log(`角色: ${role}`);
  console.log(`保留比例: ${CONFIG.roleRetention[role] * 100}%\n`);
  
  if (!fs.existsSync(sessionFile)) {
    console.log('会话文件不存在');
    return null;
  }
  
  const content = fs.readFileSync(sessionFile, 'utf8');
  const messages = content.trim().split('\n').map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
  
  console.log(`原始消息: ${messages.length} 条`);
  
  // 执行压缩
  const result = compactWithRole(messages, role);
  
  console.log(`\n压缩结果:`);
  console.log(`  - System 消息: ${result.systemMessages.length}`);
  console.log(`  - 摘要消息: 1`);
  console.log(`  - 保留消息: ${result.recentMessages.length}`);
  console.log(`  - Safe Split: ${result.safeSplitApplied ? '已应用' : '未应用'}`);
  console.log(`  - 质量检查: ${result.qualityCheck.passed ? '通过' : '失败'}`);
  
  if (result.qualityCheck.rolledBack) {
    console.log(`  - 回滚: 是（保留比例调整为 ${result.retention * 100}%）`);
  }
  
  // 保存压缩后的会话
  const compressedMessages = [
    ...result.systemMessages,
    result.summaryMessage,
    ...result.recentMessages
  ];
  
  const compressedContent = compressedMessages.map(m => JSON.stringify(m)).join('\n');
  const compressedPath = sessionFile + '.quality-compacted';
  
  fs.writeFileSync(compressedPath, compressedContent);
  
  console.log(`\n压缩后文件: ${compressedPath}`);
  console.log(`原始大小: ${Math.round(content.length / 1024)}KB`);
  console.log(`压缩后大小: ${Math.round(compressedContent.length / 1024)}KB`);
  console.log(`节省: ${Math.round((content.length - compressedContent.length) / 1024)}KB`);
  
  // 更新统计
  const state = loadState();
  state.totalCompactions++;
  if (result.qualityCheck.rolledBack) state.rollbackCount++;
  state.qualityScores.push(result.qualityCheck.passed ? 1 : 0);
  state.roleStats[role]++;
  saveState(state);
  
  return result;
}

/**
 * 显示统计
 */
function showStats() {
  console.log('=== 上下文质量压缩统计 ===\n');
  
  const state = loadState();
  
  console.log(`总压缩次数: ${state.totalCompactions}`);
  console.log(`回滚次数: ${state.rollbackCount}`);
  console.log(`回滚率: ${Math.round(state.rollbackCount / state.totalCompactions * 100) || 0}%`);
  
  if (state.qualityScores.length > 0) {
    const passRate = state.qualityScores.filter(s => s === 1).length / state.qualityScores.length;
    console.log(`质量通过率: ${Math.round(passRate * 100)}%`);
  }
  
  console.log(`\n角色分布:`);
  Object.entries(state.roleStats).forEach(([role, count]) => {
    console.log(`  - ${role}: ${count}`);
  });
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'stats';
  
  switch (action) {
    case 'compact':
      if (args[1]) {
        const roleArg = args.find(a => a.startsWith('--role='));
        const role = roleArg ? roleArg.split('=')[1] : 'default';
        compactSession(args[1], role);
      } else {
        console.log('用法: node context-quality-compactor.js compact <session-file> [--role=evaluator|builder]');
      }
      break;
      
    case 'validate':
      console.log('验证功能待实现');
      break;
      
    case 'stats':
      showStats();
      break;
      
    default:
      console.log('用法: node context-quality-compactor.js [compact|validate|stats]');
  }
}

main().catch(console.error);