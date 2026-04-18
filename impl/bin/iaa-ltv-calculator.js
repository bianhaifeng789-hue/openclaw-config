#!/usr/bin/env node
/**
 * IAA LTV Calculator - IAA（广告变现）专用 LTV 计算器
 *
 * 针对快速回收产品（3-30天）
 *
 * 功能：
 * - IAA LTV计算（基于eCPM、展示次数、留存）
 * - 快速回收评估（3/7/14/30天）
 * - 预算分配建议
 * - ARPU优化建议
 *
 * 用法：
 *   node iaa-ltv-calculator.js ltv --ecpm 8 --impressions 5 --d1 0.5 --d7 0.25
 *   node iaa-ltv-calculator.js recovery --cpi 0.3 --ecpm 8 --impressions 5
 *   node iaa-ltv-calculator.js budget --ltv 0.5 --target-roi 150 --daily-budget 1000
 *   node iaa-ltv-calculator.js optimize --current-arpu 0.1 --d1 0.5 --d7 0.25
 */

/**
 * IAA LTV 计算
 * 基于eCPM、展示次数、留存率
 */
function calculateIAALTV(ecpm, dailyImpressions, d1Retention, d7Retention, d30Retention = null) {
  if (ecpm <= 0) return { error: 'eCPM 必须大于 0' };
  if (dailyImpressions <= 0) return { error: '展示次数必须大于 0' };
  if (d1Retention <= 0) return { error: 'D1 留存率必须大于 0' };
  
  // 计算日ARPU
  // ARPU = (eCPM / 1000) × 展示次数
  const dailyArpu = (ecpm / 1000) * dailyImpressions;
  
  // 计算衰减率
  const decayRate = Math.pow(d7Retention / d1Retention, 1/7);
  
  // 计算不同周期的LTV
  const ltv3 = dailyArpu * (d1Retention + d1Retention * decayRate + d1Retention * Math.pow(decayRate, 2));
  const ltv7 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 7);
  const ltv14 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 14);
  const ltv30 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 30);
  const ltv90 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 90);
  
  return {
    input: {
      ecpm: '$' + ecpm.toFixed(2),
      dailyImpressions: dailyImpressions,
      d1Retention: (d1Retention * 100).toFixed(1) + '%',
      d7Retention: (d7Retention * 100).toFixed(1) + '%',
      d30Retention: d30Retention ? (d30Retention * 100).toFixed(1) + '%' : '未提供'
    },
    metrics: {
      dailyArpu: '$' + dailyArpu.toFixed(3),
      decayRate: decayRate.toFixed(3)
    },
    ltv: {
      day3: '$' + ltv3.toFixed(3),
      day7: '$' + ltv7.toFixed(3),
      day14: '$' + ltv14.toFixed(3),
      day30: '$' + ltv30.toFixed(3),
      day90: '$' + ltv90.toFixed(3)
    },
    assessment: assessIAALTV(ltv3, ltv7, ltv30, dailyArpu)
  };
}

/**
 * 累计留存计算
 */
function calculateCumulativeRetention(d1, decayRate, days) {
  let cumulative = 0;
  for (let day = 0; day < days; day++) {
    cumulative += d1 * Math.pow(decayRate, day);
  }
  return cumulative;
}

/**
 * IAA LTV评估（针对快速回收产品）
 */
function assessIAALTV(ltv3, ltv7, ltv30, dailyArpu) {
  const assessments = [];
  
  // 快速回收评估
  assessments.push('【快速回收评估】');
  if (ltv3 >= dailyArpu * 2.5) {
    assessments.push('• D3 LTV优秀（> ARPU×2.5） - 适合超快速回收');
  } else if (ltv3 >= dailyArpu * 2) {
    assessments.push('• D3 LTV正常（ARPU×2-2.5） - 适合快速回收');
  } else {
    assessments.push('• D3 LTV偏低 - 建议优化留存或ARPU');
  }
  
  if (ltv7 >= dailyArpu * 5) {
    assessments.push('• D7 LTV优秀（> ARPU×5） - 3-7天可回本');
  } else if (ltv7 >= dailyArpu * 3) {
    assessments.push('• D7 LTV正常（ARPU×3-5） - 7-14天可回本');
  } else {
    assessments.push('• D7 LTV偏低 - 建议优化留存');
  }
  
  // 行业基准对比
  assessments.push('\n【行业基准】');
  assessments.push('• 超休闲游戏：D7 LTV $0.20-0.50，D30 LTV $0.30-0.80');
  assessments.push('• 休闲游戏：D7 LTV $0.50-1.00，D30 LTV $1.00-2.00');
  assessments.push('• 中重度游戏：D7 LTV $1.00-2.00，D30 LTV $2.00-4.00');
  
  return assessments.join('\n');
}

/**
 * 快速回收评估（IAA专用）
 */
function evaluateFastRecovery(cpi, ecpm, dailyImpressions, d1Retention, d7Retention) {
  const dailyArpu = (ecpm / 1000) * dailyImpressions;
  const decayRate = Math.pow(d7Retention / d1Retention, 1/7);
  
  // 计算不同周期的LTV
  const ltv3 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 3);
  const ltv7 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 7);
  const ltv14 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 14);
  const ltv30 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 30);
  
  // 计算回收周期
  const recoveryDays = cpi / dailyArpu;
  
  // ROI计算
  const roi3 = ((ltv3 - cpi) / cpi) * 100;
  const roi7 = ((ltv7 - cpi) / cpi) * 100;
  const roi14 = ((ltv14 - cpi) / cpi) * 100;
  const roi30 = ((ltv30 - cpi) / cpi) * 100;
  
  // 找出盈亏平衡点
  let breakevenDay = null;
  for (let day = 1; day <= 30; day++) {
    const ltv = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, day);
    if (ltv >= cpi) {
      breakevenDay = day;
      break;
    }
  }
  
  return {
    input: {
      cpi: '$' + cpi.toFixed(3),
      ecpm: '$' + ecpm.toFixed(2),
      dailyImpressions: dailyImpressions,
      d1Retention: (d1Retention * 100).toFixed(1) + '%',
      d7Retention: (d7Retention * 100).toFixed(1) + '%'
    },
    metrics: {
      dailyArpu: '$' + dailyArpu.toFixed(3)
    },
    ltv: {
      day3: '$' + ltv3.toFixed(3),
      day7: '$' + ltv7.toFixed(3),
      day14: '$' + ltv14.toFixed(3),
      day30: '$' + ltv30.toFixed(3)
    },
    roi: {
      day3: roi3.toFixed(1) + '%',
      day7: roi7.toFixed(1) + '%',
      day14: roi14.toFixed(1) + '%',
      day30: roi30.toFixed(1) + '%'
    },
    recovery: {
      breakevenDay: breakevenDay ? breakevenDay + '天' : '超过30天',
      dailyArpuRecovery: recoveryDays.toFixed(1) + '天'
    },
    assessment: assessFastRecovery(breakevenDay, roi7, roi30)
  };
}

/**
 * 快速回收评估
 */
function assessFastRecovery(breakevenDay, roi7, roi30) {
  const assessments = [];
  
  assessments.push('【回收周期评估】');
  if (breakevenDay <= 3) {
    assessments.push('✅✅✅ 极速回收（≤3天） - 超休闲产品，可大规模投放');
  } else if (breakevenDay <= 7) {
    assessments.push('✅✅ 快速回收（3-7天） - 休闲产品，可加大投放');
  } else if (breakevenDay <= 14) {
    assessments.push('✅ 正常回收（7-14天） - 中重度产品，稳步投放');
  } else if (breakevenDay <= 30) {
    assessments.push('⚠️ 慢速回收（14-30天） - 建议优化ARPU或留存');
  } else {
    assessments.push('❌ 无法在30天内回本 - 不建议投放');
  }
  
  assessments.push('\n【ROI评估】');
  if (roi7 >= 100) {
    assessments.push('• D7 ROI ≥ 100% - 优秀，一周内盈利');
  } else if (roi7 >= 50) {
    assessments.push('• D7 ROI 50-100% - 正常，建议观察');
  } else if (roi7 >= 0) {
    assessments.push('• D7 ROI 0-50% - 较低，需要时间盈利');
  } else {
    assessments.push('• D7 ROI < 0% - 未回本，不建议继续');
  }
  
  return assessments.join('\n');
}

/**
 * 预算分配建议（基于LTV和目标ROI）
 */
function suggestBudgetAllocation(ltv, targetROI, dailyBudget) {
  // 计算目标CPI（基于目标ROI）
  // ROI = (LTV - CPI) / CPI → CPI = LTV / (1 + ROI)
  const targetCPI = ltv / (1 + targetROI / 100);
  
  // 计算安全CPI区间
  const safeCPI = ltv * 0.7;
  const maxCPI = ltv * 0.8;
  
  // 计算建议日安装量
  const suggestedInstalls = dailyBudget / targetCPI;
  
  // 预算分配建议
  const allocation = {
    google: Math.round(dailyBudget * 0.4),
    facebook: Math.round(dailyBudget * 0.3),
    tiktok: Math.round(dailyBudget * 0.2),
    other: Math.round(dailyBudget * 0.1)
  };
  
  return {
    input: {
      ltv: '$' + ltv.toFixed(3),
      targetROI: targetROI.toFixed(1) + '%',
      dailyBudget: '$' + dailyBudget.toFixed(2)
    },
    cpiTargets: {
      targetCPI: '$' + targetCPI.toFixed(3) + '（目标ROI下）',
      safeCPI: '$' + safeCPI.toFixed(3) + '（安全区间）',
      maxCPI: '$' + maxCPI.toFixed(3) + '（最高可接受）'
    },
    suggestedInstalls: Math.round(suggestedInstalls) + '个/天',
    budgetAllocation: allocation,
    assessment: assessBudgetAllocation(ltv, targetCPI, targetROI)
  };
}

/**
 * 预算分配评估
 */
function assessBudgetAllocation(ltv, targetCPI, targetROI) {
  const assessments = [];
  
  assessments.push('【投放建议】');
  assessments.push(`• 目标CPI: $${targetCPI.toFixed(3)}（确保ROI ${targetROI}%）`);
  assessments.push(`• 安全CPI上限: $${(ltv * 0.8).toFixed(3)}`);
  assessments.push(`• 预期日安装量: ~${Math.round(1000 / targetCPI)}个（假设$1000预算）`);
  
  assessments.push('\n【渠道建议】');
  assessments.push('• Google Ads (UAC): 40%预算 - 美国市场首选');
  assessments.push('• Facebook Ads: 30%预算 - 精准定向');
  assessments.push('• TikTok Ads: 20%预算 - 年轻用户群体');
  assessments.push('• 其他渠道: 10%预算 - 测试新渠道');
  
  return assessments.join('\n');
}

/**
 * ARPU优化建议（IAA专用）
 */
function suggestARPUOptimization(currentArpu, d1Retention, d7Retention) {
  const assessments = [];
  
  assessments.push('【ARPU优化建议】');
  
  // eCPM优化
  assessments.push('\n1. 提升 eCPM：');
  assessments.push('• 使用激励视频广告（eCPM $10-20）');
  assessments.push('• 配置中介优化（AdMob + Meta AN + Unity）');
  assessments.push('• 设置 eCPM Floor（$5-8）');
  assessments.push('• 优化广告位置（关键节点展示）');
  assessments.push('• 预期提升：eCPM ↑ 30-50%');
  
  // 展示次数优化
  assessments.push('\n2. 增加展示次数：');
  assessments.push('• 增加广告位数量（从3个到5个）');
  assessments.push('• 优化广告触发频率');
  assessments.push('• 添加复活广告、通关广告');
  assessments.push('• 预期提升：展示次数 ↑ 50-100%');
  
  // 留存优化
  assessments.push('\n3. 提升留存率：');
  assessments.push('• 添加每日任务/签到');
  assessments.push('• 优化新手引导');
  assessments.push('• 添加推送召回');
  assessments.push('• 预期提升：D7留存 ↑ 5-10%');
  
  // 计算优化后的ARPU
  const optimizedArpu = currentArpu * 1.5; // eCPM +50%
  const optimizedD7 = d7Retention * 1.1; // D7留存 +10%
  const decayRate = Math.pow(optimizedD7 / d1Retention, 1/7);
  const optimizedLtv7 = optimizedArpu * calculateCumulativeRetention(d1Retention, decayRate, 7);
  const optimizedLtv30 = optimizedArpu * calculateCumulativeRetention(d1Retention, decayRate, 30);
  
  return {
    current: {
      arpu: '$' + currentArpu.toFixed(3),
      d1Retention: (d1Retention * 100).toFixed(1) + '%',
      d7Retention: (d7Retention * 100).toFixed(1) + '%'
    },
    optimization: assessments.join('\n'),
    projected: {
      optimizedArpu: '$' + optimizedArpu.toFixed(3),
      optimizedD7Retention: (optimizedD7 * 100).toFixed(1) + '%',
      optimizedLtv7: '$' + optimizedLtv7.toFixed(3),
      optimizedLtv30: '$' + optimizedLtv30.toFixed(3),
      improvement: ((optimizedLtv7 / (currentArpu * calculateCumulativeRetention(d1Retention, Math.pow(d7Retention / d1Retention, 1/7), 7)) - 1) * 100).toFixed(1) + '%'
    }
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
      usage: 'ltv | recovery | budget | optimize',
      examples: [
        'node iaa-ltv-calculator.js ltv --ecpm 8 --impressions 5 --d1 0.5 --d7 0.25',
        'node iaa-ltv-calculator.js recovery --cpi 0.3 --ecpm 8 --impressions 5 --d1 0.5 --d7 0.25',
        'node iaa-ltv-calculator.js budget --ltv 0.5 --target-roi 150 --daily-budget 1000',
        'node iaa-ltv-calculator.js optimize --current-arpu 0.1 --d1 0.5 --d7 0.25'
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    const getArg = (name) => {
      const arg = args.find(a => a.startsWith(`--${name}=`));
      return arg ? parseFloat(arg.split('=')[1]) : null;
    };
    
    switch (command) {
      case 'ltv':
        result = calculateIAALTV(
          getArg('ecpm') || 8,
          getArg('impressions') || 5,
          getArg('d1') || 0.5,
          getArg('d7') || 0.25,
          getArg('d30')
        );
        break;
        
      case 'recovery':
        result = evaluateFastRecovery(
          getArg('cpi') || 0.3,
          getArg('ecpm') || 8,
          getArg('impressions') || 5,
          getArg('d1') || 0.5,
          getArg('d7') || 0.25
        );
        break;
        
      case 'budget':
        result = suggestBudgetAllocation(
          getArg('ltv') || 0.5,
          getArg('target-roi') || 150,
          getArg('daily-budget') || 1000
        );
        break;
        
      case 'optimize':
        result = suggestARPUOptimization(
          getArg('current-arpu') || 0.1,
          getArg('d1') || 0.5,
          getArg('d7') || 0.25
        );
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
  calculateIAALTV,
  evaluateFastRecovery,
  suggestBudgetAllocation,
  suggestARPUOptimization
};

if (require.main === module) {
  main();
}