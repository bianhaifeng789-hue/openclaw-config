#!/usr/bin/env node
/**
 * Enter Plan Mode Tool - 基于 Claude Code EnterPlanModeTool
 * 
 * 进入规划模式：
 *   - 创建执行计划
 *   - 规划验证
 *   - 任务分解
 * 
 * Usage:
 *   node enter-plan-mode.js start <goal>
 *   node enter-plan-mode.js add-step <description>
 *   node exit-plan-mode.js complete
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'plan');
const PLAN_FILE = path.join(STATE_DIR, 'current-plan.json');

const ENTER_PLAN_MODE_TOOL_NAME = 'EnterPlanMode';
const EXIT_PLAN_MODE_TOOL_NAME = 'ExitPlanMode';

function loadCurrentPlan() {
  if (!fs.existsSync(PLAN_FILE)) {
    return null;
  }
  
  try {
    return JSON.parse(fs.readFileSync(PLAN_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function savePlan(plan) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(PLAN_FILE, JSON.stringify(plan, null, 2));
}

function enterPlanMode(goal, context = {}) {
  // Check if already in plan mode
  const existingPlan = loadCurrentPlan();
  if (existingPlan && existingPlan.active) {
    return {
      entered: false,
      reason: 'already in plan mode',
      existingPlan
    };
  }
  
  const plan = {
    id: `plan_${Date.now()}`,
    goal,
    context,
    steps: [],
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'planning'
  };
  
  savePlan(plan);
  
  return {
    entered: true,
    plan,
    message: 'Plan mode activated. Add steps, then use exit-plan-mode to submit for approval.'
  };
}

function addPlanStep(description, details = {}) {
  const plan = loadCurrentPlan();
  
  if (!plan || !plan.active) {
    return {
      added: false,
      error: 'not in plan mode',
      hint: 'Use enter-plan-mode first'
    };
  }
  
  const step = {
    id: `step_${plan.steps.length + 1}`,
    description,
    details,
    status: 'pending',
    addedAt: Date.now()
  };
  
  plan.steps.push(step);
  plan.updatedAt = Date.now();
  
  savePlan(plan);
  
  return {
    added: true,
    step,
    totalSteps: plan.steps.length,
    plan
  };
}

function updatePlanStep(stepId, status, notes = '') {
  const plan = loadCurrentPlan();
  
  if (!plan) {
    return { error: 'no active plan' };
  }
  
  const step = plan.steps.find(s => s.id === stepId);
  
  if (!step) {
    return { error: 'step not found', stepId };
  }
  
  step.status = status;
  step.notes = notes;
  step.updatedAt = Date.now();
  
  plan.updatedAt = Date.now();
  savePlan(plan);
  
  return {
    updated: true,
    step,
    plan
  };
}

function getPlanStatus() {
  const plan = loadCurrentPlan();
  
  if (!plan) {
    return {
      active: false,
      message: 'No active plan'
    };
  }
  
  return {
    active: plan.active,
    goal: plan.goal,
    steps: plan.steps,
    totalSteps: plan.steps.length,
    completedSteps: plan.steps.filter(s => s.status === 'completed').length,
    status: plan.status,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt
  };
}

function exitPlanMode() {
  const plan = loadCurrentPlan();
  
  if (!plan || !plan.active) {
    return {
      exited: false,
      error: 'not in plan mode'
    };
  }
  
  // Validate plan has steps
  if (plan.steps.length === 0) {
    return {
      exited: false,
      error: 'plan has no steps',
      plan,
      hint: 'Add at least one step before exiting plan mode'
    };
  }
  
  // Mark as complete
  plan.active = false;
  plan.status = 'submitted';
  plan.submittedAt = Date.now();
  
  savePlan(plan);
  
  return {
    exited: true,
    plan,
    message: 'Plan submitted for approval. User will review before execution.',
    note: 'In real implementation, would prompt user for approval'
  };
}

function cancelPlan() {
  const plan = loadCurrentPlan();
  
  if (!plan) {
    return { cancelled: false, error: 'no active plan' };
  }
  
  plan.active = false;
  plan.status = 'cancelled';
  plan.cancelledAt = Date.now();
  
  savePlan(plan);
  
  return {
    cancelled: true,
    plan
  };
}

function listPlanHistory() {
  const historyDir = path.join(STATE_DIR, 'history');
  
  if (!fs.existsSync(historyDir)) {
    return { plans: [], count: 0 };
  }
  
  const plans = fs.readdirSync(historyDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(historyDir, f), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(p => p !== null);
  
  return {
    plans,
    count: plans.length
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'enter':
      const goal = args[1];
      if (!goal) {
        console.log('Usage: node enter-plan-mode.js enter <goal>');
        process.exit(1);
      }
      console.log(JSON.stringify(enterPlanMode(goal), null, 2));
      break;
    case 'add':
      const description = args[1];
      if (!description) {
        console.log('Usage: node enter-plan-mode.js add <description>');
        process.exit(1);
      }
      console.log(JSON.stringify(addPlanStep(description), null, 2));
      break;
    case 'update':
      const stepId = args[1];
      const status = args[2];
      const notes = args[3] || '';
      console.log(JSON.stringify(updatePlanStep(stepId, status, notes), null, 2));
      break;
    case 'exit':
      console.log(JSON.stringify(exitPlanMode(), null, 2));
      break;
    case 'cancel':
      console.log(JSON.stringify(cancelPlan(), null, 2));
      break;
    case 'status':
      console.log(JSON.stringify(getPlanStatus(), null, 2));
      break;
    case 'history':
      console.log(JSON.stringify(listPlanHistory(), null, 2));
      break;
    default:
      console.log('Usage: node enter-plan-mode.js [enter|add|update|exit|cancel|status|history]');
      process.exit(1);
  }
}

main();

module.exports = {
  enterPlanMode,
  addPlanStep,
  updatePlanStep,
  exitPlanMode,
  cancelPlan,
  getPlanStatus,
  ENTER_PLAN_MODE_TOOL_NAME,
  EXIT_PLAN_MODE_TOOL_NAME
};