/**
 * Base Profile - 基类配置
 * 
 * 来源：Harness Engineering - profiles/base.py
 * 
 * 所有 profiles 继承此基类，包含：
 * - 名称/描述
 * - 中间件组合
 * - 时间预算
 * - Pass threshold
 * - 系统 prompt
 */

class BaseProfile {
  constructor(config = {}) {
    this.cfg = {
      taskBudget: config.taskBudget || 1800,
      plannerBudget: config.plannerBudget || 120,
      evaluatorBudget: config.evaluatorBudget || 180,
      passThreshold: config.passThreshold || 7.0,
      maxRounds: config.maxRounds || 5,
      ...config
    };
    
    this.middlewares = [];
    this.systemPrompt = '';
  }

  name() {
    return 'base';
  }

  description() {
    return 'Base profile - inherit to customize';
  }

  // 动态配置解析（env var > config > default）
  resolve(key, envPrefix = 'PROFILE') {
    const envKey = `${envPrefix}_${this.name().toUpperCase()}_${key.toUpperCase()}`;
    const envValue = process.env[envKey];
    
    if (envValue !== undefined) {
      // 数值转换
      if (!isNaN(parseFloat(envValue))) {
        return parseFloat(envValue);
      }
      return envValue;
    }
    
    return this.cfg[key] || this.defaultValues[key];
  }

  // 计算 Builder 预算
  get builderBudget() {
    return this.resolve('taskBudget') - 
           this.resolve('plannerBudget') - 
           this.resolve('evaluatorBudget');
  }

  // 获取中间件组合
  getMiddlewares() {
    return this.middlewares;
  }

  // 获取系统 prompt
  getSystemPrompt() {
    return this.systemPrompt;
  }

  // 默认值
  defaultValues = {
    taskBudget: 1800,
    plannerBudget: 120,
    evaluatorBudget: 180,
    passThreshold: 7.0,
    maxRounds: 5,
    maxIterations: 500,
    maxToolErrors: 5,
    compressThreshold: 80000,
    resetThreshold: 150000
  };
}

module.exports = { BaseProfile };