#!/usr/bin/env node
/**
 * IAA Growth Orchestrator
 * 将 IAA 日报数据串成增长运营 4 Agent 闭环：
 * - ltv-analyst
 * - monetization
 * - creative-strategist
 * - ua-lead
 */
const path = require('path');
const { readCsv, mapRow } = require('./iaa-daily-report-batch');
const { buildNarrative } = require('./iaa-daily-report-analyzer');
const { buildCard } = require('./iaa-daily-report-feishu-card');

function getArg(name, def = null) {
  const args = process.argv.slice(2);
  const index = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (index === -1) return def;
  const exact = args[index];
  if (exact.includes('=')) return exact.split('=').slice(1).join('=');
  return args[index + 1] ?? def;
}

function ltvAnalyst(result) {
  const d0 = result.metrics.overall.d0;
  const jp = result.metrics.jpkr.d0;
  const us = result.metrics.uscaau.d0;
  const recovery = d0 >= 100 ? '短回收，可支持扩量' : d0 >= 85 ? '中性回收，适合保量' : '回收偏慢，不支持激进扩量';
  const quality = jp > us ? '日韩质量高于美加澳' : '美加澳质量不弱于日韩';
  return {
    role: 'ltv-analyst',
    summary: `${quality}；${recovery}`,
    advice: d0 >= 100 ? '允许向高质量地区倾斜预算' : d0 >= 85 ? '保持预算稳定，继续看次留与回收' : '压缩低质量流量，避免扩量'
  };
}

function monetization(result) {
  const usCpi = result.metrics.uscaau.cpi;
  const jpCpi = result.metrics.jpkr.cpi;
  const gap = +(usCpi - jpCpi).toFixed(2);
  const issue = gap > 0.2 ? '美加澳获量成本显著更高' : '各地区获量成本差距可控';
  return {
    role: 'monetization',
    summary: `${issue}`,
    advice: gap > 0.2 ? '优先优化高CPI地区的广告展示效率与收入密度' : '维持当前变现配置，重点看放量承接能力'
  };
}

function creativeStrategist(result) {
  const jpStrong = result.regions.jpkr.advice.includes('重点加量');
  const usWeak = result.regions.uscaau.advice.includes('降量');
  const summary = jpStrong ? '日韩方向素材适合继续放大' : '当前素材优势不够集中';
  const advice = jpStrong
    ? '优先扩写日韩高ROI素材母题，继续复制强开头与强转化表达'
    : usWeak
      ? '优先替换美加澳低效素材，减少高成本低转化方向'
      : '维持现有主力方向，小步测试新素材';
  return {
    role: 'creative-strategist',
    summary,
    advice
  };
}

function uaLead(result, inputs) {
  const regionPriority = result.regions.jpkr.advice.includes('重点加量') ? '预算优先给日韩' : '预算维持当前结构';
  const action = result.summary.action === '可加量'
    ? '总盘可继续放量，但只向高质量地区倾斜'
    : result.summary.action === '优先止损'
      ? '总盘进入止损状态，暂停扩量'
      : '总盘保量观察，等待更多后链路数据';
  return {
    role: 'ua-lead',
    summary: `${action}；${regionPriority}`,
    advice: [
      inputs.ltv.advice,
      inputs.monetization.advice,
      inputs.creative.advice
    ]
  };
}

function buildOrchestratedReport(result) {
  const ltv = ltvAnalyst(result);
  const monetizationAdvice = monetization(result);
  const creative = creativeStrategist(result);
  const ua = uaLead(result, { ltv, monetization: monetizationAdvice, creative });

  return {
    date: result.date,
    productType: result.productType,
    base: result,
    agents: { ltv, monetization: monetizationAdvice, creative, ua }
  };
}

function toText(report) {
  const productName = report.productType === 'file_repair' ? '文件修复' : '清理';
  return [
    `日期：${report.date}`,
    `产品：${productName}`,
    '',
    '一、增长运营四角结论',
    `- LTV留存分析官：${report.agents.ltv.summary}`,
    `- 变现优化官：${report.agents.monetization.summary}`,
    `- 素材策略官：${report.agents.creative.summary}`,
    `- 投放决策官：${report.agents.ua.summary}`,
    '',
    '二、UA最终动作',
    ...report.agents.ua.advice.map(v => `- ${v}`)
  ].join('\n');
}

function buildGrowthCard(report) {
  const baseCard = buildCard(report.base);
  baseCard.header.title.content = `IAA增长协同日报 - ${report.date}`;
  baseCard.elements.push({ tag: 'hr' });
  baseCard.elements.push({ tag: 'markdown', content: `**LTV留存分析官**：${report.agents.ltv.summary}` });
  baseCard.elements.push({ tag: 'markdown', content: `**变现优化官**：${report.agents.monetization.summary}` });
  baseCard.elements.push({ tag: 'markdown', content: `**素材策略官**：${report.agents.creative.summary}` });
  baseCard.elements.push({ tag: 'markdown', content: `**投放决策官**：${report.agents.ua.summary}` });
  baseCard.elements.push({ tag: 'markdown', content: `**最终动作**：${report.agents.ua.advice.join('；')}` });
  return baseCard;
}

function main() {
  const filePath = getArg('file', path.join(process.cwd(), 'templates/iaa-daily-report-template.csv'));
  const index = Number(getArg('index', '0'));
  const format = getArg('format', 'json');
  const rows = readCsv(filePath);
  if (!rows.length) throw new Error('CSV为空，没有可分析数据');
  if (Number.isNaN(index) || index < 0 || index >= rows.length) {
    throw new Error(`index 超出范围，当前共有 ${rows.length} 条，收到 ${index}`);
  }

  const row = rows[index];
  const result = buildNarrative(mapRow(row), row.product_type || 'file_repair');
  const report = buildOrchestratedReport(result);

  if (format === 'text') {
    console.log(toText(report));
    return;
  }

  if (format === 'card') {
    console.log(JSON.stringify(buildGrowthCard(report), null, 2));
    return;
  }

  console.log(JSON.stringify(report, null, 2));
}

module.exports = {
  ltvAnalyst,
  monetization,
  creativeStrategist,
  uaLead,
  buildOrchestratedReport,
  buildGrowthCard,
  toText
};

if (require.main === module) main();
