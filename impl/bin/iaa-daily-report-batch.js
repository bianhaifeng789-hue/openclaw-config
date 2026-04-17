#!/usr/bin/env node
/**
 * IAA Daily Report Batch Analyzer
 * 读取固定CSV模板，逐行生成分析结论
 */
const fs = require('fs');
const path = require('path');
const { buildNarrative } = require('./iaa-daily-report-analyzer');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').trim();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

function mapRow(row) {
  return {
    date: row.date,
    h1Roi: row.h1_roi,
    h6Roi: row.h6_roi,
    h12Roi: row.h12_roi,
    d0Roi: row.d0_roi,
    uscaauH1: row.uscaau_h1_roi,
    uscaauH6: row.uscaau_h6_roi,
    uscaauH12: row.uscaau_h12_roi,
    uscaauD0: row.uscaau_d0_roi,
    jpkrH1: row.jpkr_h1_roi,
    jpkrH6: row.jpkr_h6_roi,
    jpkrH12: row.jpkr_h12_roi,
    jpkrD0: row.jpkr_d0_roi,
    uscaauCpi: row.uscaau_cpi,
    jpkrCpi: row.jpkr_cpi
  };
}

function renderBrief(result) {
  return {
    date: result.date,
    productType: result.productType,
    overall: `${result.summary.overallZone} / ${result.summary.action}`,
    uscaau: `${result.regions.uscaau.zone} / ${result.regions.uscaau.advice}`,
    jpkr: `${result.regions.jpkr.zone} / ${result.regions.jpkr.advice}`,
    reasons: result.summary.coreReason.join('；')
  };
}

function main() {
  const filePath = process.argv[2] || path.join(process.cwd(), 'templates/iaa-daily-report-template.csv');
  const rows = readCsv(filePath);
  const results = rows.map(row => buildNarrative(mapRow(row), row.product_type || 'file_repair'));
  console.log(JSON.stringify({
    filePath,
    total: results.length,
    reports: results,
    brief: results.map(renderBrief)
  }, null, 2));
}

module.exports = { readCsv, mapRow, renderBrief };
if (require.main === module) main();
