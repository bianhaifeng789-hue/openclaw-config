/**
 * Task List Watcher Service
 * 借鉴 Claude Code useTaskListWatcher.ts
 * 飞书场景：监控任务目录，自动拾取未分配任务
 */
import * as fs from 'fs/promises';
import * as path from 'path';
// 单例状态
let state = {
    currentTaskId: null,
    tasksDir: '',
    isWatching: false,
    stats: {
        tasksPickedUp: 0,
        tasksCompleted: 0,
        tasksSkipped: 0,
        watchErrors: 0
    }
};
// 默认任务目录
const DEFAULT_TASKS_DIR = path.join(process.env.WORKSPACE_ROOT || '~/.openclaw/workspace', 'tasks');
/**
 * 初始化任务目录
 */
export async function initTasksDir(tasksDir) {
    const dir = tasksDir || DEFAULT_TASKS_DIR;
    state.tasksDir = dir;
    try {
        await fs.mkdir(dir, { recursive: true });
        await fs.mkdir(path.join(dir, 'open'), { recursive: true });
        await fs.mkdir(path.join(dir, 'in_progress'), { recursive: true });
        await fs.mkdir(path.join(dir, 'completed'), { recursive: true });
        await fs.mkdir(path.join(dir, 'cancelled'), { recursive: true });
    }
    catch (e) {
        state.stats.watchErrors++;
    }
}
/**
 * 列出任务
 */
export async function listTasks(taskListId) {
    const dir = taskListId ? path.join(state.tasksDir, taskListId) : state.tasksDir;
    const tasks = [];
    try {
        const openDir = path.join(dir, 'open');
        const files = await fs.readdir(openDir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(openDir, file), 'utf-8');
                const task = JSON.parse(content);
                tasks.push(task);
            }
        }
    }
    catch (e) {
        // 目录不存在或读取失败
    }
    return tasks.sort((a, b) => b.createdAt - a.createdAt);
}
/**
 * 获取下一个待处理任务
 */
export async function getNextTask(agentId) {
    const tasks = await listTasks();
    // 筛选未分配或分配给当前 agent 的任务
    const availableTasks = tasks.filter(t => t.status === 'open' &&
        (!t.owner || t.owner === agentId));
    if (availableTasks.length === 0) {
        return null;
    }
    // 优先高优先级任务
    const highPriority = availableTasks.filter(t => t.priority === 'high');
    if (highPriority.length > 0) {
        return highPriority[0];
    }
    return availableTasks[0];
}
/**
 * 认领任务
 */
export async function claimTask(taskId, agentId) {
    try {
        const openPath = path.join(state.tasksDir, 'open', `${taskId}.json`);
        const inProgressPath = path.join(state.tasksDir, 'in_progress', `${taskId}.json`);
        const content = await fs.readFile(openPath, 'utf-8');
        const task = JSON.parse(content);
        task.owner = agentId;
        task.status = 'in_progress';
        task.updatedAt = Date.now();
        await fs.writeFile(inProgressPath, JSON.stringify(task, null, 2), 'utf-8');
        await fs.unlink(openPath);
        state.currentTaskId = taskId;
        state.stats.tasksPickedUp++;
        return true;
    }
    catch (e) {
        state.stats.watchErrors++;
        return false;
    }
}
/**
 * 完成任务
 */
export async function completeTask(taskId) {
    try {
        const inProgressPath = path.join(state.tasksDir, 'in_progress', `${taskId}.json`);
        const completedPath = path.join(state.tasksDir, 'completed', `${taskId}.json`);
        const content = await fs.readFile(inProgressPath, 'utf-8');
        const task = JSON.parse(content);
        task.status = 'completed';
        task.updatedAt = Date.now();
        await fs.writeFile(completedPath, JSON.stringify(task, null, 2), 'utf-8');
        await fs.unlink(inProgressPath);
        if (state.currentTaskId === taskId) {
            state.currentTaskId = null;
        }
        state.stats.tasksCompleted++;
        return true;
    }
    catch (e) {
        state.stats.watchErrors++;
        return false;
    }
}
/**
 * 创建任务
 */
export async function createTask(prompt, priority) {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const task = {
        id: taskId,
        prompt,
        status: 'open',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        priority
    };
    const openPath = path.join(state.tasksDir, 'open', `${taskId}.json`);
    await fs.writeFile(openPath, JSON.stringify(task, null, 2), 'utf-8');
    return task;
}
/**
 * 获取当前任务
 */
export function getCurrentTask() {
    return state.currentTaskId;
}
/**
 * 获取统计
 */
export function getStats() {
    return { ...state.stats };
}
/**
 * 生成飞书任务卡片
 */
export function generateTaskWatcherCard() {
    return {
        config: { wide_screen_mode: true },
        header: {
            template: 'blue',
            title: { content: '👀 任务监听状态', tag: 'plain_text' }
        },
        elements: [
            {
                tag: 'div',
                fields: [
                    { is_short: true, text: { content: `${state.stats.tasksPickedUp}`, tag: 'lark_md' }, title: { content: '已拾取', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${state.stats.tasksCompleted}`, tag: 'lark_md' }, title: { content: '已完成', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${state.stats.tasksSkipped}`, tag: 'lark_md' }, title: { content: '已跳过', tag: 'lark_md' } },
                    { is_short: true, text: { content: state.currentTaskId || '无', tag: 'lark_md' }, title: { content: '当前任务', tag: 'lark_md' } }
                ]
            },
            {
                tag: 'div',
                text: { content: `**任务目录:** ${state.tasksDir}`, tag: 'lark_md' }
            },
            {
                tag: 'note',
                elements: [{ tag: 'plain_text', content: `监听状态: ${state.isWatching ? '活跃' : '未启动'} | 错误: ${state.stats.watchErrors}` }]
            }
        ]
    };
}
/**
 * 重置
 */
export function reset() {
    state = {
        currentTaskId: null,
        tasksDir: '',
        isWatching: false,
        stats: {
            tasksPickedUp: 0,
            tasksCompleted: 0,
            tasksSkipped: 0,
            watchErrors: 0
        }
    };
}
// 导出单例
export const taskListWatcherService = {
    initTasksDir,
    listTasks,
    getNextTask,
    claimTask,
    completeTask,
    createTask,
    getCurrentTask,
    getStats,
    generateTaskWatcherCard,
    reset
};
export default taskListWatcherService;
//# sourceMappingURL=task-list-watcher-service.js.map