#!/usr/bin/env node
/**
 * 平台开通SOP检查清单飞书卡片生成器
 * 
 * 功能：
 * - 显示各平台开通进度
 * - 检查SOP执行状态
 * - 给出下一步建议
 * 
 * 用法：
 * node platform-onboarding-checklist-feishu-card.js onboarding-status.json
 */

const fs = require('fs')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function buildPlatformOnboardingCard(data) {
  const platforms = data.platforms || []
  const total = platforms.length
  const completed = platforms.filter(p => p.status === 'completed').length
  const progress = total > 0 ? (completed / total * 100).toFixed(1) : 0
  
  // 分类统计
  const monetizationPlatforms = platforms.filter(p => p.category === 'monetization')
  const adsPlatforms = platforms.filter(p => p.category === 'ads')
  
  // 卡片颜色
  const templateColor = progress >= 80 ? 'green' : progress >= 50 ? 'blue' : 'orange'
  
  const elements = [
    // 总体进度
    { tag: 'markdown', content: '**平台开通SOP进度**' },
    { tag: 'markdown', content: `- 已开通: ${completed}/${total} (${progress}%)` },
    { tag: 'hr' },
    
    // 变现平台SOP
    { tag: 'markdown', content: '**变现平台开通状态**' },
    ...monetizationPlatforms.map(p => {
      const icon = p.status === 'completed' ? '✅' : p.status === 'in_progress' ? '⏳' : '❌'
      const detail = p.status === 'completed' 
        ? `开通: ${p.completedDate || 'N/A'}` 
        : p.status === 'in_progress' 
        ? `当前步骤: ${p.currentStep || 'N/A'}` 
        : `未开始`
      const stepsInfo = p.completedSteps ? ` (${p.completedSteps}/${p.totalSteps})` : ''
      return {
        tag: 'markdown',
        content: `- ${icon} ${p.name}: ${detail}${stepsInfo}`
      }
    }),
    { tag: 'hr' },
    
    // 广告平台SOP
    { tag: 'markdown', content: '**广告平台开通状态**' },
    ...adsPlatforms.map(p => {
      const icon = p.status === 'completed' ? '✅' : p.status === 'in_progress' ? '⏳' : '❌'
      const detail = p.status === 'completed' 
        ? `开通: ${p.completedDate || 'N/A'}` 
        : p.status === 'in_progress' 
        ? `当前步骤: ${p.currentStep || 'N/A'}` 
        : `未开始`
      const stepsInfo = p.completedSteps ? ` (${p.completedSteps}/${p.totalSteps})` : ''
      return {
        tag: 'markdown',
        content: `- ${icon} ${p.name}: ${detail}${stepsInfo}`
      }
    }),
    { tag: 'hr' },
    
    // SOP步骤概览
    { tag: 'markdown', content: '**平台开通SOP标准步骤**' },
    { tag: 'markdown', content: `- 1️⃣ 账号注册 → 2️⃣ 公司验证 → 3️⃣ 税务表格 → 4️⃣ SDK集成 → 5️⃣ 广告位配置 → 6️⃣ 测试验证 → 7️⃣ 上线收款` },
    { tag: 'hr' },
    
    // 建议
    { tag: 'markdown', content: '**📌 下一步建议**' },
    ...(progress < 50 ? [
      { tag: 'markdown', content: `- 优先变现平台：AdMob → Unity → ironSource → AppLovin` },
      { tag: 'markdown', content: `- 变现平台开通顺序影响收款时效` }
    ] : []),
    ...(progress >= 50 && progress < 80 ? [
      { tag: 'markdown', content: `- 完成剩余平台税务表格和SDK集成` }
    ] : []),
    ...(progress >= 80 ? [
      { tag: 'markdown', content: `- 平台开通接近完成，准备正式投放` }
    ] : []),
    { tag: 'markdown', content: `- 每个平台独立账号/IP，避免关联` },
    { tag: 'markdown', content: `- 变现平台需完成税务表格才能收款` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '平台开通SOP清单' },
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
        { name: 'AdMob', category: 'monetization', status: 'completed', completedDate: '2026-04-10', completedSteps: 7, totalSteps: 7 },
        { name: 'Unity Ads', category: 'monetization', status: 'in_progress', currentStep: 'SDK集成', completedSteps: 4, totalSteps: 7 },
        { name: 'ironSource', category: 'monetization', status: 'in_progress', currentStep: '税务表格', completedSteps: 3, totalSteps: 7 },
        { name: 'AppLovin MAX', category: 'monetization', status: 'not_started', completedSteps: 0, totalSteps: 7 },
        { name: 'TikTok Ads', category: 'ads', status: 'completed', completedDate: '2026-04-12', completedSteps: 5, totalSteps: 5 },
        { name: 'Google Ads', category: 'ads', status: 'in_progress', currentStep: '付款设置', completedSteps: 3, totalSteps: 5 },
        { name: 'Meta Ads', category: 'ads', status: 'not_started', completedSteps: 0, totalSteps: 5 }
      ]
    }
    const card = buildPlatformOnboardingCard(demoData)
    console.log(JSON.stringify(card, null, 2))
    return
  }
  
  try {
    const data = readJson(filePath)
    const card = buildPlatformOnboardingCard(data)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildPlatformOnboardingCard }
if (require.main === module) main()