#!/usr/bin/env node

const fs = require('fs')

function parseReport(text) {
  const lines = text.split(/\r?\n/)
  const title = lines.find(line => line.startsWith('# '))?.replace(/^#\s+/, '') || 'Media Buying Report'
  const summary = []
  const highlights = []
  const risks = []
  const actions = []

  let section = ''
  for (const line of lines) {
    if (line.startsWith('## ')) section = line.replace(/^##\s+/, '').trim()
    else if (line.startsWith('- ')) {
      if (section === 'Summary') summary.push(line)
      else if (section === 'Highlights') highlights.push(line)
      else if (section === 'Risks') risks.push(line)
      else if (section === 'Recommended Actions') actions.push(line)
    }
  }

  return { title, summary, highlights, risks, actions }
}

function buildCard({ title, summary, highlights, risks, actions }) {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `📊 ${title}` },
      template: 'blue'
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: [
            '**Summary**',
            ...(summary.length ? summary : ['- No summary']),
            '',
            '**Highlights**',
            ...(highlights.length ? highlights : ['- No highlights']),
            '',
            '**Risks**',
            ...(risks.length ? risks : ['- No risks']),
            '',
            '**Recommended Actions**',
            ...(actions.length ? actions : ['- No actions'])
          ].join('\n')
        }
      }
    ]
  }
}

function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Usage: node media-buying-send-payload.js <report.md>')
    process.exit(1)
  }
  const text = fs.readFileSync(file, 'utf8')
  const parsed = parseReport(text)
  const card = buildCard(parsed)
  console.log(JSON.stringify(card, null, 2))
}

main()
