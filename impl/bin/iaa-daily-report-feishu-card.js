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

function buildCard(result) {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `IAA日报分析 - ${result.date}` },
      template: result.summary.overallZone.includes('利润') ? 'green' : result.summary.overallZone.includes('风险') ? 'orange' : 'blue'
    },
    elements: [
      { tag: 'markdown', content: `**产品**：${result.productType === 'file_repair' ? '文件修复' : '清理'}` },
      { tag: 'markdown', content: `**总盘**：${result.summary.overallZone} ｜ **建议**：${result.summary.action}` },
      { tag: 'hr' },
      { tag: 'markdown', content: `**美加澳**：${result.regions.uscaau.zone} ｜ ${result.regions.uscaau.advice}` },
      { tag: 'markdown', content: `**日韩**：${result.regions.jpkr.zone} ｜ ${result.regions.jpkr.advice}` },
      { tag: 'hr' },
      { tag: 'markdown', content: `**核心原因**：${result.summary.coreReason.join('；')}` }
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
