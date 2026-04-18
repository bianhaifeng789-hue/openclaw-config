#!/usr/bin/env node

const fs = require('fs')

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function pct(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return 'N/A'
  return `${(n * 100).toFixed(1)}%`
}

function num(n, d = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return 'N/A'
  return Number(n).toFixed(d)
}

function analyzeCreative(row, avgCtr, avgCvr, avgCpi, avgRoas) {
  const ctr = row.clicks > 0 && row.impressions > 0 ? row.clicks / row.impressions : 0
  const cvr = row.installs > 0 && row.clicks > 0 ? row.installs / row.clicks : 0
  const cpi = row.installs > 0 ? row.spend / row.installs : Infinity
  const roas = row.roas ?? 0

  const tags = []
  const actions = []

  if (ctr >= avgCtr * 1.1) tags.push('high_ctr')
  if (cvr >= avgCvr * 1.1) tags.push('high_cvr')
  if (cpi <= avgCpi * 0.9) tags.push('efficient_cpi')
  if (roas >= avgRoas * 1.05) tags.push('strong_roas')

  if (ctr < avgCtr * 0.8) tags.push('weak_hook')
  if (cvr < avgCvr * 0.8) tags.push('weak_conversion')
  if (cpi > avgCpi * 1.2) tags.push('high_cpi')
  if (roas < avgRoas * 0.85) tags.push('weak_roas')

  if (row.ctr_trend !== undefined && row.ctr_trend <= -0.2) tags.push('fatigue_risk')
  if (row.cpi_trend !== undefined && row.cpi_trend >= 0.2) tags.push('fatigue_risk')

  if (tags.includes('high_ctr') && tags.includes('efficient_cpi') && !tags.includes('weak_roas')) {
    actions.push('scale')
  } else if (tags.includes('weak_hook') || tags.includes('high_cpi')) {
    actions.push('pause_or_replace')
  } else {
    actions.push('keep_testing')
  }

  return { ...row, ctr, cvr, cpi, roas, tags, actions }
}

function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: node creative-analyzer.js <data.json>')
    process.exit(1)
  }

  const rows = readJson(file)
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error('Input must be a non-empty JSON array')
    process.exit(1)
  }

  const metrics = rows.map(r => ({
    ctr: r.clicks > 0 && r.impressions > 0 ? r.clicks / r.impressions : 0,
    cvr: r.installs > 0 && r.clicks > 0 ? r.installs / r.clicks : 0,
    cpi: r.installs > 0 ? r.spend / r.installs : Infinity,
    roas: r.roas ?? 0,
  }))

  const avgCtr = metrics.reduce((a, b) => a + b.ctr, 0) / metrics.length
  const avgCvr = metrics.reduce((a, b) => a + b.cvr, 0) / metrics.length
  const finiteCpi = metrics.filter(m => Number.isFinite(m.cpi))
  const avgCpi = finiteCpi.reduce((a, b) => a + b.cpi, 0) / Math.max(finiteCpi.length, 1)
  const avgRoas = metrics.reduce((a, b) => a + b.roas, 0) / metrics.length

  const analyzed = rows.map(r => analyzeCreative(r, avgCtr, avgCvr, avgCpi, avgRoas))
  const winners = analyzed.filter(x => x.actions.includes('scale'))
  const losers = analyzed.filter(x => x.actions.includes('pause_or_replace'))

  console.log('# Creative Performance Report')
  console.log('')
  console.log(`Average CTR: ${pct(avgCtr)}`)
  console.log(`Average CVR: ${pct(avgCvr)}`)
  console.log(`Average CPI: $${num(avgCpi)}`)
  console.log(`Average ROAS: ${pct(avgRoas)}`)
  console.log('')
  console.log('## Winner Creatives')
  if (winners.length === 0) console.log('- None yet')
  for (const w of winners) {
    console.log(`- ${w.name}: CTR ${pct(w.ctr)}, CVR ${pct(w.cvr)}, CPI $${num(w.cpi)}, ROAS ${pct(w.roas)} | ${w.tags.join(', ')}`)
  }
  console.log('')
  console.log('## Underperforming Creatives')
  if (losers.length === 0) console.log('- None yet')
  for (const l of losers) {
    console.log(`- ${l.name}: CTR ${pct(l.ctr)}, CVR ${pct(l.cvr)}, CPI $${num(l.cpi)}, ROAS ${pct(l.roas)} | ${l.tags.join(', ')}`)
  }
  console.log('')
  console.log('## All Creatives')
  for (const item of analyzed) {
    console.log(`- ${item.name}: action=${item.actions.join(',')} | CTR ${pct(item.ctr)} | CVR ${pct(item.cvr)} | CPI $${num(item.cpi)} | ROAS ${pct(item.roas)}`)
  }
}

main()
