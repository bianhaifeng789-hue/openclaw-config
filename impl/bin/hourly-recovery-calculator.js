#!/usr/bin/env node
/**
 * Hourly Recovery Calculator - 小时级回收模型
 *
 * 功能：
 * - 计算 H1/H3/H6/H12/D0 ROI
 * - 根据目标D0反推小时阈值
 * - 根据当前小时ROI预测D0与总LTV
 * - 给出停量/放量建议
 *
 * 用法：
 *   node hourly-recovery-calculator.js target --d0=0.85 --profile=file_repair
 *   node hourly-recovery-calculator.js predict --current=0.58 --hour=h6 --profile=file_repair --d0share=0.8
 *   node hourly-recovery-calculator.js judge --h1=0.22 --h3=0.40 --h6=0.58 --h12=0.73 --profile=file_repair
 */

const PROFILES = {
  file_repair: {
    name: '文件修复',
    targets: { h1: 0.22, h3: 0.40, h6: 0.58, h12: 0.73, d0: 0.85 },
    progress: { h1: 0.26, h3: 0.47, h6: 0.68, h12: 0.86 },
    d0Share: 0.8
  },
  cleaner: {
    name: '清理',
    targets: { h1: 0.15, h3: 0.28, h6: 0.42, h12: 0.55, d0: 0.65 },
    progress: { h1: 0.23, h3: 0.43, h6: 0.65, h12: 0.85 },
    d0Share: 0.8
  }
};

function targetModel(d0, profile = 'file_repair') {
  const p = PROFILES[profile];
  return {
    profile: p.name,
    targetD0: (d0 * 100).toFixed(1) + '%',
    hourlyTargets: {
      h1: (d0 * p.progress.h1 * 100).toFixed(1) + '%',
      h3: (d0 * p.progress.h3 * 100).toFixed(1) + '%',
      h6: (d0 * p.progress.h6 * 100).toFixed(1) + '%',
      h12: (d0 * p.progress.h12 * 100).toFixed(1) + '%'
    }
  };
}

function predictFromHour(current, hour, profile = 'file_repair', d0Share = null) {
  const p = PROFILES[profile];
  const progress = p.progress[hour];
  const finalD0 = current / progress;
  const share = d0Share ?? p.d0Share;
  const totalLtv = finalD0 / share;
  return {
    profile: p.name,
    currentHour: hour,
    currentRoi: (current * 100).toFixed(1) + '%',
    progressRatio: (progress * 100).toFixed(1) + '%',
    predictedD0Roi: (finalD0 * 100).toFixed(1) + '%',
    estimatedTotalRoi: (totalLtv * 100).toFixed(1) + '%',
    decision: totalLtv >= 1 ? '可投/观察放量' : '谨慎/可能不回本'
  };
}

function judgeHourly(h1, h3, h6, h12, profile = 'file_repair') {
  const p = PROFILES[profile];
  const t = p.targets;
  const checks = {
    h1: h1 >= t.h1,
    h3: h3 >= t.h3,
    h6: h6 >= t.h6,
    h12: h12 >= t.h12
  };
  let verdict = '继续观察';
  if (!checks.h1 && h1 < t.h1 * 0.82) verdict = 'H1严重不达标，建议停量';
  else if (!checks.h3 && h3 < t.h3 * 0.88) verdict = 'H3不达标，建议停量';
  else if (!checks.h6 && h6 < t.h6 * 0.9) verdict = 'H6偏弱，谨慎';
  else if (checks.h6 && checks.h12) verdict = '可继续/准备放量';
  return {
    profile: p.name,
    input: {
      h1: (h1 * 100).toFixed(1) + '%',
      h3: (h3 * 100).toFixed(1) + '%',
      h6: (h6 * 100).toFixed(1) + '%',
      h12: (h12 * 100).toFixed(1) + '%'
    },
    target: {
      h1: (t.h1 * 100).toFixed(1) + '%',
      h3: (t.h3 * 100).toFixed(1) + '%',
      h6: (t.h6 * 100).toFixed(1) + '%',
      h12: (t.h12 * 100).toFixed(1) + '%'
    },
    checks,
    verdict
  };
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const get = (name, def = null) => {
    const a = args.find(x => x.startsWith(`--${name}=`));
    return a ? parseFloat(a.split('=')[1]) : def;
  };
  const gets = (name, def = null) => {
    const a = args.find(x => x.startsWith(`--${name}=`));
    return a ? a.split('=')[1] : def;
  };
  let result;
  switch (cmd) {
    case 'target':
      result = targetModel(get('d0', 0.85), gets('profile', 'file_repair'));
      break;
    case 'predict':
      result = predictFromHour(get('current', 0), gets('hour', 'h6'), gets('profile', 'file_repair'), get('d0share', null));
      break;
    case 'judge':
      result = judgeHourly(get('h1', 0), get('h3', 0), get('h6', 0), get('h12', 0), gets('profile', 'file_repair'));
      break;
    default:
      result = {
        error: 'unknown command',
        usage: [
          'target --d0=0.85 --profile=file_repair',
          'predict --current=0.58 --hour=h6 --profile=file_repair --d0share=0.8',
          'judge --h1=0.22 --h3=0.40 --h6=0.58 --h12=0.73 --profile=file_repair'
        ]
      };
  }
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { targetModel, predictFromHour, judgeHourly, PROFILES };
if (require.main === module) main();
