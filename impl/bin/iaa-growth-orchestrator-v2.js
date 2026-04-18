#!/usr/bin/env node
/**
 * IAA Growth Orchestrator V2
 * 真实多Agent执行版（通过 OpenClaw subagent 并发分析）
 *
 * 说明：
 * - 本脚本负责生成任务包与状态文件
 * - 真正的 subagent 执行由主会话调用 sessions_spawn / sessions_send 完成
 */
const fs = require('fs');
const path = require('path');
const { readCsv, mapRow } = require('./iaa-daily-report-batch');
const { buildNarrative } = require('./iaa-daily-report-analyzer');

function getArg(name, def = null) {
  const args = process.argv.slice(2);
  const index = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (index === -1) return def;
  const exact = args[index];
  if (exact.includes('=')) return exact.split('=').slice(1).join('=');
  return args[index + 1] ?? def;
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function now() {
  return new Date().toISOString();
}

function buildPrompt(role, result) {
  const base = {
    date: result.date,
    productType: result.productType,
    overallZone: result.summary.overallZone,
    action: result.summary.action,
    reasons: result.summary.coreReason,
    overall: result.metrics.overall,
    uscaau: result.metrics.uscaau,
    jpkr: result.metrics.jpkr
  };

  if (role === 'ltv-analyst') {
    return `你是LTV留存分析官。请根据以下IAA日报数据，输出200字以内的质量与回收判断，必须包含：1) 渠道/地区质量判断 2) 是否支持扩量 3) 一句明确建议。\n\n数据：${JSON.stringify(base, null, 2)}`;
  }
  if (role === 'monetization') {
    return `你是变现优化官。请根据以下IAA日报数据，输出200字以内的变现效率判断，必须包含：1) 收入效率问题 2) CPI/变现承接判断 3) 一句明确建议。\n\n数据：${JSON.stringify(base, null, 2)}`;
  }
  if (role === 'creative-strategist') {
    return `你是素材策略官。请根据以下IAA日报数据，输出200字以内的素材策略判断，必须包含：1) 哪个方向值得放大 2) 哪个方向需谨慎 3) 下一轮测试建议。\n\n数据：${JSON.stringify(base, null, 2)}`;
  }
  if (role === 'ua-lead') {
    return `你是投放决策官。请根据以下底层日报分析和三个专项分析结果，输出200字以内最终投放动作，必须包含：1) 总盘动作 2) 分地区预算倾斜 3) 一句最终执行建议。\n\n数据：${JSON.stringify(base, null, 2)}`;
  }
  throw new Error(`Unknown role: ${role}`);
}

function main() {
  const filePath = getArg('file', path.join(process.cwd(), 'templates/iaa-daily-report-template.csv'));
  const index = Number(getArg('index', '0'));
  const outDir = getArg('out-dir', path.join(process.cwd(), 'state', 'growth-orchestrator'));
  const rows = readCsv(filePath);
  if (!rows.length) throw new Error('CSV为空，没有可分析数据');
  if (Number.isNaN(index) || index < 0 || index >= rows.length) {
    throw new Error(`index 超出范围，当前共有 ${rows.length} 条，收到 ${index}`);
  }

  const row = rows[index];
  const result = buildNarrative(mapRow(row), row.product_type || 'file_repair');
  const runId = `growth-${String(result.date).replace(/[^0-9]/g, '')}-${index}`;
  const runDir = path.join(outDir, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const prompts = {
    'ltv-analyst': buildPrompt('ltv-analyst', result),
    'monetization': buildPrompt('monetization', result),
    'creative-strategist': buildPrompt('creative-strategist', result)
  };

  const packageData = {
    runId,
    createdAt: now(),
    status: 'prepared',
    currentStep: 'awaiting-subagent-execution',
    sourceFile: filePath,
    rowIndex: index,
    result,
    prompts
  };

  writeJson(path.join(runDir, 'package.json'), packageData);
  writeJson(path.join(process.cwd(), 'state', 'growth-orchestrator-status.json'), {
    task: 'real-subagent-growth-orchestrator',
    status: 'prepared',
    currentStep: 'awaiting-subagent-execution',
    runId,
    runDir,
    updatedAt: now(),
    checks: {
      packageWritten: true,
      promptsReady: true,
      sourceValidated: true
    }
  });

  console.log(JSON.stringify({ runId, runDir, packageFile: path.join(runDir, 'package.json'), status: 'prepared' }, null, 2));
}

if (require.main === module) main();
