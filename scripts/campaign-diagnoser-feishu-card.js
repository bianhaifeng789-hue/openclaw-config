#!/usr/bin/env node
/**
 * Campaign 诊断飞书卡片生成器
 * 
 * 功能：
 * - Campaign / Ad Set / Ad 三级诊断
 * - 定位问题（流量、创意、受众、落地页、回收）
 * - 输出飞书卡片 JSON
 * 
 * 用法：
 * node campaign-diagnoser-feishu-card.js campaign-data.json
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

// ===== 诊断函数 =====

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function money(v) {
  return `$${Number(v).toFixed(2)}`
}

// 诊断问题类型
function diagnoseCampaign(item) {
  const ctr = item.ctr || 0
  const cvr = item.cvr || 0
  const cpi = item.cpi || 0
  const roas = item.roas || 0
  
  const issues = []
  
  // CTR 低 → 流量问题
  if (ctr < 0.01) issues.push({ type: 'traffic', label: '流量问题', detail: `CTR ${pct(ctr)} < 1%` })
  
  // CVR 低 → 落地页问题
  if (cvr < 0.02) issues.push({ type: 'landing', label: '落地页问题', detail: `CVR ${pct(cvr)} < 2%` })
  
  // CPI 高 → 受众/创意问题
  if (cpi > 5) issues.push({ type: 'audience', label: '受众/创意问题', detail: `CPI ${money(cpi)} > $5` })
  
  // ROAS 低 → 回收问题
  if (roas < 0.15) issues.push({ type: 'monetization', label: '回收问题', detail: `ROAS ${pct(roas)} < 15%` })
  
  // 综合评级
  const severity = issues.length >= 3 ? 'critical' : issues.length >= 2 ? 'warning' : issues.length >= 1 ? 'attention' : 'healthy'
  
  return { issues, severity }
}

// ===== 飞书卡片构建 =====

function buildCampaignDiagnosisCard(rows) {
  // 诊断所有 campaign
  const diagnosed = rows.map(item => ({
    ...item,
    diagnosis: diagnoseCampaign(item)
  }))
  
  // 汇总
  const critical = diagnosed.filter(d => d.diagnosis.severity === 'critical')
  const warning = diagnosed.filter(d => d.diagnosis.severity === 'warning')
  const attention = diagnosed.filter(d => d.diagnosis.severity === 'attention')
  const healthy = diagnosed.filter(d => d.diagnosis.severity === 'healthy')
  
  // 统计问题类型
  const issueCounts = {}
  diagnosed.forEach(d => {
    d.diagnosis.issues.forEach(issue => {
      issueCounts[issue.type] = (issueCounts[issue.type] || 0) + 1
    })
  })
  
  // 卡片颜色
  const templateColor = critical.length > 0 ? 'red' : warning.length > 0 ? 'orange' : 'blue'
  
  const elements = [
    // 汇总
    { tag: 'markdown', content: `**诊断总数**：${rows.length} 个 Campaign` },
    { tag: 'markdown', content: `**严重问题**：${critical.length} ｜ **警告**：${warning.length} ｜ **需关注**：${attention.length} ｜ **健康**：${healthy.length}` },
    { tag: 'hr' },
    
    // 问题类型分布
    { tag: 'markdown', content: '**问题类型分布**' },
    ...(Object.entries(issueCounts).map(([type, count]) => ({
      tag: 'markdown',
      content: `- ${type}: ${count} 个`
    }))),
    { tag: 'hr' },
    
    // 严重问题详情
    ...(critical.length > 0 ? [
      { tag: 'markdown', content: '**🔴 严重问题 Campaign（建议立即处理）**' },
      ...critical.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.name}: ${c.diagnosis.issues.map(i => i.label).join(' + ')}`
      }))
    ] : []),
    
    // 警告详情
    ...(warning.length > 0 ? [
      { tag: 'markdown', content: '**⚠️ 警告 Campaign（建议观察）**' },
      ...warning.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.name}: ${c.diagnosis.issues.map(i => i.detail).join(' | ')}`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 建议动作
    { tag: 'markdown', content: '**📌 建议动作**' },
    ...(issueCounts.traffic ? [{ tag: 'markdown', content: '- 流量问题：检查受众定向，尝试新渠道' }] : []),
    ...(issueCounts.landing ? [{ tag: 'markdown', content: '- 落地页问题：优化加载速度，改进文案' }] : []),
    ...(issueCounts.audience ? [{ tag: 'markdown', content: '- 受众/创意问题：测试新素材，调整受众' }] : []),
    ...(issueCounts.monetization ? [{ tag: 'markdown', content: '- 回收问题：检查变现配置，优化广告位' }] : []),
    ...(healthy.length > 0 ? [{ tag: 'markdown', content: `- 健康 Campaign：维持或加预算（共 ${healthy.length} 个）` }] : [])
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: 'Campaign 诊断报告' },
      template: templateColor
    },
    elements
  }
}

// ===== 主函数 =====

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('用法: node campaign-diagnoser-feishu-card.js <data.json|data.csv>')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    
    if (!Array.isArray(rows) || rows.length === 0) {
      console.error('数据必须是非空数组')
      process.exit(1)
    }
    
    const card = buildCampaignDiagnosisCard(rows)
    console.log(JSON.stringify(card, null, 2))
    
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildCampaignDiagnosisCard, diagnoseCampaign }
if (require.main === module) main()