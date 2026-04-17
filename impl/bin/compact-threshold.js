#!/usr/bin/env node
/**
 * Compact Threshold Calculator - 基于 Claude Code autoCompact.ts
 * 
 * 计算自动压缩触发阈值：
 *   - effectiveContextWindow = contextWindow - reservedTokensForSummary
 *   - threshold = effectiveContextWindow - AUTOCOMPACT_BUFFER_TOKENS
 * 
 * Constants:
 *   - MAX_OUTPUT_TOKENS_FOR_SUMMARY = 20_000 (p99.99 of compact summaries)
 *   - AUTOCOMPACT_BUFFER_TOKENS = 13_000
 *   - WARNING_THRESHOLD_BUFFER_TOKENS = 20_000
 *   - ERROR_THRESHOLD_BUFFER_TOKENS = 20_000
 * 
 * Usage:
 *   node compact-threshold.js calculate <model>
 *   node compact-threshold.js check <currentTokens> <model>
 */

// Constants from Claude Code
const MAX_OUTPUT_TOKENS_FOR_SUMMARY = 20_000;
const AUTOCOMPACT_BUFFER_TOKENS = 13_000;
const WARNING_THRESHOLD_BUFFER_TOKENS = 20_000;
const ERROR_THRESHOLD_BUFFER_TOKENS = 20_000;
const MANUAL_COMPACT_BUFFER_TOKENS = 3_000;

// Context window sizes per model (from Claude Code utils/context.ts)
const CONTEXT_WINDOWS = {
  'claude-3-5-sonnet-20241022': 200_000,
  'claude-3-5-haiku-20241022': 200_000,
  'claude-opus-4-20250514': 200_000,
  'claude-sonnet-4-20250514': 200_000,
  'claude-3-opus-20240229': 200_000,
  'claude-3-sonnet-20240229': 200_000,
  'claude-3-haiku-20240307': 200_000,
  'gpt-4': 8_192,
  'gpt-4-turbo': 128_000,
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
  'gpt-5.4': 200_000, // assumption
  'glm-5': 200_000, // assumption
  'default': 200_000
};

function getContextWindowForModel(model) {
  // Handle model prefixes (e.g., "codex/gpt-5.4" -> "gpt-5.4")
  const baseModel = model.split('/').pop() || model;
  
  return CONTEXT_WINDOWS[baseModel] || CONTEXT_WINDOWS['default'];
}

function getEffectiveContextWindowSize(model) {
  const contextWindow = getContextWindowForModel(model);
  
  // Allow override via environment
  const autoCompactWindow = process.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW;
  if (autoCompactWindow) {
    const parsed = parseInt(autoCompactWindow, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return Math.min(contextWindow, parsed) - MAX_OUTPUT_TOKENS_FOR_SUMMARY;
    }
  }
  
  return contextWindow - MAX_OUTPUT_TOKENS_FOR_SUMMARY;
}

function getAutoCompactThreshold(model) {
  const effectiveContextWindow = getEffectiveContextWindowSize(model);
  return effectiveContextWindow - AUTOCOMPACT_BUFFER_TOKENS;
}

function getWarningThreshold(model) {
  const effectiveContextWindow = getEffectiveContextWindowSize(model);
  return effectiveContextWindow - WARNING_THRESHOLD_BUFFER_TOKENS;
}

function getErrorThreshold(model) {
  const effectiveContextWindow = getEffectiveContextWindowSize(model);
  return effectiveContextWindow - ERROR_THRESHOLD_BUFFER_TOKENS;
}

function calculateThresholds(model) {
  const contextWindow = getContextWindowForModel(model);
  const effectiveContextWindow = getEffectiveContextWindowSize(model);
  const autoCompactThreshold = getAutoCompactThreshold(model);
  const warningThreshold = getWarningThreshold(model);
  const errorThreshold = getErrorThreshold(model);
  
  return {
    model,
    contextWindow,
    reservedForSummary: MAX_OUTPUT_TOKENS_FOR_SUMMARY,
    effectiveContextWindow,
    thresholds: {
      autoCompact: autoCompactThreshold,
      warning: warningThreshold,
      error: errorThreshold,
      manualCompact: effectiveContextWindow - MANUAL_COMPACT_BUFFER_TOKENS
    },
    percentages: {
      autoCompact: (autoCompactThreshold / contextWindow * 100).toFixed(1) + '%',
      warning: (warningThreshold / contextWindow * 100).toFixed(1) + '%',
      error: (errorThreshold / contextWindow * 100).toFixed(1) + '%'
    }
  };
}

function checkIfNeedsCompact(currentTokens, model) {
  const thresholds = calculateThresholds(model);
  
  let status = 'OK';
  let action = 'none';
  let urgency = 0;
  
  if (currentTokens >= thresholds.thresholds.error) {
    status = 'CRITICAL';
    action = 'compact immediately';
    urgency = 100;
  } else if (currentTokens >= thresholds.thresholds.warning) {
    status = 'WARNING';
    action = 'consider compacting';
    urgency = 50;
  } else if (currentTokens >= thresholds.thresholds.autoCompact) {
    status = 'AUTO_COMPACT';
    action = 'auto compact triggered';
    urgency = 30;
  }
  
  return {
    currentTokens,
    model,
    thresholds: thresholds.thresholds,
    percentages: thresholds.percentages,
    status,
    action,
    urgency,
    remaining: thresholds.effectiveContextWindow - currentTokens,
    percentageUsed: (currentTokens / thresholds.contextWindow * 100).toFixed(1) + '%'
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'calculate';
  
  switch (command) {
    case 'calculate':
      const model = args[1] || 'default';
      const result = calculateThresholds(model);
      console.log(JSON.stringify(result, null, 2));
      break;
    case 'check':
      const tokens = parseInt(args[1], 10);
      const checkModel = args[2] || 'default';
      if (isNaN(tokens)) {
        console.log('Usage: node compact-threshold.js check <currentTokens> <model>');
        process.exit(1);
      }
      const checkResult = checkIfNeedsCompact(tokens, checkModel);
      console.log(JSON.stringify(checkResult, null, 2));
      break;
    case 'table':
      console.log('=== Compact Thresholds by Model ===');
      console.log('');
      for (const [model, window] of Object.entries(CONTEXT_WINDOWS)) {
        const t = calculateThresholds(model);
        console.log(`${model}:`);
        console.log(`  Context: ${t.contextWindow}, Effective: ${t.effectiveContextWindow}`);
        console.log(`  AutoCompact: ${t.thresholds.autoCompact} (${t.percentages.autoCompact})`);
        console.log(`  Warning: ${t.thresholds.warning} (${t.percentages.warning})`);
        console.log(`  Error: ${t.thresholds.error} (${t.percentages.error})`);
        console.log('');
      }
      break;
    default:
      console.log('Usage: node compact-threshold.js [calculate|check|table] [model]');
      process.exit(1);
  }
}

main();