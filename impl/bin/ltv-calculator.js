#!/usr/bin/env node
/**
 * LTV Calculator - 游戏 LTV（生命周期价值）计算工具
 * 
 * 支持三种计算方法：
 *   - 简单估算法: ARPU × 平均生命周期天数
 *   - 留存率累计法: Σ(ARPU_d × Retention_d)
 *   - 衰减模型法: ARPU × (1 / (1 - 留存衰减率))
 * 
 * Usage:
 *   node ltv-calculator.js simple --arpu 0.10 --lifespan 30
 *   node ltv-calculator.js cumulative --arpu 0.12 --retention '[1,0.5,0.45,0.4,0.35,0.3,0.25]'
 *   node ltv-calculator.js decay --arpu 0.10 --d1 0.5 --d7 0.2
 *   node ltv-calculator.js roi --ltv 0.65 --cpi 0.40
 *   node ltv-calculator.js recovery --cpi 0.40 --arpu 0.12
 */

const fs = require('fs');
const path = require('path');

/**
 * 简单估算法
 * LTV = ARPU × 平均生命周期天数
 */
function calculateSimpleLTV(arpu, lifespanDays) {
  if (arpu <= 0) return { error: 'ARPU 必须大于 0' };
  if (lifespanDays <= 0) return { error: '生命周期天数必须大于 0' };
  
  const ltv = arpu * lifespanDays;
  
  return {
    arpu,
    lifespanDays,
    ltv: '$' + ltv.toFixed(3),
    ltvValue: ltv,
    method: '简单估算法',
    applicable: '快速估算、产品初期阶段'
  };
}

/**
 * 留存率累计法
 * LTV = Σ(ARPU_d × Retention_d)
 */
function calculateCumulativeLTV(arpu, retentionCurve) {
  if (arpu <= 0) return { error: 'ARPU 必须大于 0' };
  if (!retentionCurve || retentionCurve.length === 0) return { error: '需提供留存率曲线' };
  
  let cumulativeLTV = 0;
  const dailyContributions = [];
  
  for (let day = 0; day < retentionCurve.length; day++) {
    const dailyValue = arpu * retentionCurve[day];
    cumulativeLTV += dailyValue;
    
    dailyContributions.push({
      day: day + 1,
      retention: (retentionCurve[day] * 100).toFixed(1) + '%',
      dailyValue: '$' + dailyValue.toFixed(3),
      cumulativeLTV: '$' + cumulativeLTV.toFixed(3)
    });
  }
  
  return {
    arpu,
    retentionCurve: retentionCurve.map(r => (r * 100).toFixed(1) + '%'),
    ltv: '$' + cumulativeLTV.toFixed(3),
    ltvValue: cumulativeLTV,
    dailyContributions,
    method: '留存率累计法',
    forecastDays: retentionCurve.length
  };
}

/**
 * 衰减模型法
 * LTV = ARPU × (1 / (1 - 留存衰减率))
 */
function calculateDecayModelLTV(arpu, d1Retention, d7Retention) {
  if (arpu <= 0) return { error: 'ARPU 必须大于 0' };
  if (d1Retention <= 0) return { error: 'D1 留存率必须大于 0' };
  if (d7Retention <= 0) return { error: 'D7 留存率必须大于 0' };
  
  // 计算衰减率
  const decayRate = Math.pow(d7Retention / d1Retention, 1/7);
  const ltv = arpu * (1 / (1 - decayRate));
  
  // 预测长期留存
  const predictions = [];
  for (let day = 1; day <= 90; day += 7) {
    const retention = d1Retention * Math.pow(decayRate, day);
    predictions.push({
      day: 'D' + day,
      retention: (retention * 100).toFixed(1) + '%'
    });
  }
  
  return {
    arpu,
    d1Retention: (d1Retention * 100).toFixed(1) + '%',
    d7Retention: (d7Retention * 100).toFixed(1) + '%',
    decayRate: decayRate.toFixed(3),
    ltv: '$' + ltv.toFixed(3),
    ltvValue: ltv,
    retentionPredictions: predictions,
    method: '衰减模型法',
    applicable: '长期预测、稳定产品'
  };
}

/**
 * 买量 ROI 评估
 * ROI = (LTV - CPI) / CPI × 100%
 */
function evaluateBuyROI(ltv, cpi) {
  if (ltv <= 0) return { error: 'LTV 必须大于 0' };
  if (cpi <= 0) return { error: 'CPI 必须大于 0' };
  
  const roi = ((ltv - cpi) / cpi) * 100;
  const profit = ltv - cpi;
  const breakeven = ltv; // 盈亏平衡点 CPI
  
  // 安全区间评估
  const safeCPI = ltv * 0.7;
  const normalCPI = ltv * 0.8;
  
  let assessment;
  if (cpi < safeCPI) {
    assessment = '✅✅ 安全区间 - 建议加大投放';
  } else if (cpi < normalCPI) {
    assessment = '✅ 正常区间 - 可正常投放';
  } else if (cpi < ltv) {
    assessment = '⚠️ 较高风险 - 建议谨慎';
  } else {
    assessment = '❌ 亏损区间 - 不推荐';
  }
  
  return {
    ltv: '$' + ltv.toFixed(3),
    cpi: '$' + cpi.toFixed(3),
    profit: '$' + profit.toFixed(3),
    roi: roi.toFixed(1) + '%',
    breakevenCPI: '$' + breakeven.toFixed(3),
    safeCPI: '$' + safeCPI.toFixed(3) + ' (< LTV × 0.7)',
    normalCPI: '$' + normalCPI.toFixed(3) + ' (< LTV × 0.8)',
    assessment
  };
}

/**
 * 回收周期计算
 * Recovery Period = CPI / Daily ARPU
 */
function calculateRecoveryPeriod(cpi, dailyArpu) {
  if (cpi <= 0) return { error: 'CPI 必须大于 0' };
  if (dailyArpu <= 0) return { error: '日 ARPU 必须大于 0' };
  
  const days = cpi / dailyArpu;
  
  let assessment;
  if (days < 7) {
    assessment = '✅✅ 优秀（< 7天）';
  } else if (days < 14) {
    assessment = '✅ 正常（7-14天）';
  } else {
    assessment = '⚠️ 风险较高（> 14天）';
  }
  
  return {
    cpi: '$' + cpi.toFixed(3),
    dailyArpu: '$' + dailyArpu.toFixed(3),
    recoveryDays: days.toFixed(1) + '天',
    assessment,
    recommendation: days < 7 ? '回收快，可加大投放' : 
                   days < 14 ? '回收正常，稳步投放' :
                   '回收慢，建议优化 ARPU 或降低 CPI'
  };
}

/**
 * 留存率预测（基于 D1、D7、D30）
 */
function predictRetention(d1, d7, d30 = null) {
  const predictions = [];
  
  // 短期衰减率（D1 → D7）
  const shortDecay = Math.pow(d7 / d1, 1/6);
  
  // 长期衰减率（D7 → D30）
  const longDecay = d30 ? Math.pow(d30 / d7, 1/23) : shortDecay;
  
  // 预测关键节点
  const nodes = [1, 7, 14, 30, 60, 90];
  
  for (const day of nodes) {
    if (day <= 7) {
      const retention = d1 * Math.pow(shortDecay, day - 1);
      predictions.push({ day: 'D' + day, retention: (retention * 100).toFixed(1) + '%', confidence: 'high' });
    } else if (day <= 30) {
      const retention = d7 * Math.pow(longDecay, day - 7);
      predictions.push({ day: 'D' + day, retention: (retention * 100).toFixed(1) + '%', confidence: 'medium' });
    } else {
      const retention = (d30 || d7) * Math.pow(longDecay, day - (d30 ? 30 : 7));
      predictions.push({ day: 'D' + day, retention: (retention * 100).toFixed(1) + '%', confidence: 'low' });
    }
  }
  
  return {
    d1: (d1 * 100).toFixed(1) + '%',
    d7: (d7 * 100).toFixed(1) + '%',
    d30: d30 ? (d30 * 100).toFixed(1) + '%' : '未提供',
    shortDecayRate: shortDecay.toFixed(3),
    longDecayRate: longDecay.toFixed(3),
    predictions,
    assessment: assessRetention(d1, d7, d30)
  };
}

/**
 * 留存率评估
 */
function assessRetention(d1, d7, d30) {
  const assessments = [];
  
  // D1 评估
  if (d1 >= 0.6) assessments.push('• D1 留存优秀 (>60%)');
  else if (d1 >= 0.4) assessments.push('• D1 留存正常 (40-60%)');
  else assessments.push('• D1 留存偏低 (<40%)');
  
  // D7 评估
  if (d7 >= 0.3) assessments.push('• D7 留存优秀 (>30%)');
  else if (d7 >= 0.15) assessments.push('• D7 留存正常 (15-30%)');
  else assessments.push('• D7 留存偏低 (<15%)');
  
  // D30 评估
  if (d30) {
    if (d30 >= 0.15) assessments.push('• D30 留存优秀 (>15%)');
    else if (d30 >= 0.05) assessments.push('• D30 留存正常 (5-15%)');
    else assessments.push('• D30 留存偏低 (<5%)');
  }
  
  return assessments.join('\n');
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
      usage: 'simple | cumulative | decay | roi | recovery | predict',
      examples: [
        'node ltv-calculator.js simple --arpu 0.10 --lifespan 30',
        'node ltv-calculator.js decay --arpu 0.10 --d1 0.5 --d7 0.2',
        'node ltv-calculator.js roi --ltv 0.65 --cpi 0.40'
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'simple':
        const arpu = parseFloat(args.find(a => a.startsWith('--arpu='))?.split('=')[1] || 0);
        const lifespan = parseFloat(args.find(a => a.startsWith('--lifespan='))?.split('=')[1] || 0);
        result = calculateSimpleLTV(arpu, lifespan);
        break;
        
      case 'cumulative':
        const cArpu = parseFloat(args.find(a => a.startsWith('--arpu='))?.split('=')[1] || 0);
        const retention = JSON.parse(args.find(a => a.startsWith('--retention='))?.split('=')[1] || '[]');
        result = calculateCumulativeLTV(cArpu, retention);
        break;
        
      case 'decay':
        const arpuArg = args.find(a => a.startsWith('--arpu='));
        const d1Arg = args.find(a => a.startsWith('--d1='));
        const d7Arg = args.find(a => a.startsWith('--d7='));
        const dArpu = arpuArg ? parseFloat(arpuArg.split('=')[1]) : 0;
        const d1 = d1Arg ? parseFloat(d1Arg.split('=')[1]) : 0;
        const d7 = d7Arg ? parseFloat(d7Arg.split('=')[1]) : 0;
        result = calculateDecayModelLTV(dArpu, d1, d7);
        break;
        
      case 'roi':
        const ltv = parseFloat(args.find(a => a.startsWith('--ltv='))?.split('=')[1] || 0);
        const cpi = parseFloat(args.find(a => a.startsWith('--cpi='))?.split('=')[1] || 0);
        result = evaluateBuyROI(ltv, cpi);
        break;
        
      case 'recovery':
        const rCpi = parseFloat(args.find(a => a.startsWith('--cpi='))?.split('=')[1] || 0);
        const rArpu = parseFloat(args.find(a => a.startsWith('--arpu='))?.split('=')[1] || 0);
        result = calculateRecoveryPeriod(rCpi, rArpu);
        break;
        
      case 'predict':
        const pD1 = parseFloat(args.find(a => a.startsWith('--d1='))?.split('=')[1] || 0);
        const pD7 = parseFloat(args.find(a => a.startsWith('--d7='))?.split('=')[1] || 0);
        const pD30 = parseFloat(args.find(a => a.startsWith('--d30='))?.split('=')[1] || 0);
        result = predictRetention(pD1, pD7, pD30);
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
  calculateSimpleLTV,
  calculateCumulativeLTV,
  calculateDecayModelLTV,
  evaluateBuyROI,
  calculateRecoveryPeriod,
  predictRetention
};

if (require.main === module) {
  main();
}