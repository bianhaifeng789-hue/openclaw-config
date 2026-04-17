#!/usr/bin/env node
/**
 * Spawn Decision Engine - Decide when to spawn background task
 *
 * Purpose: Determine if a task should be spawned (background) vs inline (foreground)
 *
 * Rules:
 * - Task duration > 5 minutes → spawn
 * - Task has multiple independent steps → spawn
 * - User explicitly asks "后台执行" → spawn
 * - Simple query/file operation → inline
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const STATE_FILE = path.join(WORKSPACE, 'state', 'spawn-decision-state.json');

// Task duration estimation (minutes)
const TASK_DURATION = {
  'simple_query': 0.5,       // < 1 minute
  'file_operation': 1,       // 1-2 minutes
  'code_generation': 5,      // 5-10 minutes
  'deep_analysis': 10,       // 10-20 minutes
  'migration': 20,           // 20-40 minutes (DeerFlow 移植类)
  'integration': 15,         // 15-30 minutes
  'research': 10,            // 10-15 minutes
  'unknown': 5               // Default: 5 minutes
};

// Spawn threshold
const SPAWN_THRESHOLD_MINUTES = 5;

class SpawnDecisionEngine {
  constructor() {
    this.state = this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch {
      // ignore
    }
    return {
      currentTask: null,
      spawnedTasks: [],
      stats: {
        spawned: 0,
        inline: 0,
        total: 0
      }
    };
  }

  saveState() {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  /**
   * Estimate task duration based on description
   */
  estimateDuration(taskDescription) {
    const lowered = taskDescription.toLowerCase();

    // Check keywords
    if (lowered.includes('移植') || lowered.includes('migration')) {
      return { type: 'migration', minutes: TASK_DURATION.migration };
    }
    if (lowered.includes('集成') || lowered.includes('integration')) {
      return { type: 'integration', minutes: TASK_DURATION.integration };
    }
    if (lowered.includes('分析') || lowered.includes('analyze')) {
      return { type: 'deep_analysis', minutes: TASK_DURATION.deep_analysis };
    }
    if (lowered.includes('研究') || lowered.includes('research')) {
      return { type: 'research', minutes: TASK_DURATION.research };
    }
    if (lowered.includes('生成代码') || lowered.includes('code')) {
      return { type: 'code_generation', minutes: TASK_DURATION.code_generation };
    }
    if (lowered.includes('read') || lowered.includes('write') || lowered.includes('glob')) {
      return { type: 'file_operation', minutes: TASK_DURATION.file_operation };
    }
    if (lowered.includes('你好') || lowered.includes('进度') || lowered.includes('状态')) {
      return { type: 'simple_query', minutes: TASK_DURATION.simple_query };
    }

    return { type: 'unknown', minutes: TASK_DURATION.unknown };
  }

  /**
   * Decide if should spawn
   */
  shouldSpawn(taskDescription, forceSpawn = false) {
    // User explicitly requests spawn
    if (taskDescription.includes('后台') || taskDescription.includes('background') || forceSpawn) {
      this.state.stats.spawned++;
      this.state.stats.total++;
      this.saveState();
      return {
        spawn: true,
        reason: '用户明确要求后台执行',
        estimatedMinutes: TASK_DURATION.unknown
      };
    }

    const estimation = this.estimateDuration(taskDescription);
    const shouldSpawn = estimation.minutes >= SPAWN_THRESHOLD_MINUTES;

    this.state.stats.total++;
    if (shouldSpawn) {
      this.state.stats.spawned++;
    } else {
      this.state.stats.inline++;
    }
    this.saveState();

    return {
      spawn: shouldSpawn,
      type: estimation.type,
      estimatedMinutes: estimation.minutes,
      reason: shouldSpawn
        ? `预估耗时 ${estimation.minutes} 分钟，超过阈值 ${SPAWN_THRESHOLD_MINUTES} 分钟，建议后台执行`
        : `预估耗时 ${estimation.minutes} 分钟，低于阈值，即时执行`
    };
  }

  /**
   * Record spawned task
   */
  recordSpawn(taskId, taskName, estimatedMinutes) {
    const spawnedTask = {
      taskId,
      taskName,
      estimatedMinutes,
      startedAt: Date.now(),
      status: 'running'
    };

    this.state.spawnedTasks.push(spawnedTask);
    this.saveState();

    return spawnedTask;
  }

  /**
   * Get active spawned tasks
   */
  getActiveSpawns() {
    return this.state.spawnedTasks.filter(t => t.status === 'running');
  }

  /**
   * Complete spawned task
   */
  completeSpawn(taskId) {
    const task = this.state.spawnedTasks.find(t => t.taskId === taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = Date.now();
      task.elapsedMinutes = Math.round((task.completedAt - task.startedAt) / 60000);
      this.saveState();
    }
    return task;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.state.stats,
      spawnRate: this.state.stats.spawned / this.state.stats.total || 0,
      activeSpawns: this.getActiveSpawns().length
    };
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const engine = new SpawnDecisionEngine();

switch (command) {
  case 'check':
    const taskDesc = args[1] || '测试任务';
    const result = engine.shouldSpawn(taskDesc);
    console.log(JSON.stringify(result, null, 2));
    break;

  case 'spawn':
    const spawnTaskId = args[1] || `spawn-${Date.now()}`;
    const spawnTaskName = args[2] || '未命名任务';
    const spawnEstimated = parseInt(args[3]) || 10;
    const spawned = engine.recordSpawn(spawnTaskId, spawnTaskName, spawnEstimated);
    console.log(JSON.stringify(spawned, null, 2));
    break;

  case 'complete':
    const completeTaskId = args[1];
    const completed = engine.completeSpawn(completeTaskId);
    console.log(JSON.stringify(completed, null, 2));
    break;

  case 'active':
    console.log(JSON.stringify(engine.getActiveSpawns(), null, 2));
    break;

  case 'stats':
    console.log(JSON.stringify(engine.getStats(), null, 2));
    break;

  case 'test':
    // Test spawn decision
    const testTasks = [
      '你好',
      '进度如何',
      'read file.txt',
      '生成代码实现缓存',
      '分析 DeerFlow 架构',
      '移植 DeerFlow 功能到 OpenClaw',
      '后台执行 DeerFlow 集成'
    ];

    console.log('Spawn decision test:');
    testTasks.forEach(task => {
      const result = engine.shouldSpawn(task);
      console.log(`  "${task}" → spawn: ${result.spawn} (${result.estimatedMinutes}min)`);
    });
    break;

  default:
    console.log('Usage: spawn-decision.js [check|spawn|complete|active|stats|test]');
    console.log('');
    console.log('Commands:');
    console.log('  check <taskDescription> - Check if should spawn');
    console.log('  spawn <taskId> <taskName> <estimatedMinutes> - Record spawn');
    console.log('  complete <taskId> - Complete spawned task');
    console.log('  active - Get active spawned tasks');
    console.log('  stats - Get spawn stats');
    console.log('  test - Test spawn decision');
}

module.exports = { SpawnDecisionEngine, TASK_DURATION, SPAWN_THRESHOLD_MINUTES };