#!/usr/bin/env node
/**
 * 视频素材分析飞书卡片生成器
 * 
 * 功能：
 * - 分析 3 秒完播率、完播率（视频素材特有指标）
 * - 判断开头抓人程度和整体节奏
 * - 给出视频优化建议
 * 
 * 用法：
 * node video-creative-feishu-card.js video-data.json
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

// 视频开头分析（3秒完播率）
function analyzeVideoStart(threeSecRate, avgThreeSecRate) {
  if (threeSecRate >= avgThreeSecRate * 1.2) {
    return {
      grade: 'A',
      label: '🌟 开头抓人',
      issue: '3秒完播率高，开头信息密集/刺激',
      action: '保持风格，复制到其他素材'
    }
  }
  if (threeSecRate >= avgThreeSecRate * 0.9) {
    return {
      grade: 'B',
      label: '✅ 开头正常',
      issue: '3秒完播率在均值附近',
      action: '维持观察'
    }
  }
  if (threeSecRate < avgThreeSecRate * 0.7) {
    return {
      grade: 'D',
      label: '❌ 开头失败',
      issue: '3秒完播率低，开头不够抓人',
      action: '优化前3秒：增加信息密度、冲突、悬念'
    }
  }
  return {
    grade: 'C',
    label: '⚠️ 开头偏弱',
    issue: '3秒完播率偏低',
    action: '微调开头节奏，尝试新钩子'
  }
}

// 视频整体节奏分析（完播率）
function analyzeVideoPacing(completionRate, avgCompletionRate) {
  if (completionRate >= avgCompletionRate * 1.3) {
    return {
      grade: 'A',
      label: '🌟 节奏优秀',
      issue: '完播率高，整体节奏顺畅',
      action: '平台倾向给更多展示，加量'
    }
  }
  if (completionRate >= avgCompletionRate) {
    return {
      grade: 'B',
      label: '✅ 节奏正常',
      issue: '完播率达标',
      action: '维持'
    }
  }
  if (completionRate < avgCompletionRate * 0.5) {
    return {
      grade: 'D',
      label: '❌ 节奏失败',
      issue: '完播率极低，中途大量流失',
      action: '优化节奏：缩短时长、减少拖沓段落'
    }
  }
  return {
    grade: 'C',
      label: '⚠️ 节奏偏弱',
      issue: '完播率偏低，流失点较多',
      action: '找出流失点（数据分析），针对性剪辑'
  }
}

// 3秒 vs 完播关系判断
function analyzeStartVsCompletion(threeSecRate, completionRate) {
  // 开头好 + 完播差 → 开头好但中间拖沓
  if (threeSecRate >= 0.7 && completionRate < 0.2) {
    return {
      pattern: 'good_start_bad_middle',
      label: '⚠️ 开头好中间拖',
      issue: '开头吸引人但中途流失',
      action: '缩短时长，删减拖沓段落'
    }
  }
  
  // 开头差 + 完播好 → 开头弱但中间好（可能是用户误点）
  if (threeSecRate < 0.5 && completionRate >= 0.3) {
    return {
      pattern: 'bad_start_good_middle',
      label: '⚠️ 开头弱中间好',
      issue: '开头不吸引但看下去的人留存好',
      action: '优化开头，或受众匹配问题'
    }
  }
  
  // 开头好 + 完播好 → 整体优秀
  if (threeSecRate >= 0.7 && completionRate >= 0.3) {
    return {
      pattern: 'excellent',
      label: '🌟 整体优秀',
      issue: '开头和完播都高',
      action: '加量，复制变体'
    }
  }
  
  // 开头差 + 完播差 → 全面问题
  return {
    pattern: 'weak',
    label: '❌ 全面问题',
    issue: '开头和完播都差',
    action: '重新制作'
  }
}

function buildVideoCreativeCard(rows) {
  // 计算组均值
  const avgThreeSecRate = rows.reduce((a, b) => a + (Number(b.three_sec_rate) || 0), 0) / rows.length
  const avgCompletionRate = rows.reduce((a, b) => a + (Number(b.completion_rate) || 0), 0) / rows.length
  
  // 分析每个素材
  const analyzed = rows.map(row => {
    const threeSecRate = row.three_sec_rate || 0
    const completionRate = row.completion_rate || 0
    const videoDuration = row.duration || 30
    
    return {
      ...row,
      startAnalysis: analyzeVideoStart(threeSecRate, avgThreeSecRate),
      pacingAnalysis: analyzeVideoPacing(completionRate, avgCompletionRate),
      relationAnalysis: analyzeStartVsCompletion(threeSecRate, completionRate)
    }
  })
  
  // 分组统计
  const excellentStart = analyzed.filter(a => a.startAnalysis.grade === 'A')
  const weakStart = analyzed.filter(a => a.startAnalysis.grade === 'D')
  const excellentPacing = analyzed.filter(a => a.pacingAnalysis.grade === 'A')
  const weakPacing = analyzed.filter(a => a.pacingAnalysis.grade === 'D')
  const excellentOverall = analyzed.filter(a => a.relationAnalysis.pattern === 'excellent')
  const goodStartBadMiddle = analyzed.filter(a => a.relationAnalysis.pattern === 'good_start_bad_middle')
  
  // 卡片颜色
  const templateColor = excellentOverall.length > 0 ? 'green' : weakStart.length + weakPacing.length > rows.length * 0.3 ? 'orange' : 'blue'
  
  const elements = [
    // 概览
    { tag: 'markdown', content: `**视频素材数**：${rows.length}` },
    { tag: 'markdown', content: `**组均值 3秒完播率**：${pct(avgThreeSecRate)} ｜ **组均值完播率**：${pct(avgCompletionRate)}` },
    { tag: 'hr' },
    
    // 开头分析
    { tag: 'markdown', content: '**开头分析（3秒完播率）**' },
    { tag: 'markdown', content: `- 🌟 开头抓人：${excellentStart.length} ｜ ⚠️ 开头偏弱：${weakStart.length}` },
    ...(excellentStart.length > 0 ? [
      { tag: 'markdown', content: `**🌟 开头抓人（建议复制风格）**` },
      ...excellentStart.slice(0, 2).map(a => ({
        tag: 'markdown',
        content: `- ${a.name}: 3秒完播率 ${pct(a.three_sec_rate)} → ${a.startAnalysis.action}`
      }))
    ] : []),
    ...(weakStart.length > 0 ? [
      { tag: 'markdown', content: `**❌ 开头失败（建议优化）**` },
      ...weakStart.slice(0, 2).map(a => ({
        tag: 'markdown',
        content: `- ${a.name}: 3秒完播率 ${pct(a.three_sec_rate)} → 增加信息密度/冲突/悬念`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 整体节奏
    { tag: 'markdown', content: '**整体节奏（完播率）**' },
    { tag: 'markdown', content: `- 🌟 节奏优秀：${excellentPacing.length} ｜ ❌ 节奏失败：${weakPacing.length}` },
    ...(excellentPacing.length > 0 ? [
      { tag: 'markdown', content: `→ 平台倾向给更多展示，建议加量` }
    ] : []),
    ...(weakPacing.length > 0 ? [
      { tag: 'markdown', content: `→ 缩短时长，删减拖沓段落` }
    ] : []),
    
    { tag: 'hr' },
    
    // 开头 vs 完播关系
    { tag: 'markdown', content: '**开头 vs 完播关系判断**' },
    ...(excellentOverall.length > 0 ? [
      { tag: 'markdown', content: `**🌟 整体优秀**：${excellentOverall.length} 个（开头 + 完播都高）` },
      { tag: 'markdown', content: `→ 加量，复制变体到其他 GEO/渠道` }
    ] : []),
    ...(goodStartBadMiddle.length > 0 ? [
      { tag: 'markdown', content: `**⚠️ 开头好中间拖**：${goodStartBadMiddle.length} 个` },
      { tag: 'markdown', content: `→ 缩短时长（15-20秒），删减拖沓段落` }
    ] : []),
    
    { tag: 'hr' },
    
    // 视频优化建议
    { tag: 'markdown', content: '**📌 视频优化建议**' },
    { tag: 'markdown', content: `- 3秒完播率低：开头不够信息密集/刺激 → 换钩子` },
    { tag: 'markdown', content: `- 完播率低：整体节奏拖沓 → 缩短时长（15-20秒最优）` },
    { tag: 'markdown', content: `- 开头好但完播差：删减中间拖沓段落，保持紧凑` },
    { tag: 'markdown', content: `- 完播率高：平台倾向给更多展示 → 加量` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '视频素材分析' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('用法: node video-creative-feishu-card.js <data.json|data.csv>')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    const card = buildVideoCreativeCard(rows)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildVideoCreativeCard, analyzeVideoStart, analyzeVideoPacing }
if (require.main === module) main()