#!/usr/bin/env node
/**
 * IAA 固定日报机器人入口
 * 统一输出 text / feishu-card / both
 */
const path = require('path');
const { readCsv, mapRow } = require('./iaa-daily-report-batch');
const { buildNarrative } = require('./iaa-daily-report-analyzer');
const { toText } = require('./iaa-daily-report-to-text');
const { buildCard } = require('./iaa-daily-report-feishu-card');

function getArg(name, def = null) {
  const args = process.argv.slice(2);
  const index = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (index === -1) return def;
  const exact = args[index];
  if (exact.includes('=')) return exact.split('=').slice(1).join('=');
  return args[index + 1] ?? def;
}

function main() {
  const mode = getArg('mode', 'both');
  const filePath = getArg('file', path.join(process.cwd(), 'templates/iaa-daily-report-template.csv'));
  const rows = readCsv(filePath);
  const reports = rows.map(row => {
    const result = buildNarrative(mapRow(row), row.product_type || 'file_repair');
    return {
      date: result.date,
      productType: result.productType,
      text: toText(result),
      card: buildCard(result)
    };
  });

  if (mode === 'text') {
    console.log(reports.map(r => r.text).join('\n\n' + '='.repeat(40) + '\n\n'));
    return;
  }

  if (mode === 'card') {
    console.log(JSON.stringify({ filePath, total: reports.length, cards: reports.map(r => r.card) }, null, 2));
    return;
  }

  console.log(JSON.stringify({ filePath, total: reports.length, reports }, null, 2));
}

if (require.main === module) main();
