#!/usr/bin/env node
/**
 * 出价预算规则飞书卡片生成器
 * 
 * 功能：
 * - 根据 CPI / ROAS / 留存等指标生成停量/放量建议
 * - 输出强制暂停、保守观察、小步放量、强势放量规则
 * 
 * 用法：
 * node auto-bid-budget-feishu-card.js campaign-data.json [targetCpi] [minRoas]
 */

const fs = require('fs')
const path = require('path')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function readCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const row = {}
    headers.forEach((h, i) => {
      const val = values[i]?.trim() || ''
      row[h] = isNaN(Number(val)) ? val : Number(val)
    })
    return row
  })
}

function readData(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.json') return readJson(filePath)
  if (ext === '.csv') return readCsv(filePath)
  throw new Error(`Unsupported format: ${ext}`)
}

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function money(v) {
  return `$${Number(v).toFixed(2)}`
}

// 出价预算规则判断
function applyBidBudgetRules(item, config = {}) {
  const spend = item.spend || 0
  const installs = item.installs || 0
  const cpi = item.cpi || (installs > 0 ? spend / installs : 0)
  const roas = item.roas || 0
  const ctr = item.ctr || 0
  const retention = item.retention || 0
  
  const targetCpi = config.targetCpi || 4.0
  const minRoas = config.minRoas || 0.15
  const targetCpa = config.targetCpa || targetCpi
  
  // 强制暂停规则
  // 1. 消耗 > 3x 目标 CPA，无转化
  if (spend > targetCpa * 3 && installs === 0) {
    return { rule: 'pause', label: '🛑 强制暂停', reason: `消耗 ${money(spend)} > 3x 目标，无转化`, action: '立即暂停' }
  }
  
  // 2. CTR 明显低于均值 30%+
  if (ctr < config.avgCtr * 0.7 && config.avgCtr > 0) {
    return { rule: 'pause', label: '🛑 强制暂停', reason: `CTR ${pct(ctr)} 明显低于均值`, action: '暂停或换素材' }
  }
  
  // 3. CPI 高于目标 30%+ 且无改善
  if (cpi > targetCpi * 1.3 && roas < minRoas) {
    return { rule: 'pause', label: '🛑 强制暂停', reason: `CPI ${money(cpi)} > 目标 30%+, ROAS ${pct(roas)} 低`, action: '暂停' }
  }
  
  // 4. D1 ROAS 明显低于底线
  if (roas < minRoas * 0.5 && spend > 50) {
    return { rule: 'pause', label: '🛑 强制暂停', reason: `ROAS ${pct(roas)} 远低于底线`, action: '暂停' }
  }
  
  // 保守观察规则
  // 1. 展示/点击不足
  if ((item.impressions || 0) < 10000 || (item.clicks || 0) < 100) {
    return { rule: 'observe', label: '⏳ 保守观察', reason: '样本量不足', action: '维持，不调整' }
  }
  
  // 2. 新素材上线未满 24h
  if (item.isNew && (item.hours || 0) < 24) {
    return { rule: 'observe', label: '⏳ 保守观察', reason: '新素材未满 24h', action: '继续观察' }
  }
  
  // 小步放量规则
  // 1. 转化量达标 + CPI 低于目标 + ROAS 正常
  if (installs >= 10 && cpi <= targetCpi && roas >= minRoas) {
    return { rule: 'scale_small', label: '📈 小步放量', reason: `CPI ${money(cpi)} 达标，ROAS ${pct(roas)} 正常`, action: '+10~15%' }
  }
  
  // 强势放量规则
  // 1. ROAS 持续领先 + 留存好 + 稳定
  if (installs >= 20 && roas >= minRoas * 1.5 && retention >= 0.35) {
    return { rule: 'scale_large', label: '🚀 强势放量', reason: `ROAS ${pct(roas)} 领先，留存 ${pct(retention)} 好`, action: '+20~30%' }
  }
  
  // 降预算规则
  // 1. CPI 上升但未失控
  if (cpi > targetCpi && cpi <= targetCpi * 1.3 && roas >= minRoas * 0.7) {
    return { rule: 'reduce', label: '🔻 降低预算', reason: `CPI ${money(cpi)} 上升，ROAS ${pct(roas)} 下滑`, action: '-10~20%' }
  }
  
  // 默认：保守观察
  return { rule: 'observe', label: '⏳ 保守观察', reason: '数据正常但未达放量标准', action: '维持' }
}

function buildAutoBidBudgetCard(rows, config = {}) {
  // 计算组均值
  const avgCtr = rows.reduce((a, b) => a + (Number(b.ctr) || 0), 0) / rows.length
  config.avgCtr = avgCtr
  
  // 应用规则
  const ruled = rows.map(item => ({
    ...item,
    rule: applyBidBudgetRules(item, config)
  }))
  
  // 按规则排序
  const ruleOrder = { 'pause': 5, 'reduce': 4, 'observe': 3, 'scale_small': 2, 'scale_large': 1 }
  const sorted = [...ruled].sort((a, b) => ruleOrder[b.rule.rule] - ruleOrder[a.rule.rule])
  
  // 分组统计
  const pause = ruled.filter(r => r.rule.rule === 'pause')
  const reduce = ruled.filter(r => r.rule.rule === 'reduce')
  const observe = ruled.filter(r => r.rule.rule === 'observe')
  const scaleSmall = ruled.filter(r => r.rule.rule === 'scale_small')
  const scaleLarge = ruled.filter(r => r.rule.rule === 'scale_large')
  
  // 卡片颜色
  const templateColor = pause.length > 0 ? 'red' : scaleLarge.length > 0 ? 'green' : 'blue'
  
  const elements = [
    // 概览
    { tag: 'markdown', content: `**Campaign 数**：${rows.length} ｜ **目标 CPI**：${money(config.targetCpi)} ｜ **最低 ROAS**：${pct(config.minRoas)}` },
    { tag: 'markdown', content: `**🛑 暂停**：${pause.length} ｜ **🔻 降预算**：${reduce.length} ｜ **⏳ 观察**：${observe.length} ｜ **📈 小步放量**：${scaleSmall.length} ｜ **🚀 强势放量**：${scaleLarge.length}` },
    { tag: 'hr' },
    
    // 强制暂停
    ...(pause.length > 0 ? [
      { tag: 'markdown', content: '**🛑 强制暂停（建议立即执行）**' },
      ...pause.slice(0, 3).map(r => ({
        tag: 'markdown',
        content: `- ${r.name}: ${r.rule.reason} → ${r.rule.action}`
      }))
    ] : []),
    
    // 降低预算
    ...(reduce.length > 0 ? [
      { tag: 'markdown', content: '**🔻 降低预算**' },
      ...reduce.slice(0, 3).map(r => ({
        tag: 'markdown',
        content: `- ${r.name}: ${r.rule.reason} → ${r.rule.action}`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 强势放量
    ...(scaleLarge.length > 0 ? [
      { tag: 'markdown', content: '**🚀 强势放量**' },
      ...scaleLarge.slice(0, 3).map(r => ({
        tag: 'markdown',
        content: `- ${r.name}: ${r.rule.reason} → ${r.rule.action}`
      }))
    ] : []),
    
    // 小步放量
    ...(scaleSmall.length > 0 ? [
      { tag: 'markdown', content: '**📈 小步放量**' },
      ...scaleSmall.slice(0, 3).map(r => ({
        tag: 'markdown',
        content: `- ${r.name}: ${r.rule.reason} → ${r.rule.action}`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 规则说明
    { tag: 'markdown', content: '**📌 规则阈值**' },
    { tag: 'markdown', content: `- 暂停：消耗 > 3x CPA 无转化 / CPI > 目标 30% / ROAS < 底线 50%` },
    { tag: 'markdown', content: `- 放量：转化 ≥ 10 + CPI ≤ 目标 + ROAS ≥ 底线` },
    { tag: 'markdown', content: `- 强势放量：转化 ≥ 20 + ROAS ≥ 1.5x 底线 + 留存 ≥ 35%` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '出价预算规则建议' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  const targetCpi = parseFloat(process.argv[3]) || 4.0
  const minRoas = parseFloat(process.argv[4]) || 0.15
  
  if (!filePath) {
    console.error('用法: node auto-bid-budget-feishu-card.js <data.json|data.csv> [targetCpi] [minRoas]')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    const card = buildAutoBidBudgetCard(rows, { targetCpi, minRoas })
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildAutoBidBudgetCard, applyBidBudgetRules }
if (require.main === module) main()