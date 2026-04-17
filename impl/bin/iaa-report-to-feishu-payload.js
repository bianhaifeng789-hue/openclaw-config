#!/usr/bin/env node
/**
 * IAA 日报飞书发送载荷生成器
 * 输出 message 工具可直接发送的 JSON 载荷
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
  const messages = rows.map(row => {
    const result = buildNarrative(mapRow(row), row.product_type || 'file_repair');
    return {
      date: result.date,
      format,
      card: buildCard(result),
      text: toText(result)
    };
  });

  if (format === 'text') {
    console.log(JSON.stringify({
      action: 'send',
      channel: 'feishu',
      message: messages.map(m => m.text).join('\n\n' + '='.repeat(40) + '\n\n')
    }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    action: 'send',
    channel: 'feishu',
    cards: messages.map(m => m.card)
  }, null, 2));
}

if (require.main === module) main();
