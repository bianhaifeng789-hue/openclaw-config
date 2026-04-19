#!/usr/bin/env node
/**
 * 投放报告飞书卡片生成器
 * 
 * 功能：
 * - 读取投放数据（JSON / CSV）
 * - 生成日报/周报飞书卡片 JSON
 * - 支持直接发送到飞书（通过 message tool）
 * 
 * 用法：
 * node ads-report-feishu-card.js data.json --mode=daily
 * node ads-report-feishu-card.js data.csv --mode=weekly --send
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

// ===== 计算函数 =====

function sum(arr, key) {
  return arr.reduce((a, b) => a + (Number(b[key]) || 0), 0)
}

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function money(v) {
  return `$${Number(v).toFixed(2)}`
}

function getArg(name, def = null) {
  const args = process.argv.slice(2)
  const index = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`))
  if (index === -1) return def
  const exact = args[index]
  if (exact.includes('=')) return exact.split('=').slice(1).join('=')
  return args[index + 1] ?? def
}

// ===== 飞书卡片构建 =====

function buildAdsReportCard(rows, mode = 'daily') {
  // 汇总指标
  const spend = sum(rows, 'spend')
  const impressions = sum(rows, 'impressions')
  const clicks = sum(rows, 'clicks')
  const installs = sum(rows, 'installs')
  const revenue = sum(rows, 'revenue')
  
  const ctr = impressions > 0 ? clicks / impressions : 0
  const cvr = clicks > 0 ? installs / clicks : 0
  const cpi = installs > 0 ? spend / installs : 0
  const roas = spend > 0 ? revenue / spend : 0
  
  // 排序：高ROAS = 表现好，高CPI = 风险
  const sortedByRoas = [...rows].sort((a, b) => (b.roas || 0) - (a.roas || 0))
  const sortedByCpi = [...rows].sort((a, b) => (a.cpi || 999999) - (b.cpi || 999999))
  
  // 判断整体状态
  const overallStatus = roas >= 0.3 ? 'profit' : roas >= 0.2 ? 'break-even' : 'risk'
  const templateColor = overallStatus === 'profit' ? 'green' : overallStatus === 'risk' ? 'orange' : 'blue'
  
  const title = mode === 'weekly' ? '投放周报' : '投放日报'
  
  // 构建卡片元素
  const elements = [
    // 汇总
    { tag: 'markdown', content: `**总花费**：${money(spend)} ｜ **安装数**：${installs}` },
    { tag: 'markdown', content: `**CTR**：${pct(ctr)} ｜ **CVR**：${pct(cvr)} ｜ **CPI**：${money(cpi)} ｜ **ROAS**：${pct(roas)}` },
    { tag: 'hr' },
    
    // 表现最好的 3 个
    { tag: 'markdown', content: '**✅ 表现最佳**' },
    ...sortedByRoas.slice(0, 3).map(item => ({
      tag: 'markdown',
      content: `- ${item.name}: ROAS ${pct(item.roas || 0)}, CPI ${money(item.cpi || 0)}, Spend ${money(item.spend || 0)}`
    })),
    { tag: 'hr' },
    
    // 风险预警
    { tag: 'markdown', content: '**⚠️ 风险预警**' },
    ...sortedByCpi.slice(0, 3).map(item => ({
      tag: 'markdown',
      content: `- ${item.name}: CPI ${money(item.cpi || 0)}, ROAS ${pct(item.roas || 0)}`
    })),
    { tag: 'hr' },
    
    // 操作建议
    { tag: 'markdown', content: '**📌 建议动作**' },
    { tag: 'markdown', content: '- 表现好的广告组：谨慎加预算 10-15%' },
    { tag: 'markdown', content: '- CPI > $5 且 ROAS < 15%：暂停或降预算' },
    { tag: 'markdown', content: '- CTR < 1%：测试新素材' }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: title },
      template: templateColor
    },
    elements
  }
}

// ===== 发送到飞书 =====

async function sendToFeishu(card) {
  // 使用 message tool 发送
  // 这里生成 payload，实际发送需要通过 OpenClaw message tool
  const payload = {
    action: 'send',
    card: card,
    channel: 'feishu'
  }
  
  console.log('\n=== 飞书发送载荷 ===')
  console.log(JSON.stringify(payload, null, 2))
  console.log('\n提示：复制上方 payload，使用 message tool 发送')
}

// ===== 主函数 =====

function main() {
  const filePath = process.argv[2]
  const mode = getArg('mode', 'daily')
  const shouldSend = process.argv.includes('--send')
  
  if (!filePath) {
    console.error('用法: node ads-report-feishu-card.js <data.json|data.csv> [--mode=daily|weekly] [--send]')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    
    if (!Array.isArray(rows) || rows.length === 0) {
      console.error('数据必须是非空数组')
      process.exit(1)
    }
    
    const card = buildAdsReportCard(rows, mode)
    
    if (shouldSend) {
      sendToFeishu(card)
    } else {
      console.log(JSON.stringify(card, null, 2))
    }
    
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildAdsReportCard, readData }
if (require.main === module) main()