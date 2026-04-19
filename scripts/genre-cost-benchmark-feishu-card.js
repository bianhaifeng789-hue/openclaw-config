#!/usr/bin/env node
/**
 * 品类成本基准飞书卡片生成器
 * 
 * 功能：
 * - 根据品类（游戏/工具）设定 CPI 目标基准
 * - 判断当前 CPI 是否合理
 * - 给出预算和放量建议
 * 
 * 品类成本排序（约定俗成）：
 * SLG > 卡牌 > RPG > 传奇 > 休闲
 * 工具类：文件修复、PDF工具、清理优化等
 * 
 * 用法：
 * node genre-cost-benchmark-feishu-card.js --genre "casual" --cpi 0.8 --roas 0.15
 */

// 品类成本基准（美元）
const GENRE_BENCHMARKS = {
  // 游戏类（高ARPU可接受高CPI）
  game: {
    slg: { targetCpi: 5.0, minRoas: 0.20, d7Roas: 0.40, payback: '30-60天', volume: 'low' },
    card: { targetCpi: 3.5, minRoas: 0.18, d7Roas: 0.35, payback: '14-30天', volume: 'medium' },
    rpg: { targetCpi: 2.8, minRoas: 0.15, d7Roas: 0.30, payback: '14-30天', volume: 'medium' },
    legend: { targetCpi: 1.5, minRoas: 0.12, d7Roas: 0.25, payback: '7-14天', volume: 'high' },
    casual: { targetCpi: 0.8, minRoas: 0.10, d7Roas: 0.20, payback: '7-14天', volume: 'high' },
    puzzle: { targetCpi: 0.5, minRoas: 0.08, d7Roas: 0.15, payback: '3-7天', volume: 'very_high' },
    hypercasual: { targetCpi: 0.15, minRoas: 0.05, d7Roas: 0.10, payback: '1-3天', volume: 'very_high' }
  },
  // 工具类（快速回收，低CPI）
  tool: {
    file_repair: { targetCpi: 0.3, minRoas: 0.15, d7Roas: 0.30, payback: '7天', volume: 'medium' },
    pdf_tool: { targetCpi: 0.25, minRoas: 0.12, d7Roas: 0.25, payback: '7天', volume: 'medium' },
    cleaner: { targetCpi: 0.20, minRoas: 0.10, d7Roas: 0.20, payback: '3-7天', volume: 'high' },
    vpn: { targetCpi: 0.35, minRoas: 0.15, d7Roas: 0.30, payback: '7天', volume: 'medium' },
    photo_editor: { targetCpi: 0.40, minRoas: 0.12, d7Roas: 0.25, payback: '7-14天', volume: 'medium' },
    calculator: { targetCpi: 0.15, minRoas: 0.08, d7Roas: 0.15, payback: '3天', volume: 'high' },
    weather: { targetCpi: 0.10, minRoas: 0.05, d7Roas: 0.10, payback: '1-3天', volume: 'very_high' }
  }
}

// 平台成本差异
const PLATFORM_ADJUSTMENT = {
  ios: 1.5,      // iOS 普遍贵 50%
  android: 1.0,  // 安卓基准
  amazon: 0.8,   // Amazon 略便宜
  huawei: 0.7    // 华米略便宜
}

// 渠道特点
const CHANNEL_CHARACTERISTICS = {
  tiktok: { volume: 'high', quality: 'medium', bestFor: '泛量测试，素材驱动' },
  meta: { volume: 'very_high', quality: 'medium', bestFor: '泛量测试，受众优化' },
  google: { volume: 'high', quality: 'medium_high', bestFor: '搜索意图，精准人群' },
  unity: { volume: 'medium', quality: 'medium', bestFor: '游戏内置广告' },
  applovin: { volume: 'medium', quality: 'medium', bestFor: '游戏内置广告' },
  ironsource: { volume: 'medium', quality: 'low_medium', bestFor: '低成本测试' },
  mintegral: { volume: 'medium', quality: 'low', bestFor: '低成本快速测试' },
  taptap: { volume: 'low', quality: 'high', bestFor: '硬核玩家，质量优先' },
  huawei: { volume: 'medium', quality: 'medium_high', bestFor: '国内安卓，华米用户' }
}

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function money(v) {
  return `$${Number(v).toFixed(2)}`
}

// 识别品类类型
function identifyGenreType(genre) {
  const gameGenres = ['slg', 'card', 'rpg', 'legend', 'casual', 'puzzle', 'hypercasual', 'game']
  const toolGenres = ['file_repair', 'pdf_tool', 'cleaner', 'vpn', 'photo_editor', 'calculator', 'weather', 'tool']
  
  const normalized = genre.toLowerCase().replace(/[-_]/g, '_')
  
  if (gameGenres.includes(normalized) || normalized.includes('game')) {
    return 'game'
  }
  if (toolGenres.includes(normalized) || normalized.includes('tool') || normalized.includes('repair') || normalized.includes('pdf')) {
    return 'tool'
  }
  return 'unknown'
}

// 获取品类基准
function getGenreBenchmark(genre) {
  const type = identifyGenreType(genre)
  const normalized = genre.toLowerCase().replace(/[-_]/g, '_')
  
  if (type === 'game') {
    return GENRE_BENCHMARKS.game[normalized] || GENRE_BENCHMARKS.game.casual
  }
  if (type === 'tool') {
    return GENRE_BENCHMARKS.tool[normalized] || GENRE_BENCHMARKS.tool.file_repair
  }
  return GENRE_BENCHMARKS.game.casual // 默认休闲游戏基准
}

// CPI 评估
function assessCpi(currentCpi, targetCpi, currentRoas, minRoas) {
  const cpiRatio = currentCpi / targetCpi
  const roasRatio = currentRoas / minRoas
  
  // CPI 低 + ROAS 高 → 优秀
  if (cpiRatio <= 0.8 && roasRatio >= 1.2) {
    return { grade: 'A', label: '🌟 成本优秀', status: 'CPI低且ROAS高', action: '大胆放量 +30%' }
  }
  
  // CPI 合理 + ROAS 达标 → 正常
  if (cpiRatio <= 1.2 && roasRatio >= 1.0) {
    return { grade: 'B', label: '✅ 成本合理', status: 'CPI在目标附近，ROAS达标', action: '稳步放量 +10-15%' }
  }
  
  // CPI 高 + ROAS 低 → 问题
  if (cpiRatio > 1.5 && roasRatio < 0.8) {
    return { grade: 'D', label: '❌ 成本过高', status: 'CPI远超目标，ROAS不达标', action: '暂停或大幅降预算' }
  }
  
  // CPI 高但 ROAS 还行 → 观察
  if (cpiRatio > 1.2 && roasRatio >= 0.8) {
    return { grade: 'C', label: '⚠️ 成本偏高', status: 'CPI偏高但ROAS勉强', action: '降预算 -10%，优化素材' }
  }
  
  // CPI 合理但 ROAS 低 → 质量问题
  if (cpiRatio <= 1.2 && roasRatio < 0.8) {
    return { grade: 'C', label: '⚠️ 质量偏低', status: 'CPI达标但ROAS低', action: '换渠道/人群，提升留存' }
  }
  
  return { grade: 'C', label: '⏳ 观察中', status: '数据积累中', action: '维持观察' }
}

function buildGenreCostBenchmarkCard(config) {
  const { genre, cpi, roas, platform, channel } = config
  
  const benchmark = getGenreBenchmark(genre)
  const type = identifyGenreType(genre)
  
  // 平台成本调整
  const platformAdj = PLATFORM_ADJUSTMENT[platform?.toLowerCase()] || 1.0
  const adjustedTargetCpi = benchmark.targetCpi * platformAdj
  
  // CPI 评估
  const assessment = assessCpi(cpi, adjustedTargetCpi, roas, benchmark.minRoas)
  
  // 卡片颜色
  const templateColor = assessment.grade === 'A' ? 'green' : assessment.grade === 'D' ? 'red' : assessment.grade === 'B' ? 'blue' : 'orange'
  
  // 品类成本排序说明
  const genreOrder = type === 'game' 
    ? 'SLG ($5.0) > 卡牌 ($3.5) > RPG ($2.8) > 传奇 ($1.5) > 休闲 ($0.8) > 超休闲 ($0.15)'
    : 'VPN ($0.35) > 文件修复 ($0.3) > PDF工具 ($0.25) > 清理优化 ($0.2) > 天气 ($0.1)'
  
  const elements = [
    // 品类信息
    { tag: 'markdown', content: `**品类**：${genre}（${type === 'game' ? '游戏' : '工具'}）` },
    { tag: 'markdown', content: `**基准 CPI**：${money(benchmark.targetCpi)} ｜ **最低 ROAS**：${pct(benchmark.minRoas)} ｜ **回收周期**：${benchmark.payback}` },
    ...(platform ? [
      { tag: 'markdown', content: `**平台调整**：${platform} × ${platformAdj} → 目标 CPI ${money(adjustedTargetCpi)}` }
    ] : []),
    { tag: 'hr' },
    
    // 当前状态
    { tag: 'markdown', content: `**当前 CPI**：${money(cpi)} ｜ **当前 ROAS**：${pct(roas)}` },
    { tag: 'markdown', content: `**${assessment.label}**` },
    { tag: 'markdown', content: `- ${assessment.status} → ${assessment.action}` },
    { tag: 'hr' },
    
    // 品类成本排序
    { tag: 'markdown', content: '**📌 品类成本排序（约定俗成）**' },
    { tag: 'markdown', content: `- ${type === 'game' ? '游戏' : '工具'}：${genreOrder}` },
    { tag: 'markdown', content: `- 高 ARPU 品类可接受高 CPI，低 ARPU 品类需要大体量` },
    { tag: 'hr' },
    
    // 渠道建议
    ...(channel ? [
      { tag: 'markdown', content: '**渠道特点**' },
      { tag: 'markdown', content: `- ${channel}: ${CHANNEL_CHARACTERISTICS[channel.toLowerCase()]?.bestFor || '通用渠道'}` }
    ] : []),
    
    // 放量建议
    { tag: 'markdown', content: '**📌 放量建议**' },
    ...(assessment.grade === 'A' ? [
      { tag: 'markdown', content: `- 成本优秀：大胆放量，预算 +30%` },
      { tag: 'markdown', content: `- 复制素材变体，扩展到更多 GEO` }
    ] : assessment.grade === 'B' ? [
      { tag: 'markdown', content: `- 成本合理：稳步放量，预算 +10-15%` },
      { tag: 'markdown', content: `- 观察留存和 ROAS 变化` }
    ] : assessment.grade === 'C' ? [
      { tag: 'markdown', content: `- 成本偏高：降预算 -10%，优化素材/受众` },
      { tag: 'markdown', content: `- 或换渠道（${type === 'game' ? 'TikTok/Meta' : 'Google/Meta'}适合泛量）` }
    ] : [
      { tag: 'markdown', content: `- 成本过高：暂停，释放预算给高 ROAS 项目` },
      { tag: 'markdown', content: `- 检查素材是否误导，落地页是否匹配` }
    ]),
    { tag: 'markdown', content: `- ${benchmark.volume === 'high' ? '适合大体量投放' : benchmark.volume === 'low' ? '精品小量测试' : '中等体量'}` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `${genre} 品类成本基准` },
      template: templateColor
    },
    elements
  }
}

function getArg(name, def) {
  const args = process.argv.slice(2)
  const index = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`))
  if (index === -1) return def
  const exact = args[index]
  if (exact.includes('=')) return exact.split('=').slice(1).join('=')
  return args[index + 1] || def
}

function main() {
  const genre = getArg('genre', 'casual')
  const cpi = parseFloat(getArg('cpi', '0.8'))
  const roas = parseFloat(getArg('roas', '0.15'))
  const platform = getArg('platform', null)
  const channel = getArg('channel', null)
  
  const card = buildGenreCostBenchmarkCard({ genre, cpi, roas, platform, channel })
  console.log(JSON.stringify(card, null, 2))
}

module.exports = { buildGenreCostBenchmarkCard, getGenreBenchmark, assessCpi, GENRE_BENCHMARKS }
if (require.main === module) main()