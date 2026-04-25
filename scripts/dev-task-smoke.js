#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const agentsPath = path.join(root, 'AGENTS.md');
const pkgPath = path.join(root, 'package.json');

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function check(name, ok, detail) {
  return { name, ok: Boolean(ok), detail };
}

const agents = readText(agentsPath);
const pkg = JSON.parse(readText(pkgPath));

const checks = [
  check(
    'feishu execution-first rule exists',
    agents.includes('## Feishu Execution Rule / 执行优先') && agents.includes('execute first, then report'),
    'AGENTS.md should tell Feishu DM runs to execute before reporting'
  ),
  check(
    'package name is present',
    typeof pkg.name === 'string' && pkg.name.length > 0,
    `package name: ${pkg.name || '(missing)'}`
  ),
  check(
    'smoke script is registered',
    pkg.scripts && pkg.scripts['dev:smoke'] === 'node scripts/dev-task-smoke.js',
    'package.json scripts.dev:smoke should invoke this file'
  ),
];

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  console.log(`${item.ok ? '✅' : '❌'} ${item.name} — ${item.detail}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} smoke check(s) failed.`);
  process.exit(1);
}

console.log('\nAll dev smoke checks passed.');
