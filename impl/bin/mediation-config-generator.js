#!/usr/bin/env node
/**
 * Mediation Config Generator - 广告中介配置生成工具
 * 
 * 支持生成中介配置：
 *   - AdMob Mediation 配置
 *   - Waterfall 顺序建议
 *   - eCPM Floor 设置
 *   - Custom Events 配置
 * 
 * Usage:
 *   node mediation-config-generator.js waterfall --platforms '["meta","applovin","unity","admob"]'
 *   node mediation-config-generator.js ecpm-floor --networks '["meta","applovin"]' --values '[15,10]'
 *   node mediation-config-generator.js custom-events --platform admob --network meta
 *   node mediation-config-generator.js optimize --current-config config.json
 */

const fs = require('fs');
const path = require('path');

// 中介网络配置
const NETWORK_CONFIGS = {
  meta: {
    name: 'Meta Audience Network',
    adapterClass: 'MetaAdapter',
    eCPMRange: [10, 30],
    recommendedPosition: 1,
    videoSupport: true,
    bannerSupport: true,
    interstitialSupport: true
  },
  applovin: {
    name: 'AppLovin',
    adapterClass: 'AppLovinAdapter',
    eCPMRange: [8, 25],
    recommendedPosition: 2,
    videoSupport: true,
    bannerSupport: true,
    interstitialSupport: true
  },
  unity: {
    name: 'Unity Ads',
    adapterClass: 'UnityAdapter',
    eCPMRange: [6, 20],
    recommendedPosition: 3,
    videoSupport: true,
    bannerSupport: false,
    interstitialSupport: true
  },
  ironsource: {
    name: 'ironSource',
    adapterClass: 'IronSourceAdapter',
    eCPMRange: [7, 22],
    recommendedPosition: 3,
    videoSupport: true,
    bannerSupport: true,
    interstitialSupport: true
  },
  chartboost: {
    name: 'Chartboost',
    adapterClass: 'ChartboostAdapter',
    eCPMRange: [8, 18],
    recommendedPosition: 4,
    videoSupport: true,
    bannerSupport: false,
    interstitialSupport: true
  },
  admob: {
    name: 'Google AdMob',
    adapterClass: 'AdMobAdapter',
    eCPMRange: [5, 15],
    recommendedPosition: 5,
    videoSupport: true,
    bannerSupport: true,
    interstitialSupport: true,
    isFallback: true
  }
};

/**
 * 生成 Waterfall 顺序配置
 */
function generateWaterfallConfig(platforms) {
  const waterfall = [];
  
  // 按推荐顺序排序
  const sortedPlatforms = platforms.sort((a, b) => {
    const aPos = NETWORK_CONFIGS[a]?.recommendedPosition || 10;
    const bPos = NETWORK_CONFIGS[b]?.recommendedPosition || 10;
    return aPos - bPos;
  });
  
  for (let i = 0; i < sortedPlatforms.length; i++) {
    const platform = sortedPlatforms[i];
    const config = NETWORK_CONFIGS[platform];
    if (!config) continue;
    
    waterfall.push({
      position: i + 1,
      network: platform,
      name: config.name,
      adapterClass: config.adapterClass,
      eCPMRange: config.eCPMRange,
      isFallback: config.isFallback || false,
      supportedAdTypes: {
        video: config.videoSupport,
        banner: config.bannerSupport,
        interstitial: config.interstitialSupport
      }
    });
  }
  
  const guide = `## Waterfall 中介顺序配置

${waterfall.map(w =>
  `### 位置 ${w.position}: ${w.name}
- eCPM 范围: $${w.eCPMRange[0]} - $${w.eCPMRange[1]}
- Adapter: ${w.adapterClass}
- 支持广告类型: ${Object.entries(w.supportedAdTypes).filter(([k, v]) => v).map(([k]) => k).join(', ')}
${w.isFallback ? '- ⚠️ 作为兜底网络' : ''}`
).join('\n\n')}

---

**配置建议：**
1. 高 eCPM 网络（Meta、AppLovin）优先
2. 中等 eCPM 网络（Unity、ironSource）次之
3. AdMob 作为兜底网络（最后）
`;

  return {
    waterfall,
    guide,
    totalNetworks: waterfall.length,
    recommendedOrder: waterfall.map(w => w.network)
  };
}

/**
 * 生成 eCPM Floor 配置
 */
function generateECPMFloorConfig(networks, values) {
  const floors = [];
  
  for (let i = 0; i < networks.length; i++) {
    const network = networks[i];
    const floorValue = values[i] || NETWORK_CONFIGS[network]?.eCPMRange[0] || 5;
    const config = NETWORK_CONFIGS[network];
    
    if (!config) continue;
    
    // 验证 floor 值是否在合理范围
    const warning = floorValue < config.eCPMRange[0] 
      ? `⚠️ Floor 值 ${floorValue} 低于推荐范围 $${config.eCPMRange[0]}`
      : floorValue > config.eCPMRange[1]
      ? `⚠️ Floor 值 ${floorValue} 高于推荐范围 $${config.eCPMRange[1]}`
      : null;
    
    floors.push({
      network,
      name: config.name,
      eCPMFloor: floorValue,
      recommendedRange: config.eCPMRange,
      warning,
      expectedFillRate: estimateFillRate(floorValue, config.eCPMRange)
    });
  }
  
  const report = `## eCPM Floor 配置

${floors.map(f =>
  `### ${f.name}
- eCPM Floor: $${f.eCPMFloor}
- 推荐范围: $${f.recommendedRange[0]} - $${f.recommendedRange[1]}
- 预估填充率: ${f.expectedFillRate}%
${f.warning ? `- ${f.warning}` : ''}`
).join('\n\n')}

---

**配置建议：**
- 高 Floor 值 → 低填充率，但单价高
- 低 Floor 值 → 高填充率，但单价低
- 建议从推荐范围低端开始，逐步调整
`;

  return {
    floors,
    report,
    totalNetworks: floors.length,
    warnings: floors.filter(f => f.warning).length
  };
}

/**
 * 生成 Custom Events 配置
 */
function generateCustomEventsConfig(platform, network) {
  const platformConfig = NETWORK_CONFIGS[platform];
  const networkConfig = NETWORK_CONFIGS[network];
  
  if (!platformConfig || !networkConfig) {
    return { error: '未知的平台或网络' };
  }
  
  // AdMob Mediation Custom Events 配置示例
  const customEvent = {
    platform,
    network,
    adapterClass: networkConfig.adapterClass,
    className: `com.google.ads.mediation.${networkConfig.adapterClass}`,
    parameter: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_API_KEY',
      placementId: 'YOUR_PLACEMENT_ID'
    },
    supportedAdTypes: {
      rewarded: {
        className: `${networkConfig.adapterClass}Rewarded`,
        parameter: { zoneId: 'YOUR_ZONE_ID' }
      },
      interstitial: {
        className: `${networkConfig.adapterClass}Interstitial`,
        parameter: { placementId: 'YOUR_PLACEMENT_ID' }
      },
      banner: networkConfig.bannerSupport ? {
        className: `${networkConfig.adapterClass}Banner`,
        parameter: { placementId: 'YOUR_PLACEMENT_ID' }
      } : null
    }
  };
  
  const guide = `## Custom Events 配置指南

### 平台: ${platformConfig.name}
### 网络: ${networkConfig.name}

**Adapter 类名：**
${customEvent.className}

**配置参数：**
- App ID: YOUR_APP_ID
- API Key: YOUR_API_KEY
- Placement ID: YOUR_PLACEMENT_ID

**支持的广告类型：**
${Object.entries(customEvent.supportedAdTypes)
  .filter(([k, v]) => v)
  .map(([type, config]) => `- ${type}: ${config.className}`)
  .join('\n')}

---

**集成步骤：**
1. 下载 ${networkConfig.name} Adapter
2. 添加到项目中
3. 在 ${platformConfig.name} 后台配置 Custom Event
4. 设置参数（App ID、Placement ID等）
5. 测试广告加载
`;

  return {
    customEvent,
    guide,
    platform,
    network,
    adapterClass: networkConfig.adapterClass
  };
}

/**
 * 优化中介配置
 */
function optimizeMediationConfig(currentConfig) {
  const optimizations = [];
  
  // 检查网络顺序
  if (currentConfig.waterfall && currentConfig.waterfall.length > 0) {
    const recommended = generateWaterfallConfig(currentConfig.waterfall.map(w => w.network));
    const currentOrder = currentConfig.waterfall.map(w => w.network);
    
    if (JSON.stringify(currentOrder) !== JSON.stringify(recommended.recommendedOrder)) {
      optimizations.push({
        type: 'waterfall_order',
        current: currentOrder,
        recommended: recommended.recommendedOrder,
        impact: '可能提升 eCPM 10-20%',
        priority: 'high'
      });
    }
  }
  
  // 检查 eCPM Floor
  if (currentConfig.floors && currentConfig.floors.length > 0) {
    for (const floor of currentConfig.floors) {
      const config = NETWORK_CONFIGS[floor.network];
      if (!config) continue;
      
      if (floor.value < config.eCPMRange[0]) {
        optimizations.push({
          type: 'ecpm_floor_low',
          network: floor.network,
          current: floor.value,
          recommended: config.eCPMRange[0],
          impact: '提升单价，降低填充率',
          priority: 'medium'
        });
      }
      
      if (floor.value > config.eCPMRange[1]) {
        optimizations.push({
          type: 'ecpm_floor_high',
          network: floor.network,
          current: floor.value,
          recommended: config.eCPMRange[1],
          impact: '提升填充率，降低单价',
          priority: 'medium'
        });
      }
    }
  }
  
  // 检查是否缺少兜底网络
  if (currentConfig.waterfall && !currentConfig.waterfall.some(w => NETWORK_CONFIGS[w.network]?.isFallback)) {
    optimizations.push({
      type: 'missing_fallback',
      current: '无兜底网络',
      recommended: '添加 AdMob 作为兜底',
      impact: '提升填充率，避免广告空缺',
      priority: 'high'
    });
  }
  
  const report = `## 中介配置优化建议

**发现 ${optimizations.length} 个优化点：**

${optimizations.map((opt, i) =>
  `### ${i + 1}. ${opt.type}
- 当前: ${Array.isArray(opt.current) ? opt.current.join(' → ') : opt.current}
- 推荐: ${Array.isArray(opt.recommended) ? opt.recommended.join(' → ') : opt.recommended}
- 影响: ${opt.impact}
- 优先级: ${opt.priority}`
).join('\n\n')}

---

**优先处理：**
${optimizations.filter(o => o.priority === 'high').map(o => `- ${o.type}`).join('\n') || '无高优先级优化'}
`;

  return {
    optimizations,
    report,
    totalOptimizations: optimizations.length,
    highPriority: optimizations.filter(o => o.priority === 'high').length
  };
}

/**
 * 估算填充率
 */
function estimateFillRate(floorValue, eCPMRange) {
  // 简化模型：floor 在范围内 → 50-80%
  if (floorValue < eCPMRange[0]) {
    return 80; // 低 floor → 高填充率
  } else if (floorValue > eCPMRange[1]) {
    return 30; // 高 floor → 低填充率
  } else {
    const ratio = (floorValue - eCPMRange[0]) / (eCPMRange[1] - eCPMRange[0]);
    return Math.round(80 - ratio * 50);
  }
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
      usage: 'waterfall | ecpm-floor | custom-events | optimize',
      examples: [
        'node mediation-config-generator.js waterfall --platforms \'["meta","applovin","unity","admob"]\'',
        'node mediation-config-generator.js ecpm-floor --networks \'["meta","applovin"]\' --values \'[15,10]\''
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'waterfall':
        const platforms = JSON.parse(args.find(a => a.startsWith('--platforms='))?.split('=')[1] || '[]');
        result = generateWaterfallConfig(platforms);
        break;
        
      case 'ecpm-floor':
        const networks = JSON.parse(args.find(a => a.startsWith('--networks='))?.split('=')[1] || '[]');
        const values = JSON.parse(args.find(a => a.startsWith('--values='))?.split('=')[1] || '[]');
        result = generateECPMFloorConfig(networks, values);
        break;
        
      case 'custom-events':
        const platform = args.find(a => a.startsWith('--platform='))?.split('=')[1] || 'admob';
        const network = args.find(a => a.startsWith('--network='))?.split('=')[1] || 'meta';
        result = generateCustomEventsConfig(platform, network);
        break;
        
      case 'optimize':
        const configPath = args.find(a => a.startsWith('--current-config='))?.split('=')[1];
        if (!configPath) {
          result = { error: '需提供当前配置文件路径' };
        } else {
          const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          result = optimizeMediationConfig(currentConfig);
        }
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
  generateWaterfallConfig,
  generateECPMFloorConfig,
  generateCustomEventsConfig,
  optimizeMediationConfig,
  NETWORK_CONFIGS
};

if (require.main === module) {
  main();
}