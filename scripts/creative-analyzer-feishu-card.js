#!/usr/bin/env node
/**
 * 创意表现分析飞书卡片生成器
 * 
 * 功能：
 * - 分析素材表现（CTR、CVR、CPI、ROAS）
 * - 检测疲劳素材
 * - 给出放量/停量建议
 * - 输出飞书卡片 JSON
 * 
 * 用法：
 * node creative-analyzer-feishu-card.js creative-data.json
 */

const fs = require('fs')
const path = require('path')

// ===== 数据读取 =====

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

// ===== 分析函数 =====

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function money(v) {
  return `$${Number(v).toFixed(2)}`
}

// 判断素材状态
function classifyCreative(item) {
  const roas = item.roas || 0
  const ctr = item.ctr || 0
  const impressions = item.impressions || 0
  
  // 疲劳检测：展示超过 50k 且 CTR < 1%
  const isFatigued = impressions > 50000 && ctr < 0.01
  
  // 表现分级
  if (roas >= 0.35) return { status: 'star', label: '🌟 星级素材', action: '加量 20-30%' }
  if (roas >= 0.25) return { status: 'good', label: '✅ 表现良好', action: '维持或加量 10%' }
  if (roas >= 0.15) return { status: 'average', label: '⚠️ 表现一般', action: '观察或降量' }
  if (isFatigued) return { status: 'fatigued', label: '🔴 疲劳素材', action: '暂停或迭代' }
  return { status: 'weak', label: '❌ 表现不佳', action: '暂停' }
}

// ===== 飞书卡片构建 =====

function buildCreativeAnalysisCard(rows) {
  // 按表现分级
  const classified = rows.map(item => ({
    ...item,
    classification: classifyCreative(item)
  }))
  
  // 汇总统计
  const totalSpend = rows.reduce((a, b) => a + (Number(b.spend) || 0), 0)
  const totalInstalls = rows.reduce((a, b) => a + (Number(b.installs) || 0), 0)
  const avgCtr = rows.reduce((a, b) => a + (Number(b.ctr) || 0), 0) / rows.length
  const avgRoas = rows.reduce((a, b) => a + (Number(b.roas) || 0), 0) / rows.length
  
  // 分组
  const stars = classified.filter(c => c.classification.status === 'star')
  const goods = classified.filter(c => c.classification.status === 'good')
  const fatigueds = classified.filter(c => c.classification.status === 'fatigued')
  const weaks = classified.filter(c => c.classification.status === 'weak')
  
  // 卡片颜色
  const hasStars = stars.length > 0
  const hasFatigueds = fatigueds.length > 0
  const templateColor = hasStars ? 'green' : hasFatigueds ? 'orange' : 'blue'
  
  const elements = [
    // 汇总
    { tag: 'markdown', content: `**总花费**：${money(totalSpend)} ｜ **总安装**：${totalInstalls}` },
    { tag: 'markdown', content: `**平均 CTR**：${pct(avgCtr)} ｜ **平均 ROAS**：${pct(avgRoas)}` },
    { tag: 'hr' },
    
    // 星级素材
    ...(stars.length > 0 ? [
      { tag: 'markdown', content: '**🌟 星级素材（建议加量 20-30%）**' },
      ...stars.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.name}: ROAS ${pct(c.roas)}, CTR ${pct(c.ctr)}, Impressions ${c.impressions}`
      }))
    ] : []),
    
    // 表现良好
    ...(goods.length > 0 ? [
      { tag: 'markdown', content: '**✅ 表现良好（建议加量 10%）**' },
      ...goods.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.name}: ROAS ${pct(c.roas)}, CTR ${pct(c.ctr)}`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 疲劳素材
    ...(fatigueds.length > 0 ? [
      { tag: 'markdown', content: '**🔴 疲劳素材（建议暂停或迭代）**' },
      ...fatigueds.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.name}: Impressions ${c.impressions}, CTR ${pct(c.ctr)} ← 展示过多，CTR下滑`
      }))
    ] : []),
    
    // 表现不佳
    ...(weaks.length > 0 ? [
      { tag: 'markdown', content: '**❌ 表现不佳（建议暂停）**' },
      ...weaks.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.name}: ROAS ${pct(c.roas)}, CPI ${money(c.cpi)}`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 建议
    { tag: 'markdown', content: '**📌 操作建议**' },
    { tag: 'markdown', content: '- 星级素材：复制变体测试，加预算 20-30%' },
    { tag: 'markdown', content: '- 疲劳素材：暂停，用新版本替代' },
    { tag: 'markdown', content: '- 表现不佳：停掉，释放预算给星级素材' }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '创意表现分析' },
      template: templateColor
    },
    elements
  }
}

// ===== 主函数 =====

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('用法: node creative-analyzer-feishu-card.js <data.json|data.csv>')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    
    if (!Array.isArray(rows) || rows.length === 0) {
      console.error('数据必须是非空数组')
      process.exit(1)
    }
    
    const card = buildCreativeAnalysisCard(rows)
    console.log(JSON.stringify(card, null, 2))
    
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildCreativeAnalysisCard, classifyCreative }
if (require.main === module) main()