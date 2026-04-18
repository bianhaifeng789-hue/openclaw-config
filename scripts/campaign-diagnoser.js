#!/usr/bin/env node

const fs = require('fs')

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function analyze(row) {
  const ctr = row.impressions > 0 ? row.clicks / row.impressions : 0
  const cvr = row.clicks > 0 ? row.conversions / row.clicks : 0
  const cpa = row.conversions > 0 ? row.spend / row.conversions : Infinity
  const roas = row.roas ?? 0

  const findings = []
  const actions = []

  if (row.spend < row.minSpendThreshold && row.conversions === 0) {
    findings.push('delivery weak / insufficient spend')
    actions.push('check bid, audience width, optimization event')
  }
  if (ctr < row.targetCtr) {
    findings.push('creative weakness likely')
    actions.push('replace hook / improve creative CTR')
  }
  if (ctr >= row.targetCtr && cvr < row.targetCvr) {
    findings.push('click quality or landing mismatch')
    actions.push('check audience match and store page')
  }
  if (Number.isFinite(cpa) && cpa > row.targetCpa) {
    findings.push('acquisition cost too high')
    actions.push('reduce budget or tighten targeting')
  }
  if (roas < row.targetRoas) {
    findings.push('payback below target')
    actions.push('check retention, event quality, monetization')
  }
  if (findings.length === 0) {
    findings.push('campaign healthy')
    actions.push('maintain or scale carefully')
  }

  return { ...row, ctr, cvr, cpa, roas, findings, actions }
}

function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: node campaign-diagnoser.js <data.json>')
    process.exit(1)
  }

  const rows = readJson(file)
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error('Input must be a non-empty JSON array')
    process.exit(1)
  }

  const analyzed = rows.map(analyze)

  console.log('# Campaign Diagnosis')
  console.log('')
  for (const row of analyzed) {
    console.log(`## ${row.name}`)
    console.log(`- CTR: ${pct(row.ctr)}`)
    console.log(`- CVR: ${pct(row.cvr)}`)
    console.log(`- CPA: ${Number.isFinite(row.cpa) ? `$${row.cpa.toFixed(2)}` : 'N/A'}`)
    console.log(`- ROAS: ${pct(row.roas)}`)
    console.log(`- Findings: ${row.findings.join('; ')}`)
    console.log(`- Actions: ${row.actions.join('; ')}`)
    console.log('')
  }
}

main()
