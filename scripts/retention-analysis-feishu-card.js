#!/usr/bin/env node
/**
 * 留存分析飞书卡片生成器
 * 
 * 功能：
 * - 分析留存数据（D1/D3/D7/D14/D30）
 * - 判断留存质量等级
 * - 给出留存优化建议
 * 
 * 用法：
 * node retention-analysis-feishu-card.js retention-data.json
 */

const fs = require('fs')
const path = require('path')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function money(v) {
  return `$${Number(v).toFixed(2)}`
}

// 留存质量评估
function assessRetention(d1, d7, d30) {
  // 快速回收产品留存标准
  if (d1 >= 0.40 && d7 >= 0.20 && d30 >= 0.08) {
    return { grade: 'A', label: '🌟 优秀留存', status: '高质量用户', action: '大胆放量' }
  }
  if (d1 >= 0.35 && d7 >= 0.15 && d30 >= 0.05) {
    return { grade: 'B', label: '✅ 良好留存', status: '正常质量', action: '稳步投放' }
  }
  if (d1 >= 0.25 && d7 >= 0.10) {
    return { grade: 'C', label: '⚠️ 一般留存', status: '质量偏低', action: '保守测试' }
  }
  return { grade: 'D', label: '❌ 较差留存', status: '低质量流量', action: '暂停或换渠道' }
}

// 留存衰减分析
function analyzeRetentionDecay(d1, d3, d7, d14, d30) {
  const decayPoints = []
  
  // D1 → D3 衰减
  if (d3) {
    const d1ToD3 = d3 / d1
    decayPoints.push({
      period: 'D1→D3',
      ratio: d1ToD3,
      status: d1ToD3 >= 0.6 ? '正常' : d1ToD3 >= 0.5 ? '偏快' : '异常'
    })
  }
  
  // D3 → D7 衰减
  if (d3 && d7) {
    const d3ToD7 = d7 / d3
    decayPoints.push({
      period: 'D3→D7',
      ratio: d3ToD7,
      status: d3ToD7 >= 0.6 ? '正常' : d3ToD7 >= 0.5 ? '偏快' : '异常'
    })
  }
  
  // D7 → D30 衰减
  if (d7 && d30) {
    const d7ToD30 = d30 / d7
    decayPoints.push({
      period: 'D7→D30',
      ratio: d7ToD30,
      status: d7ToD30 >= 0.4 ? '正常' : d7ToD30 >= 0.3 ? '偏快' : '异常'
    })
  }
  
  return decayPoints
}

function buildRetentionAnalysisCard(data) {
  const d1 = data.d1 || 0
  const d3 = data.d3 || data.d1 * 0.6
  const d7 = data.d7 || 0
  const d14 = data.d14 || data.d7 * 0.6
  const d30 = data.d30 || 0
  
  const assessment = assessRetention(d1, d7, d30)
  const decayAnalysis = analyzeRetentionDecay(d1, d3, d7, d14, d30)
  
  // 异常衰减检测
  const abnormalDecays = decayAnalysis.filter(d => d.status === '异常' || d.status === '偏快')
  
  // 卡片颜色
  const templateColor = assessment.grade === 'A' ? 'green' : assessment.grade === 'D' ? 'red' : abnormalDecays.length > 0 ? 'orange' : 'blue'
  
  const elements = [
    // 留存曲线
    { tag: 'markdown', content: '**留存曲线**' },
    { tag: 'markdown', content: `- D1: ${pct(d1)} ｜ D3: ${pct(d3)} ｜ D7: ${pct(d7)} ｜ D14: ${pct(d14)} ｜ D30: ${pct(d30)}` },
    { tag: 'hr' },
    
    // 质量评估
    { tag: 'markdown', content: `**${assessment.label}**` },
    { tag: 'markdown', content: `- 状态: ${assessment.status} → ${assessment.action}` },
    { tag: 'hr' },
    
    // 衰减分析
    { tag: 'markdown', content: '**留存衰减分析**' },
    ...decayAnalysis.map(d => ({
      tag: 'markdown',
      content: `- ${d.period}: ${(d.ratio * 100).toFixed(0)}% 保留率 → ${d.status}`
    })),
    { tag: 'hr' },
    
    // 异常预警
    ...(abnormalDecays.length > 0 ? [
      { tag: 'markdown', content: '**⚠️ 异常衰减预警**' },
      ...abnormalDecays.map(d => ({
        tag: 'markdown',
        content: `- ${d.period} 衰减过快，用户流失严重`
      })),
      { tag: 'markdown', content: `- 建议：检查新用户体验、首日引导、核心功能触达` }
    ] : []),
    
    // 优化建议
    { tag: 'markdown', content: '**📌 留存优化建议**' },
    ...(assessment.grade === 'A' ? [
      { tag: 'markdown', content: `- D1 ≥ 40%：高质量，继续放量` }
    ] : assessment.grade === 'B' ? [
      { tag: 'markdown', content: `- D1 35-40%：良好，可稳步扩展` }
    ] : assessment.grade === 'C' ? [
      { tag: 'markdown', content: `- D1 25-35%：偏低，优化新手引导` },
      { tag: 'markdown', content: `- 检查首次启动流程、核心功能露出` }
    ] : [
      { tag: 'markdown', content: `- D1 < 25%：过低，暂停投放` },
      { tag: 'markdown', content: `- 排查渠道质量、素材与产品匹配度` }
    ]),
    { tag: 'markdown', content: `- 提升 D7 留存：增加每日激励、push通知、社交功能` },
    { tag: 'markdown', content: `- 提升 D30 留存：长期任务、成就系统、社区运营` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '留存分析报告' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    // 允许直接传参数
    const d1 = parseFloat(process.argv[3]) || 0.35
    const d7 = parseFloat(process.argv[4]) || 0.18
    const d30 = parseFloat(process.argv[5]) || 0.05
    
    const card = buildRetentionAnalysisCard({ d1, d7, d30 })
    console.log(JSON.stringify(card, null, 2))
    return
  }
  
  try {
    const data = readJson(filePath)
    // 支持 cohorts 数组或单个留存数据
    const cohorts = data.cohorts || [data]
    
    // 计算平均留存率
    const avgD1 = cohorts.reduce((a, c) => a + (c.d1 || 0) / (c.installs || 1), 0) / cohorts.length
    const avgD3 = cohorts.reduce((a, c) => a + (c.d3 || 0) / (c.installs || 1), 0) / cohorts.length
    const avgD7 = cohorts.reduce((a, c) => a + (c.d7 || 0) / (c.installs || 1), 0) / cohorts.length
    const avgD14 = cohorts.reduce((a, c) => a + (c.d14 || 0) / (c.installs || 1), 0) / cohorts.length
    const avgD30 = cohorts.reduce((a, c) => a + (c.d30 || 0) / (c.installs || 1), 0) / cohorts.length
    
    const card = buildRetentionAnalysisCard({ d1: avgD1, d3: avgD3, d7: avgD7, d14: avgD14, d30: avgD30 })
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildRetentionAnalysisCard, assessRetention }
if (require.main === module) main()