#!/usr/bin/env node
/**
 * GEO × 渠道分析飞书卡片生成器
 * 
 * 功能：
 * - 分国家分渠道效果分析
 * - 给出 GEO Tier 分层建议
 * - 识别优先放量/降权的组合
 * 
 * 用法：
 * node geo-channel-feishu-card.js geo-data.json
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

// GEO Tier 分层
function classifyGeo(item, config = {}) {
  const cpi = item.cpi || 0
  const roas = item.roas || 0
  const retention = item.retention || 0
  const targetCpi = config.targetCpi || 4.0
  const minRoas = config.minRoas || 0.15
  
  // Tier 1: 低CPI + 高ROAS + 留存好
  if (cpi <= targetCpi && roas >= minRoas * 1.5 && retention >= 0.35) {
    return { tier: 'T1', label: '🚀 Tier 1 - 优先放量', action: '+20~30%' }
  }
  
  // Tier 2: 成本尚可 + 回收一般
  if (cpi <= targetCpi * 1.3 && roas >= minRoas) {
    return { tier: 'T2', label: '📈 Tier 2 - 保守测试', action: '+10~15%' }
  }
  
  // Tier 3: 成本高或回收差
  if (cpi > targetCpi * 1.5 || roas < minRoas * 0.7) {
    return { tier: 'T3', label: '🔻 Tier 3 - 降权或暂停', action: '-20~50%' }
  }
  
  return { tier: 'T2', label: '⚠️ Tier 2 - 边缘观察', action: '0% 维持' }
}

function buildGeoChannelCard(rows, config = {}) {
  // 分组统计
  const geoStats = {}
  const channelStats = {}
  
  rows.forEach(row => {
    const geo = row.geo || row.country || 'Unknown'
    const channel = row.channel || row.platform || 'Unknown'
    
    // GEO 分组
    if (!geoStats[geo]) {
      geoStats[geo] = { count: 0, spend: 0, installs: 0, revenue: 0, retention: 0 }
    }
    geoStats[geo].count++
    geoStats[geo].spend += row.spend || 0
    geoStats[geo].installs += row.installs || 0
    geoStats[geo].revenue += row.revenue || 0
    geoStats[geo].retention += row.retention || 0
    
    // 渠道分组
    if (!channelStats[channel]) {
      channelStats[channel] = { count: 0, spend: 0, installs: 0, revenue: 0 }
    }
    channelStats[channel].count++
    channelStats[channel].spend += row.spend || 0
    channelStats[channel].installs += row.installs || 0
    channelStats[channel].revenue += row.revenue || 0
  })
  
  // 计算 GEO 指标
  const geoResults = Object.entries(geoStats).map(([geo, stats]) => {
    const cpi = stats.installs > 0 ? stats.spend / stats.installs : 0
    const roas = stats.spend > 0 ? stats.revenue / stats.spend : 0
    const retention = stats.count > 0 ? stats.retention / stats.count : 0
    
    return {
      geo,
      spend: stats.spend,
      installs: stats.installs,
      cpi,
      roas,
      retention,
      classification: classifyGeo({ cpi, roas, retention }, config)
    }
  }).sort((a, b) => b.roas - a.roas)
  
  // 计算渠道指标
  const channelResults = Object.entries(channelStats).map(([channel, stats]) => {
    const cpi = stats.installs > 0 ? stats.spend / stats.installs : 0
    const roas = stats.spend > 0 ? stats.revenue / stats.spend : 0
    
    return {
      channel,
      spend: stats.spend,
      installs: stats.installs,
      cpi,
      roas
    }
  }).sort((a, b) => b.roas - a.roas)
  
  // Tier 分组
  const t1 = geoResults.filter(g => g.classification.tier === 'T1')
  const t2 = geoResults.filter(g => g.classification.tier === 'T2')
  const t3 = geoResults.filter(g => g.classification.tier === 'T3')
  
  // 卡片颜色
  const templateColor = t1.length > 0 ? 'green' : t3.length > geoResults.length * 0.5 ? 'orange' : 'blue'
  
  const elements = [
    // 概览
    { tag: 'markdown', content: `**GEO 数**：${geoResults.length} ｜ **渠道数**：${channelResults.length}` },
    { tag: 'markdown', content: `**🚀 T1**：${t1.length} ｜ **📈 T2**：${t2.length} ｜ **🔻 T3**：${t3.length}` },
    { tag: 'hr' },
    
    // GEO 分层
    { tag: 'markdown', content: '**GEO 分层分析**' },
    ...(t1.length > 0 ? [
      { tag: 'markdown', content: '**🚀 Tier 1 - 优先放量**' },
      ...t1.slice(0, 3).map(g => ({
        tag: 'markdown',
        content: `- ${g.geo}: ROAS ${pct(g.roas)}, CPI ${money(g.cpi)}, 留存 ${pct(g.retention)} → +20~30%`
      }))
    ] : []),
    
    ...(t3.length > 0 ? [
      { tag: 'markdown', content: '**🔻 Tier 3 - 降权或暂停**' },
      ...t3.slice(0, 3).map(g => ({
        tag: 'markdown',
        content: `- ${g.geo}: ROAS ${pct(g.roas)}, CPI ${money(g.cpi)} → -20~50%`
      }))
    ] : []),
    
    { tag: 'hr' },
    
    // 渠道对比
    { tag: 'markdown', content: '**渠道横向对比**' },
    ...channelResults.slice(0, 5).map(c => ({
      tag: 'markdown',
      content: `- ${c.channel}: ROAS ${pct(c.roas)}, CPI ${money(c.cpi)}, Spend ${money(c.spend)}`
    })),
    
    { tag: 'hr' },
    
    // 操作建议
    { tag: 'markdown', content: '**📌 预算分配建议**' },
    ...(t1.length > 0 ? [
      { tag: 'markdown', content: `- T1 GEO：加预算，优先放量（${t1.map(g => g.geo).join(', ')}）` }
    ] : []),
    { tag: 'markdown', content: `- T2 GEO：保守测试，维持观察` },
    ...(t3.length > 0 ? [
      { tag: 'markdown', content: `- T3 GEO：降预算或暂停，释放预算给 T1` }
    ] : []),
    { tag: 'markdown', content: `- 渠道：优先高 ROAS 渠道，控制低质渠道预算` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: 'GEO × 渠道分析' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  const targetCpi = parseFloat(process.argv[3]) || 4.0
  
  if (!filePath) {
    console.error('用法: node geo-channel-feishu-card.js <data.json|data.csv> [targetCpi]')
    process.exit(1)
  }
  
  try {
    const rows = readData(filePath)
    const card = buildGeoChannelCard(rows, { targetCpi })
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildGeoChannelCard, classifyGeo }
if (require.main === module) main()