#!/usr/bin/env node
const fs = require('fs');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
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

const file = process.argv[2];
if (!file) {
  console.error('Usage: node advise-campaign-scaling.js <csv-path>');
  process.exit(1);
}
const rows = parseCsv(fs.readFileSync(file, 'utf8'));

const results = rows.map(r => {
  const name = r.campaign || 'unknown';
  const target = num(r.target_roas);
  const d1 = num(r.actual_d1_roas);
  const d3 = num(r.actual_d3_roas);
  const d7 = num(r.actual_d7_roas);
  const delivery = r.delivery_status || 'stable';
  const volume = r.volume_signal || 'stable';
  const age = num(r.age_days);
  const spend = num(r.spend);

  const mainWindow = d3 > 0 ? 'D3' : d1 > 0 ? 'D1' : 'D7';
  const mainRoas = d3 > 0 ? d3 : d1 > 0 ? d1 : d7;
  const catchup = d3 > d1 || d7 > d3;

  let action = 'hold';
  let budget = '0%';
  let reason = 'Signal mixed; keep observing.';

  if ((delivery === 'limited' || delivery === 'stable') && mainRoas >= target * 0.95 && age >= 3 && volume !== 'weak') {
    action = 'scale';
    budget = age < 7 ? '+10%' : '+15% to +20%';
    reason = 'Recovery is near/above target with enough maturity to expand.';
  } else if (age < 2 || spend < 100) {
    action = 'hold';
    budget = '0%';
    reason = 'Too early or too little spend to scale confidently.';
  } else if (mainRoas < target * 0.75 && !catchup) {
    action = 'pause';
    budget = '-100%';
    reason = 'Recovery is clearly below target with weak catch-up.';
  } else if (mainRoas < target) {
    action = 'trim';
    budget = '-10% to -20%';
    reason = 'Below target; reduce pressure and watch recovery.';
  }

  return {
    campaign: name,
    action,
    suggestedBudgetChange: budget,
    mainDecisionWindow: mainWindow,
    mainRoas,
    targetRoas: target,
    reason
  };
}).sort((a, b) => {
  const score = x => x.action === 'scale' ? 3 : x.action === 'hold' ? 2 : x.action === 'trim' ? 1 : 0;
  return score(b) - score(a);
});

console.log(JSON.stringify({ campaigns: results }, null, 2));
