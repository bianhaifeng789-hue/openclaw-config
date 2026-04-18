#!/usr/bin/env node
/**
 * Account Registration CLI - 账号注册自动化
 *
 * 功能：
 * - 生成注册资料模板
 * - 验证注册信息
 * - 记录账号信息
 * - 查询注册状态
 *
 * 用法：
 *   node account-registration-cli.js template <platform>
 *   node account-registration-cli.js register <platform> <info_json>
 *   node account-registration-cli.js list
 *   node account-registration-cli.js status <account_id>
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/Users/mar2game';
const WORKSPACE = `${HOME}/.openclaw/workspace`;
const ACCOUNTS_FILE = `${WORKSPACE}/state/accounts.json`;

// 平台注册模板
const PLATFORMS = {
  admob: {
    name: 'Google AdMob',
    url: 'https://admob.google.com',
    requirements: ['companyName', 'email', 'bankAccount', 'taxForm']
  },
  facebook: {
    name: 'Facebook Developer',
    url: 'https://developers.facebook.com',
    requirements: ['companyName', 'email', 'facebookAccount']
  },
  unity: {
    name: 'Unity Ads',
    url: 'https://unity.com/products/unity-ads',
    requirements: ['companyName', 'email', 'website']
  },
  ironsource: {
    name: 'ironSource',
    url: 'https://ironsource.com',
    requirements: ['companyName', 'email', 'website']
  },
  applovin: {
    name: 'AppLovin',
    url: 'https://applovin.com',
    requirements: ['companyName', 'email', 'bankAccount']
  },
  googleplay: {
    name: 'Google Play Developer',
    url: 'https://play.google.com/console',
    requirements: ['companyName', 'email', 'address', 'fee']
  },
  tiktok: {
    name: 'TikTok Ads',
    url: 'https://ads.tiktok.com',
    requirements: ['companyName', 'email', 'website']
  }
};

// 生成注册模板
function generateTemplate(platform) {
  if (!PLATFORMS[platform]) {
    return `[error] Unknown platform: ${platform}. Available: ${Object.keys(PLATFORMS).join(', ')}`;
  }
  
  const p = PLATFORMS[platform];
  const template = {
    platform: platform,
    platformName: p.name,
    url: p.url,
    companyName: '',
    email: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    },
    bankAccount: {
      bankName: '',
      accountNumber: '',
      routingNumber: ''
    },
    taxForm: '',
    fee: platform === 'googleplay' ? '$25' : '',
    requirements: p.requirements
  };
  
  return JSON.stringify(template, null, 2);
}

// 注册账号（记录信息）
function registerAccount(platform, infoJson) {
  try {
    const info = JSON.parse(infoJson);
    
    // 验证必填字段
    const p = PLATFORMS[platform];
    if (!p) {
      return `[error] Unknown platform: ${platform}`;
    }
    
    const missing = p.requirements.filter(r => !info[r]);
    if (missing.length > 0) {
      return `[error] Missing required fields: ${missing.join(', ')}`;
    }
    
    // 加载现有账号
    let accounts = [];
    if (fs.existsSync(ACCOUNTS_FILE)) {
      accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    }
    
    // 生成账号ID
    const accountId = `${platform}_${Date.now()}`;
    const account = {
      id: accountId,
      platform: platform,
      platformName: p.name,
      ...info,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    accounts.push(account);
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
    
    return JSON.stringify({
      success: true,
      accountId: accountId,
      message: `Account registered for ${p.name}. Please visit ${p.url} to complete registration.`
    }, null, 2);
    
  } catch (err) {
    return `[error] ${err.message}`;
  }
}

// 列出所有账号
function listAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return '[]';
  }
  
  const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  return JSON.stringify(accounts.map(a => ({
    id: a.id,
    platform: a.platformName,
    email: a.email,
    status: a.status,
    createdAt: a.createdAt
  })), null, 2);
}

// 查询账号状态
function getAccountStatus(accountId) {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return `[error] No accounts file`;
  }
  
  const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  const account = accounts.find(a => a.id === accountId);
  
  if (!account) {
    return `[error] Account not found: ${accountId}`;
  }
  
  return JSON.stringify(account, null, 2);
}

// CLI入口
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'template') {
    const platform = args[1];
    console.log(generateTemplate(platform));
    
  } else if (command === 'register') {
    const platform = args[1];
    const infoJson = args[2];
    console.log(registerAccount(platform, infoJson));
    
  } else if (command === 'list') {
    console.log(listAccounts());
    
  } else if (command === 'status') {
    const accountId = args[1];
    console.log(getAccountStatus(accountId));
    
  } else {
    console.error('用法:');
    console.error('  node account-registration-cli.js template <platform>');
    console.error('  node account-registration-cli.js register <platform> <info_json>');
    console.error('  node account-registration-cli.js list');
    console.error('  node account-registration-cli.js status <account_id>');
    console.error('\n可用平台:');
    Object.keys(PLATFORMS).forEach(p => {
      console.error(`  - ${p}: ${PLATFORMS[p].name}`);
    });
    process.exit(1);
  }
}

module.exports = {
  generateTemplate,
  registerAccount,
  listAccounts,
  getAccountStatus,
  PLATFORMS
};

if (require.main === module) {
  main();
}