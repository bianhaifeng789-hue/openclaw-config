#!/usr/bin/env node

const fs = require('fs')
const { spawnSync } = require('child_process')

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',').map(x => x.trim())
  return lines.slice(1).filter(Boolean).map(line => {
    const values = line.split(',')
    const obj = {}
    headers.forEach((h, i) => {
      const raw = (values[i] ?? '').trim()
      const num = Number(raw)
      obj[h] = raw !== '' && !Number.isNaN(num) ? num : raw
    })
    return obj
  })
}

function loadData(path) {
  const raw = fs.readFileSync(path, 'utf8')
  if (path.endsWith('.json')) return JSON.parse(raw)
  if (path.endsWith('.csv')) return parseCsv(raw)
  throw new Error('Only .json and .csv are supported')
}

function writeTempJson(data) {
  const path = `/tmp/media-buying-${Date.now()}.json`
  fs.writeFileSync(path, JSON.stringify(data, null, 2))
  return path
}

function runScript(scriptName, file, extra = []) {
  const scriptPath = `/Users/mar2game/.openclaw/workspace/scripts/${scriptName}`
  const result = spawnSync('node', [scriptPath, file, ...extra], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 1)
}

function main() {
  const command = process.argv[2]
  const input = process.argv[3]
  const mode = process.argv[4]

  if (!command || !input) {
    console.error('Usage: node media-buying-cli.js <creative|campaign|report> <file.json|file.csv> [daily|weekly]')
    process.exit(1)
  }

  const data = loadData(input)
  const tempFile = writeTempJson(data)

  if (command === 'creative') {
    runScript('creative-analyzer.js', tempFile)
  } else if (command === 'campaign') {
    runScript('campaign-diagnoser.js', tempFile)
  } else if (command === 'report') {
    runScript('ads-report-cli.js', tempFile, [mode || 'daily'])
  } else {
    console.error('Unknown command. Use creative | campaign | report')
    process.exit(1)
  }
}

main()
