/**
 * Smart Heartbeat Scheduler - 轻量 heartbeat 调度器
 *
 * 自动检测 HEARTBEAT.md 中定义的轻任务，状态模型与当前最小 heartbeat schema 一致。
 * 仅使用 memory/heartbeat-state.json 作为主状态来源。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

interface HeartbeatTask {
  name: string;
  interval: string;
  priority: 'high' | 'medium' | 'low';
  prompt: string;
  lastRun?: number;
  nextRun?: number;
}

interface HeartbeatState {
  lastChecks: {
    heartbeat: number | null;
    tasks: number | null;
    contextPressure: number | null;
    doctor: number | null;
    memoryReview: number | null;
  };
  lastNotices: {
    heartbeat: number | null;
    tasks: number | null;
    contextPressure: number | null;
    doctor: number | null;
    memoryReview: number | null;
  };
  notes?: Record<string, any>;
}

const HEARTBEAT_MD_PATH = join(process.env.OPENCLAW_WORKSPACE || process.cwd(), 'HEARTBEAT.md');
const STATE_PATH = join(process.env.OPENCLAW_WORKSPACE || process.cwd(), 'memory', 'heartbeat-state.json');
const MAX_TASKS_PER_RUN = 2;

const INTERVAL_MS: Record<string, number> = {
  '5m': 5 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

const TASK_TO_STATE_KEY: Record<string, keyof HeartbeatState['lastChecks']> = {
  'context-pressure-check': 'contextPressure',
  'doctor-check': 'doctor',
  'memory-maintenance': 'memoryReview',
};

function defaultState(): HeartbeatState {
  return {
    lastChecks: {
      heartbeat: null,
      tasks: null,
      contextPressure: null,
      doctor: null,
      memoryReview: null,
    },
    lastNotices: {
      heartbeat: null,
      tasks: null,
      contextPressure: null,
      doctor: null,
      memoryReview: null,
    },
    notes: {
      comment: 'Minimal heartbeat state schema. Keep small and stable.',
    },
  };
}

function loadState(): HeartbeatState {
  if (!existsSync(STATE_PATH)) {
    return defaultState();
  }

  try {
    const parsed = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
    return {
      ...defaultState(),
      ...parsed,
      lastChecks: { ...defaultState().lastChecks, ...(parsed.lastChecks || {}) },
      lastNotices: { ...defaultState().lastNotices, ...(parsed.lastNotices || {}) },
    };
  } catch {
    return defaultState();
  }
}

function saveState(state: HeartbeatState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function parseHeartbeatMd(): HeartbeatTask[] {
  if (!existsSync(HEARTBEAT_MD_PATH)) {
    return [];
  }

  const content = readFileSync(HEARTBEAT_MD_PATH, 'utf-8');
  const tasks: HeartbeatTask[] = [];
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

  return tasks.filter(task => TASK_TO_STATE_KEY[task.name]);
}

export class SmartHeartbeatScheduler {
  private state: HeartbeatState;
  private tasks: HeartbeatTask[];

  constructor() {
    this.state = loadState();
    this.tasks = parseHeartbeatMd();
  }

  check(): { pending: HeartbeatTask[]; state: HeartbeatState } {
    const now = Date.now();
    this.state.lastChecks.heartbeat = now;

    const pending: HeartbeatTask[] = [];

    for (const task of this.tasks) {
      const intervalMs = INTERVAL_MS[task.interval] || 30 * 60 * 1000;
      const stateKey = TASK_TO_STATE_KEY[task.name];
      const lastRun = this.state.lastChecks[stateKey] || 0;
      const needsRun = !lastRun || (now - lastRun) >= intervalMs;

      if (needsRun) {
        pending.push({
          ...task,
          lastRun,
          nextRun: lastRun + intervalMs,
        });
      }
    }

    pending.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return { pending, state: this.state };
  }

  run(): { executed: string[]; skipped: string[]; summary: string } {
    const { pending } = this.check();
    const now = Date.now();

    const executed: string[] = [];
    const skipped: string[] = [];
    const toExecute = pending.slice(0, MAX_TASKS_PER_RUN);

    for (const task of toExecute) {
      const stateKey = TASK_TO_STATE_KEY[task.name];
      this.state.lastChecks[stateKey] = now;
      executed.push(task.name);
    }

    for (const task of pending.slice(MAX_TASKS_PER_RUN)) {
      skipped.push(task.name);
    }

    saveState(this.state);
    const summary = `执行 ${executed.length} 个任务: ${executed.join(', ')}`;
    return { executed, skipped, summary };
  }

  getPrompts(): string[] {
    const { pending } = this.check();
    return pending.slice(0, MAX_TASKS_PER_RUN).map(t => t.prompt);
  }

  getStats(): {
    tasksDefined: number;
    lastCheckTime: number | null;
    lastRunTime: number | null;
    pendingCount: number;
    lastChecks: HeartbeatState['lastChecks'];
  } {
    const { pending } = this.check();

    const lastRunTime = Math.max(
      ...Object.values(this.state.lastChecks).map(v => v || 0),
      0,
    ) || null;

    return {
      tasksDefined: this.tasks.length,
      lastCheckTime: this.state.lastChecks.heartbeat,
      lastRunTime,
      pendingCount: pending.length,
      lastChecks: this.state.lastChecks,
    };
  }
}

export const smartHeartbeatScheduler = new SmartHeartbeatScheduler();

export function getPendingTasks(): HeartbeatTask[] {
  return smartHeartbeatScheduler.check().pending;
}

export function runTasks(): { executed: string[]; skipped: string[]; summary: string } {
  return smartHeartbeatScheduler.run();
}

export function getSchedulerStats(): ReturnType<SmartHeartbeatScheduler['getStats']> {
  return smartHeartbeatScheduler.getStats();
}
