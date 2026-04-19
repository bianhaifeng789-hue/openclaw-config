/**
 * Context 压缩质量优化器
 * 角色感知压缩 + 质量检查 + 回滚机制
 */

const ROLE_RETENTION = {
  evaluator: 0.50,  // Evaluator 需要跨轮对比
  builder: 0.20,    // Builder 旧调试无用
  planner: 0.30,    // Planner 需要历史上下文
  default: 0.30
};

const ROLE_SUMMARIZE_INSTRUCTIONS = {
  evaluator: '保留：所有评分、发现的 bug、跨轮对比结果',
  builder: '保留：创建/修改的文件、架构决策、最新错误',
  planner: '保留：任务分解、依赖关系、执行计划',
  default: '保留：关键决策、修改的文件、当前进度、错误'
};

// 安全分割索引（避免破坏 tool_call/tool_result 配对）
function safeSplitIndex(messages, targetIndex) {
  // 确保不破坏 tool_call/tool_result 配对
  let splitIdx = targetIndex;

  // 向前找，直到找到一个安全的分割点
  while (splitIdx > 0) {
    const msg = messages[splitIdx];
    const prevMsg = messages[splitIdx - 1];

    // 检查是否是 tool_call 后紧跟 tool_result
    if (prevMsg?.tool_calls && msg?.role === 'tool') {
      // 需要包含这个 tool_result，向前移动
      splitIdx--;
      continue;
    }

    // 检查是否是 tool_result 后紧跟 assistant 的总结
    if (prevMsg?.role === 'tool' && msg?.role === 'assistant') {
      // 这是一个安全的分割点
      break;
    }

    // 普通消息，可以分割
    if (!msg?.tool_calls && msg?.role !== 'tool') {
      break;
    }

    splitIdx--;
  }

  return Math.max(0, splitIdx);
}

// 生成摘要
function generateSummary(messages, options = {}) {
  const instruction = options.instruction || ROLE_SUMMARIZE_INSTRUCTIONS.default;

  // 提取关键信息
  const keyDecisions = [];
  const filesModified = [];
  const errors = [];
  const progress = [];

  for (const msg of messages) {
    const content = msg.content || '';

    // 检测决策
    if (content.includes('决定') || content.includes('选择') || content.includes('方案')) {
      keyDecisions.push(content.slice(0, 100));
    }

    // 检测文件修改
    const fileMatches = content.match(/[\w-]+\.(js|ts|py|md|json|yml|yaml)/g);
    if (fileMatches) {
      filesModified.push(...fileMatches);
    }

    // 检测错误
    if (content.includes('错误') || content.includes('error') || content.includes('失败')) {
      errors.push(content.slice(0, 100));
    }

    // 检测进度
    if (content.includes('完成') || content.includes('✓') || content.includes('done')) {
      progress.push(content.slice(0, 100));
    }
  }

  // 生成摘要文本
  const summary = `[压缩摘要 - ${instruction}]
关键决策: ${keyDecisions.slice(0, 3).join('; ') || '无'}
文件修改: ${[...new Set(filesModified)].slice(0, 5).join(', ') || '无'}
错误记录: ${errors.slice(0, 3).join('; ') || '无'}
进度: ${progress.slice(0, 3).join('; ') || '无'}
原始消息数: ${messages.length}`;

  return summary;
}

// 验证摘要质量
function validateSummary(summary, originalMessages) {
  // 检查摘要长度
  if (summary.length < 50) {
    return { valid: false, reason: 'Summary too short' };
  }

  // 检查是否包含关键信息
  const hasKeyInfo = summary.includes('关键决策') ||
                     summary.includes('文件修改') ||
                     summary.includes('错误记录');

  if (!hasKeyInfo) {
    return { valid: false, reason: 'Missing key information' };
  }

  // 检查摘要比例（不应超过原始消息的 20%）
  const originalLength = originalMessages.reduce((sum, m) => sum + (m.content || '').length, 0);
  if (summary.length > originalLength * 0.2) {
    return { valid: false, reason: 'Summary too long' };
  }

  return { valid: true };
}

// 角色感知压缩
function compactWithRole(role, messages, options = {}) {
  const retention = ROLE_RETENTION[role] || ROLE_RETENTION.default;
  const keepCount = Math.floor(messages.length * retention);

  // 使用安全分割索引
  const splitIdx = safeSplitIndex(messages, messages.length - keepCount);

  const oldMessages = messages.slice(0, splitIdx);
  const recentMessages = messages.slice(splitIdx);

  // 生成摘要
  const summary = generateSummary(oldMessages, {
    instruction: ROLE_SUMMARIZE_INSTRUCTIONS[role] || ROLE_SUMMARIZE_INSTRUCTIONS.default
  });

  // 质量检查
  const validation = validateSummary(summary, oldMessages);

  if (!validation.valid && !options.keepMore) {
    // 回滚：保留更多消息
    console.log(`[Compact] Quality check failed: ${validation.reason}, retrying with more context...`);
    return compactWithRole(role, messages, { keepMore: true, keepRatio: 0.5 });
  }

  return [
    { role: 'assistant', content: summary },
    ...recentMessages
  ];
}

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'test':
      // 测试用例
      const testMessages = [
        { role: 'user', content: '帮我优化代码' },
        { role: 'assistant', content: '我来分析...', tool_calls: [{ id: '1' }] },
        { role: 'tool', content: '分析结果', tool_call_id: '1' },
        { role: 'assistant', content: '发现了几个问题' },
        { role: 'user', content: '怎么修复？' },
        { role: 'assistant', content: '建议修改 file.js' }
      ];

      const result = compactWithRole('builder', testMessages);
      console.log('Test result:');
      console.log('- Messages before:', testMessages.length);
      console.log('- Messages after:', result.length);
      console.log('- Summary:', result[0].content.slice(0, 100) + '...');
      break;

    case 'roles':
      console.log('Available roles:', Object.keys(ROLE_RETENTION));
      console.log('Retention rates:', ROLE_RETENTION);
      break;

    default:
      console.log('Usage: node context-compact-quality.js [test|roles]');
  }
}

module.exports = {
  compactWithRole,
  generateSummary,
  validateSummary,
  safeSplitIndex,
  ROLE_RETENTION,
  ROLE_SUMMARIZE_INSTRUCTIONS
};
