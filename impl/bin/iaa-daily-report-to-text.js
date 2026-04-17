#!/usr/bin/env node
/**
 * 将日报分析结果转成中文运营结论
 */
const { buildNarrative } = require('./iaa-daily-report-analyzer');

function getArg(name, def = null) {
  const args = process.argv.slice(2);
  const index = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (index === -1) return def;
  const exact = args[index];
  if (exact.includes('=')) return exact.split('=').slice(1).join('=');
  return args[index + 1] ?? def;
}

function toText(result) {
  const lines = [];
  lines.push(`日期：${result.date}`);
  lines.push(`产品：${result.productType === 'file_repair' ? '文件修复' : '清理'}`);
  lines.push('');
  lines.push(`一、总盘结论`);
  lines.push(`- 当前属于：${result.summary.overallZone}`);
  lines.push(`- 操作建议：${result.summary.action}`);
  lines.push(`- 核心原因：${result.summary.coreReason.join('；')}`);
  lines.push('');
  lines.push(`二、分地区结论`);
  lines.push(`- 美加澳：${result.regions.uscaau.zone}，建议 ${result.regions.uscaau.advice}`);
  lines.push(`- 日韩：${result.regions.jpkr.zone}，建议 ${result.regions.jpkr.advice}`);
  lines.push('');
  lines.push(`三、执行建议`);

  if (result.regions.jpkr.advice.includes('重点加量')) {
    lines.push(`- 日韩是当前利润池，优先承接放量。`);
  } else if (result.regions.jpkr.advice.includes('谨慎')) {
    lines.push(`- 日韩当前不适合扩量，先控成本和素材。`);
  }

  if (result.regions.uscaau.advice.includes('保守加量')) {
    lines.push(`- 美加澳可小幅加量，但继续盯CPI。`);
  } else if (result.regions.uscaau.advice.includes('降量')) {
    lines.push(`- 美加澳偏弱，优先降量或换素材。`);
  } else {
    lines.push(`- 美加澳以保量观察为主。`);
  }

  if (result.summary.action.includes('可加量')) {
    lines.push(`- 总盘可以继续跑，但放量优先给高ROI地区。`);
  } else if (result.summary.action.includes('止损')) {
    lines.push(`- 总盘先止损，不建议继续扩量。`);
  } else {
    lines.push(`- 总盘先保量，继续观察次日和后续小时补量。`);
  }

  return lines.join('\n');
}

function main() {
  const input = {
    date: getArg('date', ''),
    h1Roi: getArg('h1', 0),
    h6Roi: getArg('h6', 0),
    h12Roi: getArg('h12', 0),
    d0Roi: getArg('d0', 0),
    uscaauH1: getArg('us-h1', 0),
    uscaauH6: getArg('us-h6', 0),
    uscaauH12: getArg('us-h12', 0),
    uscaauD0: getArg('us-d0', 0),
    jpkrH1: getArg('jp-h1', 0),
    jpkrH6: getArg('jp-h6', 0),
    jpkrH12: getArg('jp-h12', 0),
    jpkrD0: getArg('jp-d0', 0),
    uscaauCpi: getArg('us-cpi', 0),
    jpkrCpi: getArg('jp-cpi', 0)
  };
  const result = buildNarrative(input, getArg('product', 'file_repair'));
  console.log(toText(result));
}

module.exports = { toText };
if (require.main === module) main();
