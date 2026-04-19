#!/usr/bin/env node
/**
 * 账号注册清单飞书卡片生成器
 * 
 * 功能：
 * - 检查各平台账号注册状态
 * - 显示注册进度
 * - 给出下一步建议
 * 
 * 用法：
 * node account-registration-checklist-feishu-card.js accounts-status.json
 */

const fs = require('fs')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function buildAccountRegistrationCard(data) {
  const platforms = data.platforms || []
  const total = platforms.length
  const registered = platforms.filter(p => p.status === 'registered').length
  const pending = platforms.filter(p => p.status === 'pending').length
  const failed = platforms.filter(p => p.status === 'failed').length
  
  // 进度百分比
  const progress = total > 0 ? (registered / total * 100).toFixed(1) : 0
  
  // 卡片颜色
  const templateColor = progress >= 80 ? 'green' : progress >= 50 ? 'blue' : 'orange'
  
  const elements = [
    // 总进度
    { tag: 'markdown', content: '**账号注册进度**' },
    { tag: 'markdown', content: `- 已注册: ${registered}/${total} (${progress}%)` },
    { tag: 'markdown', content: `- 待注册: ${pending} ｜ 失败: ${failed}` },
    { tag: 'hr' },
    
    // 各平台状态
    { tag: 'markdown', content: '**平台注册状态**' },
    ...platforms.map(p => {
      const statusIcon = p.status === 'registered' ? '✅' : p.status === 'pending' ? '⏳' : '❌'
      const detail = p.status === 'registered' 
        ? `账号: ${p.accountId || 'N/A'}` 
        : p.status === 'pending' 
        ? `下一步: ${p.nextStep || '开始注册'}` 
        : `原因: ${p.error || '未知'}`
      return {
        tag: 'markdown',
        content: `- ${statusIcon} ${p.name}: ${detail}`
      }
    }),
    { tag: 'hr' },
    
    // 注册建议
    { tag: 'markdown', content: '**📌 注册建议**' },
    ...(pending > 0 ? [
      { tag: 'markdown', content: `- 优先注册变现平台：AdMob → Unity → ironSource → AppLovin` },
      { tag: 'markdown', content: `- 广告平台可在变现平台就绪后注册：Facebook → TikTok → Google Ads` }
    ] : []),
    ...(failed > 0 ? [
      { tag: 'markdown', content: `- 失败账号：检查资料准确性、IP隔离、邮箱验证` }
    ] : []),
    ...(progress >= 80 ? [
      { tag: 'markdown', content: `- 注册进度良好，可开始配置 SDK 和广告位` }
    ] : []),
    { tag: 'markdown', content: `- 使用不同邮箱/IP注册每个账号，避免关联` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '账号注册清单' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    // 演示数据
    const demoData = {
      platforms: [
        { name: 'Google AdMob', status: 'registered', accountId: 'pub-123456' },
        { name: 'Unity Ads', status: 'registered', accountId: 'unity-789' },
        { name: 'ironSource', status: 'pending', nextStep: '验证邮箱' },
        { name: 'AppLovin', status: 'pending', nextStep: '填写公司信息' },
        { name: 'Facebook Ads', status: 'failed', error: '邮箱验证超时' }
      ]
    }
    const card = buildAccountRegistrationCard(demoData)
    console.log(JSON.stringify(card, null, 2))
    return
  }
  
  try {
    const data = readJson(filePath)
    const card = buildAccountRegistrationCard(data)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildAccountRegistrationCard }
if (require.main === module) main()