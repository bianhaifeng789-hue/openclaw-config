#!/usr/bin/env node
/**
 * Retention Predictor - 留存率预测工具
 * 
 * 基于历史留存数据预测未来留存曲线：
 *   - 短期预测（D1 → D7）
 *   - 中期预测（D7 → D30）
 *   - 长期预测（D30 → D90）
 * 
 * Usage:
 *   node retention-predictor.js predict --d1 0.5 --d7 0.25 --d30 0.10
 *   node retention-predictor.js curve --days 90 --d1 0.5 --d7 0.2
 *   node retention-predictor.js compare --baseline '[0.5,0.2,0.1]' --current '[0.55,0.25,0.12]'
 */

const fs = require('fs');
const path = require('path');

/**
 * 留存率曲线预测
 * 使用幂律衰减模型: Retention(d) = d1 × d^(-α)
 */
function predictRetentionCurve(d1, days = 90, alpha = null) {
  if (d1 <= 0) return { error: 'D1 留存率必须大于 0' };
  
  // 默认衰减系数（休闲游戏典型值）
  const decayAlpha = alpha || 0.35;
  
  const curve = [];
  for (let day = 1; day <= days; day++) {
    const retention = d1 * Math.pow(day, -decayAlpha);
    curve.push({
      day,
      retention: Math.max(0, retention),
      retentionPercent: Math.max(0, retention * 100).toFixed(2) + '%'
    });
  }
  
  // 关键节点摘要
  const keyNodes = [1, 7, 14, 30, 60, 90].map(day => {
    const retention = curve[day - 1]?.retention || 0;
    return {
      day: 'D' + day,
      retention: (retention * 100).toFixed(1) + '%',
      assessment: assessRetentionNode(day, retention)
    };
  });
  
  return {
    d1: (d1 * 100).toFixed(1) + '%',
    decayAlpha,
    forecastDays: days,
    keyNodes,
    fullCurve: curve,
    method: '幂律衰减模型',
    confidence: days <= 30 ? 'high' : days <= 60 ? 'medium' : 'low'
  };
}

/**
 * 三点预测（D1 → D7 → D30）
 */
function predictFromThreePoints(d1, d7, d30) {
  if (!d1 || !d7) return { error: '需提供 D1 和 D7 留存率' };
  
  // 计算短期衰减率（D1 → D7）
  const shortAlpha = -Math.log(d7 / d1) / Math.log(7);
  
  // 计算长期衰减率（D7 → D30）
  const longAlpha = d30 ? -Math.log(d30 / d7) / Math.log(30/7) : shortAlpha;
  
  // 预测曲线
  const predictions = [];
  const nodes = [1, 7, 14, 30, 60, 90];
  
  for (const day of nodes) {
    let retention;
    if (day <= 7) {
      retention = d1 * Math.pow(day, -shortAlpha);
    } else if (day <= 30) {
      retention = d7 * Math.pow(day/7, -longAlpha);
    } else {
      retention = (d30 || d7) * Math.pow(day/(d30 ? 30 : 7), -longAlpha);
    }
    
    predictions.push({
      day: 'D' + day,
      retention: (Math.max(0, retention) * 100).toFixed(1) + '%',
      confidence: day <= 7 ? '实测' : day <= 30 ? '高' : '中'
    });
  }
  
  return {
    input: {
      d1: (d1 * 100).toFixed(1) + '%',
      d7: (d7 * 100).toFixed(1) + '%',
      d30: d30 ? (d30 * 100).toFixed(1) + '%' : '未提供'
    },
    shortAlpha: shortAlpha.toFixed(3),
    longAlpha: longAlpha.toFixed(3),
    predictions,
    assessment: assessRetentionCurve(predictions)
  };
}

/**
 * 留存率对比分析
 */
function compareRetention(baseline, current) {
  if (!baseline || !current) return { error: '需提供基准和当前数据' };
  
  const comparison = [];
  let overallChange = 0;
  
  for (let i = 0; i < Math.min(baseline.length, current.length); i++) {
    const base = baseline[i];
    const curr = current[i];
    const change = ((curr - base) / base) * 100;
    overallChange += change;
    
    comparison.push({
      day: 'D' + (i === 0 ? 1 : i === 1 ? 7 : i === 2 ? 30 : i * 7),
      baseline: (base * 100).toFixed(1) + '%',
      current: (curr * 100).toFixed(1) + '%',
      change: change.toFixed(1) + '%',
      trend: change > 5 ? '📈 提升' : change < -5 ? '📉 下降' : '➡️ 稳定'
    });
  }
  
  const avgChange = overallChange / comparison.length;
  
  return {
    comparison,
    averageChange: avgChange.toFixed(1) + '%',
    overallAssessment: avgChange > 5 ? '✅ 整体提升显著' : 
                      avgChange < -5 ? '⚠️ 整体下降明显' : 
                      '➡️ 整体稳定',
    recommendations: generateRetentionRecommendations(avgChange)
  };
}

/**
 * 留存节点评估
 */
function assessRetentionNode(day, retention) {
  const benchmarks = {
    1: { excellent: 0.6, normal: 0.4 },
    7: { excellent: 0.3, normal: 0.15 },
    14: { excellent: 0.2, normal: 0.1 },
    30: { excellent: 0.15, normal: 0.05 },
    60: { excellent: 0.1, normal: 0.03 },
    90: { excellent: 0.08, normal: 0.02 }
  };
  
  const bench = benchmarks[day];
  if (!bench) return 'N/A';
  
  if (retention >= bench.excellent) return '✅✅ 优秀';
  if (retention >= bench.normal) return '✅ 正常';
  return '⚠️ 较低';
}

/**
 * 留存曲线整体评估
 */
function assessRetentionCurve(predictions) {
  const assessments = [];
  
  for (const pred of predictions) {
    const day = parseInt(pred.day.replace('D', ''));
    const retention = parseFloat(pred.retention.replace('%', '')) / 100;
    
    if (pred.confidence === '实测') continue;
    
    if (day === 14) {
      if (retention >= 0.2) assessments.push('• D14 预测优秀 (>20%)');
      else assessments.push('• D14 预测偏低 (<20%)');
    }
    
    if (day === 60) {
      if (retention >= 0.1) assessments.push('• D60 预测优秀 (>10%)');
      else assessments.push('• D60 预测偏低 (<10%)');
    }
  }
  
  return assessments.join('\n');
}

/**
 * 留存率优化建议
 */
function generateRetentionRecommendations(avgChange) {
  if (avgChange > 5) {
    return [
      '• 留存率提升显著，建议分析成功因素',
      '• 可尝试扩大类似策略',
      '• 建议记录优化措施用于后续参考'
    ];
  } else if (avgChange < -5) {
    return [
      '• 留存率下降明显，需排查原因',
      '• 建议检查：游戏体验、推送频率、内容更新',
      '• 考虑用户调研找出流失原因'
    ];
  } else {
    return [
      '• 留存率稳定，可尝试新优化策略',
      '• 建议小幅测试新功能',
      '• 关注竞品动态'
    ];
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
      usage: 'predict | curve | compare',
      examples: [
        'node retention-predictor.js predict --d1 0.5 --d7 0.25 --d30 0.10',
        'node retention-predictor.js curve --days 90 --d1 0.5',
        'node retention-predictor.js compare --baseline \'[0.5,0.2,0.1]\' --current \'[0.55,0.25,0.12]\''
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'predict':
        const d1 = parseFloat(args.find(a => a.startsWith('--d1='))?.split('=')[1] || 0);
        const d7 = parseFloat(args.find(a => a.startsWith('--d7='))?.split('=')[1] || 0);
        const d30 = parseFloat(args.find(a => a.startsWith('--d30='))?.split('=')[1] || 0);
        result = predictFromThreePoints(d1, d7, d30);
        break;
        
      case 'curve':
        const cD1 = parseFloat(args.find(a => a.startsWith('--d1='))?.split('=')[1] || 0);
        const days = parseInt(args.find(a => a.startsWith('--days='))?.split('=')[1] || 90);
        const alpha = parseFloat(args.find(a => a.startsWith('--alpha='))?.split('=')[1] || 0);
        result = predictRetentionCurve(cD1, days, alpha > 0 ? alpha : null);
        break;
        
      case 'compare':
        const baseline = JSON.parse(args.find(a => a.startsWith('--baseline='))?.split('=')[1] || '[]');
        const current = JSON.parse(args.find(a => a.startsWith('--current='))?.split('=')[1] || '[]');
        result = compareRetention(baseline, current);
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
  predictRetentionCurve,
  predictFromThreePoints,
  compareRetention,
  assessRetentionNode
};

if (require.main === module) {
  main();
}