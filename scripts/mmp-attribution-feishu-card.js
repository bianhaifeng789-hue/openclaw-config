#!/usr/bin/env node
/**
 * MMP 归因检查飞书卡片生成器
 * 
 * 功能：
 * - 检查平台 vs MMP 数据差异
 * - 分析归因偏差和回传问题
 * - 输出对账结果和建议
 * 
 * 用法：
 * node mmp-attribution-feishu-card.js attribution-data.json
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

// 归因偏差检测
function checkAttributionGap(item) {
  const platformInstalls = item.platform_installs || 0
  const mmpInstalls = item.mmp_installs || 0
  const platformEvents = item.platform_events || 0
  const mmpEvents = item.mmp_events || 0
  
  const installGap = platformInstalls > 0 ? (platformInstalls - mmpInstalls) / platformInstalls : 0
  const eventGap = platformEvents > 0 ? (platformEvents - mmpEvents) / platformEvents : 0
  
  const issues = []
  
  // Install 差异 > 15%
  if (Math.abs(installGap) > 0.15) {
    issues.push({
      type: 'install_gap',
      severity: Math.abs(installGap) > 0.3 ? 'high' : 'medium',
      detail: `Install 差异 ${pct(Math.abs(installGap))}（平台 ${platformInstalls} vs MMP ${mmpInstalls})`
    })
  }
  
  // Event 差异 > 20%
  if (Math.abs(eventGap) > 0.2) {
    issues.push({
      type: 'event_gap',
      severity: Math.abs(eventGap) > 0.4 ? 'high' : 'medium',
      detail: `Event 差异 ${pct(Math.abs(eventGap))}（平台 ${platformEvents} vs MMP ${mmpEvents})`
    })
  }
  
  // 判断整体状态
  const highIssues = issues.filter(i => i.severity === 'high')
  const mediumIssues = issues.filter(i => i.severity === 'medium')
  
  if (highIssues.length >= 2) return { status: 'critical', label: '🚨 严重偏差', issues, action: '立即核查' }
  if (highIssues.length >= 1) return { status: 'warning', label: '⚠️ 明显偏差', issues, action: '优先对账' }
  if (mediumIssues.length >= 1) return { status: 'attention', label: '⚡ 轻微偏差', issues, action: '观察复核' }
  return { status: 'normal', label: '✅ 归因正常', issues: [], action: '无需处理' }
}

function buildMmpAttributionCard(rows) {
  // 检查所有数据源
  const checked = rows.map(item => ({
    ...item,
    check: checkAttributionGap(item)
  }))
  
  // 按状态排序
  const statusOrder = { 'critical': 4, 'warning': 3, 'attention': 2, 'normal': 1 }
  const sorted = [...checked].sort((a, b) => statusOrder[b.check.status] - statusOrder[a.check.status])
  
  // 分组统计
  const critical = checked.filter(c => c.check.status === 'critical')
  const warning = checked.filter(c => c.check.status === 'warning')
  const attention = checked.filter(c => c.check.status === 'attention')
  const normal = checked.filter(c => c.check.status === 'normal')
  
  // 统计偏差类型
  const issueTypes = {}
  checked.forEach(c => {
    c.check.issues.forEach(i => {
      issueTypes[i.type] = (issueTypes[i.type] || 0) + 1
    })
  })
  
  // 卡片颜色
  const templateColor = critical.length > 0 ? 'red' : warning.length > 0 ? 'orange' : 'blue'
  
  const elements = [
    // 概览
    { tag: 'markdown', content: `**检查数据源数**：${rows.length}` },
    { tag: 'markdown', content: `**🚨 严重**：${critical.length} ｜ **⚠️ 明显**：${warning.length} ｜ **⚡ 轻微**：${attention.length} ｜ **✅ 正常**：${normal.length}` },
    { tag: 'hr' },
    
    // 偏差类型分布
    ...(Object.keys(issueTypes).length > 0 ? [
      { tag: 'markdown', content: '**偏差类型分布**' },
      ...Object.entries(issueTypes).map(([type, count]) => ({
        tag: 'markdown',
        content: `- ${type}: ${count} 个数据源`
      })),
      { tag: 'hr' }
    ] : []),
    
    // 严重偏差
    ...(critical.length > 0 ? [
      { tag: 'markdown', content: '**🚨 严重偏差（建议立即核查）**' },
      ...critical.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.source || c.name}: ${c.check.issues[0]?.detail}`
      }))
    ] : []),
    
    // 明显偏差
    ...(warning.length > 0 ? [
      { tag: 'markdown', content: '**⚠️ 明显偏差（建议优先对账）**' },
      ...warning.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.source || c.name}: ${c.check.issues[0]?.detail}`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 对账建议
    { tag: 'markdown', content: '**📌 对账建议**' },
    ...(critical.length + warning.length > 0 ? [
      { tag: 'markdown', content: `- 检查 postback 开关和 partner 配置` },
      { tag: 'markdown', content: `- 对齐 attribution window 口径` },
      { tag: 'markdown', content: `- 核对 event mapping 是否完整` },
      { tag: 'markdown', content: `- 检查是否有数据延迟或批处理影响` }
    ] : [
      { tag: 'markdown', content: `- 归因链路正常，无需处理` }
    ]),
    { tag: 'markdown', content: `- SKAN / iOS 需额外检查 CV 映射` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: 'MMP 归因检查' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('用法: node mmp-attribution-feishu-card.js <data.json|data.csv>')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    const card = buildMmpAttributionCard(rows)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildMmpAttributionCard, checkAttributionGap }
if (require.main === module) main()