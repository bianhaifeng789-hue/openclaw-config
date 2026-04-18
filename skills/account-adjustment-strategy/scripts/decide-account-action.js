#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node decide-account-action.js <json-path>');
  process.exit(1);
}
const input = JSON.parse(fs.readFileSync(file, 'utf8'));
const model = input.recovery_model || 'medium-payback';
const stage = input.optimization_stage || 'scaling';
const target = Number(input.target_roas || 0);
const d0 = Number(input.actual_d0_roas || 0);
const d1 = Number(input.actual_d1_roas || 0);
const d3 = Number(input.actual_d3_roas || 0);
const d7 = Number(input.actual_d7_roas || 0);
const delivery = input.delivery_status || 'stable';
const spendTrend = input.spend_trend || 'flat';
const volume = input.volume_signal || 'stable';

const lateCatchup = d3 > d1 || d7 > d3;
const matureWindow = model === 'fast-payback' ? d1 : model === 'medium-payback' ? d3 : d7;
const farBelowTarget = target > 0 ? matureWindow < target * 0.75 : false;
const nearTarget = target > 0 ? matureWindow >= target * 0.95 : true;

let action = 'hold';
let budgetAdjustment = '0%';
let mainDecisionWindow = model === 'fast-payback' ? 'D1' : model === 'medium-payback' ? 'D3' : 'D7';
let timing = 'wait for more stable data';

if ((delivery === 'limited' || volume === 'weak') && lateCatchup && !farBelowTarget) {
  action = 'scale';
  budgetAdjustment = stage === 'testing' ? '+10%' : '+15% to +20%';
  timing = 'change now, but avoid multiple same-day edits';
} else if (farBelowTarget && !lateCatchup) {
  action = 'stop-loss';
  budgetAdjustment = '-30% to -100%';
  timing = 'change now';
} else if (!nearTarget || spendTrend === 'up') {
  action = 'trim';
  budgetAdjustment = '-10% to -20%';
  timing = 'change now, then observe one full control window';
} else {
  action = 'hold';
  budgetAdjustment = '0%';
  timing = 'wait unless a clearer signal appears';
}

const result = {
  recommendedAction: action,
  suggestedBudgetAdjustment: budgetAdjustment,
  mainDecisionWindow,
  rationale: {
    recoveryModel: model,
    optimizationStage: stage,
    deliveryStatus: delivery,
    spendTrend,
    volumeSignal: volume,
    lateWindowCatchup: lateCatchup,
    matureWindowRoas: matureWindow,
    targetRoas: target
  },
  executionNote: {
    timing,
    frequentEditRisk: 'High-frequency edits can reset learning or create noise.',
    monitorNext: `Monitor ${mainDecisionWindow} quality after the change.`
  }
};

console.log(JSON.stringify(result, null, 2));
