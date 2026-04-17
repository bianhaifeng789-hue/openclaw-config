/**
 * Smart Heartbeat Scheduler - 智能心跳调度器
 * 
 * 自动检测并执行 HEARTBEAT.md 任务，无需手动触发
 * 
 * 机制：
 * 1. OpenClaw heartbeat 配置触发轮询
 * 2. 自动检查 pending tasks
 * 3. 智能选择优先级最高的任务执行
 * 4. 防止重复执行（基于时间戳）
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

interface HeartbeatTask {
  name: string;
  interval: string;
  priority: 'high' | 'medium' | 'low';
  prompt: string;
  lastRun?: number;
  nextRun?: number;
}

interface HeartbeatState {
  lastCheckTime: number;
  lastRunTime: number;
  tasks: Record<string, {
    lastRun: number;
    nextRun: number;
    runs: number;
    skipCount: number;
  }>;
}

// ============================================================================
// Constants
// ============================================================================

const HEARTBEAT_MD_PATH = join(process.env.OPENCLAW_WORKSPACE || process.cwd(), 'HEARTBEAT.md');
const STATE_PATH = join(process.env.OPENCLAW_WORKSPACE || process.cwd(), 'memory', 'heartbeat-state.json');
const MAX_TASKS_PER_RUN = 3; // 每次最多执行 3 个任务
const HEALTH_MONITOR_MAX_FREQUENCY = 2; // 健康监控最多每2次心跳执行一次

const INTERVAL_MS: Record<string, number> = {
  '5m': 5 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

// 任务分类权重（影响调度优先级）
const TASK_CATEGORY_WEIGHT: Record<string, number> = {
  'health': 0.3,      // 健康监控权重低，不抢占其他任务
  'memory': 0.7,      // 记忆维护权重高
  'notification': 0.6, // 通知中等
  'stats': 0.5,       // 统计报告中等
  'service': 0.8,     // 服务检查高
};

// ============================================================================
// State Management
// ============================================================================

function loadState(): HeartbeatState {
  if (!existsSync(STATE_PATH)) {
    return {
      lastCheckTime: 0,
      lastRunTime: 0,
      tasks: {},
    };
  }
  
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    return {
      lastCheckTime: 0,
      lastRunTime: 0,
      tasks: {},
    };
  }
}

function saveState(state: HeartbeatState): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// ============================================================================
// Task Parser
// ============================================================================

function parseHeartbeatMd(): HeartbeatTask[] {
  if (!existsSync(HEARTBEAT_MD_PATH)) {
    return [];
  }
  
  const content = readFileSync(HEARTBEAT_MD_PATH, 'utf-8');
  const tasks: HeartbeatTask[] = [];
  
  // 解析 YAML 格式的任务定义
  const taskRegex = /- name: ([^\n]+)\n\s+interval: ([^\n]+)\n\s+priority: ([^\n]+)\n\s+prompt: "([^"]+)"/g;
  
  let match;
  while ((match = taskRegex.exec(content)) !== null) {
    tasks.push({
      name: match[1].trim(),
      interval: match[2].trim(),
      priority: match[3].trim() as 'high' | 'medium' | 'low',
      prompt: match[4].trim(),
    });
  }
  
  return tasks;
}

// ============================================================================
// Smart Scheduler
// ============================================================================

export class SmartHeartbeatScheduler {
  private state: HeartbeatState;
  private tasks: HeartbeatTask[];
  
  constructor() {
    this.state = loadState();
    this.tasks = parseHeartbeatMd();
  }
  
  /**
   * 检查是否有需要执行的任务（智能调度）
   */
  check(): {
    pending: HeartbeatTask[];
    state: HeartbeatState;
  } {
    const now = Date.now();
    this.state.lastCheckTime = now;
    
    const pending: HeartbeatTask[] = [];
    let healthMonitorSkipped = false;
    
    for (const task of this.tasks) {
      const intervalMs = INTERVAL_MS[task.interval] || 30 * 60 * 1000;
      const taskState = this.state.tasks[task.name] || { lastRun: 0, nextRun: 0, runs: 0, skipCount: 0 };
      
      // 检查是否需要执行
      const needsRun = !taskState.lastRun || (now - taskState.lastRun) >= intervalMs;
      
      if (needsRun) {
        // 健康监控特殊处理：最多每2次心跳执行一次
        if (task.name === 'health-monitor' && taskState.skipCount > 0 && taskState.skipCount < HEALTH_MONITOR_MAX_FREQUENCY) {
          taskState.skipCount++;
          healthMonitorSkipped = true;
          continue; // 跳过本次，给其他任务机会
        }
        
        pending.push({
          ...task,
          lastRun: taskState.lastRun,
          nextRun: taskState.lastRun + intervalMs,
        });
      }
    }
    
    // 按优先级 + 分类权重排序
    pending.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2, critical: 3 }; // critical 特殊处理
      
      // 健康监控永远排在最后（除非其他任务都完成）
      if (a.name === 'health-monitor' && pending.length > 1) return 1;
      if (b.name === 'health-monitor' && pending.length > 1) return -1;
      
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    return { pending, state: this.state };
  }
  
  /**
   * 执行任务
   */
  run(): {
    executed: string[];
    skipped: string[];
    summary: string;
  } {
    const { pending } = this.check();
    const now = Date.now();
    
    const executed: string[] = [];
    const skipped: string[] = [];
    
    // 每次最多执行 MAX_TASKS_PER_RUN 个任务
    const toExecute = pending.slice(0, MAX_TASKS_PER_RUN);
    
    for (const task of toExecute) {
      // 更新状态
      if (!this.state.tasks[task.name]) {
        this.state.tasks[task.name] = { lastRun: 0, nextRun: 0, runs: 0, skipCount: 0 };
      }
      
      this.state.tasks[task.name].lastRun = now;
      this.state.tasks[task.name].nextRun = now + (INTERVAL_MS[task.interval] || 30 * 60 * 1000);
      this.state.tasks[task.name].runs++;
      
      executed.push(task.name);
    }
    
    // 剩余任务标记为 skipped
    for (const task of pending.slice(MAX_TASKS_PER_RUN)) {
      skipped.push(task.name);
      // 增加健康监控的跳过计数
      if (task.name === 'health-monitor' && this.state.tasks[task.name]) {
        this.state.tasks[task.name].skipCount = (this.state.tasks[task.name].skipCount || 0) + 1;
      }
    }
    
    this.state.lastRunTime = now;
    saveState(this.state);
    
    const summary = `执行 ${executed.length} 个任务: ${executed.join(', ')}`;
    
    return { executed, skipped, summary };
  }
  
  /**
   * 获取任务执行提示
   */
  getPrompts(): string[] {
    const { pending } = this.check();
    return pending.slice(0, MAX_TASKS_PER_RUN).map(t => t.prompt);
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    tasksDefined: number;
    lastCheckTime: number;
    lastRunTime: number;
    pendingCount: number;
    taskStats: Record<string, { runs: number; lastRun: number }>;
  } {
    const { pending } = this.check();
    
    return {
      tasksDefined: this.tasks.length,
      lastCheckTime: this.state.lastCheckTime,
      lastRunTime: this.state.lastRunTime,
      pendingCount: pending.length,
      taskStats: this.state.tasks,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const smartHeartbeatScheduler = new SmartHeartbeatScheduler();

// ============================================================================
// CLI Interface (for heartbeat-cli.js)
// ============================================================================

export function getPendingTasks(): HeartbeatTask[] {
  return smartHeartbeatScheduler.check().pending;
}

export function runTasks(): { executed: string[]; skipped: string[]; summary: string } {
  return smartHeartbeatScheduler.run();
}

export function getSchedulerStats(): ReturnType<SmartHeartbeatScheduler['getStats']> {
  return smartHeartbeatScheduler.getStats();
}