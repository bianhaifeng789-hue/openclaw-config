#!/usr/bin/env node
/**
 * Platform Registration Helper - 广告平台注册助手
 * 
 * 支持主流广告变现平台：
 *   - Google AdMob
 *   - Meta Audience Network
 *   - AppLovin
 *   - Unity Ads
 *   - ironSource
 *   - Chartboost
 * 
 * Usage:
 *   node platform-registration-helper.js admob --app-name "MyGame" --bundle "com.game.my"
 *   node platform-registration-helper.js meta --business "MyCompany" --website "https://mygame.com"
 *   node platform-registration-helper.js check --platform admob --status pending
 *   node platform-registration-helper.js requirements --platform all
 */

const fs = require('fs');
const path = require('path');

// 平台注册要求配置
const PLATFORM_REQUIREMENTS = {
  admob: {
    name: 'Google AdMob',
    url: 'https://admob.google.com',
    requirements: [
      { item: 'Google账户', required: true, note: '使用现有 Google 账户' },
      { item: '年龄', required: true, note: '18岁以上' },
      { item: 'APP', required: true, note: '至少1个已上线APP' },
      { item: '税务信息', required: true, note: '美国税务信息（W-9/W-8BEN）' },
      { item: '银行账户', required: true, note: '收款银行账户' }
    ],
    steps: [
      '访问 https://admob.google.com',
      '使用Google账户登录',
      '填写开发者信息（公司名称、地址、税务）',
      '验证邮箱',
      '添加APP信息（名称、平台、Store链接）',
      '等待审核（1-3天）'
    ],
    reviewTime: '1-3天',
    autoActivate: false
  },
  meta: {
    name: 'Meta Audience Network',
    url: 'https://developers.facebook.com/products/audience-network',
    requirements: [
      { item: 'Facebook账户', required: true },
      { item: 'Business Manager', required: true, note: '需创建Business Manager' },
      { item: 'APP', required: true, note: '5000+日活用户（推荐）' },
      { item: '内容政策', required: true, note: '符合Facebook内容政策' }
    ],
    steps: [
      '访问 https://developers.facebook.com',
      '创建Facebook开发者账户',
      '创建应用（获取App ID）',
      '填写业务信息（Business name、Website、Contact）',
      '添加APP详情',
      '提交审核'
    ],
    reviewTime: '3-7天',
    autoActivate: false
  },
  applovin: {
    name: 'AppLovin',
    url: 'https://www.applovin.com',
    requirements: [
      { item: '开发者账户', required: true },
      { item: 'APP', required: true, note: 'iOS/Android游戏优先' },
      { item: '流量', required: false, note: '无最低流量要求' }
    ],
    steps: [
      '访问 https://www.applovin.com',
      '点击 Sign Up',
      '填写开发者信息（Name、Email、Company）',
      '添加APP信息（名称、Bundle ID、Store链接）',
      '等待审核（即时激活）'
    ],
    reviewTime: '即时',
    autoActivate: true
  },
  unity: {
    name: 'Unity Ads',
    url: 'https://unity.com/products/unity-ads',
    requirements: [
      { item: 'Unity ID', required: true },
      { item: '游戏', required: true, note: '游戏优先' },
      { item: '流量', required: false, note: '无最低要求' }
    ],
    steps: [
      '访问 https://unity.com/products/unity-ads',
      '创建Unity ID',
      '填写开发者信息',
      '添加APP（Game name、Platform、Store link）',
      '获取Game ID'
    ],
    reviewTime: '即时',
    autoActivate: true
  },
  ironsource: {
    name: 'ironSource',
    url: 'https://www.ironsrc.com',
    requirements: [
      { item: '开发者账户', required: true },
      { item: '公司信息', required: true },
      { item: 'APP', required: true }
    ],
    steps: [
      '访问 https://www.ironsrc.com',
      '注册开发者账户',
      '填写公司信息',
      '添加APP详情',
      '集成SDK',
      '等待审核'
    ],
    reviewTime: '1-2天',
    autoActivate: false
  },
  chartboost: {
    name: 'Chartboost',
    url: 'https://www.chartboost.com',
    requirements: [
      { item: '开发者账户', required: true },
      { item: '游戏', required: true, note: '游戏优先' },
      { item: 'SDK集成', required: true }
    ],
    steps: [
      '访问 https://www.chartboost.com',
      '注册开发者账户',
      '填写开发者信息',
      '添加APP',
      '集成SDK'
    ],
    reviewTime: '即时',
    autoActivate: true
  }
};

/**
 * 生成平台注册指南
 */
function generateRegistrationGuide(platform) {
  const config = PLATFORM_REQUIREMENTS[platform];
  if (!config) return { error: `未知平台: ${platform}` };
  
  const guide = `## ${config.name} 注册指南

### 注册步骤
${config.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

### 注册要求
${config.requirements.map(r => `- ${r.item}${r.required ? ' ✅ 必需' : ' ⚪ 可选'}${r.note ? ` (${r.note})` : ''}`).join('\n')}

### 审核时间
${config.reviewTime}${config.autoActivate ? ' ✅ 自动激活' : ' ⏳ 需等待审核'}

### 注册链接
${config.url}

---
`;

  return {
    platform,
    name: config.name,
    url: config.url,
    guide,
    steps: config.steps,
    requirements: config.requirements,
    reviewTime: config.reviewTime,
    autoActivate: config.autoActivate
  };
}

/**
 * 检查注册状态
 */
function checkRegistrationStatus(platform, status) {
  const config = PLATFORM_REQUIREMENTS[platform];
  if (!config) return { error: `未知平台: ${platform}` };
  
  let message, nextSteps;
  
  switch (status) {
    case 'pending':
      message = `⏳ ${config.name} 注册审核中`;
      nextSteps = [
        '等待审核完成',
        '准备SDK集成文档',
        '配置测试广告单元'
      ];
      break;
      
    case 'approved':
      message = `✅ ${config.name} 注册已通过`;
      nextSteps = [
        '集成SDK',
        '配置广告单元',
        '设置中介（如需要）',
        '开始测试广告'
      ];
      break;
      
    case 'rejected':
      message = `❌ ${config.name} 注册被拒绝`;
      nextSteps = [
        '检查拒绝原因',
        '修改APP或账户信息',
        '重新提交审核'
      ];
      break;
      
    case 'not_started':
      message = `⚪ ${config.name} 未注册`;
      nextSteps = config.steps.slice(0, 3);
      break;
      
    default:
      message = `❓ ${config.name} 状态未知`;
      nextSteps = ['检查平台后台状态'];
  }
  
  return {
    platform,
    name: config.name,
    status,
    message,
    nextSteps,
    reviewTime: config.reviewTime
  };
}

/**
 * 生成所有平台要求对比
 */
function generateAllRequirements() {
  const comparison = [];
  
  for (const [platform, config] of Object.entries(PLATFORM_REQUIREMENTS)) {
    comparison.push({
      platform,
      name: config.name,
      reviewTime: config.reviewTime,
      autoActivate: config.autoActivate,
      requiredCount: config.requirements.filter(r => r.required).length,
      totalRequirements: config.requirements.length
    });
  }
  
  const report = `## 广告平台注册要求对比

${comparison.map(c => 
  `### ${c.name}
- 审核时间: ${c.reviewTime}${c.autoActivate ? ' ✅ 自动激活' : ''}
- 必需项: ${c.requiredCount}/${c.totalRequirements}
- 链接: ${PLATFORM_REQUIREMENTS[c.platform].url}`
).join('\n\n')}

---

**快速推荐：**
- 即时激活：AppLovin、Unity Ads、Chartboost
- 1-3天审核：Google AdMob、ironSource
- 3-7天审核：Meta Audience Network
`;

  return {
    comparison,
    report,
    totalPlatforms: comparison.length,
    instantActivation: comparison.filter(c => c.autoActivate).length
  };
}

/**
 * 生成注册检查清单
 */
function generateRegistrationChecklist(platforms = 'all') {
  const platformList = platforms === 'all' 
    ? Object.keys(PLATFORM_REQUIREMENTS)
    : platforms.split(',');
  
  const checklist = [];
  
  for (const platform of platformList) {
    const config = PLATFORM_REQUIREMENTS[platform];
    if (!config) continue;
    
    checklist.push({
      platform,
      name: config.name,
      items: config.requirements.map(r => ({
        item: r.item,
        required: r.required,
        prepared: false,
        note: r.note || ''
      }))
    });
  }
  
  return {
    platforms: checklist,
    totalItems: checklist.reduce((sum, p) => sum + p.items.length, 0),
    requiredItems: checklist.reduce((sum, p) => sum + p.items.filter(i => i.required).length, 0),
    generatedAt: new Date().toISOString()
  };
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(JSON.stringify({
      error: '请指定命令',
      usage: 'admob | meta | applovin | unity | ironsource | chartboost | check | requirements',
      examples: [
        'node platform-registration-helper.js admob',
        'node platform-registration-helper.js check --platform admob --status pending',
        'node platform-registration-helper.js requirements --platform all'
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'admob':
      case 'meta':
      case 'applovin':
      case 'unity':
      case 'ironsource':
      case 'chartboost':
        result = generateRegistrationGuide(command);
        break;
        
      case 'check':
        const platform = args.find(a => a.startsWith('--platform='))?.split('=')[1] || '';
        const status = args.find(a => a.startsWith('--status='))?.split('=')[1] || 'not_started';
        result = checkRegistrationStatus(platform, status);
        break;
        
      case 'requirements':
        const platformsParam = args.find(a => a.startsWith('--platform='))?.split('=')[1] || 'all';
        if (platformsParam === 'all') {
          result = generateAllRequirements();
        } else {
          result = generateRegistrationChecklist(platformsParam);
        }
        break;
        
      case 'checklist':
        const clPlatforms = args.find(a => a.startsWith('--platforms='))?.split('=')[1] || 'all';
        result = generateRegistrationChecklist(clPlatforms);
        break;
        
      default:
        result = { error: `未知命令: ${command}` };
    }
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (e) {
    console.log(JSON.stringify({ error: e.message }));
  }
}

// 导出供其他模块使用
module.exports = {
  generateRegistrationGuide,
  checkRegistrationStatus,
  generateAllRequirements,
  generateRegistrationChecklist,
  PLATFORM_REQUIREMENTS
};

if (require.main === module) {
  main();
}