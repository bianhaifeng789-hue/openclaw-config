#!/usr/bin/env node
/**
 * ROI Calculator - 广告 ROI 计算工具
 * 
 * 支持多种计算模式：
 *   - 基础 ROI: (收入 - 成本) / 成本 × 100%
 *   - 转化率分析: CTR, CVR, CPA
 *   - 成本指标: CPC, CPM
 *   - A/B 测试对比
 * 
 * Usage:
 *   node roi-calculator.js basic --cost 1000 --revenue 3500
 *   node roi-calculator.js metrics --impressions 50000 --clicks 2500 --conversions 150 --cost 1200
 *   node roi-calculator.js ab-test --a '{"ctr":5,"cvr":6}' --b '{"ctr":4.5,"cvr":5}'
 *   node roi-calculator.js report --data '{"impressions":50000,"clicks":2500,"conversions":150,"cost":1200,"revenue":4500}'
 */

const fs = require('fs');
const path = require('path');

/**
 * 基础 ROI 计算
 * ROI = (收入 - 成本) / 成本 × 100%
 */
function calculateBasicROI(cost, revenue) {
  if (cost <= 0) return { error: '成本必须大于 0' };
  
  const roi = ((revenue - cost) / cost) * 100;
  const profit = revenue - cost;
  const profitMargin = (profit / revenue) * 100;
  
  return {
    cost,
    revenue,
    profit,
    roi: roi.toFixed(2) + '%',
    profitMargin: profitMargin.toFixed(2) + '%',
    assessment: assessROI(roi)
  };
}

/**
 * 广告指标计算
 * CTR = 点击数 / 展示数
 * CVR = 转化数 / 点击数  
 * CPC = 成本 / 点击数
 * CPM = 成本 / (展示数/1000)
 * CPA = 成本 / 转化数
 */
function calculateMetrics(impressions, clicks, conversions, cost, revenue = null) {
  if (impressions <= 0) return { error: '展示数必须大于 0' };
  
  const ctr = (clicks / impressions) * 100;
  const cvr = (conversions / clicks) * 100;
  const cpc = cost / clicks;
  const cpm = cost / (impressions / 1000);
  const cpa = cost / conversions;
  
  const result = {
    impressions,
    clicks,
    conversions,
    cost,
    ctr: ctr.toFixed(2) + '%',
    cvr: cvr.toFixed(2) + '%',
    cpc: '$' + cpc.toFixed(2),
    cpm: '$' + cpm.toFixed(2),
    cpa: '$' + cpa.toFixed(2),
    ctrAssessment: assessCTR(ctr),
    cvrAssessment: assessCVR(cvr),
    cpaAssessment: assessCPA(cpa)
  };
  
  if (revenue) {
    const roi = ((revenue - cost) / cost) * 100;
    result.revenue = revenue;
    result.roi = roi.toFixed(2) + '%';
    result.roiAssessment = assessROI(roi);
  }
  
  return result;
}

/**
 * A/B 测试对比
 */
function compareABTest(a, b) {
  const ctrDiff = a.ctr - b.ctr;
  const cvrDiff = a.cvr - b.cvr;
  
  const ctrPercentChange = ((a.ctr - b.ctr) / b.ctr) * 100;
  const cvrPercentChange = ((a.cvr - b.cvr) / b.cvr) * 100;
  
  return {
    variantA: a,
    variantB: b,
    ctrDifference: ctrDiff.toFixed(2) + '%',
    ctrPercentChange: ctrPercentChange.toFixed(2) + '%',
    cvrDifference: cvrDiff.toFixed(2) + '%',
    cvrPercentChange: cvrPercentChange.toFixed(2) + '%',
    recommendation: ctrPercentChange > 0 && cvrPercentChange > 0 ? 'Variant A 更优' : 
                   ctrPercentChange < 0 && cvrPercentChange < 0 ? 'Variant B 更优' : 
                   '需要更多数据'
  };
}

/**
 * 生成广告分析报告
 */
function generateReport(data) {
  const metrics = calculateMetrics(
    data.impressions,
    data.clicks,
    data.conversions,
    data.cost,
    data.revenue
  );
  
  const report = `📊 广告效果分析报告

【核心指标】
- CTR: ${metrics.ctr} ${metrics.ctrAssessment}
- CVR: ${metrics.cvr} ${metrics.cvrAssessment}
- CPC: ${metrics.cpc}
- CPA: ${metrics.cpa} ${metrics.cpaAssessment}
- ROI: ${metrics.roi || 'N/A'} ${metrics.roiAssessment || ''}

【投放概况】
- 总展示: ${data.impressions}
- 总点击: ${data.clicks}
- 总转化: ${data.conversions}
- 总成本: $${data.cost}
- 总收入: $${data.revenue || 'N/A'}

【行业基准对比】（美国市场）
- CTR 行业平均: 2-3%, 优秀: >5%
- CVR 行业平均: 3-5%, 优秀: >8%
- CPA 行业平均: $10-20, 优秀: <$5
- ROI 行业平均: 100-150%, 优秀: >200%

【建议】
${generateRecommendations(metrics)}

生成时间: ${new Date().toISOString()}
`;
  
  return {
    metrics,
    report,
    recommendations: generateRecommendations(metrics)
  };
}

/**
 * ROI 评估
 */
function assessROI(roi) {
  if (roi >= 200) return '✅✅ 优秀';
  if (roi >= 100) return '✅ 正常';
  if (roi >= 0) return '⚠️ 较低';
  return '❌ 亏损';
}

/**
 * CTR 评估
 */
function assessCTR(ctr) {
  if (ctr >= 5) return '✅ 优秀（高于行业平均）';
  if (ctr >= 2) return '✅ 正常';
  return '⚠️ 较低';
}

/**
 * CVR 评估
 */
function assessCVR(cvr) {
  if (cvr >= 8) return '✅ 优秀';
  if (cvr >= 3) return '✅ 正常';
  return '⚠️ 较低';
}

/**
 * CPA 评估
 */
function assessCPA(cpa) {
  if (cpa <= 5) return '✅ 优秀';
  if (cpa <= 20) return '✅ 正常';
  return '⚠️ 较高';
}

/**
 * 生成建议
 */
function generateRecommendations(metrics) {
  const recommendations = [];
  
  const ctr = parseFloat(metrics.ctr);
  const cvr = parseFloat(metrics.cvr);
  const cpa = parseFloat(metrics.cpa.replace('$', ''));
  
  if (ctr >= 5) {
    recommendations.push('• 点击率优秀，可扩大投放规模');
  } else if (ctr < 2) {
    recommendations.push('• 点击率偏低，建议优化广告素材');
  }
  
  if (cvr >= 8) {
    recommendations.push('• 转化率优秀，建议增加预算 20-30%');
  } else if (cvr < 3) {
    recommendations.push('• 转化率偏低，建议优化落地页');
  }
  
  if (cpa <= 5) {
    recommendations.push('• CPA 优秀，可尝试更激进的投放策略');
  } else if (cpa > 20) {
    recommendations.push('• CPA 较高，建议优化受众定位');
  }
  
  if (metrics.roi) {
    const roi = parseFloat(metrics.roi);
    if (roi >= 200) {
      recommendations.push('• ROI 优秀，建议大幅增加预算');
    } else if (roi >= 100) {
      recommendations.push('• ROI 正常，建议稳步扩大投放');
    } else if (roi < 0) {
      recommendations.push('• ❌ ROI 负值，建议暂停投放重新评估');
    }
  }
  
  return recommendations.join('\n');
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
      usage: 'basic | metrics | ab-test | report',
      examples: [
        'node roi-calculator.js basic --cost 1000 --revenue 3500',
        'node roi-calculator.js metrics --impressions 50000 --clicks 2500 --conversions 150 --cost 1200',
        'node roi-calculator.js report --data \'{"impressions":50000,"clicks":2500,"conversions":150,"cost":1200,"revenue":4500}\''
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'basic':
        const costArg = args.find(a => a.startsWith('--cost='));
        const revenueArg = args.find(a => a.startsWith('--revenue='));
        const cost = costArg ? parseFloat(costArg.split('=')[1]) : 0;
        const revenue = revenueArg ? parseFloat(revenueArg.split('=')[1]) : 0;
        result = calculateBasicROI(cost, revenue);
        break;
        
      case 'metrics':
        const impressions = parseFloat(args.find(a => a.startsWith('--impressions='))?.split('=')[1] || 0);
        const clicks = parseFloat(args.find(a => a.startsWith('--clicks='))?.split('=')[1] || 0);
        const conversions = parseFloat(args.find(a => a.startsWith('--conversions='))?.split('=')[1] || 0);
        const mCost = parseFloat(args.find(a => a.startsWith('--cost='))?.split('=')[1] || 0);
        const mRevenue = parseFloat(args.find(a => a.startsWith('--revenue='))?.split('=')[1] || 0);
        result = calculateMetrics(impressions, clicks, conversions, mCost, mRevenue);
        break;
        
      case 'ab-test':
        const aData = JSON.parse(args.find(a => a.startsWith('--a='))?.split('=')[1] || '{}');
        const bData = JSON.parse(args.find(a => a.startsWith('--b='))?.split('=')[1] || '{}');
        result = compareABTest(aData, bData);
        break;
        
      case 'report':
        const data = JSON.parse(args.find(a => a.startsWith('--data='))?.split('=')[1] || '{}');
        result = generateReport(data);
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
  calculateBasicROI,
  calculateMetrics,
  compareABTest,
  generateReport,
  assessROI,
  assessCTR,
  assessCVR,
  assessCPA
};

if (require.main === module) {
  main();
}