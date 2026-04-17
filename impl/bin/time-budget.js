#!/usr/bin/env node
/**
 * Time Budget - 时间预算管理
 * 
 * 管理Agent时间预算，提供警告和强制停止
 * 
 * 来源：Harness Engineering - TimeBudgetMiddleware
 * 
 * 阶段：
 * - 60%预算 → 警告
 * - 85%预算 → 关闭新功能
 * - 100%预算 → 强制停止
 * 
 * 用法：
 * node time-budget.js start <budget_seconds>
 * node time-budget.js check
 * node time-budget.js status
 */

const fs = require('fs');
const path = require('path');

// 状态文件
const STATE_FILE = path.join(__dirname, '..', '..', 'memory', 'time-budget-state.json');

// 阶段阈值
const WARN_THRESHOLD = 0.60;
const CRITICAL_THRESHOLD = 0.85;
const STOP_THRESHOLD = 1.00;

/**
 * 初始化时间预算
 * @param {number} budgetSeconds - 时间预算（秒）
 * @returns {Object} 初始状态
 */
function initTimeBudget(budgetSeconds) {
  const state = {
    budget: budgetSeconds,
    startTime: Date.now(),
    elapsed: 0,
    remaining: budgetSeconds,
    percentage: 0,
    phase: 'normal',
    warnings: []
  };
  
  saveState(state);
  return state;
}

/**
 * 检查时间预算
 * @returns {Object} 当前状态和建议
 */
function checkTimeBudget() {
  const state = loadState();
  
  if (!state) {
    return {
      active: false,
      message: '时间预算未启动'
    };
  }
  
  // 计算已用时间
  state.elapsed = (Date.now() - state.startTime) / 1000;
  state.remaining = Math.max(0, state.budget - state.elapsed);
  state.percentage = state.elapsed / state.budget;
  
  // 确定阶段
  if (state.percentage >= STOP_THRESHOLD) {
    state.phase = 'stop';
  } else if (state.percentage >= CRITICAL_THRESHOLD) {
    state.phase = 'critical';
  } else if (state.percentage >= WARN_THRESHOLD) {
    state.phase = 'warning';
  } else {
    state.phase = 'normal';
  }
  
  // 生成建议
  const recommendation = getRecommendation(state);
  
  saveState(state);
  
  return {
    active: true,
    ...state,
    recommendation
  };
}

/**
 * 获取推荐操作
 * @param {Object} state - 当前状态
 * @returns {string} 推荐信息
 */
function getRecommendation(state) {
  switch (state.phase) {
    case 'stop':
      return `⏱️ 时间预算耗尽！已用 ${formatTime(state.elapsed)} / 预算 ${formatTime(state.budget)}\n\n强制停止：\n1. 立即停止当前工作\n2. 总结已完成部分\n3. 保存进度\n4. 建议用户增加预算或分阶段执行`;
    
    case 'critical':
      return `⚠️ 时间预算严重不足！剩余 ${formatTime(state.remaining)} (${Math.round(state.percentage * 100)}%已用)\n\n紧急措施：\n1. 停止探索性工作\n2. 只做核心任务\n3. 简化方案\n4. 准备结束`;
    
    case 'warning':
      return `⏰ 时间预算警告！已用 ${formatTime(state.elapsed)} / 预算 ${formatTime(state.budget)} (${Math.round(state.percentage * 100)}%)\n\n建议：\n1. 检查进度\n2. 评估剩余任务\n3. 调整优先级\n4. 避免扩展需求`;
    
    default:
      return `✅ 时间预算充足。剩余 ${formatTime(state.remaining)} (${Math.round((1 - state.percentage) * 100)}%)`;
  }
}

/**
 * 格式化时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化时间
 */
function formatTime(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * 加载状态
 * @returns {Object|null} 状态对象
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (err) {
    // 忽略错误
  }
  return null;
}

/**
 * 保存状态
 * @param {Object} state - 状态对象
 */
function saveState(state) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    // 忽略错误
  }
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'start') {
    const budgetSeconds = parseInt(args[1]);
    
    if (!budgetSeconds) {
      console.error('用法: node time-budget.js start <budget_seconds>');
      process.exit(1);
    }
    
    const state = initTimeBudget(budgetSeconds);
    console.log(JSON.stringify(state, null, 2));
    console.log(`\n✅ 时间预算启动: ${formatTime(budgetSeconds)}`);
    
  } else if (command === 'check') {
    const result = checkTimeBudget();
    console.log(JSON.stringify(result, null, 2));
    
    if (result.active) {
      console.log(`\n阶段: ${result.phase}`);
      console.log(`已用: ${formatTime(result.elapsed)}`);
      console.log(`剩余: ${formatTime(result.remaining)}`);
      console.log(`百分比: ${Math.round(result.percentage * 100)}%`);
    }
    
  } else if (command === 'status') {
    console.log(JSON.stringify({
      thresholds: {
        warn: WARN_THRESHOLD,
        critical: CRITICAL_THRESHOLD,
        stop: STOP_THRESHOLD
      },
      version: '1.0.0'
    }, null, 2));
    
  } else if (command === 'test') {
    // 测试阶段判断逻辑
    const testState = {budget: 60, startTime: Date.now()};
    
    // 测试60%警告
    testState.elapsed = 36;
    testState.percentage = testState.elapsed / testState.budget;
    testState.remaining = testState.budget - testState.elapsed;
    testState.phase = testState.percentage >= STOP_THRESHOLD ? 'stop' :
                      testState.percentage >= CRITICAL_THRESHOLD ? 'critical' :
                      testState.percentage >= WARN_THRESHOLD ? 'warning' : 'normal';
    console.log('警告阶段测试:', testState.phase === 'warning' && testState.percentage >= WARN_THRESHOLD ? '✅' : '❌');
    
    // 测试85%严重
    testState.elapsed = 51;
    testState.percentage = testState.elapsed / testState.budget;
    testState.phase = testState.percentage >= STOP_THRESHOLD ? 'stop' :
                      testState.percentage >= CRITICAL_THRESHOLD ? 'critical' :
                      testState.percentage >= WARN_THRESHOLD ? 'warning' : 'normal';
    console.log('严重阶段测试:', testState.phase === 'critical' && testState.percentage >= CRITICAL_THRESHOLD ? '✅' : '❌');
    
    // 测试100%停止
    testState.elapsed = 60;
    testState.percentage = testState.elapsed / testState.budget;
    testState.phase = testState.percentage >= STOP_THRESHOLD ? 'stop' :
                      testState.percentage >= CRITICAL_THRESHOLD ? 'critical' :
                      testState.percentage >= WARN_THRESHOLD ? 'warning' : 'normal';
    console.log('停止阶段测试:', testState.phase === 'stop' && testState.percentage >= STOP_THRESHOLD ? '✅' : '❌');
    
  } else {
    console.log(`
Time Budget - 时间预算管理

用法:
  node time-budget.js start <budget_seconds>  启动预算
  node time-budget.js check                   检查状态
  node time-budget.js status                  查看阈值
  node time-budget.js test                    运行测试

阶段阈值:
  60%预算 → 警告
  85%预算 → 关闭新功能
  100%预算 → 强制停止

示例:
  node time-budget.js start 1800  # 30分钟预算
  node time-budget.js check        # 查看进度
`);
  }
}

// 导出函数
module.exports = {
  initTimeBudget,
  checkTimeBudget,
  getRecommendation,
  formatTime,
  loadState,
  saveState,
  WARN_THRESHOLD,
  CRITICAL_THRESHOLD,
  STOP_THRESHOLD
};

// CLI入口
if (require.main === module) {
  main();
}