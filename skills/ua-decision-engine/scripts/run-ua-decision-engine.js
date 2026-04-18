#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const accountFile = process.argv[2];
const campaignFile = process.argv[3];
if (!accountFile || !campaignFile) {
  console.error('Usage: node run-ua-decision-engine.js <account-json> <campaign-csv>');
  process.exit(1);
}

const root = '/Users/mar2game/.openclaw/workspace/skills';
function runNode(script, args) {
  return JSON.parse(execFileSync('node', [script, ...args], { encoding: 'utf8' }));
}

const account = JSON.parse(fs.readFileSync(accountFile, 'utf8'));
let recovery = null;
if (account.recovery_model) {
  recovery = {
    model: account.recovery_model,
    recommendedOptimizationWindow: account.recovery_model === 'fast-payback' ? 'D1' : account.recovery_model === 'medium-payback' ? 'D1' : 'D3',
    display: {
      d0: `${((account.actual_d0_roas || 0) * 100).toFixed(1)}%`,
      d1: `${((account.actual_d1_roas || 0) * 100).toFixed(1)}%`,
      d3: `${((account.actual_d3_roas || 0) * 100).toFixed(1)}%`,
      d7: `${((account.actual_d7_roas || 0) * 100).toFixed(1)}%`
    }
  };
} else {
  throw new Error('account json currently requires recovery_model for orchestrator v1');
}

const roas = runNode(path.join(root, 'roas-target-strategy/scripts/decide-roas-target.js'), [accountFile]);
const accountAction = runNode(path.join(root, 'account-adjustment-strategy/scripts/decide-account-action.js'), [accountFile]);
const campaignAction = runNode(path.join(root, 'campaign-scaling-advisor/scripts/advise-campaign-scaling.js'), [campaignFile]);

const result = {
  recoveryModel: {
    model: recovery.model,
    mainOptimizationWindow: recovery.recommendedOptimizationWindow,
    windowRoas: recovery.display
  },
  roasTargetStrategy: roas,
  accountAction,
  campaignActions: campaignAction.campaigns,
  finalOperatorSummary: {
    doNow: accountAction.recommendedAction === 'scale'
      ? `Scale account ${accountAction.suggestedBudgetAdjustment} and prioritize top scale campaigns.`
      : accountAction.recommendedAction === 'trim'
      ? `Trim account and protect quality before expanding again.`
      : accountAction.recommendedAction === 'stop-loss'
      ? `Stop-loss weak spend and halt failing campaigns.`
      : `Hold structure and avoid unnecessary noise.` ,
    mainRisk: roas.warning || 'Signal quality may degrade if controls are mis-set.',
    observeNext: accountAction.executionNote.monitorNext
  }
};

console.log(JSON.stringify(result, null, 2));
