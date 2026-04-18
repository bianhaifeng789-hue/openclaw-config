#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node decide-roas-target.js <json-path>');
  process.exit(1);
}
const input = JSON.parse(fs.readFileSync(file, 'utf8'));
const model = input.recovery_model || 'medium-payback';
const stage = input.optimization_stage || 'testing';
const target = Number(input.current_target_roas || 0);
const d0 = Number(input.actual_d0_roas || 0);
const d1 = Number(input.actual_d1_roas || 0);
const d3 = Number(input.actual_d3_roas || 0);
const d7 = Number(input.actual_d7_roas || 0);
const delivery = input.delivery_status || 'stable';

let controlWindow = 'D1';
if (model === 'fast-payback') controlWindow = d0 > 0 ? 'D0' : 'D1';
if (model === 'medium-payback') controlWindow = d1 > 0 ? 'D1' : 'D3';
if (model === 'long-payback') controlWindow = d3 > 0 ? 'D3' : 'D7';

let action = 'hold';
let style = 'moderate';
let low = target || 0.3;
let high = target || 0.4;

if (model === 'fast-payback') {
  low = Math.max(0.25, target ? target - 0.03 : 0.3);
  high = target ? target + 0.03 : 0.4;
} else if (model === 'medium-payback') {
  low = Math.max(0.2, target ? target - 0.05 : 0.25);
  high = target ? target + 0.02 : 0.35;
} else {
  low = Math.max(0.12, target ? target - 0.08 : 0.18);
  high = target ? Math.max(low + 0.03, target) : 0.28;
}

const lateBetter = d3 > d1 || d7 > d3;
const underAllWindows = d0 < target && d1 < target && d3 < target && d7 < target;

if (delivery === 'limited' && lateBetter) {
  action = 'lower';
  style = model === 'long-payback' ? 'conservative' : 'moderate';
} else if ((delivery === 'expanding' || delivery === 'stable') && underAllWindows && target > 0) {
  action = 'raise';
  style = 'moderate';
} else {
  action = 'hold';
  style = stage === 'testing' ? 'conservative' : 'moderate';
}

const result = {
  recommendedTargetRoasRange: {
    min: Number(low.toFixed(2)),
    max: Number(high.toFixed(2))
  },
  action,
  mainControlWindow: controlWindow,
  adjustmentStyle: style,
  rationale: {
    recoveryModel: model,
    optimizationStage: stage,
    deliveryStatus: delivery,
    lateWindowCatchup: lateBetter,
    allWindowsUnderTarget: underAllWindows
  },
  warning: action === 'lower'
    ? 'If lowered too much, low-quality volume may enter.'
    : action === 'raise'
    ? 'If raised too much, delivery may choke and learning may reset.'
    : 'Hold target unless more stable data changes the picture.'
};

console.log(JSON.stringify(result, null, 2));
