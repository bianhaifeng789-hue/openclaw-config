#!/usr/bin/env node
/**
 * Ad Report Generator - 自动生成广告分析报告
 * 
 * 支持多种报告格式：
 *   - 日报（日报模板）
 *   - 周报（周报模板）
 *   - 自定义报告
 * 
 * Usage:
 *   node ad-report-generator.js daily --data '{"date":"2026-04-15","impressions":50000,"clicks":2500,"conversions":150,"cost":1200}'
 *   node ad-report-generator.js weekly --data '{"week":"W15","total_cost":8400,"total_revenue":28000}'
 *   node ad-report-generator.js custom --template report-template.json
 */

const fs = require('fs');
const path = require('path');

/**
 * 生成日报
 */
function generateDailyReport(data) {
  const date = data.date || new Date().toISOString().split('T')[0];
  
  // 计算指标
  const ctr = data.clicks && data.impressions ? ((data.clicks / data.impressions) * 100).toFixed(2) : 'N/A';
  const cvr = data.conversions && data.clicks ? ((data.conversions / data.clicks) * 100).toFixed(2) : 'N/A';
  const cpc = data.cost && data.clicks ? (data.cost / data.clicks).toFixed(2) : 'N/A';
  const cpa = data.cost && data.conversions ? (data.cost / data.conversions).toFixed(2) : 'N/A';
  const roi = data.revenue && data.cost ? (((data.revenue - data.cost) / data.cost) * 100).toFixed(1) : 'N/A';
  
  // 生成报告
  const report = `## 广告日报 - ${date}

### 投放概况
- 总展示: ${data.impressions || 'N/A'}
- 总点击: ${data.clicks || 'N/A'}
- 总转化: ${data.conversions || 'N/A'}
- 总成本: $${data.cost || 'N/A'}

### 效果指标
- CTR: ${ctr}%
- CVR: ${cvr}%
- CPA: $${cpa}
- ROI: ${roi}%

### 异常预警
${generateWarnings(ctr, cvr, cpa, roi)}

### 明日建议
${generateDailyRecommendations(ctr, cvr, cpa, roi)}

---
生成时间: ${new Date().toISOString()}
`;

  return {
    date,
    metrics: { ctr, cvr, cpc, cpa, roi },
    report,
    warnings: generateWarnings(ctr, cvr, cpa, roi),
    recommendations: generateDailyRecommendations(ctr, cvr, cpa, roi)
  };
}

/**
 * 生成周报
 */
function generateWeeklyReport(data) {
  const week = data.week || 'W' + Math.ceil(new Date().getDate() / 7);
  
  const totalCost = data.total_cost || 0;
  const totalRevenue = data.total_revenue || 0;
  const roi = totalRevenue && totalCost ? (((totalRevenue - totalCost) / totalCost) * 100).toFixed(1) : 'N/A';
  
  // 趋势分析（如果有 daily_breakdown）
  let trendAnalysis = '';
  if (data.daily_breakdown && data.daily_breakdown.length > 0) {
    const ctrTrend = analyzeTrend(data.daily_breakdown.map(d => d.ctr));
    const cvrTrend = analyzeTrend(data.daily_breakdown.map(d => d.cvr));
    trendAnalysis = `- CTR 趋势: ${ctrTrend}\n- CVR 趋势: ${cvrTrend}`;
  } else {
    trendAnalysis = '- 数据未提供趋势分析';
  }
  
  // Top 表现广告（如果有 ad_breakdown）
  let topAds = '';
  if (data.ad_breakdown && data.ad_breakdown.length > 0) {
    const sortedAds = data.ad_breakdown.sort((a, b) => (b.roi || 0) - (a.roi || 0));
    topAds = sortedAds.slice(0, 3).map((ad, i) => `${i + 1}. ${ad.name} - ROI: ${(ad.roi || 0).toFixed(1)}%`).join('\n');
  } else {
    topAds = '1. 数据未提供\n2. 数据未提供\n3. 数据未提供';
  }
  
  const report = `## 广告周报 - ${week}

### 本周概况
- 总成本: $${totalCost}
- 总收入: $${totalRevenue}
- ROI: ${roi}%

### 趋势分析
${trendAnalysis}

### Top 表现广告
${topAds}

### 下周计划
${generateWeeklyRecommendations(roi)}

---
生成时间: ${new Date().toISOString()}
`;

  return {
    week,
    totalCost,
    totalRevenue,
    roi,
    report,
    trendAnalysis,
    topAds,
    recommendations: generateWeeklyRecommendations(roi)
  };
}

/**
 * 生成自定义报告
 */
function generateCustomReport(template, data) {
  // 根据 template 生成报告
  let report = template.title || '自定义报告';
  
  for (const section of template.sections || []) {
    report += `\n\n### ${section.name}\n`;
    
    for (const field of section.fields || []) {
      const value = data[field.key] || field.default || 'N/A';
      report += `- ${field.label}: ${value}\n`;
    }
  }
  
  return {
    report,
    template: template.title,
    generatedAt: new Date().toISOString()
  };
}

/**
 * 生成异常预警
 */
function generateWarnings(ctr, cvr, cpa, roi) {
  const warnings = [];
  
  const ctrNum = parseFloat(ctr);
  const cvrNum = parseFloat(cvr);
  const cpaNum = parseFloat(cpa);
  const roiNum = parseFloat(roi);
  
  if (ctrNum < 2) warnings.push('⚠️ CTR 偏低 (< 2%)');
  if (cvrNum < 3) warnings.push('⚠️ CVR 偏低 (< 3%)');
  if (cpaNum > 20) warnings.push('⚠️ CPA 过高 (> $20)');
  if (roiNum < 0) warnings.push('❌ ROI 负值，建议暂停投放');
  
  return warnings.length > 0 ? warnings.join('\n') : '✅ 无异常';
}

/**
 * 生成日报建议
 */
function generateDailyRecommendations(ctr, cvr, cpa, roi) {
  const recommendations = [];
  
  const ctrNum = parseFloat(ctr);
  const cvrNum = parseFloat(cvr);
  const cpaNum = parseFloat(cpa);
  const roiNum = parseFloat(roi);
  
  if (ctrNum >= 5) {
    recommendations.push('• 点击率优秀，扩大投放规模');
  } else if (ctrNum < 2) {
    recommendations.push('• 优化广告素材，提升点击率');
  }
  
  if (cvrNum >= 8) {
    recommendations.push('• 转化率优秀，增加预算');
  } else if (cvrNum < 3) {
    recommendations.push('• 优化落地页，提升转化率');
  }
  
  if (roiNum >= 200) {
    recommendations.push('• ROI 优秀，建议增加预算 20-30%');
  } else if (roiNum < 0) {
    recommendations.push('• 建议暂停投放，重新评估');
  }
  
  return recommendations.length > 0 ? recommendations.join('\n') : '• 继续保持当前投放策略';
}

/**
 * 生成周报建议
 */
function generateWeeklyRecommendations(roi) {
  const roiNum = parseFloat(roi);
  
  if (roiNum >= 200) {
    return '• ROI 优秀，下周建议增加预算 20%\n• 尝试新的受众细分\n• 测试新广告素材';
  } else if (roiNum >= 100) {
    return '• ROI 正常，下周稳步投放\n• 关注低效广告优化\n• 测试小幅调整';
  } else if (roiNum >= 0) {
    return '• ROI 较低，下周优化投放策略\n• 暂停低效广告\n• 重新评估受众定位';
  } else {
    return '• ROI 负值，下周暂停部分投放\n• 深度分析失败原因\n• 调整投放策略';
  }
}

/**
 * 分析趋势
 */
function analyzeTrend(values) {
  if (!values || values.length < 2) return '数据不足';
  
  const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
  if (numericValues.length < 2) return '数据不足';
  
  const first = numericValues[0];
  const last = numericValues[numericValues.length - 1];
  const change = ((last - first) / first) * 100;
  
  if (change > 10) return `📈 上升 ${(change).toFixed(1)}%`;
  if (change < -10) return `📉 下降 ${(Math.abs(change)).toFixed(1)}%`;
  return `➡️ 稳定 (${change.toFixed(1)}%)`;
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
      usage: 'daily | weekly | custom',
      examples: [
        'node ad-report-generator.js daily --data \'{"date":"2026-04-15","impressions":50000,"clicks":2500}\'',
        'node ad-report-generator.js weekly --data \'{"week":"W15","total_cost":8400,"total_revenue":28000}\''
      ]
    }));
    return;
  }
  
  try {
    let result;
    
    switch (command) {
      case 'daily':
        const dailyData = JSON.parse(args.find(a => a.startsWith('--data='))?.split('=')[1] || '{}');
        result = generateDailyReport(dailyData);
        break;
        
      case 'weekly':
        const weeklyData = JSON.parse(args.find(a => a.startsWith('--data='))?.split('=')[1] || '{}');
        result = generateWeeklyReport(weeklyData);
        break;
        
      case 'custom':
        const templatePath = args.find(a => a.startsWith('--template='))?.split('=')[1];
        const customData = JSON.parse(args.find(a => a.startsWith('--data='))?.split('=')[1] || '{}');
        
        if (!templatePath) {
          result = { error: '需提供模板文件路径' };
        } else {
          const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
          result = generateCustomReport(template, customData);
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
  generateDailyReport,
  generateWeeklyReport,
  generateCustomReport,
  generateWarnings,
  generateDailyRecommendations,
  generateWeeklyRecommendations
};

if (require.main === module) {
  main();
}