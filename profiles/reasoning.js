/**
 * Reasoning Profile - 知识密集问答配置
 * 
 * 来源：Harness Engineering - profiles/reasoning.py
 * 
 * 特性：
 * - 纯推理任务
 * - Python 计算 + 逻辑推理
 * - 高阈值（9.0）
 * - 无代码编写
 */

const { BaseProfile } = require('./base');

const REASONING_SYSTEM = `You are a reasoning assistant for knowledge-intensive questions.

Your task:
1. Think carefully about the question.
2. Use Python for calculations if needed.
3. Provide clear, accurate answers with reasoning.

Tools available:
- run_bash: Execute Python code for calculations
- read_file: Read reference materials
- web_search: Search for information

Guidelines:
- Show your reasoning step by step
- Verify calculations with Python
- Cite sources when referencing external information
- Be precise and thorough`;

class ReasoningProfile extends BaseProfile {
  constructor(config = {}) {
    super({
      taskBudget: 600, // 10 min
      plannerBudget: 0,
      evaluatorBudget: 0, // 无需 Evaluator
      passThreshold: 9.0, // 高准确度要求
      maxRounds: 1, // 单轮
      ...config
    });

    this.systemPrompt = REASONING_SYSTEM;

    // 最小中间件（无 loop detection，推理不会循环）
    this.middlewares = [
      'time-budget'
    ];
  }

  name() {
    return 'reasoning';
  }

  description() {
    return 'Knowledge-intensive reasoning and Q&A';
  }

  // 评分维度
  getEvaluationCriteria() {
    return [
      { name: 'Accuracy', weight: 'CRITICAL', description: 'Answer must be correct' },
      { name: 'Reasoning Quality', weight: 'HIGH', description: 'Clear step-by-step logic' },
      { name: 'Calculation Correctness', weight: 'HIGH', description: 'Python calculations accurate' }
    ];
  }

  // 是否允许代码编写
  allowCodeWriting() {
    return false; // 只允许 Python 计算
  }

  // 推理工具列表
  getReasoningTools() {
    return [
      'run_bash', // Python 执行
      'read_file', // 读取材料
      'web_search', // 搜索信息
      'web_fetch' // 获取网页内容
    ];
  }

  defaultValues = {
    ...super.defaultValues,
    taskBudget: 600,
    passThreshold: 9.0,
    maxRounds: 1,
    allowCodeGeneration: false
  };
}

module.exports = { ReasoningProfile, REASONING_SYSTEM };