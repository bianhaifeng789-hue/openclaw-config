#!/usr/bin/env node
/**
 * Account Isolation CLI - 账号隔离管理
 *
 * 功能：
 * - 检查账号健康状态
 * - 检测账号关联风险
 * - 生成隔离建议
 * - 记录账号切换日志
 *
 * 用法：
 *   node account-isolation-cli.js check-all
 *   node account-isolation-cli.js check <account_id>
 *   node account-isolation-cli.js risk-report
 *   node account-isolation-cli.js switch-log <account_id>
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/Users/mar2game';
const WORKSPACE = `${HOME}/.openclaw/workspace`;
const ACCOUNTS_FILE = `${WORKSPACE}/state/accounts.json`;
const SWITCH_LOG_FILE = `${WORKSPACE}/state/account-switch-log.json`;

// 检查账号健康状态
function checkAccountHealth(account) {
  const healthScore = 100;
  const issues = [];
  
  // 检查IP隔离
  if (account.lastIp) {
    // 模拟检查（实际需要调用外部API）
    issues.push({
      type: 'info',
      message: 'Last IP: ' + account.lastIp
    });
  }
  
  // 检查登录频率
  if (account.loginCount && account.loginCount > 10) {
    issues.push({
      type: 'warning',
      message: 'High login frequency'
    });
  }
  
  return {
    accountId: account.id,
    platform: account.platformName,
    healthScore: healthScore - issues.filter(i => i.type === 'warning').length * 10,
    issues: issues,
    status: account.status
  };
}

// 检查所有账号
function checkAllAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return '[info] No accounts registered';
  }
  
  const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  const results = accounts.map(checkAccountHealth);
  
  return JSON.stringify({
    totalAccounts: accounts.length,
    healthyAccounts: results.filter(r => r.healthScore >= 80).length,
    warningAccounts: results.filter(r => r.healthScore < 80).length,
    results: results
  }, null, 2);
}

// 检查单个账号
function checkSingleAccount(accountId) {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return `[error] No accounts file`;
  }
  
  const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  const account = accounts.find(a => a.id === accountId);
  
  if (!account) {
    return `[error] Account not found: ${accountId}`;
  }
  
  return JSON.stringify(checkAccountHealth(account), null, 2);
}

// 生成风险报告
function generateRiskReport() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return '[info] No accounts registered';
  }
  
  const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  
  // 检测关联风险
  const risks = [];
  
  // 检查相同邮箱
  const emails = {};
  accounts.forEach(a => {
    if (emails[a.email]) {
      risks.push({
        type: 'email_duplicate',
        severity: 'high',
        accounts: [emails[a.email], a.id],
        message: `Duplicate email: ${a.email}`
      });
    } else {
      emails[a.email] = a.id;
    }
  });
  
  // 检查相同公司名
  const companies = {};
  accounts.forEach(a => {
    if (companies[a.companyName]) {
      risks.push({
        type: 'company_duplicate',
        severity: 'medium',
        accounts: [companies[a.companyName], a.id],
        message: `Duplicate company: ${a.companyName}`
      });
    } else {
      companies[a.companyName] = a.id;
    }
  });
  
  return JSON.stringify({
    totalAccounts: accounts.length,
    totalRisks: risks.length,
    highRisks: risks.filter(r => r.severity === 'high').length,
    mediumRisks: risks.filter(r => r.severity === 'medium').length,
    risks: risks
  }, null, 2);
}

// 记录账号切换
function logAccountSwitch(accountId, fromAccountId = null) {
  let logs = [];
  if (fs.existsSync(SWITCH_LOG_FILE)) {
    logs = JSON.parse(fs.readFileSync(SWITCH_LOG_FILE, 'utf8'));
  }
  
  logs.push({
    timestamp: new Date().toISOString(),
    fromAccount: fromAccountId,
    toAccount: accountId
  });
  
  fs.writeFileSync(SWITCH_LOG_FILE, JSON.stringify(logs, null, 2));
  
  return JSON.stringify({
    success: true,
    message: `Switch logged: ${fromAccountId || 'none'} → ${accountId}`,
    totalSwitches: logs.length
  }, null, 2);
}

// CLI入口
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check-all') {
    console.log(checkAllAccounts());
    
  } else if (command === 'check') {
    const accountId = args[1];
    console.log(checkSingleAccount(accountId));
    
  } else if (command === 'risk-report') {
    console.log(generateRiskReport());
    
  } else if (command === 'switch-log') {
    const accountId = args[1];
    const fromAccountId = args[2];
    console.log(logAccountSwitch(accountId, fromAccountId));
    
  } else {
    console.error('用法:');
    console.error('  node account-isolation-cli.js check-all');
    console.error('  node account-isolation-cli.js check <account_id>');
    console.error('  node account-isolation-cli.js risk-report');
    console.error('  node account-isolation-cli.js switch-log <account_id> [from_account_id]');
    process.exit(1);
  }
}

module.exports = {
  checkAccountHealth,
  checkAllAccounts,
  checkSingleAccount,
  generateRiskReport,
  logAccountSwitch
};

if (require.main === module) {
  main();
}