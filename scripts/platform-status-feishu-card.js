#!/usr/bin/env node
/**
 * 平台状态飞书卡片生成器
 * 
 * 功能：
 * - 显示各平台账号状态
 * - 变现平台配置进度
 * - SDK 集成状态
 * 
 * 用法：
 * node platform-status-feishu-card.js platforms-status.json
 */

const fs = require('fs')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function buildPlatformStatusCard(data) {
  const platforms = data.platforms || []
  const categories = {
    monetization: platforms.filter(p => p.category === 'monetization'),
    ads: platforms.filter(p => p.category === 'ads'),
    store: platforms.filter(p => p.category === 'store')
  }
  
  // 统计
  const monetizationReady = categories.monetization.filter(p => p.sdkIntegrated && p.adUnitsConfigured).length
  const adsReady = categories.ads.filter(p => p.accountReady).length
  
  // 卡片颜色
  const templateColor = monetizationReady >= categories.monetization.length * 0.5 ? 'green' : 'blue'
  
  const elements = [
    // 变现平台
    { tag: 'markdown', content: '**变现平台状态**' },
    ...(categories.monetization.length > 0 ? categories.monetization.map(p => {
      const accountIcon = p.accountCreated ? '✅' : '❌'
      const sdkIcon = p.sdkIntegrated ? '✅' : '❌'
      const adUnitsIcon = p.adUnitsConfigured ? '✅' : '❌'
      const ecpmInfo = p.ecpm ? ` ｜ eCPM: $${p.ecpm.toFixed(2)}` : ''
      return {
        tag: 'markdown',
        content: `- ${p.name}: 账号${accountIcon} SDK${sdkIcon} 广告位${adUnitsIcon}${ecpmInfo}`
      }
    }) : [{ tag: 'markdown', content: '- 无数据' }]),
    { tag: 'hr' },
    
    // 广告平台
    { tag: 'markdown', content: '**广告平台状态**' },
    ...(categories.ads.length > 0 ? categories.ads.map(p => {
      const accountIcon = p.accountReady ? '✅' : '❌'
      const fundingIcon = p.fundingSetup ? '✅' : '❌'
      const campaignIcon = p.campaignCreated ? '✅' : '❌'
      return {
        tag: 'markdown',
        content: `- ${p.name}: 账号${accountIcon} 付款${fundingIcon} Campaign${campaignIcon}`
      }
    }) : [{ tag: 'markdown', content: '- 无数据' }]),
    { tag: 'hr' },
    
    // 应用商店
    { tag: 'markdown', content: '**应用商店状态**' },
    ...(categories.store.length > 0 ? categories.store.map(p => {
      const accountIcon = p.accountCreated ? '✅' : '❌'
      const appIcon = p.appPublished ? '✅' : '❌'
      return {
        tag: 'markdown',
        content: `- ${p.name}: 账号${accountIcon} 应用${appIcon}`
      }
    }) : [{ tag: 'markdown', content: '- 无数据' }]),
    { tag: 'hr' },
    
    // 建议
    { tag: 'markdown', content: '**📌 下一步建议**' },
    ...(monetizationReady < categories.monetization.length ? [
      { tag: 'markdown', content: `- 变现平台未就绪：优先完成 SDK 集成和广告位配置` },
      { tag: 'markdown', content: `- 变现平台配置顺序：AdMob → Unity → ironSource → AppLovin` }
    ] : [
      { tag: 'markdown', content: `- 变现平台已就绪：可开始投放广告` }
    ]),
    ...(adsReady < categories.ads.length ? [
      { tag: 'markdown', content: `- 广告平台未就绪：完成账号注册和付款设置` }
    ] : [
      { tag: 'markdown', content: `- 广告平台已就绪：可创建 Campaign` }
    ]),
    { tag: 'markdown', content: `- 每周检查平台状态，确保账号正常` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '平台状态一览' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    const demoData = {
      platforms: [
        { name: 'AdMob', category: 'monetization', accountCreated: true, sdkIntegrated: true, adUnitsConfigured: true, ecpm: 8.5 },
        { name: 'Unity Ads', category: 'monetization', accountCreated: true, sdkIntegrated: false, adUnitsConfigured: false },
        { name: 'ironSource', category: 'monetization', accountCreated: true, sdkIntegrated: true, adUnitsConfigured: false },
        { name: 'TikTok Ads', category: 'ads', accountReady: true, fundingSetup: true, campaignCreated: true },
        { name: 'Google Ads', category: 'ads', accountReady: true, fundingSetup: false, campaignCreated: false },
        { name: 'Google Play', category: 'store', accountCreated: true, appPublished: true }
      ]
    }
    const card = buildPlatformStatusCard(demoData)
    console.log(JSON.stringify(card, null, 2))
    return
  }
  
  try {
    const data = readJson(filePath)
    const card = buildPlatformStatusCard(data)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildPlatformStatusCard }
if (require.main === module) main()