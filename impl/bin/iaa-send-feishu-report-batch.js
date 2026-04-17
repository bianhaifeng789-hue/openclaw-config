#!/usr/bin/env node
/**
 * IAA 日报批量发送到飞书
 * 用法：
 *   node impl/bin/iaa-send-feishu-report-batch.js --file=templates/iaa-daily-report-template.csv --format=card
 *   node impl/bin/iaa-send-feishu-report-batch.js --file=templates/iaa-daily-report-template.csv --format=text
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
  const filePath = getArg('file', path.join(process.cwd(), 'templates/iaa-daily-report-template.csv'));
  const format = getArg('format', 'card');
  const rows = readCsv(filePath);
  const reports = rows.map((row, index) => {
    const result = buildNarrative(mapRow(row), row.product_type || 'file_repair');
    return {
      index,
      date: result.date,
      text: toText(result),
      card: buildCard(result)
    };
  });

  if (format === 'text') {
    console.log(JSON.stringify({
      action: 'send',
      channel: 'feishu',
      message: reports.map(r => r.text).join('\n\n' + '='.repeat(40) + '\n\n'),
      total: reports.length
    }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    action: 'send',
    channel: 'feishu',
    total: reports.length,
    cards: reports.map(r => r.card)
  }, null, 2));
}

if (require.main === module) main();
