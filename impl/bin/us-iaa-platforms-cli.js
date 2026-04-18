#!/usr/bin/env node
/**
 * US IAA Platforms CLI - 美国IAA变现平台查询工具
 *
 * 功能：
 * - 查询平台开通信息
 * - 对比平台优劣势
 * - 推荐开通顺序
 * - 查询平台配置SOP
 *
 * 用法：
 *   node us-iaa-platforms-cli.js list
 *   node us-iaa-platforms-cli.js compare
 *   node us-iaa-platforms-cli.js recommend --game-type=casual
 *   node us-iaa-platforms-cli.js onboard --platform=admob
 */

const fs = require('fs');
const path = require('path');

// 平台数据
const PLATFORMS = {
  admob: {
    name: 'AdMob',
    onboardDifficulty: 2,
    usPerformance: 5,
    biddingSupport: true,
    mediationSupport: true,
    priority: 'P0',
    ecpmRewarded: [12, 18],
    ecpmInterstitial: [10, 15],
    ecpmBanner: [2, 4],
    onboardTime: '1-3天',
   审核Time: '1-7天',
    paymentThreshold: 20,
    paymentCycle: '每月21日',
    skillPath: 'admob-onboarding/SKILL.md'
  },
  applovin: {
    name: 'AppLovin MAX',
    onboardDifficulty: 1,
    usPerformance: 5,
    biddingSupport: true,
    mediationSupport: true,
    priority: 'P0',
    ecpmRewarded: [15, 25],
    ecpmInterstitial: [8, 12],
    ecpmBanner: [1, 2],
    onboardTime: '1-2天',
   审核Time: '无审核',
    paymentThreshold: 20,
    paymentCycle: '每月15日',
    skillPath: 'applovlin-max-onboarding/SKILL.md'
  },
  meta_an: {
    name: 'Meta Audience Network',
    onboardDifficulty: 3,
    usPerformance: 4,
    biddingSupport: true,
    mediationSupport: true,
    priority: 'P1',
    ecpmRewarded: [10, 15],
    ecpmInterstitial: [8, 10],
    ecpmBanner: [1, 2],
    onboardTime: '3-5天',
   审核Time: '7-14天',
    paymentThreshold: 100,
    paymentCycle: '每月21日',
    skillPath: 'meta-audience-network-onboarding/SKILL.md'
  },
  unity: {
    name: 'Unity Ads',
    onboardDifficulty: 2,
    usPerformance: 4,
    biddingSupport: true,
    mediationSupport: true,
    priority: 'P1',
    ecpmRewarded: [8, 12],
    ecpmInterstitial: [6, 8],
    ecpmBanner: [0.5, 1],
    onboardTime: '1-3天',
   审核Time: '1-3天',
    paymentThreshold: 100,
    paymentCycle: '每月15日',
    skillPath: 'unity-ads-onboarding/SKILL.md'
  },
  ironsource: {
    name: 'ironSource',
    onboardDifficulty: 1,
    usPerformance: 4,
    biddingSupport: true,
    mediationSupport: true,
    priority: 'P1',
    ecpmRewarded: [8, 12],
    ecpmInterstitial: [6, 8],
    ecpmBanner: [0.5, 1],
    onboardTime: '1-2天',
   审核Time: '无审核',
    paymentThreshold: 50,
    paymentCycle: '每月15日',
    skillPath: 'ironsource-levelplay-onboarding/SKILL.md'
  },
  chartboost: {
    name: 'Chartboost',
    onboardDifficulty: 2,
    usPerformance: 3,
    biddingSupport: true,
    mediationSupport: true,
    priority: 'P2',
    ecpmRewarded: [6, 10],
    ecpmInterstitial: [4, 6],
    ecpmBanner: [0.3, 0.5],
    onboardTime: '1-3天',
   审核Time: '1-3天',
    paymentThreshold: 75,
    paymentCycle: '每月10日',
    skillPath: 'chartboost-onboarding/SKILL.md'
  },
  inmobi: {
    name: 'InMobi',
    onboardDifficulty: 3,
    usPerformance: 3,
    biddingSupport: true,
    mediationSupport: true,
    priority: 'P2',
    ecpmRewarded: [4, 6],
    ecpmInterstitial: [3, 5],
    ecpmBanner: [1, 2],
    onboardTime: '3-7天',
   审核Time: '7-14天',
    paymentThreshold: 50,
    paymentCycle: '每月15日',
    skillPath: 'inmobi-onboarding/SKILL.md'
  },
  vungle: {
    name: 'Vungle',
    onboardDifficulty: 2,
    usPerformance: 3,
    biddingSupport: true,
    mediationSupport: true,
    priority: 'P2',
    ecpmRewarded: [5, 8],
    ecpmInterstitial: [4, 6],
    ecpmBanner: [0.3, 0.5],
    onboardTime: '1-3天',
   审核Time: '1-3天',
    paymentThreshold: 50,
    paymentCycle: '每月15日',
    skillPath: 'vungle-onboarding/SKILL.md'
  },
  fyber: {
    name: 'Fyber',
    onboardDifficulty: 3,
    usPerformance: 3,
    biddingSupport: true,
    mediationSupport: true,
    priority: 'P2',
    ecpmRewarded: [4, 6],
    ecpmInterstitial: [3, 5],
    ecpmBanner: [0.5, 1],
    onboardTime: '3-7天',
   审核Time: '7-14天',
    paymentThreshold: 50,
    paymentCycle: '每月15日',
    skillPath: 'fyber-onboarding/SKILL.md'
  },
  mintegral: {
    name: 'Mintegral',
    onboardDifficulty: 3,
    usPerformance: 2,
    biddingSupport: true,
    mediationSupport: true,
    priority: 'P3',
    ecpmRewarded: [3, 5],
    ecpmInterstitial: [2, 4],
    ecpmBanner: [0.2, 0.5],
    onboardTime: '7-14天',
   审核Time: '14-30天',
    paymentThreshold: 50,
    paymentCycle: '每月15日',
    skillPath: 'mintegral-onboarding/SKILL.md'
  },
  pangle: {
    name: 'Pangle',
    onboardDifficulty: 4,
    usPerformance: 2,
    biddingSupport: true,
    mediationSupport: false,
    priority: 'P3',
    ecpmRewarded: [3, 5],
    ecpmInterstitial: [2, 4],
    ecpmBanner: [0.2, 0.5],
    onboardTime: '7-14天',
   审核Time: '14-30天',
    paymentThreshold: 50,
    paymentCycle: '每月15日',
    skillPath: 'pangle-onboarding/SKILL.md'
  }
};

// 游戏类型推荐
const GAME_TYPE_RECOMMENDATIONS = {
  hypercasual: {
    name: '超休闲游戏',
    primary: ['admob', 'applovin', 'ironsource'],
    secondary: ['unity', 'chartboost'],
    reason: 'eCPM中等但量大，bidding成熟，快速回本'
  },
  casual: {
    name: '休闲游戏',
    primary: ['admob', 'applovin', 'meta_an'],
    secondary: ['unity', 'ironsource', 'vungle'],
    reason: '美国eCPM高，用户质量好'
  },
  tool: {
    name: '工具类APP',
    primary: ['admob', 'inmobi', 'fyber'],
    secondary: ['meta_an'],
    reason: 'Banner/插屏表现好，非游戏类友好'
  },
  midcore: {
    name: '中重度游戏',
    primary: ['applovin', 'meta_an', 'vungle'],
    secondary: ['chartboost', 'unity'],
    reason: '激励视频eCPM高，付费用户转化好'
  }
};

/**
 * 列出所有平台
 */
function listPlatforms() {
  const result = [];
  
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    result.push({
      key,
      name: platform.name,
      priority: platform.priority,
      onboardDifficulty: platform.onboardDifficulty,
      usPerformance: platform.usPerformance,
      ecpmRewarded: `$${platform.ecpmRewarded[0]}-${platform.ecpmRewarded[1]}`,
      onboardTime: platform.onboardTime
    });
  }
  
  return result;
}

/**
 * 对比平台
 */
function comparePlatforms() {
  const result = [];
  
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    result.push({
      key,
      name: platform.name,
      priority: platform.priority,
      onboardDifficulty: `⭐${platform.onboardDifficulty}`,
      usPerformance: `⭐${platform.usPerformance}`,
      biddingSupport: platform.biddingSupport ? '✅' : '❌',
      mediationSupport: platform.mediationSupport ? '✅' : '❌',
      paymentThreshold: `$${platform.paymentThreshold}`,
      paymentCycle: platform.paymentCycle
    });
  }
  
  return result;
}

/**
 * 推荐开通顺序
 */
function recommendOrder(gameType = 'casual') {
  const recommendation = GAME_TYPE_RECOMMENDATIONS[gameType];
  
  if (!recommendation) {
    return { error: `未知游戏类型: ${gameType}` };
  }
  
  const result = {
    gameType: recommendation.name,
    primary: recommendation.primary.map(key => ({
      key,
      name: PLATFORMS[key].name,
      priority: PLATFORMS[key].priority,
      onboardTime: PLATFORMS[key].onboardTime
    })),
    secondary: recommendation.secondary.map(key => ({
      key,
      name: PLATFORMS[key].name,
      priority: PLATFORMS[key].priority,
      onboardTime: PLATFORMS[key].onboardTime
    })),
    reason: recommendation.reason
  };
  
  return result;
}

/**
 * 查询平台开通SOP
 */
function getOnboardSOP(platformKey) {
  const platform = PLATFORMS[platformKey];
  
  if (!platform) {
    return { error: `未知平台: ${platformKey}` };
  }
  
  const skillPath = path.join(__dirname, '../skills', platform.skillPath);
  
  if (!fs.existsSync(skillPath)) {
    return {
      platform: platform.name,
      skillPath: platform.skillPath,
      status: 'Skill文件不存在',
      info: platform
    };
  }
  
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  
  return {
    platform: platform.name,
    skillPath: platform.skillPath,
    info: platform,
    skillContent: skillContent.slice(0, 2000) + '...(查看完整SKILL.md)'
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
      usage: 'list | compare | recommend | onboard',
      examples: [
        'node us-iaa-platforms-cli.js list',
        'node us-iaa-platforms-cli.js compare',
        'node us-iaa-platforms-cli.js recommend --game-type=casual',
        'node us-iaa-platforms-cli.js onboard --platform=admob'
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'list':
        result = listPlatforms();
        break;
        
      case 'compare':
        result = comparePlatforms();
        break;
        
      case 'recommend':
        const gameTypeArg = args.find(a => a.startsWith('--game-type='));
        const gameType = gameTypeArg ? gameTypeArg.split('=')[1] : 'casual';
        result = recommendOrder(gameType);
        break;
        
      case 'onboard':
        const platformArg = args.find(a => a.startsWith('--platform='));
        const platformKey = platformArg ? platformArg.split('=')[1] : 'admob';
        result = getOnboardSOP(platformKey);
        break;
        
      default:
        result = { error: `未知命令: ${command}` };
    }
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (e) {
    console.log(JSON.stringify({ error: e.message }));
  }
}

module.exports = {
  listPlatforms,
  comparePlatforms,
  recommendOrder,
  getOnboardSOP,
  PLATFORMS,
  GAME_TYPE_RECOMMENDATIONS
};

if (require.main === module) {
  main();
}