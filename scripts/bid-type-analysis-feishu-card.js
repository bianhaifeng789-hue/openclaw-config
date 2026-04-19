#!/usr/bin/env node
/**
 * 出价方式适配飞书卡片生成器
 * 
 * 功能：
 * - 根据出价方式（CPC/CPI/CPA/oCPM）给出不同判断标准
 * - 判断当前出价是否合理
 * - 给出出价优化建议
 * 
 * 出价方式差别：
 * - CPC：测试素材/人群，只看点击不看后续
 * - CPI：休闲游戏常用，只付安装成功的用户
 * - CPA：中重度游戏，按激活/注册/付费付费
 * - oCPM：智能优化，设定目标成本系统自动优化
 * - CPM：品牌曝光，按展示付费
 * - CPS：按流水分成，低风险但分成比高
 * 
 * 用法：
 * node bid-type-analysis-feishu-card.js --bid-type "cpi" --cost 0.8 --target 0.5 --conversions 100
 */

const fs = require('fs')

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function money(v) {
  return `$${Number(v).toFixed(2)}`
}

// 出价方式说明
const BID_TYPE_INFO = {
  cpc: {
    name: 'CPC（按点击付费）',
    focus: '点击数',
    risk: '只看点击不看后续，容易被点击高但转化差的素材误导',
    bestFor: '早期测试素材/人群',
    optimization: '关注 CTR，同时监控后续转化',
    warning: 'CTR 高但 CVR 低 = 误导性素材'
  },
  cpi: {
    name: 'CPI（按安装付费）',
    focus: '安装数',
    risk: '安装后留存/付费差，CPI 再低也难回本',
    bestFor: '休闲游戏、中轻度产品前期放量',
    optimization: '关注 CPI + D7 ROAS',
    warning: 'CPI 低但留存差 = 拉来低质量用户'
  },
  cpa_activation: {
    name: 'CPA（按激活付费）',
    focus: '激活数',
    risk: '激活 ≠ 留存/付费',
    bestFor: '中轻度游戏',
    optimization: '关注 CPA + D7 留存',
    warning: '激活成本低但留存差'
  },
  cpa_register: {
    name: 'CPA（按注册付费）',
    focus: '注册数',
    risk: '注册 ≠ 付费',
    bestFor: '社交/工具类',
    optimization: '关注 CPA + 注册后转化率',
    warning: '注册多但付费少'
  },
  cpa_purchase: {
    name: 'CPA（按付费付费）',
    focus: '首付费数',
    risk: '首付费 CPA 通常很贵（$50-200）',
    bestFor: '中重度游戏、高 ARPU 产品',
    optimization: '关注 CPA + LTV',
    warning: 'CPA 高需要高 LTV 覆盖'
  },
  ocpm: {
    name: 'oCPM（智能优化 CPA）',
    focus: '目标成本（激活/付费等）',
    risk: '数据样本太少时，系统学习不充分',
    bestFor: '有一定历史数据、需要稳定放量',
    optimization: '设定合理目标成本，给系统学习时间',
    warning: '实际成本偏离目标 > 20% 需调整'
  },
  cpm: {
    name: 'CPM（按展示付费）',
    focus: '曝光数',
    risk: '不看点击/转化，只为让更多人看见',
    bestFor: '品牌曝光、预热、新品宣发',
    optimization: '关注 CPM + CTR + 品牌搜索量',
    warning: 'CPM 高但 CTR 低 = 曝光质量差'
  },
  cps: {
    name: 'CPS（按流水分成）',
    focus: '实际流水',
    risk: '分成比通常较高（30-50%）',
    bestFor: '硬核渠道、应用商店联运',
    optimization: '关注分成比 + 流水',
    warning: '渠道只推高流水/高 ARPU 游戏'
  }
}

// 出价评估
function assessBidType(bidType, currentCost, targetCost, conversions, ctr, cvr) {
  const costRatio = currentCost / targetCost
  
  // 基础评估
  let baseAssessment = {
    costStatus: costRatio <= 1.0 ? '达标' : costRatio <= 1.2 ? '略高' : '过高',
    costRatio: costRatio
  }
  
  // 根据出价方式特殊判断
  switch (bidType) {
    case 'cpc':
      // CPC 特殊判断：CTR + 后续转化
      if (ctr >= 0.03 && cvr >= 0.05) {
        return { ...baseAssessment, grade: 'A', label: '🌟 CPC优秀', issue: 'CTR高且转化好', action: '转为 CPI/CPA 出价，锁定转化' }
      }
      if (ctr >= 0.03 && cvr < 0.02) {
        return { ...baseAssessment, grade: 'D', label: '❌ CPC误导', issue: 'CTR高但转化差', action: '调整素材，减少夸大，或换 CPI' }
      }
      if (conversions >= 100) {
        return { ...baseAssessment, grade: 'B', label: '✅ CPC测试完成', issue: '有足够数据', action: '转 CPI/CPA 稳定放量' }
      }
      return { ...baseAssessment, grade: 'C', label: '⏳ CPC测试中', issue: '数据积累', action: '继续测试，监控转化' }
    
    case 'cpi':
      // CPI 特殊判断：CPI + 留存
      if (costRatio <= 0.8) {
        return { ...baseAssessment, grade: 'A', label: '🌟 CPI优秀', issue: '成本低于目标', action: '加量 20-30%' }
      }
      if (costRatio <= 1.0) {
        return { ...baseAssessment, grade: 'B', label: '✅ CPI达标', issue: '成本在目标附近', action: '维持或稳步加量' }
      }
      if (costRatio <= 1.5) {
        return { ...baseAssessment, grade: 'C', label: '⚠️ CPI偏高', issue: '成本略高', action: '降预算或优化素材' }
      }
      return { ...baseAssessment, grade: 'D', label: '❌ CPI过高', issue: '成本远超目标', action: '暂停或大幅降预算' }
    
    case 'cpa_purchase':
      // CPA 付费特殊判断：高成本需要高 LTV
      if (costRatio <= 1.0) {
        return { ...baseAssessment, grade: 'A', label: '🌟 CPA达标', issue: '付费成本在目标内', action: '前提是 LTV 能覆盖' }
      }
      if (currentCost > 100) {
        return { ...baseAssessment, grade: 'C', label: '⚠️ CPA很贵', issue: '付费 CPA 通常 $50-200', action: '确保 LTV ≥ CPA × 1.2' }
      }
      return { ...baseAssessment, grade: 'B', label: '✅ CPA正常', issue: '成本可接受', action: '监控 LTV 覆盖' }
    
    case 'ocpm':
      // oCPM 特殊判断：实际成本 vs 目标
      if (Math.abs(costRatio - 1.0) <= 0.1) {
        return { ...baseAssessment, grade: 'A', label: '🌟 oCPM稳定', issue: '实际成本贴近目标', action: '系统学习良好，可加量' }
      }
      if (Math.abs(costRatio - 1.0) <= 0.2) {
        return { ...baseAssessment, grade: 'B', label: '✅ oCPM正常', issue: '成本偏离 < 20%', action: '继续观察，给系统学习时间' }
      }
      if (conversions < 50) {
        return { ...baseAssessment, grade: 'C', label: '⚠️ oCPM学习不足', issue: '样本太少', action: '等待 50+ 转化再判断' }
      }
      return { ...baseAssessment, grade: 'D', label: '❌ oCPM偏离', issue: '成本偏离 > 20%', action: '调整目标成本或暂停' }
    
    case 'cpm':
      // CPM 特殊判断：曝光 + CTR
      if (ctr >= 0.02) {
        return { ...baseAssessment, grade: 'A', label: '🌟 CPM效果好', issue: '曝光有点击', action: '继续品牌曝光' }
      }
      if (ctr < 0.01) {
        return { ...baseAssessment, grade: 'D', label: '❌ CPM浪费', issue: '曝光没人点', action: '优化素材或换渠道' }
      }
      return { ...baseAssessment, grade: 'B', label: '✅ CPM正常', issue: '品牌曝光达标', action: '维持' }
    
    case 'cps':
      // CPS 特殊判断：分成比
      return { ...baseAssessment, grade: 'B', label: '✅ CPS低风险', issue: '按流水分成', action: '关注分成比（通常 30-50%）' }
    
    default:
      // CPA 激活/注册
      if (costRatio <= 1.0) {
        return { ...baseAssessment, grade: 'A', label: '🌟 CPA达标', issue: '成本在目标内', action: '加量' }
      }
      return { ...baseAssessment, grade: 'C', label: '⚠️ CPA偏高', issue: '成本略高', action: '优化素材/人群' }
  }
}

function buildBidTypeAnalysisCard(config) {
  const { bidType, currentCost, targetCost, conversions, ctr, cvr, genre } = config
  
  const info = BID_TYPE_INFO[bidType] || BID_TYPE_INFO.cpi
  const assessment = assessBidType(bidType, currentCost, targetCost, conversions, ctr, cvr)
  
  // 卡片颜色
  const templateColor = assessment.grade === 'A' ? 'green' : assessment.grade === 'D' ? 'red' : assessment.grade === 'B' ? 'blue' : 'orange'
  
  const elements = [
    // 出价方式说明
    { tag: 'markdown', content: `**${info.name}**` },
    { tag: 'markdown', content: `- 关注指标：${info.focus}` },
    { tag: 'markdown', content: `- 适用场景：${info.bestFor}` },
    { tag: 'hr' },
    
    // 当前状态
    { tag: 'markdown', content: `**当前成本**：${money(currentCost)} ｜ **目标成本**：${money(targetCost)}` },
    ...(ctr ? [{ tag: 'markdown', content: `**CTR**：${pct(ctr)} ｜ **CVR**：${pct(cvr)}` }] : []),
    ...(conversions ? [{ tag: 'markdown', content: `**转化数**：${conversions}` }] : []),
    { tag: 'markdown', content: `**${assessment.label}**` },
    { tag: 'markdown', content: `- ${assessment.issue} → ${assessment.action}` },
    { tag: 'hr' },
    
    // 风险提醒
    { tag: 'markdown', content: '**⚠️ 风险提醒**' },
    { tag: 'markdown', content: `- ${info.risk}` },
    { tag: 'markdown', content: `- ${info.warning}` },
    { tag: 'hr' },
    
    // 优化建议
    { tag: 'markdown', content: '**📌 优化建议**' },
    { tag: 'markdown', content: `- ${info.optimization}` },
    ...(bidType === 'cpc' && conversions >= 50 ? [
      { tag: 'markdown', content: `- 有足够转化数据，建议转为 CPI/CPA 出价` }
    ] : []),
    ...(bidType === 'ocpm' && conversions < 50 ? [
      { tag: 'markdown', content: `- 等待 50+ 转化再判断系统学习效果` }
    ] : []),
    ...(bidType === 'cpi' && assessment.grade === 'A' ? [
      { tag: 'markdown', content: `- CPI达标，加量 20-30%，扩展 GEO/渠道` }
    ] : []),
    { tag: 'markdown', content: `- 出价方式越靠近真实收益（付费 CPA、CPS），单价越贵` }
  ]
  
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `${info.name} 分析` },
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
  const bidType = getArg('bid-type', 'cpi')
  const currentCost = parseFloat(getArg('cost', '0.8'))
  const targetCost = parseFloat(getArg('target', '0.5'))
  const conversions = parseInt(getArg('conversions', '100'))
  const ctr = parseFloat(getArg('ctr', null))
  const cvr = parseFloat(getArg('cvr', null))
  const genre = getArg('genre', null)
  
  const card = buildBidTypeAnalysisCard({ bidType, currentCost, targetCost, conversions, ctr, cvr, genre })
  console.log(JSON.stringify(card, null, 2))
}

module.exports = { buildBidTypeAnalysisCard, assessBidType, BID_TYPE_INFO }
if (require.main === module) main()