#!/usr/bin/env node
/**
 * CTR/CVR 漏斗分析飞书卡片生成器
 * 
 * 功能：
 * - 分析三层漏斗：曝光 → 点击 → 转化
 * - 判断 CTR/CVR 关系（误导性素材检测）
 * - 识别漏斗瓶颈（哪一层流失最严重）
 * 
 * 用法：
 * node funnel-analysis-feishu-card.js funnel-data.json
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

// CTR/CVR 关系判断（核心启发）
function analyzeCtrCvrRelation(ctr, cvr, avgCtr, avgCvr) {
  // CTR 高 + CVR 低 → 误导性素材
  if (ctr >= avgCtr * 1.3 && cvr < avgCvr * 0.7) {
    return {
      pattern: 'misleading',
      label: '⚠️ 误导性素材',
      issue: '点击多但转化少',
      reason: '广告与落地页/游戏体验差距大，或承诺过头',
      action: '调整素材，减少夸大宣传，贴近真实体验'
    }
  }
  
  // CTR 一般 + CVR 高 → 质量好但吸引力不足
  if (ctr < avgCtr * 0.9 && cvr >= avgCvr * 1.2) {
    return {
      pattern: 'quality_but_weak',
      label: '✅ 高质量低吸引',
      issue: '点的人不多但转化好',
      reason: '素材对目标人群准确但不够吸睛',
      action: '优化封面/开头，提升吸引力，保持真实'
    }
  }
  
  // CTR 高 + CVR 高 → 星级素材
  if (ctr >= avgCtr * 1.2 && cvr >= avgCvr * 1.2) {
    return {
      pattern: 'star',
      label: '🌟 星级素材',
      issue: '点击和转化都优秀',
      reason: '素材精准吸引目标用户，体验匹配',
      action: '加量 20-30%，复制变体'
    }
  }
  
  // CTR 低 + CVR 低 → 全面问题
  if (ctr < avgCtr * 0.7 && cvr < avgCvr * 0.7) {
    return {
      pattern: 'weak',
      label: '❌ 全面弱势',
      issue: '点击和转化都差',
      reason: '素材不吸引人，且受众不匹配',
      action: '暂停，换素材或换人群'
    }
  }
  
  // 正常
  return {
    pattern: 'normal',
    label: '⏳ 正常表现',
    issue: 'CTR/CVR 在均值附近',
    reason: '表现平稳，无明显问题',
    action: '维持观察'
  }
}

// 漏斗瓶颈识别
function identifyFunnelBottleneck(impressions, clicks, conversions) {
  const ctr = impressions > 0 ? clicks / impressions : 0
  const cvr = clicks > 0 ? conversions / clicks : 0
  const overallCvr = impressions > 0 ? conversions / impressions : 0
  
  // 曝光 → 点击流失率
  const clickDropRate = 1 - ctr
  
  // 点击 → 转化流失率  
  const conversionDropRate = 1 - cvr
  
  // 判断瓶颈在哪一层
  if (clickDropRate > 0.98) {
    return {
      bottleneck: 'exposure',
      label: '🚨 曝光层瓶颈',
      issue: '曝光多但几乎没人点',
      loss: `${pct(clickDropRate)} 在点击层流失`,
      action: '优化封面/开头 3 秒，检查定向是否过宽'
    }
  }
  
  if (conversionDropRate > 0.95) {
    return {
      bottleneck: 'click',
      label: '🚨 点击层瓶颈',
      issue: '点击多但几乎没人转化',
      loss: `${pct(conversionDropRate)} 在转化层流失`,
      action: '优化落地页/商店页，减少广告与体验差距'
    }
  }
  
  if (clickDropRate > 0.9 && conversionDropRate > 0.9) {
    return {
      bottleneck: 'both',
      label: '🚨 双层瓶颈',
      issue: '点击和转化都流失严重',
      loss: `点击流失 ${pct(clickDropRate)} + 转化流失 ${pct(conversionDropRate)}`,
      action: '素材 + 落地页都需要优化'
    }
  }
  
  return {
    bottleneck: 'none',
    label: '✅ 漏斗顺畅',
    issue: '各层流失率正常',
    loss: `点击流失 ${pct(clickDropRate)} + 转化流失 ${pct(conversionDropRate)}`,
    action: '维持或加量'
  }
}

function buildFunnelAnalysisCard(rows) {
  // 计算组均值
  const avgCtr = rows.reduce((a, b) => {
    const imp = b.impressions || 0
    const clk = b.clicks || 0
    return a + (imp > 0 ? clk / imp : 0)
  }, 0) / rows.length
  
  const avgCvr = rows.reduce((a, b) => {
    const clk = b.clicks || 0
    const conv = b.conversions || b.installs || 0
    return a + (clk > 0 ? conv / clk : 0)
  }, 0) / rows.length
  
  // 分析每个素材
  const analyzed = rows.map(row => {
    const imp = row.impressions || 0
    const clk = row.clicks || 0
    const conv = row.conversions || row.installs || 0
    
    const ctr = imp > 0 ? clk / imp : 0
    const cvr = clk > 0 ? conv / clk : 0
    
    return {
      ...row,
      ctr,
      cvr,
      relation: analyzeCtrCvrRelation(ctr, cvr, avgCtr, avgCvr),
      bottleneck: identifyFunnelBottleneck(imp, clk, conv)
    }
  })
  
  // 按问题严重性排序
  const severityOrder = { 'misleading': 5, 'weak': 4, 'both': 3, 'exposure': 2, 'click': 1, 'normal': 0, 'none': 0 }
  const sorted = [...analyzed].sort((a, b) => {
    const aSeverity = severityOrder[a.relation.pattern] || severityOrder[a.bottleneck.bottleneck] || 0
    const bSeverity = severityOrder[b.relation.pattern] || severityOrder[b.bottleneck.bottleneck] || 0
    return bSeverity - aSeverity
  })
  
  // 分组统计
  const misleading = analyzed.filter(a => a.relation.pattern === 'misleading')
  const stars = analyzed.filter(a => a.relation.pattern === 'star')
  const weak = analyzed.filter(a => a.relation.pattern === 'weak')
  const exposureBottleneck = analyzed.filter(a => a.bottleneck.bottleneck === 'exposure')
  const clickBottleneck = analyzed.filter(a => a.bottleneck.bottleneck === 'click')
  
  // 卡片颜色
  const templateColor = misleading.length > 0 || clickBottleneck.length > 0 ? 'orange' : stars.length > 0 ? 'green' : 'blue'
  
  const elements = [
    // 概览
    { tag: 'markdown', content: `**素材数**：${rows.length} ｜ **组均值 CTR**：${pct(avgCtr)} ｜ **组均值 CVR**：${pct(avgCvr)}` },
    { tag: 'hr' },
    
    // CTR/CVR 关系判断
    { tag: 'markdown', content: '**CTR/CVR 关系判断（三层漏斗）**' },
    { tag: 'markdown', content: `- 🌟 星级素材：${stars.length} ｜ ⚠️ 误导性素材：${misleading.length} ｜ ❌ 全面弱势：${weak.length}` },
    { tag: 'hr' },
    
    // 星级素材
    ...(stars.length > 0 ? [
      { tag: 'markdown', content: '**🌟 星级素材（CTR + CVR 都高）**' },
      ...stars.slice(0, 3).map(a => ({
        tag: 'markdown',
        content: `- ${a.name}: CTR ${pct(a.ctr)}, CVR ${pct(a.cvr)} → ${a.relation.action}`
      }))
    ] : []),
    
    // 误导性素材
    ...(misleading.length > 0 ? [
      { tag: 'markdown', content: '**⚠️ 误导性素材（CTR 高 + CVR 低）**' },
      ...misleading.slice(0, 3).map(a => ({
        tag: 'markdown',
        content: `- ${a.name}: CTR ${pct(a.ctr)}, CVR ${pct(a.cvr)} → ${a.relation.reason}`
      })),
      { tag: 'markdown', content: `→ 建议：${misleading[0]?.relation.action}` }
    ] : []),
    
    { tag: 'hr' },
    
    // 漏斗瓶颈
    { tag: 'markdown', content: '**漏斗瓶颈分析**' },
    ...(exposureBottleneck.length > 0 ? [
      { tag: 'markdown', content: `**🚨 曝光层瓶颈**：${exposureBottleneck.length} 个素材` },
      { tag: 'markdown', content: `→ 问题：曝光多但点击少 → 优化封面/开头 3 秒` }
    ] : []),
    ...(clickBottleneck.length > 0 ? [
      { tag: 'markdown', content: `**🚨 点击层瓶颈**：${clickBottleneck.length} 个素材` },
      { tag: 'markdown', content: `→ 问题：点击多但转化少 → 优化落地页/商店页` }
    ] : []),
    
    { tag: 'hr' },
    
    // 三层漏斗说明
    { tag: 'markdown', content: '**📌 三层漏斗逻辑**' },
    { tag: 'markdown', content: `- 曝光 → 点击：CTR 衡量素材吸引力` },
    { tag: 'markdown', content: `- 点击 → 转化：CVR 衡量落地页/体验匹配度` },
    { tag: 'markdown', content: `- 转化 → 付费：ROI/LTV 衡量用户价值` },
    { tag: 'markdown', content: `→ 找出哪一层流失最严重，针对性优化` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: 'CTR/CVR 漏斗分析' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('用法: node funnel-analysis-feishu-card.js <data.json|data.csv>')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    const card = buildFunnelAnalysisCard(rows)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildFunnelAnalysisCard, analyzeCtrCvrRelation, identifyFunnelBottleneck }
if (require.main === module) main()