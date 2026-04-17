#!/usr/bin/env node
/**
 * 从固定CSV模板直接生成中文日报结论
 */
const path = require('path');
const { readCsv, mapRow } = require('./iaa-daily-report-batch');
const { buildNarrative } = require('./iaa-daily-report-analyzer');
const { toText } = require('./iaa-daily-report-to-text');

function main() {
  const filePath = process.argv[2] || path.join(process.cwd(), 'templates/iaa-daily-report-template.csv');
  const rows = readCsv(filePath);
  const reports = rows.map(row => {
    const result = buildNarrative(mapRow(row), row.product_type || 'file_repair');
    return toText(result);
  });
  console.log(reports.join('\n\n' + '='.repeat(40) + '\n\n'));
}

if (require.main === module) main();
