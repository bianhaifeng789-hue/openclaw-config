#!/usr/bin/env node
/**
 * 税务合规状态飞书卡片生成器
 * 
 * 功能：
 * - 检查税务表格准备状态
 * - 显示合规进度
 * - 给出下一步建议
 * 
 * 用法：
 * node tax-compliance-status-feishu-card.js tax-status.json
 */

const fs = require('fs')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function buildTaxComplianceCard(data) {
  const forms = data.forms || []
  const compliance = data.compliance || []
  
  const completedForms = forms.filter(f => f.status === 'completed')
  const pendingForms = forms.filter(f => f.status === 'pending')
  const missingForms = forms.filter(f => f.status === 'missing')
  
  const completedCompliance = compliance.filter(c => c.status === 'completed')
  const pendingCompliance = compliance.filter(c => c.status === 'pending')
  
  // 总体进度
  const totalItems = forms.length + compliance.length
  const completedItems = completedForms.length + completedCompliance.length
  const progress = totalItems > 0 ? (completedItems / totalItems * 100).toFixed(1) : 0
  
  // 卡片颜色
  const templateColor = progress >= 80 ? 'green' : progress >= 50 ? 'blue' : 'red'
  
  const elements = [
    // 总体进度
    { tag: 'markdown', content: '**税务合规进度**' },
    { tag: 'markdown', content: `- 已完成: ${completedItems}/${totalItems} (${progress}%)` },
    { tag: 'hr' },
    
    // 税务表格
    { tag: 'markdown', content: '**税务表格状态**' },
    ...forms.map(f => {
      const icon = f.status === 'completed' ? '✅' : f.status === 'pending' ? '⏳' : '❌'
      const detail = f.status === 'completed' 
        ? `提交: ${f.submittedDate || 'N/A'}` 
        : f.status === 'pending' 
        ? `下一步: ${f.action || '准备表格'}` 
        : `缺失`
      return {
        tag: 'markdown',
        content: `- ${icon} ${f.name}: ${detail}`
      }
    }),
    { tag: 'hr' },
    
    // 合规要求
    { tag: 'markdown', content: '**合规要求状态**' },
    ...compliance.map(c => {
      const icon = c.status === 'completed' ? '✅' : c.status === 'pending' ? '⏳' : '❌'
      return {
        tag: 'markdown',
        content: `- ${icon} ${c.name}: ${c.status === 'completed' ? '已完成' : c.status === 'pending' ? '待处理' : '缺失'}`
      }
    }),
    { tag: 'hr' },
    
    // 建议
    { tag: 'markdown', content: '**📌 下一步建议**' },
    ...(missingForms.length > 0 ? [
      { tag: 'markdown', content: `- 缺失表格: 优先准备 W-8BEN/W-8BEN-E` }
    ] : []),
    ...(pendingForms.length > 0 ? [
      { tag: 'markdown', content: `- 待处理表格: ${pendingForms[0].name} → ${pendingForms[0].action || '填写并提交'}` }
    ] : []),
    ...(pendingCompliance.length > 0 ? [
      { tag: 'markdown', content: `- 合规要求: ${pendingCompliance[0].name} → 完成后才能上线` }
    ] : []),
    { tag: 'markdown', content: `- 税务表格提交后，等待平台确认（通常 2-4 周）` },
    { tag: 'markdown', content: `- GDPR/COPPA 合规影响收款，务必完成` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '税务合规状态' },
      template: templateColor
    },
    elements
  }
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    const demoData = {
      forms: [
        { name: 'W-8BEN-E（AdMob）', status: 'completed', submittedDate: '2026-04-01' },
        { name: 'W-8BEN-E（Unity）', status: 'completed', submittedDate: '2026-04-05' },
        { name: 'W-8BEN-E（ironSource）', status: 'pending', action: '填写表格' },
        { name: 'W-8BEN-E（AppLovin）', status: 'missing' }
      ],
      compliance: [
        { name: '隐私政策页面', status: 'completed' },
        { name: 'GDPR 合规', status: 'completed' },
        { name: 'COPPA 合规', status: 'pending' },
        { name: '数据删除功能', status: 'pending' }
      ]
    }
    const card = buildTaxComplianceCard(demoData)
    console.log(JSON.stringify(card, null, 2))
    return
  }
  
  try {
    const data = readJson(filePath)
    const card = buildTaxComplianceCard(data)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildTaxComplianceCard }
if (require.main === module) main()