#!/usr/bin/env node
/**
 * Budget Monitor - 预算监控脚本
 *
 * 功能：
 * - 检查预算消耗状态
 * - 生成预算预警
 * - 计算ROI
 * - 生成预算调整建议
 *
 * 用法：
 *   node budget-monitor.js status
 *   node budget-monitor.js check <platform>
 *   node budget-monitor.js alerts
 *   node budget-monitor.js suggestions
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/Users/mar2game';
const WORKSPACE = `${HOME}/.openclaw/workspace`;
const BUDGET_FILE = `${WORKSPACE}/state/budget.json`;

// 默认预算配置
const DEFAULT_BUDGET = {
  total: 5000,
  platforms: {
    google: { budget: 2000, spent: 0, roi: 0 },
    facebook: { budget: 1500, spent: 0, roi: 0 },
    tiktok: { budget: 1000, spent: 0, roi: 0 },
    other: { budget: 500, spent: 0, roi: 0 }
  },
  alerts: {
    dailyWarningThreshold: 0.8,
    dailyEmergencyThreshold: 1.0,
    roiWarningThreshold: 100
  }
};

// 加载预算数据
function loadBudget() {
  if (!fs.existsSync(BUDGET_FILE)) {
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(DEFAULT_BUDGET, null, 2));
    return DEFAULT_BUDGET;
  }
  return JSON.parse(fs.readFileSync(BUDGET_FILE, 'utf8'));
}

// 检查整体预算状态
function checkBudgetStatus() {
  const budget = loadBudget();
  
  const totalSpent = Object.values(budget.platforms).reduce((sum, p) => sum + p.spent, 0);
  const totalRemaining = budget.total - totalSpent;
  const spentPercent = (totalSpent / budget.total) * 100;
  
  const platformStatus = {};
  for (const [name, p] of Object.entries(budget.platforms)) {
    const platformSpentPercent = (p.spent / p.budget) * 100;
    platformStatus[name] = {
      budget: p.budget,
      spent: p.spent,
      remaining: p.budget - p.spent,
      spentPercent: platformSpentPercent.toFixed(1),
      roi: p.roi,
      status: platformSpentPercent >= budget.alerts.dailyEmergencyThreshold * 100 ? 'emergency' :
              platformSpentPercent >= budget.alerts.dailyWarningThreshold * 100 ? 'warning' : 'normal'
    };
  }
  
  return JSON.stringify({
    totalBudget: budget.total,
    totalSpent: totalSpent,
    totalRemaining: totalRemaining,
    spentPercent: spentPercent.toFixed(1),
    platforms: platformStatus,
    overallStatus: spentPercent >= 80 ? 'warning' : 'normal'
  }, null, 2);
}

// 检查单个平台预算
function checkPlatformBudget(platform) {
  const budget = loadBudget();
  
  if (!budget.platforms[platform]) {
    return `[error] Unknown platform: ${platform}. Available: ${Object.keys(budget.platforms).join(', ')}`;
  }
  
  const p = budget.platforms[platform];
  const spentPercent = (p.spent / p.budget) * 100;
  
  return JSON.stringify({
    platform: platform,
    budget: p.budget,
    spent: p.spent,
    remaining: p.budget - p.spent,
    spentPercent: spentPercent.toFixed(1),
    roi: p.roi,
    status: spentPercent >= budget.alerts.dailyEmergencyThreshold * 100 ? 'emergency' :
            spentPercent >= budget.alerts.dailyWarningThreshold * 100 ? 'warning' : 'normal'
  }, null, 2);
}

// 生成预算预警
function generateBudgetAlerts() {
  const budget = loadBudget();
  const alerts = [];
  
  for (const [name, p] of Object.entries(budget.platforms)) {
    const spentPercent = (p.spent / p.budget) * 100;
    
    if (spentPercent >= budget.alerts.dailyEmergencyThreshold * 100) {
      alerts.push({
        platform: name,
        severity: 'emergency',
        message: `Budget exhausted: ${spentPercent.toFixed(1)}% spent`,
        action: 'Stop spending immediately'
      });
    } else if (spentPercent >= budget.alerts.dailyWarningThreshold * 100) {
      alerts.push({
        platform: name,
        severity: 'warning',
        message: `Budget warning: ${spentPercent.toFixed(1)}% spent`,
        action: 'Reduce spending or increase budget'
      });
    }
    
    if (p.roi < budget.alerts.roiWarningThreshold) {
      alerts.push({
        platform: name,
        severity: 'warning',
        message: `ROI warning: ${p.roi}% < target ${budget.alerts.roiWarningThreshold}%`,
        action: 'Optimize campaign or reduce budget'
      });
    }
  }
  
  return JSON.stringify({
    totalAlerts: alerts.length,
    emergencyAlerts: alerts.filter(a => a.severity === 'emergency').length,
    warningAlerts: alerts.filter(a => a.severity === 'warning').length,
    alerts: alerts
  }, null, 2);
}

// 生成预算调整建议
function generateBudgetSuggestions() {
  const budget = loadBudget();
  const suggestions = [];
  
  // 按ROI排序
  const sortedPlatforms = Object.entries(budget.platforms)
    .sort((a, b) => b[1].roi - a[1].roi);
  
  const topPlatform = sortedPlatforms[0];
  const bottomPlatform = sortedPlatforms[sortedPlatforms.length - 1];
  
  // 高ROI平台增加预算
  if (topPlatform[1].roi > 150) {
    suggestions.push({
      platform: topPlatform[0],
      action: 'increase',
      amount: 500,
      reason: `ROI ${topPlatform[1].roi}% > target 150%`
    });
  }
  
  // 低ROI平台减少预算
  if (bottomPlatform[1].roi < 100 && bottomPlatform[1].spent > 0) {
    suggestions.push({
      platform: bottomPlatform[0],
      action: 'decrease',
      amount: 200,
      reason: `ROI ${bottomPlatform[1].roi}% < target 100%`
    });
  }
  
  return JSON.stringify({
    suggestions: suggestions,
    topPerformers: sortedPlatforms.slice(0, 2).map(([name, p]) => ({
      platform: name,
      roi: p.roi
    })),
    lowPerformers: sortedPlatforms.slice(-2).map(([name, p]) => ({
      platform: name,
      roi: p.roi
    }))
  }, null, 2);
}

// CLI入口
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'status') {
    console.log(checkBudgetStatus());
    
  } else if (command === 'check') {
    const platform = args[1];
    console.log(checkPlatformBudget(platform));
    
  } else if (command === 'alerts') {
    console.log(generateBudgetAlerts());
    
  } else if (command === 'suggestions') {
    console.log(generateBudgetSuggestions());
    
  } else {
    console.error('用法:');
    console.error('  node budget-monitor.js status');
    console.error('  node budget-monitor.js check <platform>');
    console.error('  node budget-monitor.js alerts');
    console.error('  node budget-monitor.js suggestions');
    process.exit(1);
  }
}

module.exports = {
  checkBudgetStatus,
  checkPlatformBudget,
  generateBudgetAlerts,
  generateBudgetSuggestions,
  loadBudget
};

if (require.main === module) {
  main();
}