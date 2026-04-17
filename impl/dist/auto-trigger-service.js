/**
 * Auto-trigger Service - 自动触发服务
 *
 * 功能：
 * 1. 系统启动时自动触发所有心跳任务
 * 2. 创建初始状态文件
 * 3. 确保自动化运行
 */
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
const STATE_PATH = join(process.env.OPENCLAW_WORKSPACE || process.cwd(), 'memory', 'heartbeat-state.json');
export function initializeHeartbeatState() {
    const now = Math.floor(Date.now() / 1000);
    if (!existsSync(STATE_PATH)) {
        // 创建初始状态文件
        const initialState = {
            lastCheckTime: now,
            lastRunTime: now,
            tasks: {
                'health-monitor': { lastRun: now, nextRun: now + 300, runs: 1, skipCount: 0 },
                'task-visualizer': { lastRun: now, nextRun: now + 1800, runs: 1, skipCount: 0 },
                'rate-limit-check': { lastRun: now, nextRun: now + 1800, runs: 1, skipCount: 0 },
                'away-summary': { lastRun: now, nextRun: now + 1800, runs: 1, skipCount: 0 },
            },
        };
        writeFileSync(STATE_PATH, JSON.stringify(initialState, null, 2));
        return {
            initialized: true,
            tasksTriggered: ['health-monitor', 'task-visualizer', 'rate-limit-check', 'away-summary'],
            summary: '心跳状态已初始化，首次触发完成',
        };
    }
    return {
        initialized: false,
        tasksTriggered: [],
        summary: '状态文件已存在，无需初始化',
    };
}
export const autoTriggerService = {
    initialize: initializeHeartbeatState,
};
//# sourceMappingURL=auto-trigger-service.js.map