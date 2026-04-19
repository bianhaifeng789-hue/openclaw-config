#!/usr/bin/env node
const fs = require('fs');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV needs header and at least one data row');
  const headers = lines[0].split(',').map(s => s.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const row = {};
    headers.forEach((h, i) => row[h] = (cols[i] || '').trim());
    return row;
  });
}

function num(v) {
  const n = Number(String(v || '').replace(/[$%\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function pct(v) {
  return `${(v * 100).toFixed(1)}%`;
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node analyze-recovery.js <csv-path>');
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(file, 'utf8'));
let spend = 0, d0 = 0, d1 = 0, d3 = 0, d7 = 0;
for (const r of rows) {
  spend += num(r.spend);
  d0 += num(r.d0_revenue);
  d1 += num(r.d1_revenue);
  d3 += num(r.d3_revenue);
  d7 += num(r.d7_revenue);
}
if (spend <= 0) {
  console.error('Spend must be > 0');
  process.exit(2);
}
const roas = {
  d0: d0 / spend,
  d1: d1 / spend,
  d3: d3 / spend,
  d7: d7 / spend,
};
let model = 'long-payback';
let window = 'D7';
if (roas.d0 >= 0.35 || roas.d1 >= 0.5) {
  model = 'fast-payback';
  window = roas.d0 >= 0.35 ? 'D0' : 'D1';
} else if (roas.d1 >= 0.3 || roas.d3 >= 0.5) {
  model = 'medium-payback';
  window = roas.d1 >= 0.3 ? 'D1' : 'D3';
}

const result = {
  spend,
  revenue: { d0, d1, d3, d7 },
  roas,
  model,
  recommendedOptimizationWindow: window,
  interpretation: {
    summary: `${model} based on recovery curve from D0-D7`,
    earlySignalReliable: roas.d0 >= 0.35 || roas.d1 >= 0.5,
    warning: model === 'long-payback'
      ? 'Do not over-constrain early ROAS targets or delivery may choke.'
      : model === 'medium-payback'
      ? 'Avoid overreacting to same-day noise; use D1/D3 as primary controls.'
      : 'Early ROAS can be used more directly for account control.'
  },
  display: {
    d0: pct(roas.d0),
    d1: pct(roas.d1),
    d3: pct(roas.d3),
    d7: pct(roas.d7),
  }
};

console.log(JSON.stringify(result, null, 2));
