/**
 * Auto-trigger Service - heartbeat 轻状态初始化器
 *
 * 仅负责在缺少状态文件时写入当前最小 schema，
 * 不再隐式触发旧的 worker 型 heartbeat 任务。
 */

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const STATE_PATH = join(process.env.OPENCLAW_WORKSPACE || process.cwd(), 'memory', 'heartbeat-state.json');

function createInitialState() {
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
      initializedBy: 'auto-trigger-service',
    },
  };
}

export function initializeHeartbeatState(): {
  initialized: boolean;
  tasksTriggered: string[];
  summary: string;
} {
  if (!existsSync(STATE_PATH)) {
    writeFileSync(STATE_PATH, JSON.stringify(createInitialState(), null, 2));

    return {
      initialized: true,
      tasksTriggered: [],
      summary: 'heartbeat 轻状态已初始化（未触发旧 worker 任务）',
    };
  }

  return {
    initialized: false,
    tasksTriggered: [],
    summary: 'heartbeat 状态文件已存在，无需初始化',
  };
}

export const autoTriggerService = {
  initialize: initializeHeartbeatState,
};
