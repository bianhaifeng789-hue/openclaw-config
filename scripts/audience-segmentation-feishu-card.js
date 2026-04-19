#!/usr/bin/env node
/**
 * 受众分层分析飞书卡片生成器
 * 
 * 功能：
 * - 分析 Broad / Interest / Lookalike / Remarketing 表现
 * - 识别高价值人群包和低质量流量
 * - 给出定向优化建议
 * 
 * 用法：
 * node audience-segmentation-feishu-card.js audience-data.json
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

// 受众类型标签
const audienceLabels = {
  'broad': 'Broad（广泛定向）',
  'interest': 'Interest（兴趣包）',
  'lookalike': 'Lookalike（相似受众）',
  'remarketing': 'Remarketing（重定向）',
  'custom': 'Custom（自定义包）'
}

// 评估受众质量
function evaluateAudience(item) {
  const ctr = item.ctr || 0
  const cvr = item.cvr || 0
  const cpi = item.cpi || 0
  const roas = item.roas || 0
  const retention = item.retention || 0
  
  // 综合评分（权重可调）
  const score = (ctr * 10) + (cvr * 20) - (cpi / 10) + (roas * 30) + (retention * 20)
  
  // 分级
  if (score >= 15) return { grade: 'A', label: '🌟 高价值人群', action: '优先放量' }
  if (score >= 10) return { grade: 'B', label: '✅ 质量良好', action: '稳步投放' }
  if (score >= 5) return { grade: 'C', label: '⚠️ 质量一般', action: '控制预算' }
  return { grade: 'D', label: '❌ 低质量', action: '暂停或降权' }
}

function buildAudienceSegmentationCard(rows) {
  // 评估所有受众
  const evaluated = rows.map(item => ({
    ...item,
    evaluation: evaluateAudience(item),
    audienceLabel: audienceLabels[item.type] || item.type
  }))
  
  // 按评分排序
  const sorted = [...evaluated].sort((a, b) => {
    const gradeOrder = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 }
    return gradeOrder[b.evaluation.grade] - gradeOrder[a.evaluation.grade]
  })
  
  // 分组统计
  const gradeA = evaluated.filter(e => e.evaluation.grade === 'A')
  const gradeB = evaluated.filter(e => e.evaluation.grade === 'B')
  const gradeC = evaluated.filter(e => e.evaluation.grade === 'C')
  const gradeD = evaluated.filter(e => e.evaluation.grade === 'D')
  
  // 按类型统计
  const typeStats = {}
  evaluated.forEach(e => {
    const type = e.type || 'unknown'
    if (!typeStats[type]) {
      typeStats[type] = { count: 0, avgRoas: 0, avgCpi: 0 }
    }
    typeStats[type].count++
    typeStats[type].avgRoas += e.roas || 0
    typeStats[type].avgCpi += e.cpi || 0
  })
  
  // 计算类型平均值
  Object.keys(typeStats).forEach(type => {
    typeStats[type].avgRoas /= typeStats[type].count
    typeStats[type].avgCpi /= typeStats[type].count
  })
  
  // 卡片颜色
  const templateColor = gradeD.length > evaluated.length * 0.3 ? 'orange' : gradeA.length > 0 ? 'green' : 'blue'
  
  const elements = [
    // 概览
    { tag: 'markdown', content: `**受众包总数**：${rows.length}` },
    { tag: 'markdown', content: `**🌟 A级**：${gradeA.length} ｜ **✅ B级**：${gradeB.length} ｜ **⚠️ C级**：${gradeC.length} ｜ **❌ D级**：${gradeD.length}` },
    { tag: 'hr' },
    
    // 类型对比
    { tag: 'markdown', content: '**受众类型对比**' },
    ...Object.entries(typeStats).map(([type, stats]) => ({
      tag: 'markdown',
      content: `- ${audienceLabels[type] || type}: 平均 ROAS ${pct(stats.avgRoas)}, 平均 CPI ${money(stats.avgCpi)} (${stats.count} 个)`
    })),
    { tag: 'hr' },
    
    // 高价值人群
    ...(gradeA.length > 0 ? [
      { tag: 'markdown', content: '**🌟 高价值人群（建议优先放量）**' },
      ...gradeA.slice(0, 3).map(e => ({
        tag: 'markdown',
        content: `- ${e.name} (${e.audienceLabel}): ROAS ${pct(e.roas)}, CPI ${money(e.cpi)}`
      }))
    ] : []),
    
    // 低质量人群
    ...(gradeD.length > 0 ? [
      { tag: 'markdown', content: '**❌ 低质量人群（建议暂停）**' },
      ...gradeD.slice(0, 3).map(e => ({
        tag: 'markdown',
        content: `- ${e.name} (${e.audienceLabel}): ROAS ${pct(e.roas)}, CPI ${money(e.cpi)}`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 优化建议
    { tag: 'markdown', content: '**📌 定向优化建议**' },
    ...(gradeA.length > 0 ? [
      { tag: 'markdown', content: `- A级人群：加预算 20-30%，复制到其他 GEO` }
    ] : []),
    ...(typeStats.lookalike && typeStats.lookalike.avgRoas > 0.25 ? [
      { tag: 'markdown', content: `- Lookalike 表现好：可扩展到更大相似度（1%-5%）` }
    ] : []),
    ...(typeStats.remarketing && typeStats.remarketing.avgRoas > 0.3 ? [
      { tag: 'markdown', content: `- Remarketing 回收高：适合重定向转化` }
    ] : []),
    ...(gradeD.length > 0 ? [
      { tag: 'markdown', content: `- D级人群：暂停或降低权重` }
    ] : []),
    { tag: 'markdown', content: `- Broad 需强素材支持，Interest 需精简标签` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '受众分层分析' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('用法: node audience-segmentation-feishu-card.js <data.json|data.csv>')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    const card = buildAudienceSegmentationCard(rows)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildAudienceSegmentationCard, evaluateAudience }
if (require.main === module) main()