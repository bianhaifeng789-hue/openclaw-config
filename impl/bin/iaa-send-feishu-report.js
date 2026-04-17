#!/usr/bin/env node
/**
 * IAA 日报直接发送到飞书
 * 用法：
 *   node impl/bin/iaa-send-feishu-report.js --file=templates/iaa-daily-report-template.csv --index=0 --format=card
 *   node impl/bin/iaa-send-feishu-report.js --file=templates/iaa-daily-report-template.csv --index=0 --format=text
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
  const index = Number(getArg('index', '0'));
  const format = getArg('format', 'card');
  const rows = readCsv(filePath);
  if (!rows.length) throw new Error('CSV为空，没有可发送数据');
  if (Number.isNaN(index) || index < 0 || index >= rows.length) {
    throw new Error(`index 超出范围，当前共有 ${rows.length} 条，收到 ${index}`);
  }

  const row = rows[index];
  const result = buildNarrative(mapRow(row), row.product_type || 'file_repair');
  const text = toText(result);
  const card = buildCard(result);

  if (format === 'text') {
    console.log(JSON.stringify({
      action: 'send',
      channel: 'feishu',
      message: text
    }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    action: 'send',
    channel: 'feishu',
    card
  }, null, 2));
}

if (require.main === module) main();
