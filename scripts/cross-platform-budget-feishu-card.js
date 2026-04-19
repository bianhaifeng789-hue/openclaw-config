#!/usr/bin/env node
/**
 * 多平台预算分配飞书卡片生成器
 * 
 * 功能：
 * - 对 TikTok / Meta / Google / Unity / ironSource 等平台做横向比较
 * - 根据成本、回收、质量给出预算倾斜建议
 * - 输出下周预算结构建议
 * 
 * 用法：
 * node cross-platform-budget-feishu-card.js platform-data.json
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

// 平台标签
const platformLabels = {
  'tiktok': 'TikTok',
  'meta': 'Meta (FB/IG)',
  'google': 'Google (UAC)',
  'unity': 'Unity Ads',
  'ironsource': 'ironSource',
  'applovin': 'AppLovin',
  'mintegral': 'Mintegral',
  'pangle': 'Pangle'
}

// 评估平台优先级
function evaluatePlatform(item) {
  const roas = item.roas || 0
  const cpi = item.cpi || 0
  const spend = item.spend || 0
  const installs = item.installs || 0
  const retention = item.retention || 0
  const scale = item.scale || installs // 放量空间
  
  // 综合评分
  const roasScore = roas * 40 // ROAS 权重最高
  const cpiScore = Math.max(0, 10 - cpi) // CPI 越低越好
  const scaleScore = Math.min(scale / 1000, 10) // 放量空间
  const retentionScore = retention * 20
  
  const totalScore = roasScore + cpiScore + scaleScore + retentionScore
  
  // 分级
  if (totalScore >= 25) return { priority: 'P1', label: '🚀 优先放量', action: '+20~30%', reason: 'ROAS + CPI + 放量空间 全优' }
  if (totalScore >= 18) return { priority: 'P2', label: '📈 稳步加量', action: '+10~15%', reason: '回收稳定，有放量空间' }
  if (totalScore >= 12) return { priority: 'P3', label: '➡️ 维持预算', action: '0%', reason: '表现一般，观望' }
  if (totalScore >= 6) return { priority: 'P4', label: '🔻 降低预算', action: '-10~20%', reason: '回收或成本偏弱' }
  return { priority: 'P5', label: '⏸️ 保留测试', action: '测试预算', reason: '只适合小预算探索' }
}

function buildCrossPlatformBudgetCard(rows, totalBudget = 5000) {
  // 评估所有平台
  const evaluated = rows.map(item => ({
    ...item,
    evaluation: evaluatePlatform(item),
    platformLabel: platformLabels[item.platform] || item.platform
  }))
  
  // 按优先级排序
  const priorityOrder = { 'P1': 5, 'P2': 4, 'P3': 3, 'P4': 2, 'P5': 1 }
  const sorted = [...evaluated].sort((a, b) => priorityOrder[b.evaluation.priority] - priorityOrder[a.evaluation.priority])
  
  // 分组统计
  const p1 = evaluated.filter(e => e.evaluation.priority === 'P1')
  const p2 = evaluated.filter(e => e.evaluation.priority === 'P2')
  const p3 = evaluated.filter(e => e.evaluation.priority === 'P3')
  const p4 = evaluated.filter(e => e.evaluation.priority === 'P4')
  const p5 = evaluated.filter(e => e.evaluation.priority === 'P5')
  
  // 当前预算分布
  const currentBudget = {}
  evaluated.forEach(e => {
    currentBudget[e.platform] = e.spend || 0
  })
  
  // 建议预算分配（按优先级分配）
  const suggestedBudget = {}
  let remainingBudget = totalBudget
  
  // P1: 优先分配（30-40%）
  const p1Ratio = 0.35
  if (p1.length > 0) {
    const p1Total = totalBudget * p1Ratio
    p1.forEach(e => {
      suggestedBudget[e.platform] = Math.round(p1Total / p1.length)
    })
    remainingBudget -= p1Total
  }
  
  // P2: 稳步分配（25-30%）
  const p2Ratio = 0.25
  if (p2.length > 0) {
    const p2Total = totalBudget * p2Ratio
    p2.forEach(e => {
      suggestedBudget[e.platform] = Math.round(p2Total / p2.length)
    })
    remainingBudget -= p2Total
  }
  
  // P3: 维持（20%）
  const p3Ratio = 0.20
  if (p3.length > 0) {
    const p3Total = totalBudget * p3Ratio
    p3.forEach(e => {
      suggestedBudget[e.platform] = Math.round(p3Total / p3.length)
    })
    remainingBudget -= p3Total
  }
  
  // P4: 降低（10%）
  const p4Ratio = 0.10
  if (p4.length > 0) {
    const p4Total = totalBudget * p4Ratio
    p4.forEach(e => {
      suggestedBudget[e.platform] = Math.round(p4Total / p4.length)
    })
    remainingBudget -= p4Total
  }
  
  // P5: 测试预算（剩余）
  if (p5.length > 0) {
    p5.forEach(e => {
      suggestedBudget[e.platform] = Math.round(remainingBudget / p5.length)
    })
  }
  
  // 卡片颜色
  const templateColor = p1.length > 0 ? 'green' : p4.length + p5.length > evaluated.length * 0.5 ? 'orange' : 'blue'
  
  const elements = [
    // 概览
    { tag: 'markdown', content: `**总预算**：${money(totalBudget)} ｜ **平台数**：${rows.length}` },
    { tag: 'markdown', content: `**🚀 P1**：${p1.length} ｜ **📈 P2**：${p2.length} ｜ **➡️ P3**：${p3.length} ｜ **🔻 P4**：${p4.length} ｜ **⏸️ P5**：${p5.length}` },
    { tag: 'hr' },
    
    // 平台横向对比
    { tag: 'markdown', content: '**平台横向对比**' },
    ...sorted.map(e => ({
      tag: 'markdown',
      content: `- ${e.platformLabel}: ROAS ${pct(e.roas)}, CPI ${money(e.cpi)}, Scale ${e.installs || 0} → ${e.evaluation.label}`
    })),
    { tag: 'hr' },
    
    // 优先放量平台
    ...(p1.length > 0 ? [
      { tag: 'markdown', content: '**🚀 优先放量平台**' },
      ...p1.map(e => ({
        tag: 'markdown',
        content: `- ${e.platformLabel}: ${e.evaluation.reason} → 建议 +20~30%`
      }))
    ] : []),
    
    // 降低预算平台
    ...(p4.length > 0 ? [
      { tag: 'markdown', content: '**🔻 降低预算平台**' },
      ...p4.slice(0, 2).map(e => ({
        tag: 'markdown',
        content: `- ${e.platformLabel}: ROAS ${pct(e.roas)} 偏弱 → 建议 -10~20%`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 下周预算建议
    { tag: 'markdown', content: '**📌 下周预算结构建议**' },
    ...Object.entries(suggestedBudget).map(([platform, budget]) => ({
      tag: 'markdown',
      content: `- ${platformLabels[platform] || platform}: ${money(budget)} (${pct(budget / totalBudget)})`
    })),
    { tag: 'markdown', content: `→ 总计：${money(totalBudget)}` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '多平台预算分配建议' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  const totalBudget = parseFloat(process.argv[3]) || 5000
  
  if (!filePath) {
    console.error('用法: node cross-platform-budget-feishu-card.js <data.json|data.csv> [totalBudget]')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    const card = buildCrossPlatformBudgetCard(rows, totalBudget)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildCrossPlatformBudgetCard, evaluatePlatform }
if (require.main === module) main()