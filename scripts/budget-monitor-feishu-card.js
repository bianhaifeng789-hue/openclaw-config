#!/usr/bin/env node
/**
 * 预算监控飞书卡片生成器
 * 
 * 功能：
 * - 监控预算消耗
 * - 预警超支风险
 * - 给出调整建议
 * 
 * 用法：
 * node budget-monitor-feishu-card.js budget-data.json
 */

const fs = require('fs')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function money(v) {
  return `$${Number(v).toFixed(0)}`
}

function buildBudgetMonitorCard(data) {
  const dailyBudget = data.dailyBudget || 5000
  const monthlyBudget = data.monthlyBudget || 150000
  const consumedDaily = data.consumedDaily || 0
  const consumedMonthly = data.consumedMonthly || 0
  const platforms = data.platforms || []
  
  // 消耗百分比
  const dailyPercent = dailyBudget > 0 ? consumedDaily / dailyBudget : 0
  const monthlyPercent = monthlyBudget > 0 ? consumedMonthly / monthlyBudget : 0
  
  // 预警状态
  const dailyStatus = dailyPercent >= 1.0 ? '🚨 超支' : dailyPercent >= 0.8 ? '⚠️ 高消耗' : '✅ 正常'
  const monthlyStatus = monthlyPercent >= 1.0 ? '🚨 超支' : monthlyPercent >= 0.8 ? '⚠️ 高消耗' : '✅ 正常'
  
  // 超支平台
  const overBudgetPlatforms = platforms.filter(p => p.consumed > p.budget)
  const highConsumptionPlatforms = platforms.filter(p => p.consumed >= p.budget * 0.8 && p.consumed <= p.budget)
  
  // 卡片颜色
  const templateColor = dailyPercent >= 1.0 || monthlyPercent >= 1.0 ? 'red' : dailyPercent >= 0.8 ? 'orange' : 'green'
  
  const elements = [
    // 日预算
    { tag: 'markdown', content: '**日预算监控**' },
    { tag: 'markdown', content: `- 预算: ${money(dailyBudget)} ｜ 消耗: ${money(consumedDaily)} (${pct(dailyPercent)})` },
    { tag: 'markdown', content: `- ${dailyStatus}` },
    { tag: 'hr' },
    
    // 月预算
    { tag: 'markdown', content: '**月预算监控**' },
    { tag: 'markdown', content: `- 预算: ${money(monthlyBudget)} ｜ 消耗: ${money(consumedMonthly)} (${pct(monthlyPercent)})` },
    { tag: 'markdown', content: `- ${monthlyStatus}` },
    { tag: 'hr' },
    
    // 平台消耗
    { tag: 'markdown', content: '**平台消耗详情**' },
    ...platforms.slice(0, 6).map(p => {
      const percent = p.budget > 0 ? p.consumed / p.budget : 0
      const status = percent >= 1.0 ? '🚨' : percent >= 0.8 ? '⚠️' : '✅'
      return {
        tag: 'markdown',
        content: `- ${status} ${p.name}: ${money(p.consumed)}/${money(p.budget)} (${pct(percent)})`
      }
    }),
    { tag: 'hr' },
    
    // 预警
    ...(overBudgetPlatforms.length > 0 ? [
      { tag: 'markdown', content: '**🚨 超支平台（紧急处理）**' },
      ...overBudgetPlatforms.map(p => ({
        tag: 'markdown',
        content: `- ${p.name}: 超支 ${money(p.consumed - p.budget)} → 立即暂停或降预算`
      }))
    ] : []),
    ...(highConsumptionPlatforms.length > 0 ? [
      { tag: 'markdown', content: '**⚠️ 高消耗平台（关注）**' },
      ...highConsumptionPlatforms.map(p => ({
        tag: 'markdown',
        content: `- ${p.name}: 消耗 ${pct(p.consumed / p.budget)} → 密切监控`
      }))
    ] : []),
    { tag: 'hr' },
    
    // 建议
    { tag: 'markdown', content: '**📌 预算调整建议**' },
    ...(dailyPercent >= 1.0 ? [
      { tag: 'markdown', content: `- 日预算超支：暂停低ROI平台，释放预算给高ROI` }
    ] : dailyPercent >= 0.8 ? [
      { tag: 'markdown', content: `- 日消耗偏高：监控ROI，必要时降预算` }
    ] : [
      { tag: 'markdown', content: `- 日消耗正常：维持当前策略` }
    ]),
    { tag: 'markdown', content: `- 每日检查消耗，每周调整分配` },
    { tag: 'markdown', content: `- ROI 高平台优先保预算，ROI 低平台降预算` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '预算监控报告' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    const demoData = {
      dailyBudget: 5000,
      monthlyBudget: 150000,
      consumedDaily: 4200,
      consumedMonthly: 98000,
      platforms: [
        { name: 'TikTok', budget: 1500, consumed: 1400 },
        { name: 'Google Ads', budget: 1200, consumed: 950 },
        { name: 'Meta', budget: 1000, consumed: 850 },
        { name: 'Unity', budget: 800, consumed: 600 },
        { name: 'ironSource', budget: 500, consumed: 400 }
      ]
    }
    const card = buildBudgetMonitorCard(demoData)
    console.log(JSON.stringify(card, null, 2))
    return
  }
  
  try {
    const data = readJson(filePath)
    const card = buildBudgetMonitorCard(data)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildBudgetMonitorCard }
if (require.main === module) main()