#!/usr/bin/env node
/**
 * Prompt Suggestion Service - 基于 Claude Code PromptSuggestion
 * 
 * 提示词建议：
 *   - 基于上下文生成建议
 *   - 常用命令推荐
 *   - 学习用户模式
 * 
 * Usage:
 *   node prompt-suggestion.js suggest <context>
 *   node prompt-suggestion.js learn <prompt>
 *   node prompt-suggestion.js history
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'prompt-suggestion');
const HISTORY_FILE = path.join(STATE_DIR, 'prompt-history.json');
const SUGGESTIONS_FILE = path.join(STATE_DIR, 'suggestions.json');

// Common prompts suggestions
const COMMON_SUGGESTIONS = [
  { label: '继续实现', description: 'Continue implementation' },
  { label: '测试一下', description: 'Test the system' },
  { label: '检查状态', description: 'Check system status' },
  { label: '清理缓存', description: 'Clear caches' },
  { label: '查看日志', description: 'View logs' },
  { label: '生成报告', description: 'Generate report' },
  { label: '优化性能', description: 'Optimize performance' },
  { label: '修复问题', description: 'Fix issues' },
  { label: '添加功能', description: 'Add features' },
  { label: '更新文档', description: 'Update documentation' }
];

function loadPromptHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return { prompts: [], totalPrompts: 0 };
  }
  
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return { prompts: [], totalPrompts: 0 };
  }
}

function savePromptHistory(history) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function loadSuggestions() {
  if (!fs.existsSync(SUGGESTIONS_FILE)) {
    return { suggestions: COMMON_SUGGESTIONS, learned: [] };
  }
  
  try {
    return JSON.parse(fs.readFileSync(SUGGESTIONS_FILE, 'utf8'));
  } catch {
    return { suggestions: COMMON_SUGGESTIONS, learned: [] };
  }
}

function saveSuggestions(suggestions) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2));
}

function suggestPrompts(context = '') {
  const suggestions = loadSuggestions();
  const history = loadPromptHistory();
  
  // Context-based filtering
  let filtered = suggestions.suggestions;
  
  if (context.includes('实现') || context.includes('implement')) {
    filtered = filtered.filter(s => 
      s.label.includes('实现') || 
      s.label.includes('添加') ||
      s.label.includes('功能')
    );
  } else if (context.includes('测试') || context.includes('test')) {
    filtered = filtered.filter(s => 
      s.label.includes('测试') || 
      s.label.includes('检查')
    );
  } else if (context.includes('问题') || context.includes('error')) {
    filtered = filtered.filter(s => 
      s.label.includes('修复') || 
      s.label.includes('查看')
    );
  }
  
  // Add learned suggestions
  const learnedSuggestions = suggestions.learned.slice(0, 5);
  
  // Add recent prompts from history
  const recentPrompts = history.prompts.slice(-5).map(p => ({
    label: p.prompt.slice(0, 20),
    description: 'Recent prompt',
    learned: true,
    timestamp: p.timestamp
  }));
  
  return {
    suggestions: filtered.slice(0, 5),
    learned: learnedSuggestions,
    recent: recentPrompts,
    total: filtered.length + learnedSuggestions.length + recentPrompts.length,
    context
  };
}

function learnPrompt(prompt) {
  const suggestions = loadSuggestions();
  
  // Check if already learned
  if (suggestions.learned.some(s => s.label === prompt.slice(0, 20))) {
    return {
      learned: false,
      reason: 'already known',
      prompt
    };
  }
  
  const learnedPrompt = {
    label: prompt.slice(0, 20),
    description: 'Learned from user',
    fullPrompt: prompt,
    learnedAt: Date.now(),
    usageCount: 1
  };
  
  suggestions.learned.push(learnedPrompt);
  
  // Keep only top 20 learned
  if (suggestions.learned.length > 20) {
    suggestions.learned.sort((a, b) => b.usageCount - a.usageCount);
    suggestions.learned = suggestions.learned.slice(0, 20);
  }
  
  saveSuggestions(suggestions);
  
  return {
    learned: true,
    prompt: learnedPrompt,
    totalLearned: suggestions.learned.length
  };
}

function recordPromptUsage(prompt) {
  const history = loadPromptHistory();
  
  history.prompts.push({
    prompt,
    timestamp: Date.now(),
    id: `prompt_${Date.now()}`
  });
  history.totalPrompts++;
  
  // Keep only last 100
  if (history.prompts.length > 100) {
    history.prompts = history.prompts.slice(-100);
  }
  
  savePromptHistory(history);
  
  // Update learned prompt usage count
  const suggestions = loadSuggestions();
  const learned = suggestions.learned.find(s => 
    s.fullPrompt === prompt || 
    s.label === prompt.slice(0, 20)
  );
  
  if (learned) {
    learned.usageCount++;
    learned.lastUsedAt = Date.now();
    saveSuggestions(suggestions);
  }
  
  return {
    recorded: true,
    prompt
  };
}

function getPromptHistory(limit = 20) {
  const history = loadPromptHistory();
  
  return {
    prompts: history.prompts.slice(-limit),
    total: history.totalPrompts,
    recent: history.prompts.slice(-10)
  };
}

function getLearnedSuggestions() {
  const suggestions = loadSuggestions();
  
  return {
    learned: suggestions.learned,
    count: suggestions.learned.length,
    topUsed: suggestions.learned.sort((a, b) => b.usageCount - a.usageCount).slice(0, 10)
  };
}

function clearLearnedSuggestions() {
  const suggestions = { suggestions: COMMON_SUGGESTIONS, learned: [] };
  saveSuggestions(suggestions);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'suggest';
  
  switch (command) {
    case 'suggest':
      const context = args[1] || '';
      console.log(JSON.stringify(suggestPrompts(context), null, 2));
      break;
    case 'learn':
      const learnPromptText = args[1];
      if (!learnPromptText) {
        console.log('Usage: node prompt-suggestion.js learn <prompt>');
        process.exit(1);
      }
      console.log(JSON.stringify(learnPrompt(learnPromptText), null, 2));
      break;
    case 'record':
      const recordPromptText = args[1];
      if (!recordPromptText) {
        console.log('Usage: node prompt-suggestion.js record <prompt>');
        process.exit(1);
      }
      console.log(JSON.stringify(recordPromptUsage(recordPromptText), null, 2));
      break;
    case 'history':
      const historyLimit = parseInt(args[1], 10) || 20;
      console.log(JSON.stringify(getPromptHistory(historyLimit), null, 2));
      break;
    case 'learned':
      console.log(JSON.stringify(getLearnedSuggestions(), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearLearnedSuggestions(), null, 2));
      break;
    default:
      console.log('Usage: node prompt-suggestion.js [suggest|learn|record|history|learned|clear]');
      process.exit(1);
  }
}

main();

module.exports = {
  suggestPrompts,
  learnPrompt,
  recordPromptUsage,
  getPromptHistory,
  getLearnedSuggestions,
  COMMON_SUGGESTIONS
};