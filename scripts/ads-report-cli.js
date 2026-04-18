#!/usr/bin/env node

const fs = require('fs')

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function sum(arr, key) {
  return arr.reduce((a, b) => a + (Number(b[key]) || 0), 0)
}

function pct(v) {
  return `${(v * 100).toFixed(1)}%`
}

function money(v) {
  return `$${Number(v).toFixed(2)}`
}

function main() {
  const file = process.argv[2]
  const mode = process.argv[3] || 'daily'

  if (!file) {
    console.error('Usage: node ads-report-cli.js <data.json> [daily|weekly]')
    process.exit(1)
  }

  const rows = readJson(file)
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error('Input must be a non-empty JSON array')
    process.exit(1)
  }

  const spend = sum(rows, 'spend')
  const impressions = sum(rows, 'impressions')
  const clicks = sum(rows, 'clicks')
  const installs = sum(rows, 'installs')
  const revenue = sum(rows, 'revenue')

  const ctr = impressions > 0 ? clicks / impressions : 0
  const cvr = clicks > 0 ? installs / clicks : 0
  const cpi = installs > 0 ? spend / installs : 0
  const roas = spend > 0 ? revenue / spend : 0

  const sortedByRoas = [...rows].sort((a, b) => (b.roas || 0) - (a.roas || 0))
  const sortedByCpi = [...rows].sort((a, b) => (b.cpi || 999999) - (a.cpi || 999999))

  console.log(`# Ads ${mode === 'weekly' ? 'Weekly' : 'Daily'} Report`)
  console.log('')
  console.log('## Summary')
  console.log(`- Total Spend: ${money(spend)}`)
  console.log(`- Total Impressions: ${impressions}`)
  console.log(`- Total Clicks: ${clicks}`)
  console.log(`- Total Installs: ${installs}`)
  console.log(`- CTR: ${pct(ctr)}`)
  console.log(`- CVR: ${pct(cvr)}`)
  console.log(`- CPI: ${money(cpi)}`)
  console.log(`- ROAS: ${pct(roas)}`)
  console.log('')
  console.log('## Highlights')
  for (const item of sortedByRoas.slice(0, 3)) {
    console.log(`- ${item.name}: ROAS ${pct(item.roas || 0)}, Spend ${money(item.spend || 0)}`)
  }
  console.log('')
  console.log('## Risks')
  for (const item of sortedByCpi.slice(0, 3)) {
    console.log(`- ${item.name}: CPI ${money(item.cpi || 0)}, ROAS ${pct(item.roas || 0)}`)
  }
  console.log('')
  console.log('## Recommended Actions')
  console.log('- Increase budget on top-ROAS units carefully')
  console.log('- Review high-CPI units for creative or targeting issues')
  console.log('- Keep testing new creatives if CTR weak but scale potential exists')
}

main()
