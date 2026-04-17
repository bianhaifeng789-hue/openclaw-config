#!/usr/bin/env node
/**
 * 生成飞书日报卡片 JSON（供 message/feishu 使用）
 */
const { buildNarrative } = require('./iaa-daily-report-analyzer');

function getArg(name, def = null) {
  const args = process.argv.slice(2);
  const index = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (index === -1) return def;
  const exact = args[index];
  if (exact.includes('=')) return exact.split('=').slice(1).join('=');
  return args[index + 1] ?? def;
}

function pct(v) {
  const n = Number(v || 0);
  return `${n.toFixed(2)}%`;
}

function money(v) {
  const n = Number(v || 0);
  return `$${n.toFixed(2)}`;
}

function regionLine(name, region, metrics) {
  return `**${name}**：${region.zone} ｜ ${region.advice}\nH1 ${pct(metrics.h1)} / H6 ${pct(metrics.h6)} / H12 ${pct(metrics.h12)} / D0 ${pct(metrics.d0)} ｜ CPI ${money(metrics.cpi)}`;
}

function buildCard(result) {
  const template = result.summary.overallZone.includes('利润')
    ? 'green'
    : result.summary.overallZone.includes('风险') || result.summary.overallZone.includes('止损')
      ? 'orange'
      : 'blue';

  const productName = result.productType === 'file_repair' ? '文件修复' : '清理';
  const overallMetrics = result.metrics?.overall || {};
  const usMetrics = result.metrics?.uscaau || {};
  const jpMetrics = result.metrics?.jpkr || {};

  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `IAA正式日报 - ${result.date}` },
      template
    },
    elements: [
      { tag: 'markdown', content: `**产品**：${productName}` },
      { tag: 'markdown', content: `**总盘结论**：${result.summary.overallZone} ｜ **操作建议**：${result.summary.action}` },
      { tag: 'markdown', content: `**总盘ROI**：H1 ${pct(overallMetrics.h1)} / H6 ${pct(overallMetrics.h6)} / H12 ${pct(overallMetrics.h12)} / D0 ${pct(overallMetrics.d0)}` },
      { tag: 'hr' },
      { tag: 'markdown', content: regionLine('美加澳', result.regions.uscaau, usMetrics) },
      { tag: 'markdown', content: regionLine('日韩', result.regions.jpkr, jpMetrics) },
      { tag: 'hr' },
      { tag: 'markdown', content: `**核心原因**：${result.summary.coreReason.join('；')}` },
      { tag: 'markdown', content: `**执行建议**：优先按地区ROI分配预算，强利润区承接放量，弱区控量并持续观察素材与CPI。` }
    ]
  };
}

function main() {
  const input = {
    date: getArg('date', ''),
    h1Roi: getArg('h1', 0),
    h6Roi: getArg('h6', 0),
    h12Roi: getArg('h12', 0),
    d0Roi: getArg('d0', 0),
    uscaauH1: getArg('us-h1', 0),
    uscaauH6: getArg('us-h6', 0),
    uscaauH12: getArg('us-h12', 0),
    uscaauD0: getArg('us-d0', 0),
    jpkrH1: getArg('jp-h1', 0),
    jpkrH6: getArg('jp-h6', 0),
    jpkrH12: getArg('jp-h12', 0),
    jpkrD0: getArg('jp-d0', 0),
    uscaauCpi: getArg('us-cpi', 0),
    jpkrCpi: getArg('jp-cpi', 0)
  };
  const result = buildNarrative(input, getArg('product', 'file_repair'));
  console.log(JSON.stringify(buildCard(result), null, 2));
}

module.exports = { buildCard };
if (require.main === module) main();
