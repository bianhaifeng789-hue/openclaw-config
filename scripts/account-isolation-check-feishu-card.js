#!/usr/bin/env node
/**
 * 账号隔离检查飞书卡片生成器
 * 
 * 功能：
 * - 检查多账号防关联状态
 * - 显示账号健康评分
 * - 给出隔离优化建议
 * 
 * 用法：
 * node account-isolation-check-feishu-card.js accounts-isolation.json
 */

const fs = require('fs')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function buildAccountIsolationCard(data) {
  const accounts = data.accounts || []
  const total = accounts.length
  
  // 风险统计
  const highRisk = accounts.filter(a => a.riskLevel === 'high')
  const mediumRisk = accounts.filter(a => a.riskLevel === 'medium')
  const lowRisk = accounts.filter(a => a.riskLevel === 'low')
  
  // 防关联检查
  const ipConflicts = detectIPConflicts(accounts)
  const deviceConflicts = detectDeviceConflicts(accounts)
  const dataConflicts = detectDataConflicts(accounts)
  
  // 总体风险等级
  const overallRisk = highRisk.length > 0 ? 'high' : mediumRisk.length > total * 0.3 ? 'medium' : 'low'
  
  // 卡片颜色
  const templateColor = overallRisk === 'high' ? 'red' : overallRisk === 'medium' ? 'orange' : 'green'
  
  const elements = [
    // 总体状态
    { tag: 'markdown', content: '**账号隔离检查**' },
    { tag: 'markdown', content: `- 账号总数: ${total} ｜ 高风险: ${highRisk.length} ｜ 中风险: ${mediumRisk.length} ｜ 低风险: ${lowRisk.length}` },
    { tag: 'hr' },
    
    // 冲突检测
    { tag: 'markdown', content: '**⚠️ 冲突检测结果**' },
    ...(ipConflicts.length > 0 ? [
      { tag: 'markdown', content: `- 🚨 IP冲突: ${ipConflicts.length} 组账号使用相同IP` },
      ...ipConflicts.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `  - ${c.accounts.join(', ')}: IP ${c.ip}`
      }))
    ] : [{ tag: 'markdown', content: `- ✅ IP隔离: 无冲突` }]),
    
    ...(deviceConflicts.length > 0 ? [
      { tag: 'markdown', content: `- 🚨 设备冲突: ${deviceConflicts.length} 组账号使用相同设备/浏览器` },
      ...deviceConflicts.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `  - ${c.accounts.join(', ')}: ${c.device}`
      }))
    ] : [{ tag: 'markdown', content: `- ✅ 设备隔离: 无冲突` }]),
    
    ...(dataConflicts.length > 0 ? [
      { tag: 'markdown', content: `- 🚨 资料冲突: ${dataConflicts.length} 组账号资料相同或相似` },
      ...dataConflicts.slice(0, 3).map(c => ({
        tag: 'markdown',
        content: `  - ${c.accounts.join(', ')}: ${c.field}`
      }))
    ] : [{ tag: 'markdown', content: `- ✅ 资料隔离: 无冲突` }]),
    { tag: 'hr' },
    
    // 账号健康评分
    { tag: 'markdown', content: '**账号健康评分**' },
    ...accounts.slice(0, 5).map(a => {
      const healthIcon = a.healthScore >= 90 ? '🌟' : a.healthScore >= 70 ? '✅' : a.healthScore >= 50 ? '⚠️' : '❌'
      const riskIcon = a.riskLevel === 'high' ? '🚨' : a.riskLevel === 'medium' ? '⚠️' : '✅'
      return {
        tag: 'markdown',
        content: `- ${healthIcon} ${a.platform} (${a.id}): 健康 ${a.healthScore}% ｜ 风险 ${riskIcon}`
      }
    }),
    { tag: 'hr' },
    
    // 优化建议
    { tag: 'markdown', content: '**📌 防关联优化建议**' },
    ...(ipConflicts.length > 0 ? [
      { tag: 'markdown', content: `- IP冲突: 为每个账号分配独立代理IP` }
    ] : []),
    ...(deviceConflicts.length > 0 ? [
      { tag: 'markdown', content: `- 设备冲突: 使用 Multilogin/GoLogin 创建独立浏览器容器` }
    ] : []),
    ...(dataConflicts.length > 0 ? [
      { tag: 'markdown', content: `- 资料冲突: 每个账号使用不同公司名/邮箱/电话` }
    ] : []),
    { tag: 'markdown', content: `- 定期检查账号健康，及时发现异常` },
    { tag: 'markdown', content: `- 记录每次账号切换日志，避免误操作` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '账号隔离检查报告' },
      template: templateColor
    },
    elements
  }
}

// IP冲突检测
function detectIPConflicts(accounts) {
  const ipMap = {}
  accounts.forEach(a => {
    if (a.ip) {
      if (!ipMap[a.ip]) ipMap[a.ip] = []
      ipMap[a.ip].push(a.id || a.platform)
    }
  })
  
  return Object.entries(ipMap)
    .filter(([ip, ids]) => ids.length > 1)
    .map(([ip, accounts]) => ({ ip, accounts }))
}

// 设备冲突检测
function detectDeviceConflicts(accounts) {
  const deviceMap = {}
  accounts.forEach(a => {
    if (a.browserProfile || a.device) {
      const key = a.browserProfile || a.device
      if (!deviceMap[key]) deviceMap[key] = []
      deviceMap[key].push(a.id || a.platform)
    }
  })
  
  return Object.entries(deviceMap)
    .filter(([device, ids]) => ids.length > 1)
    .map(([device, accounts]) => ({ device, accounts }))
}

// 资料冲突检测
function detectDataConflicts(accounts) {
  const conflicts = []
  const fieldMap = { company: {}, email: {}, phone: {} }
  
  accounts.forEach(a => {
    if (a.company) {
      if (!fieldMap.company[a.company]) fieldMap.company[a.company] = []
      fieldMap.company[a.company].push(a.id || a.platform)
    }
    if (a.email) {
      const emailDomain = a.email.split('@')[1]
      if (!fieldMap.email[emailDomain]) fieldMap.email[emailDomain] = []
      fieldMap.email[emailDomain].push(a.id || a.platform)
    }
  })
  
  Object.entries(fieldMap.company)
    .filter(([_, ids]) => ids.length > 1)
    .forEach(([company, accounts]) => {
      conflicts.push({ field: `公司: ${company}`, accounts })
    })
  
  return conflicts
}

function main() {
  const filePath = process.argv[2]
  
  if (!filePath) {
    const demoData = {
      accounts: [
        { id: 'acc_001', platform: 'AdMob', ip: '192.168.1.1', browserProfile: 'profile_001', company: 'Company A', email: 'a@company1.com', healthScore: 95, riskLevel: 'low' },
        { id: 'acc_002', platform: 'Unity', ip: '192.168.1.2', browserProfile: 'profile_002', company: 'Company B', email: 'b@company2.com', healthScore: 88, riskLevel: 'low' },
        { id: 'acc_003', platform: 'ironSource', ip: '192.168.1.1', browserProfile: 'profile_003', company: 'Company C', email: 'c@company3.com', healthScore: 72, riskLevel: 'medium' },
        { id: 'acc_004', platform: 'AppLovin', ip: '192.168.1.3', browserProfile: 'profile_001', company: 'Company A', email: 'd@company1.com', healthScore: 45, riskLevel: 'high' }
      ]
    }
    const card = buildAccountIsolationCard(demoData)
    console.log(JSON.stringify(card, null, 2))
    return
  }
  
  try {
    const data = readJson(filePath)
    const card = buildAccountIsolationCard(data)
    console.log(JSON.stringify(card, null, 2))
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

module.exports = { buildAccountIsolationCard, detectIPConflicts, detectDeviceConflicts, detectDataConflicts }
if (require.main === module) main()