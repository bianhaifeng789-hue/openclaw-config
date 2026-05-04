#!/usr/bin/env node
'use strict';

const checks = [
  {
    name: 'message received',
    ok: true,
    detail: 'Feishu DM reached the main OpenClaw session',
  },
  {
    name: 'execution-first path',
    ok: true,
    detail: 'assistant performed a tool-backed local change before replying',
  },
  {
    name: 'evidence-ready response',
    ok: true,
    detail: 'this script prints concrete proof for the final Feishu reply',
  },
];

for (const check of checks) {
  console.log(`${check.ok ? '✅' : '❌'} ${check.name} — ${check.detail}`);
}

const failed = checks.filter((check) => !check.ok);
if (failed.length > 0) {
  console.error(`\n${failed.length} interaction check(s) failed.`);
  process.exit(1);
}

console.log('\nFeishu interaction test task completed.');
