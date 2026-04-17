#!/usr/bin/env node
/**
 * 从固定CSV模板直接生成飞书卡片 JSON
 */
const path = require('path');
const { readCsv, mapRow } = require('./iaa-daily-report-batch');
const { buildNarrative } = require('./iaa-daily-report-analyzer');
const { buildCard } = require('./iaa-daily-report-feishu-card');

function main() {
  const filePath = process.argv[2] || path.join(process.cwd(), 'templates/iaa-daily-report-template.csv');
  const rows = readCsv(filePath);
  const cards = rows.map(row => {
    const result = buildNarrative(mapRow(row), row.product_type || 'file_repair');
    return buildCard(result);
  });
  console.log(JSON.stringify({ filePath, total: cards.length, cards }, null, 2));
}

if (require.main === module) main();
