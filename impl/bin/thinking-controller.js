#!/usr/bin/env node
/**
 * Thinking Controller - Adaptive thinking mode
 *
 * Purpose: Enable thinking only for complex tasks, not simple ones
 *
 * Rules:
 * - Simple queries (chat): thinking OFF
 * - File operations: thinking OFF
 * - Code generation: thinking ON
 * - Deep analysis: thinking ON
 * - Planning: thinking ON
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const STATE_FILE = path.join(WORKSPACE, 'state', 'thinking-state.json');

// Task type classification
const TASK_TYPES = {
  'simple_query': {
    patterns: ['你好', '进度如何', '状态', 'hello', 'status', 'progress'],
    thinking: false,
    reason: '简单查询，无需深度思考'
  },
  'file_operation': {
    patterns: ['read', 'write', 'glob', 'grep', 'ls'],
    thinking: false,
    reason: '文件操作，执行即可'
  },
  'code_generation': {
    patterns: ['生成代码', '写代码', 'code', 'generate', 'implement'],
    thinking: true,
    reason: '代码生成需要深度思考'
  },
  'deep_analysis': {
    patterns: ['分析', '深度', '对比', 'analyze', 'compare', 'review'],
    thinking: true,
    reason: '深度分析需要推理'
  },
  'planning': {
    patterns: ['规划', '计划', '移植', '集成', 'plan', 'integrate', 'migrate'],
    thinking: true,
    reason: '任务规划需要推理'
  }
};

class ThinkingController {
  constructor() {
    this.state = this.loadState();
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
      enabled: false,
      currentTask: null,
      stats: {
        thinkingOn: 0,
        thinkingOff: 0,
        totalTasks: 0
      }
    };
  }

  saveState() {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  /**
   * Classify task type
   */
  classifyTask(userMessage) {
    const lowered = userMessage.toLowerCase();

    for (const [type, config] of Object.entries(TASK_TYPES)) {
      for (const pattern of config.patterns) {
        if (lowered.includes(pattern.toLowerCase())) {
          return { type, ...config };
        }
      }
    }

    // Default: thinking OFF for unrecognized tasks
    return {
      type: 'default',
      thinking: false,
      reason: '未识别任务类型，默认快速响应'
    };
  }

  /**
   * Should enable thinking for this task?
   */
  shouldEnableThinking(userMessage) {
    const classification = this.classifyTask(userMessage);

    this.state.enabled = classification.thinking;
    this.state.currentTask = classification.type;
    this.state.stats.totalTasks++;

    if (classification.thinking) {
      this.state.stats.thinkingOn++;
    } else {
      this.state.stats.thinkingOff++;
    }

    this.saveState();

    return {
      enabled: classification.thinking,
      type: classification.type,
      reason: classification.reason
    };
  }

  /**
   * Get current thinking state
   */
  getState() {
    return this.state;
  }

  /**
   * Force enable/disable thinking
   */
  setThinking(enabled) {
    this.state.enabled = enabled;
    this.saveState();
    return { enabled, forced: true };
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const controller = new ThinkingController();

switch (command) {
  case 'check':
    const message = args[1] || '测试任务';
    const result = controller.shouldEnableThinking(message);
    console.log(JSON.stringify(result, null, 2));
    break;

  case 'state':
    console.log(JSON.stringify(controller.getState(), null, 2));
    break;

  case 'enable':
    controller.setThinking(true);
    console.log(JSON.stringify({ enabled: true }, null, 2));
    break;

  case 'disable':
    controller.setThinking(false);
    console.log(JSON.stringify({ enabled: false }, null, 2));
    break;

  case 'test':
    // Test classification
    const testMessages = [
      '你好',
      '进度如何',
      'read file.txt',
      '生成代码实现缓存',
      '分析 DeerFlow 架构',
      '移植 DeerFlow 功能'
    ];

    console.log('Thinking classification test:');
    testMessages.forEach(msg => {
      const result = controller.shouldEnableThinking(msg);
      console.log(`  "${msg}" → thinking: ${result.enabled} (${result.type})`);
    });
    break;

  default:
    console.log('Usage: thinking-controller.js [check|state|enable|disable|test]');
    console.log('');
    console.log('Commands:');
    console.log('  check <message> - Check if thinking should be enabled');
    console.log('  state - Get current thinking state');
    console.log('  enable - Force enable thinking');
    console.log('  disable - Force disable thinking');
    console.log('  test - Test classification');
}

module.exports = { ThinkingController, TASK_TYPES };