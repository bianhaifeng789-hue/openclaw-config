#!/usr/bin/env node
/**
 * 公司注册进度飞书卡片生成器
 * 
 * 功能：
 * - 显示公司注册进度
 * - 税务合规状态
 * - 银行账户状态
 * 
 * 用法：
 * node company-registration-progress-feishu-card.js company-status.json
 */

const fs = require('fs')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function buildCompanyRegistrationCard(data) {
  const steps = data.steps || []
  const documents = data.documents || []
  
  const completed = steps.filter(s => s.status === 'completed').length
  const total = steps.length
  const progress = total > 0 ? (completed / total * 100).toFixed(1) : 0
  
  // 卡片颜色
  const templateColor = progress >= 80 ? 'green' : progress >= 50 ? 'blue' : 'orange'
  
  const elements = [
    // 总进度
    { tag: 'markdown', content: '**公司注册进度**' },
    { tag: 'markdown', content: `- 已完成: ${completed}/${total} (${progress}%)` },
    { tag: 'hr' },
    
    // 各步骤状态
    { tag: 'markdown', content: '**注册步骤状态**' },
    ...steps.map(s => {
      const icon = s.status === 'completed' ? '✅' : s.status === 'pending' ? '⏳' : '❌'
      const detail = s.status === 'completed' 
        ? `完成: ${s.completedDate || 'N/A'}` 
        : s.status === 'pending' 
        ? `下一步: ${s.action || '待处理'}` 
        : `问题: ${s.issue || '未知'}`
      return {
        tag: 'markdown',
        content: `- ${icon} ${s.name}: ${detail}`
      }
    }),
    { tag: 'hr' },
    
    // 文档状态
    { tag: 'markdown', content: '**文档准备状态**' },
    ...documents.map(d => {
      const icon = d.status === 'ready' ? '✅' : d.status === 'pending' ? '⏳' : '❌'
      return {
        tag: 'markdown',
        content: `- ${icon} ${d.name}: ${d.status === 'ready' ? '已准备' : d.status === 'pending' ? '待准备' : '缺失'}`
      }
    }),
    { tag: 'hr' },
    
    // 建议
    { tag: 'markdown', content: '**📌 下一步建议**' },
    ...(progress < 50 ? [
      { tag: 'markdown', content: `- 优先准备核心文档：营业执照、税务登记证、银行开户许可证` }
    ] : []),
    ...(progress >= 50 && progress < 80 ? [
      { tag: 'markdown', content: `- 推进税务合规和银行账户设置` }
    ] : []),
    ...(progress >= 80 ? [
      { tag: 'markdown', content: `- 注册接近完成，准备账号注册资料` }
    ] : []),
    { tag: 'markdown', content: `- 所有文档保存在 company-docs/ 目录` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '公司注册进度' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    const demoData = {
      steps: [
        { name: '公司名称核准', status: 'completed', completedDate: '2026-04-01' },
        { name: '营业执照申请', status: 'completed', completedDate: '2026-04-05' },
        { name: '税务登记', status: 'pending', action: '提交税务登记表' },
        { name: '银行开户', status: 'pending', action: '预约银行开户' },
        { name: '外汇账户', status: 'not_started', issue: '等待银行开户完成' }
      ],
      documents: [
        { name: '营业执照', status: 'ready' },
        { name: '税务登记证', status: 'pending' },
        { name: '银行开户许可证', status: 'pending' },
        { name: '公司章程', status: 'ready' },
        { name: '法人身份证', status: 'ready' }
      ]
    }
    const card = buildCompanyRegistrationCard(demoData)
    console.log(JSON.stringify(card, null, 2))
    return
  }
  
  try {
    const data = readJson(filePath)
    const card = buildCompanyRegistrationCard(data)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildCompanyRegistrationCard }
if (require.main === module) main()