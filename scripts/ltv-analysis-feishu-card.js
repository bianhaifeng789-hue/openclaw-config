#!/usr/bin/env node
/**
 * LTV 分析飞书卡片生成器
 * 
 * 功能：
 * - 计算 IAA LTV（基于 eCPM、展示次数、留存）
 * - 快速回收评估（D3/D7/D14/D30）
 * - 给出预算分配和 ARPU 优化建议
 * 
 * 用法：
 * node ltv-analysis-feishu-card.js --ecpm 8 --impressions 5 --d1 0.35 --d7 0.18
 */

function calculateCumulativeRetention(d1, decayRate, days) {
  let cumulative = 0
  for (let day = 0; day < days; day++) {
    cumulative += d1 * Math.pow(decayRate, day)
  }
  return cumulative
}

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function money(v) {
  return `$${Number(v).toFixed(3)}`
}

function calculateIAALTV(ecpm, dailyImpressions, d1Retention, d7Retention) {
  // 计算日 ARPU
  const dailyArpu = (ecpm / 1000) * dailyImpressions
  
  // 计算衰减率
  const decayRate = Math.pow(d7Retention / d1Retention, 1/7)
  
  // 计算不同周期的 LTV
  const ltv3 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 3)
  const ltv7 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 7)
  const ltv14 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 14)
  const ltv30 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 30)
  const ltv90 = dailyArpu * calculateCumulativeRetention(d1Retention, decayRate, 90)
  
  return { dailyArpu, decayRate, ltv3, ltv7, ltv14, ltv30, ltv90 }
}

function assessLTV(ltv7, ltv14, ltv30, dailyArpu, cpi) {
  // 回收周期评估
  const d7Payback = cpi > 0 ? ltv7 / cpi : 0
  const d14Payback = cpi > 0 ? ltv14 / cpi : 0
  const d30Payback = cpi > 0 ? ltv30 / cpi : 0
  
  // 回收等级
  if (d7Payback >= 1) {
    return { grade: 'A', label: '🚀 极快回收', payback: '7天内回本', action: '可大胆放量' }
  }
  if (d14Payback >= 1) {
    return { grade: 'B', label: '✅ 快速回收', payback: '14天内回本', action: '稳步放量' }
  }
  if (d30Payback >= 1) {
    return { grade: 'C', label: '⚠️ 正常回收', payback: '30天内回本', action: '保守测试' }
  }
  return { grade: 'D', label: '❌ 回收偏慢', payback: '超过30天', action: '暂停或优化' }
}

function buildLTVAnalysisCard(config) {
  const { ecpm, impressions, d1, d7, cpi } = config
  
  const result = calculateIAALTV(ecpm, impressions, d1, d7)
  const assessment = assessLTV(result.ltv7, result.ltv14, result.ltv30, result.dailyArpu, cpi)
  
  // 卡片颜色
  const templateColor = assessment.grade === 'A' ? 'green' : assessment.grade === 'D' ? 'orange' : 'blue'
  
  // 回收周期计算
  const d7Payback = cpi > 0 ? result.ltv7 / cpi : 0
  const d30Payback = cpi > 0 ? result.ltv30 / cpi : 0
  
  const elements = [
    // 输入参数
    { tag: 'markdown', content: '**输入参数**' },
    { tag: 'markdown', content: `- eCPM: ${money(ecpm)} ｜ 日均展示: ${impressions} 次` },
    { tag: 'markdown', content: `- D1 留存: ${pct(d1)} ｜ D7 留存: ${pct(d7)} ｜ CPI: ${money(cpi)}` },
    { tag: 'hr' },
    
    // LTV 结果
    { tag: 'markdown', content: '**LTV 计算结果**' },
    { tag: 'markdown', content: `- 日 ARPU: ${money(result.dailyArpu)} ｜ 衰减率: ${result.decayRate.toFixed(3)}` },
    { tag: 'markdown', content: `- D3 LTV: ${money(result.ltv3)} ｜ D7 LTV: ${money(result.ltv7)} ｜ D14 LTV: ${money(result.ltv14)}` },
    { tag: 'markdown', content: `- D30 LTV: ${money(result.ltv30)} ｜ D90 LTV: ${money(result.ltv90)}` },
    { tag: 'hr' },
    
    // 回收评估
    { tag: 'markdown', content: `**${assessment.label}**` },
    { tag: 'markdown', content: `- 回收周期: ${assessment.payback}` },
    { tag: 'markdown', content: `- D7 回收率: ${pct(d7Payback)} ｜ D30 回收率: ${pct(d30Payback)}` },
    { tag: 'hr' },
    
    // 建议
    { tag: 'markdown', content: '**📌 操作建议**' },
    { tag: 'markdown', content: `- ${assessment.action}` },
    ...(assessment.grade === 'A' ? [
      { tag: 'markdown', content: `- CPI ≤ LTV7 时可大胆放量，预算 +20~30%` }
    ] : []),
    ...(assessment.grade === 'B' ? [
      { tag: 'markdown', content: `- CPI ≤ LTV14 时稳步放量，预算 +10~15%` }
    ] : []),
    ...(assessment.grade === 'C' ? [
      { tag: 'markdown', content: `- CPI ≤ LTV30 时保守测试，预算维持` }
    ] : []),
    ...(assessment.grade === 'D' ? [
      { tag: 'markdown', content: `- CPI > LTV30 时暂停，优化留存或 eCPM` },
      { tag: 'markdown', content: `- 提升 D1 留存（目标 35%+）或增加展示次数` }
    ] : []),
    { tag: 'markdown', content: `- 优化方向：提升 D1 留存、增加人均展示、提高 eCPM` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: 'LTV 分析报告' },
      template: templateColor
    },
    elements
  }
}

function getArg(name, def) {
  const args = process.argv.slice(2)
  const index = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`))
  if (index === -1) return def
  const exact = args[index]
  if (exact.includes('=')) return parseFloat(exact.split('=').slice(1).join('='))
  return parseFloat(args[index + 1]) || def
}

function main() {
  const ecpm = getArg('ecpm', 8.0)
  const impressions = getArg('impressions', 5)
  const d1 = getArg('d1', 0.35)
  const d7 = getArg('d7', 0.18)
  const cpi = getArg('cpi', 0.5)
  
  const card = buildLTVAnalysisCard({ ecpm, impressions, d1, d7, cpi })
  console.log(JSON.stringify(card, null, 2))
}

module.exports = { buildLTVAnalysisCard, calculateIAALTV }
if (require.main === module) main()