/**
 * Scheduled Tasks Service
 * 借鉴 Claude Code useScheduledTasks.ts
 * 飞书场景：定时任务管理
 */
// 单例状态
let state = {
    tasks: [],
    stats: {
        totalTasks: 0,
        enabledTasks: 0,
        runsCompleted: 0,
        runsFailed: 0,
        lastCheckTime: 0
    }
};
/**
 * 创建定时任务
 */
export function createTask(name, type, schedule, enabled = true) {
    const task = {
        id: `sched-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        type,
        schedule,
        enabled,
        runCount: 0,
        nextRun: parseSchedule(schedule)
    };
    state.tasks.push(task);
    state.stats.totalTasks++;
    if (enabled)
        state.stats.enabledTasks++;
    return task;
}
/**
 * 解析调度表达式（简化）
 */
function parseSchedule(schedule) {
    // 支持简单格式:
    // - "1h" - 1小时后
    // - "30m" - 30分钟后
    // - "daily" - 每天
    // - "hourly" - 每小时
    const now = Date.now();
    if (schedule.endsWith('h')) {
        const hours = parseInt(schedule.slice(0, -1));
        return now + hours * 3_600_000;
    }
    if (schedule.endsWith('m')) {
        const minutes = parseInt(schedule.slice(0, -1));
        return now + minutes * 60_000;
    }
    if (schedule === 'daily') {
        // 下一个 midnight
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
    }
    if (schedule === 'hourly') {
        return now + 3_600_000;
    }
    return now + 60_000; // 默认 1 分钟
}
/**
 * 启用/禁用任务
 */
export function setTaskEnabled(taskId, enabled) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        const wasEnabled = task.enabled;
        task.enabled = enabled;
        if (wasEnabled && !enabled)
            state.stats.enabledTasks--;
        if (!wasEnabled && enabled)
            state.stats.enabledTasks++;
        return true;
    }
    return false;
}
/**
 * 检查到期任务
 */
export function checkDueTasks() {
    const now = Date.now();
    state.stats.lastCheckTime = now;
    return state.tasks.filter(t => t.enabled &&
        t.nextRun &&
        t.nextRun <= now);
}
/**
 * 运行任务（标记）
 */
export function runTask(taskId, success = true) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.lastRun = Date.now();
        task.runCount++;
        // 计算下一次运行时间
        if (task.type === 'recurring' || task.type === 'cron') {
            task.nextRun = parseSchedule(task.schedule);
        }
        else {
            task.enabled = false; // one-time 任务完成后禁用
            state.stats.enabledTasks--;
        }
        if (success)
            state.stats.runsCompleted++;
        else
            state.stats.runsFailed++;
        return true;
    }
    return false;
}
/**
 * 获取所有任务
 */
export function getAllTasks() {
    return [...state.tasks];
}
/**
 * 获取启用任务
 */
export function getEnabledTasks() {
    return state.tasks.filter(t => t.enabled);
}
/**
 * 获取统计
 */
export function getStats() {
    return { ...state.stats };
}
/**
 * 删除任务
 */
export function deleteTask(taskId) {
    const index = state.tasks.findIndex(t => t.id === taskId);
    if (index >= 0) {
        const task = state.tasks[index];
        state.tasks.splice(index, 1);
        state.stats.totalTasks--;
        if (task.enabled)
            state.stats.enabledTasks--;
        return true;
    }
    return false;
}
/**
 * 生成飞书定时任务卡片
 */
export function generateScheduledTasksCard() {
    const enabled = getEnabledTasks();
    const due = checkDueTasks();
    return {
        config: { wide_screen_mode: true },
        header: {
            template: due.length > 0 ? 'orange' : 'blue',
            title: { content: '⏰ 定时任务状态', tag: 'plain_text' }
        },
        elements: [
            {
                tag: 'div',
                fields: [
                    { is_short: true, text: { content: `${state.stats.totalTasks}`, tag: 'lark_md' }, title: { content: '总任务', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${state.stats.enabledTasks}`, tag: 'lark_md' }, title: { content: '启用', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${due.length}`, tag: 'lark_md' }, title: { content: '待运行', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${state.stats.runsCompleted}`, tag: 'lark_md' }, title: { content: '已完成', tag: 'lark_md' } }
                ]
            },
            enabled.length > 0 ? {
                tag: 'div',
                text: {
                    content: '**启用任务:**\n' + enabled
                        .slice(0, 5)
                        .map(t => `• ${t.name} (${t.type}) ${t.nextRun ? `→ ${new Date(t.nextRun).toLocaleTimeString('zh-CN')}` : ''}`)
                        .join('\n'),
                    tag: 'lark_md'
                }
            } : undefined,
            due.length > 0 ? {
                tag: 'div',
                text: {
                    content: '**⚠️ 到期任务:**\n' + due
                        .slice(0, 3)
                        .map(t => `• ${t.name}`)
                        .join('\n'),
                    tag: 'lark_md'
                }
            } : undefined,
            {
                tag: 'note',
                elements: [{ tag: 'plain_text', content: `最后检查: ${new Date(state.stats.lastCheckTime).toLocaleTimeString('zh-CN')} | 失败: ${state.stats.runsFailed}` }]
            }
        ].filter(Boolean)
    };
}
/**
 * 重置
 */
export function reset() {
    state = {
        tasks: [],
        stats: {
            totalTasks: 0,
            enabledTasks: 0,
            runsCompleted: 0,
            runsFailed: 0,
            lastCheckTime: 0
        }
    };
}
// 导出单例
export const scheduledTasksService = {
    createTask,
    setTaskEnabled,
    checkDueTasks,
    runTask,
    getAllTasks,
    getEnabledTasks,
    getStats,
    deleteTask,
    generateScheduledTasksCard,
    reset
};
export default scheduledTasksService;
//# sourceMappingURL=scheduled-tasks-service.js.map