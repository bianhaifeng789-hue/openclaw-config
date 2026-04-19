#!/usr/bin/env node
/**
 * 流量异常与作弊风险检查飞书卡片生成器
 * 
 * 功能：
 * - 检测异常点击、异常安装、异常留存
 * - 识别可疑渠道和作弊风险
 * - 输出人工复核建议
 * 
 * 用法：
 * node fraud-risk-feishu-card.js traffic-data.json
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

// 作弊风险检测
function detectFraudRisk(item) {
  const ctr = item.ctr || 0
  const cvr = item.cvr || 0
  const installs = item.installs || 0
  const retention = item.retention || 0
  const roas = item.roas || 0
  const spend = item.spend || 0
  
  const risks = []
  
  // CTR 异常高但 CVR 极低 → 机刷点击
  if (ctr > 0.1 && cvr < 0.01) {
    risks.push({ type: 'click_fraud', severity: 'high', detail: `CTR ${pct(ctr)} 异常高，CVR ${pct(cvr)} 极低，疑似机刷点击` })
  }
  
  // 安装高但留存极差 → 机刷安装
  if (installs > 1000 && retention < 0.05) {
    risks.push({ type: 'install_fraud', severity: 'high', detail: `安装 ${installs} 但留存 ${pct(retention)} 极差，疑似机刷安装` })
  }
  
  // 短时间暴涨但 ROAS 很差 → 突然注入低质量流量
  if (spend > 500 && roas < 0.05) {
    risks.push({ type: 'traffic_dump', severity: 'medium', detail: `花费 ${money(spend)} 但 ROAS ${pct(roas)} 极差，疑似低质量流量注入` })
  }
  
  // CPI 极低但用户质量异常 → 便宜但假量
  const cpi = installs > 0 ? spend / installs : 0
  if (cpi < 0.5 && retention < 0.1) {
    risks.push({ type: 'cheap_fake', severity: 'medium', detail: `CPI ${money(cpi)} 极低但留存 ${pct(retention)} 差，疑似假量` })
  }
  
  // 判断总体风险等级
  const highRisks = risks.filter(r => r.severity === 'high')
  const mediumRisks = risks.filter(r => r.severity === 'medium')
  
  if (highRisks.length >= 2) return { level: 'critical', label: '🚨 高风险', risks, action: '立即暂停' }
  if (highRisks.length >= 1) return { level: 'high', label: '🔴 较高风险', risks, action: '暂停并复核' }
  if (mediumRisks.length >= 2) return { level: 'medium', label: '⚠️ 中等风险', risks, action: '降预算并观察' }
  if (risks.length >= 1) return { level: 'low', label: '⚡ 低风险', risks, action: '持续监控' }
  return { level: 'safe', label: '✅ 正常', risks: [], action: '正常投放' }
}

function buildFraudRiskCard(rows) {
  // 检测所有渠道
  const checked = rows.map(item => ({
    ...item,
    riskAssessment: detectFraudRisk(item)
  }))
  
  // 按风险排序
  const sorted = [...checked].sort((a, b) => {
    const levelOrder = { 'critical': 5, 'high': 4, 'medium': 3, 'low': 2, 'safe': 1 }
    return levelOrder[b.riskAssessment.level] - levelOrder[a.riskAssessment.level]
  })
  
  // 分组统计
  const critical = checked.filter(c => c.riskAssessment.level === 'critical')
  const high = checked.filter(c => c.riskAssessment.level === 'high')
  const medium = checked.filter(c => c.riskAssessment.level === 'medium')
  const low = checked.filter(c => c.riskAssessment.level === 'low')
  const safe = checked.filter(c => c.riskAssessment.level === 'safe')
  
  // 统计风险类型
  const riskTypeCounts = {}
  checked.forEach(c => {
    c.riskAssessment.risks.forEach(r => {
      riskTypeCounts[r.type] = (riskTypeCounts[r.type] || 0) + 1
    })
  })
  
  // 卡片颜色
  const templateColor = critical.length > 0 ? 'red' : high.length > 0 ? 'orange' : 'blue'
  
  const elements = [
    // 概览
    { tag: 'markdown', content: `**检测渠道数**：${rows.length}` },
    { tag: 'markdown', content: `**🚨 高风险**：${critical.length + high.length} ｜ **⚠️ 中等风险**：${medium.length} ｜ **⚡ 低风险**：${low.length} ｜ **✅ 正常**：${safe.length}` },
    { tag: 'hr' },
    
    // 风险类型分布
    ...(Object.keys(riskTypeCounts).length > 0 ? [
      { tag: 'markdown', content: '**风险类型分布**' },
      ...Object.entries(riskTypeCounts).map(([type, count]) => ({
        tag: 'markdown',
        content: `- ${type}: ${count} 个渠道`
      })),
      { tag: 'hr' }
    ] : []),
    
    // 高风险渠道
    ...(critical.length > 0 ? [
      { tag: 'markdown', content: '**🚨 高风险渠道（建议立即暂停）**' },
      ...critical.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.name}: ${c.riskAssessment.risks[0]?.detail}`
      }))
    ] : []),
    
    ...(high.length > 0 ? [
      { tag: 'markdown', content: '**🔴 较高风险渠道（建议暂停并复核）**' },
      ...high.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.name}: ${c.riskAssessment.risks[0]?.detail}`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 复核建议
    { tag: 'markdown', content: '**📌 复核建议**' },
    ...(critical.length + high.length > 0 ? [
      { tag: 'markdown', content: `- 高风险渠道：暂停后拉 MMP 数据交叉验证` },
      { tag: 'markdown', content: `- 抽样检查：看安装后用户行为是否异常` },
      { tag: 'markdown', content: `- 时间段分析：检查是否有异常峰值` }
    ] : [
      { tag: 'markdown', content: `- 当前无高风险渠道，继续正常监控` }
    ]),
    { tag: 'markdown', content: `- 每周定期复查，观察风险变化` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '流量异常风险检查' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('用法: node fraud-risk-feishu-card.js <data.json|data.csv>')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    const card = buildFraudRiskCard(rows)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildFraudRiskCard, detectFraudRisk }
if (require.main === module) main()