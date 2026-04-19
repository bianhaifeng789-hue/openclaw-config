#!/usr/bin/env node
/**
 * ROI 分析飞书卡片生成器
 * 
 * 功能：
 * - 计算投放 ROI（ROAS = Revenue / Spend）
 * - 判断 ROI 等级和回收状态
 * - 给出预算调整建议
 * 
 * 用法：
 * node roi-analysis-feishu-card.js roi-data.json
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
  if (ext === '.json') {
    const data = readJson(filePath)
    // 支持 campaigns 数组或直接数组
    return data.campaigns || data.rows || data
  }
  if (ext === '.csv') return readCsv(filePath)
  throw new Error(`Unsupported format: ${ext}`)
}

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function money(v) {
  return `$${Number(v).toFixed(2)}`
}

// ROI 等级评估
function assessROI(roas, targetRoas = 1.0) {
  const ratio = roas / targetRoas
  
  if (ratio >= 1.5) {
    return { grade: 'A', label: '🚀 高盈利', status: '盈利 50%+', action: '大胆放量 +20~30%' }
  }
  if (ratio >= 1.2) {
    return { grade: 'B', label: '✅ 盈利', status: '盈利 20%+', action: '稳步放量 +10~15%' }
  }
  if (ratio >= 1.0) {
    return { grade: 'C', label: '⚖️ 盈亏平衡', status: '刚好回本', action: '维持观察' }
  }
  if (ratio >= 0.8) {
    return { grade: 'D', label: '⚠️ 小亏', status: '亏损 20%', action: '降预算 -10~20%' }
  }
  return { grade: 'F', label: '❌ 大亏', status: '亏损 >20%', action: '暂停或止损' }
}

function buildROIAnalysisCard(rows, targetRoas = 1.0) {
  // 计算总体 ROI
  const totalSpend = rows.reduce((a, b) => a + (Number(b.spend) || 0), 0)
  const totalRevenue = rows.reduce((a, b) => a + (Number(b.revenue) || 0), 0)
  const overallRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  
  // 单项 ROI 评估
  const evaluated = rows.map(row => {
    const spend = row.spend || 0
    const revenue = row.revenue || 0
    const roas = spend > 0 ? revenue / spend : 0
    
    return {
      ...row,
      roas,
      assessment: assessROI(roas, targetRoas)
    }
  })
  
  // 按等级排序
  const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 }
  const sorted = [...evaluated].sort((a, b) => gradeOrder[b.assessment.grade] - gradeOrder[a.assessment.grade])
  
  // 分组统计
  const gradeA = evaluated.filter(e => e.assessment.grade === 'A')
  const gradeB = evaluated.filter(e => e.assessment.grade === 'B')
  const gradeC = evaluated.filter(e => e.assessment.grade === 'C')
  const gradeD = evaluated.filter(e => e.assessment.grade === 'D')
  const gradeF = evaluated.filter(e => e.assessment.grade === 'F')
  
  // 总体评估
  const overallAssessment = assessROI(overallRoas, targetRoas)
  
  // 卡片颜色
  const templateColor = gradeA.length > evaluated.length * 0.3 ? 'green' : gradeF.length > evaluated.length * 0.3 ? 'red' : 'blue'
  
  const elements = [
    // 总体 ROI
    { tag: 'markdown', content: '**总体 ROI**' },
    { tag: 'markdown', content: `- 总花费: ${money(totalSpend)} ｜ 总收入: ${money(totalRevenue)} ｜ ROAS: ${pct(overallRoas)}` },
    { tag: 'markdown', content: `- 目标 ROAS: ${pct(targetRoas)} ｜ ${overallAssessment.label}（${overallAssessment.status}）` },
    { tag: 'hr' },
    
    // 分级统计
    { tag: 'markdown', content: `**ROI 分级统计**` },
    { tag: 'markdown', content: `- 🚀 高盈利: ${gradeA.length} ｜ ✅ 盈利: ${gradeB.length} ｜ ⚖️ 平衡: ${gradeC.length} ｜ ⚠️ 小亏: ${gradeD.length} ｜ ❌ 大亏: ${gradeF.length}` },
    { tag: 'hr' },
    
    // 高盈利项
    ...(gradeA.length > 0 ? [
      { tag: 'markdown', content: '**🚀 高盈利项（建议加量）**' },
      ...gradeA.slice(0, 3).map(e => ({
        tag: 'markdown',
        content: `- ${e.name}: ROAS ${pct(e.roas)}, Spend ${money(e.spend)} → ${e.assessment.action}`
      }))
    ] : []),
    
    // 大亏项
    ...(gradeF.length > 0 ? [
      { tag: 'markdown', content: '**❌ 大亏项（建议暂停）**' },
      ...gradeF.slice(0, 3).map(e => ({
        tag: 'markdown',
        content: `- ${e.name}: ROAS ${pct(e.roas)}, Spend ${money(e.spend)} → ${e.assessment.action}`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 预算建议
    { tag: 'markdown', content: '**📌 预算调整建议**' },
    ...(gradeA.length + gradeB.length > 0 ? [
      { tag: 'markdown', content: `- 高盈利项：加预算 10~30%，优先放量` }
    ] : []),
    ...(gradeC.length > 0 ? [
      { tag: 'markdown', content: `- 盈亏平衡：维持观察，等待数据积累` }
    ] : []),
    ...(gradeD.length > 0 ? [
      { tag: 'markdown', content: `- 小亏项：降预算 10~20%，优化素材/受众` }
    ] : []),
    ...(gradeF.length > 0 ? [
      { tag: 'markdown', content: `- 大亏项：暂停，释放预算给高盈利项` }
    ] : []),
    { tag: 'markdown', content: `- ROI 目标：${pct(targetRoas)}，整体 ${overallAssessment.status}` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: 'ROI 分析报告' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  const targetRoas = parseFloat(process.argv[3]) || 1.0
  
  if (!filePath) {
    console.error('用法: node roi-analysis-feishu-card.js <data.json|data.csv> [targetRoas]')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    const card = buildROIAnalysisCard(rows, targetRoas)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildROIAnalysisCard, assessROI }
if (require.main === module) main()