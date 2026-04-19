#!/usr/bin/env node
/**
 * 创意测试 SOP 飞书卡片生成器
 * 
 * 功能：
 * - 分析素材测试结果
 * - 按样本量和指标判断淘汰/晋级
 * - 输出胜出素材和下一轮迭代方向
 * 
 * 用法：
 * node creative-testing-feishu-card.js test-data.json
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

// 判断素材是否达到最小样本量
function hasMinimumSample(item) {
  const clicks = item.clicks || 0
  const installs = item.installs || 0
  return clicks >= 100 && installs >= 10 // 最小样本：100点击 + 10安装
}

// 判断晋级/淘汰
function classifyTestResult(item, groupAvg) {
  // 未达样本量 → 待观察
  if (!hasMinimumSample(item)) {
    return { status: 'pending', label: '⏳ 待观察', reason: '样本量不足', action: '继续投放至达标' }
  }
  
  const ctr = item.ctr || 0
  const cpi = item.cpi || 0
  const roas = item.roas || 0
  
  // 晋级条件：CTR高于均值 + CPI低于目标 + ROAS达标
  if (ctr >= groupAvg.ctr * 1.2 && cpi <= groupAvg.targetCpi && roas >= 0.2) {
    return { status: 'winner', label: '🏆 胜出素材', reason: 'CTR + CPI + ROAS 全达标', action: '晋级并衍生变体' }
  }
  
  // 淘汰条件：CTR明显低 + CPI明显高
  if (ctr < groupAvg.ctr * 0.7 || cpi > groupAvg.targetCpi * 1.5) {
    return { status: 'loser', label: '❌ 淘汰素材', reason: 'CTR过低或CPI过高', action: '暂停测试' }
  }
  
  // 边缘素材
  return { status: 'edge', label: '⚠️ 边缘素材', reason: '指标接近均值', action: '观察或小调整' }
}

function buildCreativeTestingCard(rows, config = {}) {
  // 计算组均值
  const avgCtr = rows.reduce((a, b) => a + (Number(b.ctr) || 0), 0) / rows.length
  const avgCpi = rows.reduce((a, b) => a + (Number(b.cpi) || 0), 0) / rows.length
  const targetCpi = config.targetCpi || 4.0
  
  const groupAvg = { ctr: avgCtr, cpi: avgCpi, targetCpi }
  
  // 分类所有素材
  const classified = rows.map(item => ({
    ...item,
    classification: classifyTestResult(item, groupAvg)
  }))
  
  // 分组统计
  const winners = classified.filter(c => c.classification.status === 'winner')
  const losers = classified.filter(c => c.classification.status === 'loser')
  const pending = classified.filter(c => c.classification.status === 'pending')
  const edges = classified.filter(c => c.classification.status === 'edge')
  
  // 卡片颜色
  const templateColor = winners.length > 0 ? 'green' : pending.length > rows.length * 0.5 ? 'blue' : 'orange'
  
  const elements = [
    // 测试概览
    { tag: 'markdown', content: `**测试素材数**：${rows.length}` },
    { tag: 'markdown', content: `**组均值 CTR**：${pct(avgCtr)} ｜ **组均值 CPI**：${money(avgCpi)} ｜ **目标 CPI**：${money(targetCpi)}` },
    { tag: 'hr' },
    
    // 分类汇总
    { tag: 'markdown', content: `**🏆 胜出**：${winners.length} ｜ **❌ 淘汰**：${losers.length} ｜ **⏳ 待观察**：${pending.length} ｜ **⚠️ 边缘**：${edges.length}` },
    { tag: 'hr' },
    
    // 胜出素材
    ...(winners.length > 0 ? [
      { tag: 'markdown', content: '**🏆 胜出素材（建议晋级）**' },
      ...winners.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.name}: CTR ${pct(c.ctr)}, CPI ${money(c.cpi)}, ROAS ${pct(c.roas)}`
      })),
      { tag: 'markdown', content: `→ 建议：复制 2-3 个变体，继续测试` }
    ] : []),
    
    // 淘汰素材
    ...(losers.length > 0 ? [
      { tag: 'markdown', content: '**❌ 淘汰素材（建议暂停）**' },
      ...losers.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.name}: ${c.classification.reason}`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 待观察
    ...(pending.length > 0 ? [
      { tag: 'markdown', content: '**⏳ 待观察（样本量不足）**' },
      ...pending.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `- ${c.name}: Clicks ${c.clicks || 0}, Installs ${c.installs || 0}`
      })),
      { tag: 'markdown', content: `→ 建议：继续投放，达到 100 点击 + 10 安装后再判断` }
    ] : []),
    
    { tag: 'hr' },
    
    // 下一轮迭代方向
    { tag: 'markdown', content: '**📌 下一轮迭代方向**' },
    ...(winners.length > 0 ? [
      { tag: 'markdown', content: `- 胜出素材 Hook 可复制到其他 GEO/渠道` },
      { tag: 'markdown', content: `- 测试胜出素材的文案变体` }
    ] : [
      { tag: 'markdown', content: `- 本轮无胜出素材，需重新审视 Hook/文案/画面` }
    ]),
    { tag: 'markdown', content: `- 控制每次只改 1-2 个变量，避免混杂` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '创意测试 SOP 结果' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  const targetCpi = parseFloat(process.argv[3]) || 4.0
  
  if (!filePath) {
    console.error('用法: node creative-testing-feishu-card.js <data.json|data.csv> [targetCpi]')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    const card = buildCreativeTestingCard(rows, { targetCpi })
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildCreativeTestingCard, classifyTestResult }
if (require.main === module) main()