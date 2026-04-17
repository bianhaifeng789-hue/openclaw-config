#!/usr/bin/env node
/**
 * OpenClaw Token Usage Tracker - LLM Token 统计
 * 
 * 借鉴 DeerFlow 2.0 的 TokenUsageConfig 统计机制
 * Track LLM token usage per model call (input/output/total tokens)
 * 成本监控，避免失控
 * 
 * 来源: https://github.com/bytedance/deer-flow
 * 参考: backend/packages/harness/deerflow/config/token_usage_config.py
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '..', 'state', 'token-usage-state.json');

/**
 * Token Usage Tracker
 */
class TokenUsageTracker {
  constructor(config = {}) {
    this.enabled = config.enabled || true;
    this.logLevel = config.log_level || 'info';
    
    // Usage stats
    this.totalTokens = 0;
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.totalCalls = 0;
    
    // Model-specific stats
    this.modelStats = {};
    
    // Session stats
    this.sessionStats = [];
    
    // Cost tracking (optional)
    this.costPerToken = {
      'bailian/glm-5': { input: 0.0001, output: 0.0001 },  // 元/token
      'openai/gpt-4o': { input: 0.005, output: 0.015 },
      'anthropic/claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 }
    };
    
    this.loadState();
  }

  /**
   * Load state from file
   */
  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        this.totalTokens = state.totalTokens || 0;
        this.totalInputTokens = state.totalInputTokens || 0;
        this.totalOutputTokens = state.totalOutputTokens || 0;
        this.totalCalls = state.totalCalls || 0;
        this.modelStats = state.modelStats || {};
        this.sessionStats = state.sessionStats || [];
      }
    } catch (err) {
      console.error('[token-usage] Load state failed:', err.message);
    }
  }

  /**
   * Save state to file
   */
  saveState() {
    try {
      const state = {
        enabled: this.enabled,
        logLevel: this.logLevel,
        totalTokens: this.totalTokens,
        totalInputTokens: this.totalInputTokens,
        totalOutputTokens: this.totalOutputTokens,
        totalCalls: this.totalCalls,
        modelStats: this.modelStats,
        sessionStats: this.sessionStats.slice(-100),  // Keep last 100 sessions
        timestamp: Date.now()
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
      console.error('[token-usage] Save state failed:', err.message);
    }
  }

  /**
   * Track token usage
   * @param {string} model - Model name (e.g., 'bailian/glm-5')
   * @param {number} inputTokens - Input tokens
   * @param {number} outputTokens - Output tokens
   * @param {string} sessionId - Session ID (optional)
   */
  track(model, inputTokens, outputTokens, sessionId = null) {
    if (!this.enabled) {
      return;
    }
    
    const totalTokens = inputTokens + outputTokens;
    
    // Update global stats
    this.totalTokens += totalTokens;
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
    this.totalCalls++;
    
    // Update model-specific stats
    if (!this.modelStats[model]) {
      this.modelStats[model] = {
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCalls: 0,
        avgInputTokens: 0,
        avgOutputTokens: 0,
        avgTotalTokens: 0
      };
    }
    
    const stats = this.modelStats[model];
    stats.totalTokens += totalTokens;
    stats.totalInputTokens += inputTokens;
    stats.totalOutputTokens += outputTokens;
    stats.totalCalls++;
    stats.avgInputTokens = Math.round(stats.totalInputTokens / stats.totalCalls);
    stats.avgOutputTokens = Math.round(stats.totalOutputTokens / stats.totalCalls);
    stats.avgTotalTokens = Math.round(stats.totalTokens / stats.totalCalls);
    
    // Track session (optional)
    if (sessionId) {
      this.sessionStats.push({
        sessionId,
        model,
        inputTokens,
        outputTokens,
        totalTokens,
        timestamp: Date.now()
      });
    }
    
    // Log at configured level
    if (this.logLevel === 'info' || this.logLevel === 'debug') {
      console.log(`[token-usage] Model: ${model}, Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`);
    }
    
    this.saveState();
    
    return {
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      cost: this.calculateCost(model, inputTokens, outputTokens)
    };
  }

  /**
   * Calculate cost
   * @param {string} model - Model name
   * @param {number} inputTokens - Input tokens
   * @param {number} outputTokens - Output tokens
   * @returns {number} Cost in yuan
   */
  calculateCost(model, inputTokens, outputTokens) {
    const pricing = this.costPerToken[model];
    if (!pricing) {
      return 0;
    }
    
    const inputCost = inputTokens * pricing.input;
    const outputCost = outputTokens * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * Get usage summary
   */
  getSummary() {
    const totalCost = Object.entries(this.modelStats).reduce((sum, [model, stats]) => {
      return sum + this.calculateCost(model, stats.totalInputTokens, stats.totalOutputTokens);
    }, 0);
    
    return {
      enabled: this.enabled,
      logLevel: this.logLevel,
      totalTokens: this.totalTokens,
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      totalCalls: this.totalCalls,
      totalCost: totalCost.toFixed(2),
      avgTokensPerCall: this.totalCalls > 0 
        ? Math.round(this.totalTokens / this.totalCalls)
        : 0,
      modelStats: this.modelStats,
      topModels: this.getTopModels(5)
    };
  }

  /**
   * Get top models by usage
   * @param {number} limit - Number of models to return
   */
  getTopModels(limit = 5) {
    return Object.entries(this.modelStats)
      .sort((a, b) => b[1].totalTokens - a[1].totalTokens)
      .slice(0, limit)
      .map(([model, stats]) => ({
        model,
        totalTokens: stats.totalTokens,
        totalCalls: stats.totalCalls,
        avgTokens: stats.avgTotalTokens
      }));
  }

  /**
   * Get session stats
   * @param {string} sessionId - Session ID (optional)
   */
  getSessionStats(sessionId = null) {
    if (sessionId) {
      return this.sessionStats.filter(s => s.sessionId === sessionId);
    }
    return this.sessionStats.slice(-20);  // Last 20 sessions
  }

  /**
   * Reset stats
   */
  reset() {
    this.totalTokens = 0;
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.totalCalls = 0;
    this.modelStats = {};
    this.sessionStats = [];
    console.log('[token-usage] Stats reset');
    this.saveState();
  }

  /**
   * Check budget (optional)
   * @param {number} budgetLimit - Budget limit in yuan
   */
  checkBudget(budgetLimit) {
    const summary = this.getSummary();
    const totalCost = parseFloat(summary.totalCost);
    
    if (totalCost >= budgetLimit) {
      console.warn(`[token-usage] ⚠️ Budget limit reached: ${totalCost} >= ${budgetLimit}`);
      return {
        exceeded: true,
        currentCost: totalCost,
        budgetLimit,
        percentage: ((totalCost / budgetLimit) * 100).toFixed(1)
      };
    }
    
    return {
      exceeded: false,
      currentCost: totalCost,
      budgetLimit,
      percentage: ((totalCost / budgetLimit) * 100).toFixed(1)
    };
  }
}

// Singleton instance
let _trackerInstance = null;

/**
 * Get TokenUsageTracker instance (singleton)
 */
function getTokenUsageTracker(config = null) {
  if (!_trackerInstance || config) {
    _trackerInstance = new TokenUsageTracker(config || { enabled: true });
  }
  return _trackerInstance;
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'summary';

if (command === 'summary') {
  const tracker = getTokenUsageTracker();
  const summary = tracker.getSummary();
  console.log(JSON.stringify(summary, null, 2));
} else if (command === 'reset') {
  const tracker = getTokenUsageTracker();
  tracker.reset();
  console.log('✓ Token usage stats reset');
} else if (command === 'track') {
  const tracker = getTokenUsageTracker();
  const model = args[1] || 'bailian/glm-5';
  const input = parseInt(args[2]) || 100;
  const output = parseInt(args[3]) || 50;
  
  const result = tracker.track(model, input, output);
  console.log('✓ Tracked:');
  console.log(JSON.stringify(result, null, 2));
} else if (command === 'budget') {
  const tracker = getTokenUsageTracker();
  const limit = parseFloat(args[1]) || 100;
  
  const result = tracker.checkBudget(limit);
  console.log(JSON.stringify(result, null, 2));
} else if (command === 'test') {
  const tracker = getTokenUsageTracker();
  
  console.log('Testing token usage tracker...\n');
  
  // Track some usage
  console.log('1. Tracking usage:');
  tracker.track('bailian/glm-5', 100, 50, 'session-1');
  tracker.track('bailian/glm-5', 200, 100, 'session-2');
  tracker.track('openai/gpt-4o', 500, 200, 'session-3');
  console.log('✓ Tracked 3 calls\n');
  
  // Summary
  console.log('2. Summary:');
  console.log(JSON.stringify(tracker.getSummary(), null, 2));
  
  // Budget check
  console.log('\n3. Budget check (limit: 1 yuan):');
  console.log(JSON.stringify(tracker.checkBudget(1), null, 2));
  
  // Reset
  console.log('\n4. Reset:');
  tracker.reset();
  console.log(JSON.stringify(tracker.getSummary(), null, 2));
} else {
  console.log('Usage: token-usage.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  summary - Show usage summary');
  console.log('  reset   - Reset stats');
  console.log('  track <model> <input> <output> - Track usage');
  console.log('  budget <limit> - Check budget');
  console.log('  test    - Test tracker');
}

module.exports = { TokenUsageTracker, getTokenUsageTracker };