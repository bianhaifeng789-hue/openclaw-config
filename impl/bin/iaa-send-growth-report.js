#!/usr/bin/env node
/**
 * IAA 增长协同日报发送载荷生成器
 */
const path = require('path');
const { readCsv, mapRow } = require('./iaa-daily-report-batch');
const { buildNarrative } = require('./iaa-daily-report-analyzer');
const { buildOrchestratedReport, buildGrowthCard, toText } = require('./iaa-growth-orchestrator');

function getArg(name, def = null) {
  const args = process.argv.slice(2);
  const index = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (index === -1) return def;
  const exact = args[index];
  if (exact.includes('=')) return exact.split('=').slice(1).join('=');
  return args[index + 1] ?? def;
}

function main() {
  const filePath = getArg('file', path.join(process.cwd(), 'templates/iaa-daily-report-template.csv'));
  const index = Number(getArg('index', '0'));
  const format = getArg('format', 'card');
  const rows = readCsv(filePath);
  if (!rows.length) throw new Error('CSV为空，没有可发送数据');
  if (Number.isNaN(index) || index < 0 || index >= rows.length) {
    throw new Error(`index 超出范围，当前共有 ${rows.length} 条，收到 ${index}`);
  }

  const row = rows[index];
  const base = buildNarrative(mapRow(row), row.product_type || 'file_repair');
  const report = buildOrchestratedReport(base);

  if (format === 'text') {
    console.log(JSON.stringify({
      action: 'send',
      channel: 'feishu',
      message: toText(report)
    }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    action: 'send',
    channel: 'feishu',
    card: buildGrowthCard(report)
  }, null, 2));
}

if (require.main === module) main();
