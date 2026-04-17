#!/usr/bin/env node
/**
 * Task Progress Reporter - Track and report task progress for Feishu
 *
 * Purpose: Solve the "long wait with no feedback" problem
 *
 * Usage:
 * - start <taskId> <taskName> <totalSteps> <estimatedMinutes>
 * - step <stepName>
 * - complete
 * - status
 * - query (for user asking "进度如何")
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const STATE_FILE = path.join(WORKSPACE, 'state', 'task-progress.json');

function loadProgress() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {
    // ignore
  }
  return {
    taskId: null,
    taskName: null,
    status: 'idle',
    progress: 0,
    currentStep: null,
    totalSteps: 0,
    completedSteps: [],
    remainingSteps: [],
    startedAt: null,
    estimatedMinutes: 0,
    elapsedMinutes: 0,
    lastUpdate: null,
    lastProgressCard: null
  };
}

function saveProgress(progress) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(progress, null, 2));
}

function startTask(taskId, taskName, totalSteps, estimatedMinutes, steps) {
  const progress = {
    taskId,
    taskName,
    status: 'running',
    progress: 0,
    currentStep: steps[0] || '准备开始',
    totalSteps,
    completedSteps: [],
    remainingSteps: steps || [],
    startedAt: Date.now(),
    estimatedMinutes,
    elapsedMinutes: 0,
    lastUpdate: Date.now(),
    lastProgressCard: null
  };
  
  saveProgress(progress);
  return progress;
}

function completeStep(stepName) {
  const progress = loadProgress();
  
  if (progress.status !== 'running') {
    return { error: 'No running task' };
  }
  
  progress.completedSteps.push(stepName);
  progress.remainingSteps = progress.remainingSteps.filter(s => s !== stepName);
  progress.currentStep = progress.remainingSteps[0] || '完成';
  progress.progress = Math.round((progress.completedSteps.length / progress.totalSteps) * 100);
  progress.elapsedMinutes = Math.round((Date.now() - progress.startedAt) / 60000);
  progress.lastUpdate = Date.now();
  
  saveProgress(progress);
  return progress;
}

function completeTask() {
  const progress = loadProgress();
  
  progress.status = 'completed';
  progress.progress = 100;
  progress.currentStep = '完成';
  progress.completedSteps = progress.remainingSteps.map(s => s);
  progress.remainingSteps = [];
  progress.elapsedMinutes = Math.round((Date.now() - progress.startedAt) / 60000);
  progress.lastUpdate = Date.now();
  
  saveProgress(progress);
  return progress;
}

function getStatus() {
  return loadProgress();
}

function shouldSendProgressCard() {
  const progress = loadProgress();
  
  // Only send if running and elapsed >= 5 minutes
  if (progress.status !== 'running') return false;
  
  const elapsed = (Date.now() - progress.startedAt) / 60000;
  const lastCardTime = progress.lastProgressCard ? progress.lastProgressCard : 0;
  const sinceLastCard = (Date.now() - lastCardTime) / 60000;
  
  // Send progress card every 5 minutes
  return elapsed >= 5 && sinceLastCard >= 5;
}

function markProgressCardSent() {
  const progress = loadProgress();
  progress.lastProgressCard = Date.now();
  saveProgress(progress);
}

function buildFeishuCard(progress) {
  const elapsed = progress.elapsedMinutes;
  const remaining = Math.max(0, progress.estimatedMinutes - elapsed);
  
  return {
    elements: [
      {
        tag: 'div',
        text: {
          content: `**🔍 任务进度更新**\n\n**任务**: ${progress.taskName}\n**进度**: ${progress.progress}% (${progress.completedSteps.length}/${progress.totalSteps})\n**当前**: ${progress.currentStep}\n**已用时间**: ${elapsed}分钟\n**预估剩余**: ${remaining}分钟`,
          tag: 'lark_md'
        }
      }
    ]
  };
}

function buildStartCard(progress) {
  const stepsList = progress.remainingSteps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  
  return {
    elements: [
      {
        tag: 'div',
        text: {
          content: `**🔍 开始任务**\n\n**任务**: ${progress.taskName}\n**预估时间**: ${progress.estimatedMinutes}分钟\n\n**任务列表**:\n${stepsList}\n\n我会定期报告进度，你也可以继续和我聊天。`,
          tag: 'lark_md'
        }
      }
    ]
  };
}

function buildCompleteCard(progress) {
  return {
    elements: [
      {
        tag: 'div',
        text: {
          content: `**✅ 任务完成**\n\n**任务**: ${progress.taskName}\n**总耗时**: ${progress.elapsedMinutes}分钟\n**结果**: ${progress.completedSteps.length} 步骤完成`,
          tag: 'lark_md'
        }
      }
    ]
  };
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'start':
    const taskId = args[1] || `task-${Date.now()}`;
    const taskName = args[2] || '未命名任务';
    const totalSteps = parseInt(args[3]) || 1;
    const estimatedMinutes = parseInt(args[4]) || 5;
    const stepsJson = args[5] || '[]';
    const steps = JSON.parse(stepsJson);
    
    const started = startTask(taskId, taskName, totalSteps, estimatedMinutes, steps);
    console.log(JSON.stringify({
      status: 'started',
      card: buildStartCard(started),
      progress: started
    }, null, 2));
    break;

  case 'step':
    const stepName = args[1] || '未知步骤';
    const stepped = completeStep(stepName);
    console.log(JSON.stringify({
      status: 'step_completed',
      progress: stepped,
      shouldSendCard: shouldSendProgressCard()
    }, null, 2));
    break;

  case 'complete':
    const completed = completeTask();
    console.log(JSON.stringify({
      status: 'completed',
      card: buildCompleteCard(completed),
      progress: completed
    }, null, 2));
    break;

  case 'status':
    console.log(JSON.stringify(getStatus(), null, 2));
    break;

  case 'query':
    // User asking "进度如何"
    const currentProgress = loadProgress();
    if (currentProgress.status === 'running') {
      console.log(JSON.stringify({
        reply: `当前进度：${currentProgress.progress}% (${currentProgress.completedSteps.length}/${currentProgress.totalSteps})\n正在执行：${currentProgress.currentStep}\n已用时间：${currentProgress.elapsedMinutes}分钟\n预估剩余：${Math.max(0, currentProgress.estimatedMinutes - currentProgress.elapsedMinutes)}分钟`,
        card: buildFeishuCard(currentProgress)
      }, null, 2));
    } else {
      console.log(JSON.stringify({
        reply: '当前没有正在执行的任务。'
      }, null, 2));
    }
    break;

  case 'check':
    // Heartbeat check
    if (shouldSendProgressCard()) {
      const progress = loadProgress();
      markProgressCardSent();
      console.log(JSON.stringify({
        shouldSend: true,
        card: buildFeishuCard(progress)
      }, null, 2));
    } else {
      console.log(JSON.stringify({ shouldSend: false }));
    }
    break;

  default:
    console.log('Usage: task-progress-reporter.js [start|step|complete|status|query|check]');
    console.log('');
    console.log('Commands:');
    console.log('  start <taskId> <taskName> <totalSteps> <estimatedMinutes> <stepsJson>');
    console.log('  step <stepName>');
    console.log('  complete');
    console.log('  status');
    console.log('  query (for user asking "进度如何")');
    console.log('  check (for heartbeat)');
}

module.exports = {
  loadProgress,
  saveProgress,
  startTask,
  completeStep,
  completeTask,
  shouldSendProgressCard,
  buildFeishuCard,
  buildStartCard,
  buildCompleteCard
};