#!/usr/bin/env node
/**
 * ROI Recovery Calculator - IAA投放回收计算器
 *
 * 功能：
 * - 计算 D0/D1/D3/D7 ROI
 * - 反推可接受 CPI
 * - 估算完整 LTV
 * - 给出投放模式建议
 *
 * 用法：
 *   node roi-recovery-calculator.js daily --cpi 1.0 --d0 0.85 --d1 0.08 --d3 0.03 --d7 0.04
 *   node roi-recovery-calculator.js max-cpi --d0 0.85 --share 0.8 --target-roi 1.05
 *   node roi-recovery-calculator.js mode --product=file_repair --d0-roi 0.85
 */

function calcDailyROI(cpi, d0, d1, d3tail, d7tail) {
  const d0roi = d0 / cpi;
  const d1roi = (d0 + d1) / cpi;
  const d3roi = (d0 + d1 + d3tail) / cpi;
  const d7roi = (d0 + d1 + d3tail + d7tail) / cpi;
  const ltv = d0 + d1 + d3tail + d7tail;
  return {
    cpi,
    revenue: { d0, d1, d3tail, d7tail, total: ltv },
    roi: {
      d0: (d0roi * 100).toFixed(1) + '%',
      d1: (d1roi * 100).toFixed(1) + '%',
      d3: (d3roi * 100).toFixed(1) + '%',
      d7: (d7roi * 100).toFixed(1) + '%'
    },
    breakEven: ltv >= cpi,
    profit: +(ltv - cpi).toFixed(4)
  };
}

function calcMaxCPI(d0, d0Share = 0.8, targetRoi = 1.05) {
  const ltv = d0 / d0Share;
  const maxCpi = ltv / targetRoi;
  return {
    d0,
    d0Share,
    estimatedLtv: +ltv.toFixed(4),
    targetRoi: (targetRoi * 100).toFixed(1) + '%',
    maxCpi: +maxCpi.toFixed(4)
  };
}

function suggestMode(product, d0roi) {
  let suggestion;
  if (product === 'file_repair') {
    if (d0roi >= 0.85) {
      suggestion = {
        mode: 'cost first -> value optimization later',
        bidding: 'tCPI / lowest cost first, then D0 value optimization',
        target: 'tROAS 70%-80% to start',
        note: '可放量，但不要一开始就高tROAS'
      };
    } else {
      suggestion = {
        mode: 'cost control',
        bidding: 'tCPI / lowest cost',
        target: '先把D0拉回80%+',
        note: '当前不适合激进价值优化'
      };
    }
  } else {
    if (d0roi >= 0.75) {
      suggestion = {
        mode: 'cost control',
        bidding: 'lowest cost / tCPI',
        target: '严格控CPI',
        note: '可测，但仍不建议直接价值优化'
      };
    } else {
      suggestion = {
        mode: 'strict cost control',
        bidding: 'lowest cost only',
        target: '先优化变现与创意',
        note: '低留存清理类，先别上value optimization'
      };
    }
  }
  return { product, d0roi: (d0roi * 100).toFixed(1) + '%', ...suggestion };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const get = (name, def = null) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? parseFloat(arg.split('=')[1]) : def;
  };
  const gets = (name, def = null) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : def;
  };

  let result;
  switch (command) {
    case 'daily':
      result = calcDailyROI(get('cpi', 1), get('d0', 0), get('d1', 0), get('d3', 0), get('d7', 0));
      break;
    case 'max-cpi':
      result = calcMaxCPI(get('d0', 0), get('share', 0.8), get('target-roi', 1.05));
      break;
    case 'mode':
      result = suggestMode(gets('product', 'cleaner'), get('d0-roi', 0.65));
      break;
    default:
      result = {
        error: 'unknown command',
        usage: [
          'daily --cpi=1 --d0=0.85 --d1=0.08 --d3=0.03 --d7=0.04',
          'max-cpi --d0=0.85 --share=0.8 --target-roi=1.05',
          'mode --product=file_repair --d0-roi=0.85'
        ]
      };
  }

  console.log(JSON.stringify(result, null, 2));
}

module.exports = { calcDailyROI, calcMaxCPI, suggestMode };

if (require.main === module) main();
