#!/usr/bin/env node

const { spawnSync } = require('child_process')

const base = '/Users/mar2game/.openclaw/workspace'
const cli = `${base}/scripts/media-buying-cli.js`

const tests = [
  ['creative', `${base}/examples/media-buying/creative-data.csv`],
  ['campaign', `${base}/examples/media-buying/campaign-data.csv`],
  ['report', `${base}/examples/media-buying/report-data.csv`, 'weekly'],
]

for (const args of tests) {
  const result = spawnSync('node', [cli, ...args], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 1)
  console.log('\n==============================\n')
}
