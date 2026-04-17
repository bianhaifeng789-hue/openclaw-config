#!/usr/bin/env node
/**
 * IAA Daily Report Analyzer
 * 输入日报数据，输出总盘/地区/小时级结论与操作建议
 */

const THRESHOLDS = {
  file_repair: {
    overall: { h1: 46, h6: 54, h12: 60, d0: 85 },
    uscaau: { h1: 40, h6: 50, h12: 52, d0: 85 },
    jpkr: { h1: 60, h6: 65, h12: 70, d0: 100 }
  },
  cleaner: {
    overall: { h1: 15, h6: 42, h12: 55, d0: 65 },
    uscaau: { h1: 30, h6: 40, h12: 48, d0: 70 },
    jpkr: { h1: 45, h6: 55, h12: 60, d0: 85 }
  }
};

function parseNum(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[%,$,，\s]/g, '').replace(/,/g, '');
  return parseFloat(s) || 0;
}

function zoneByD0(d0, region = 'overall') {
  if (region === 'jpkr') {
    if (d0 >= 120) return '强利润区';
    if (d0 >= 100) return '可投区';
    if (d0 >= 85) return '观察区';
    return '谨慎区';
  }
  if (region === 'uscaau') {
    if (d0 >= 85) return '可投区';
    if (d0 >= 75) return '观察区';
    return '谨慎区';
  }
  if (d0 >= 100) return '利润区';
  if (d0 >= 85) return '观察区';
  if (d0 >= 75) return '风险区';
  return '止损区';
}

function compare(actual, target) {
  return {
    actual,
    target,
    pass: actual >= target,
    gap: +(actual - target).toFixed(2)
  };
}

function analyzeRegion(name, actual, target, regionKey) {
  const checks = {
    h1: compare(actual.h1, target.h1),
    h6: compare(actual.h6, target.h6),
    h12: compare(actual.h12, target.h12),
    d0: compare(actual.d0, target.d0)
  };

  const zone = zoneByD0(actual.d0, regionKey);
  let advice = '保量观察';
  if (regionKey === 'jpkr') {
    if (actual.d0 >= 120 && actual.h6 >= target.h6) advice = '重点加量';
    else if (actual.d0 < 85 || actual.h6 < target.h6 - 5) advice = '谨慎/降量';
  } else if (regionKey === 'uscaau') {
    if (actual.d0 >= 85 && actual.h6 >= target.h6) advice = '保守加量';
    else if (actual.d0 < 75 || actual.h1 < target.h1 - 5) advice = '降量/换素材';
  } else {
    if (actual.d0 >= 100) advice = '可加量';
    else if (actual.d0 < 75) advice = '优先止损';
  }

  return { name, zone, checks, advice };
}

function buildNarrative(input, productType) {
  const t = THRESHOLDS[productType];
  const overall = analyzeRegion('总盘', {
    h1: parseNum(input.h1Roi),
    h6: parseNum(input.h6Roi),
    h12: parseNum(input.h12Roi),
    d0: parseNum(input.d0Roi)
  }, t.overall, 'overall');

  const uscaau = analyzeRegion('美加澳', {
    h1: parseNum(input.uscaauH1),
    h6: parseNum(input.uscaauH6),
    h12: parseNum(input.uscaauH12),
    d0: parseNum(input.uscaauD0)
  }, t.uscaau, 'uscaau');

  const jpkr = analyzeRegion('日韩', {
    h1: parseNum(input.jpkrH1),
    h6: parseNum(input.jpkrH6),
    h12: parseNum(input.jpkrH12),
    d0: parseNum(input.jpkrD0)
  }, t.jpkr, 'jpkr');

  let coreReason = [];
  if (parseNum(input.jpkrD0) > parseNum(input.uscaauD0)) coreReason.push('日韩表现强于美加澳');
  if (parseNum(input.uscaauCpi) > parseNum(input.jpkrCpi)) coreReason.push('美加澳CPI显著高于日韩');
  if (parseNum(input.h12Roi) < parseNum(input.d0Roi) - 15) coreReason.push('12小时后半段补量明显');
  if (!coreReason.length) coreReason.push('整体结构较平稳');

  return {
    date: input.date,
    productType,
    overall,
    regions: { uscaau, jpkr },
    metrics: {
      overall: {
        h1: parseNum(input.h1Roi),
        h6: parseNum(input.h6Roi),
        h12: parseNum(input.h12Roi),
        d0: parseNum(input.d0Roi)
      },
      uscaau: {
        h1: parseNum(input.uscaauH1),
        h6: parseNum(input.uscaauH6),
        h12: parseNum(input.uscaauH12),
        d0: parseNum(input.uscaauD0),
        cpi: parseNum(input.uscaauCpi)
      },
      jpkr: {
        h1: parseNum(input.jpkrH1),
        h6: parseNum(input.jpkrH6),
        h12: parseNum(input.jpkrH12),
        d0: parseNum(input.jpkrD0),
        cpi: parseNum(input.jpkrCpi)
      }
    },
    summary: {
      overallZone: overall.zone,
      coreReason,
      action: overall.advice
    }
  };
}

function getArg(name, def = null) {
  const args = process.argv.slice(2);
  const index = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (index === -1) return def;
  const exact = args[index];
  if (exact.includes('=')) return exact.split('=').slice(1).join('=');
  return args[index + 1] ?? def;
}

function main() {
  const productType = getArg('product', 'file_repair');
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

  console.log(JSON.stringify(buildNarrative(input, productType), null, 2));
}

module.exports = { buildNarrative, analyzeRegion, zoneByD0, THRESHOLDS };
if (require.main === module) main();
