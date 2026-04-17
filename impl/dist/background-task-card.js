// @ts-nocheck
/**
 * Background Task Card - 飞书后台任务可视化卡片
 *
 * 从 Claude Code tasks/ 借鉴：
 * - DreamTask 的任务注册机制
 * - Footer pill 的状态展示
 * - utils/task/framework.ts 的状态更新
 *
 * 飞书适配：
 * - 用飞书卡片替代 CLI footer pill
 * - 定期轮询更新卡片状态
 * - 支持交互按钮（查看详情、取消任务）
 */
export const DEFAULT_CONFIG = {
    showProgress: true,
    showResult: true,
    notifyOnFailure: true,
    compactMode: false,
    updateIntervalMs: 3000 // 3秒更新一次
};
// 状态图标映射（借鉴 Claude Code Diamond icons）
const STATUS_ICONS = {
    pending: '⏳',
    running: '🔄',
    completed: '✅',
    failed: '❌',
    cancelled: '🚫'
};
// 任务类型中文映射
const TASK_TYPE_NAMES = {
    memory_maintenance: '记忆维护',
    insights_analysis: '洞察分析',
    dream_task: '记忆整合',
    cron_task: '定时任务',
    subagent: '子代理任务',
    compact: '上下文压缩',
    tool_run: '工具执行'
};
// 进度条可视化
function formatProgressBar(progress, width = 10) {
    const filled = Math.round(progress / 100 * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}
// 任务时长格式化
function formatDuration(startedAt, completedAt) {
    const end = completedAt ?? Date.now();
    const seconds = Math.round((end - startedAt) / 1000);
    if (seconds < 60)
        return `${seconds}秒`;
    if (seconds < 3600)
        return `${Math.round(seconds / 60)}分钟`;
    return `${Math.round(seconds / 3600)}小时`;
}
/**
 * 创建任务启动卡片
 */
export function createTaskStartCard(task, config = DEFAULT_CONFIG) {
    const taskName = TASK_TYPE_NAMES[task.name] ?? task.name;
    const icon = STATUS_ICONS[task.status];
    return {
        config: { wide_screen_mode: true },
        header: {
            title: {
                tag: 'plain_text',
                content: `${icon} 后台任务启动`
            },
            template: 'blue'
        },
        elements: [
            {
                tag: 'div',
                text: {
                    tag: 'lark_md',
                    content: `**${taskName}**\n\n任务 ID: ${task.id}\n状态: 运行中`
                }
            },
            {
                tag: 'note',
                elements: [
                    { tag: 'plain_text', content: `预计耗时：1-2 分钟` }
                ]
            }
        ]
    };
}
/**
 * 创建任务进度卡片
 */
export function createTaskProgressCard(task, config = DEFAULT_CONFIG) {
    const taskName = TASK_TYPE_NAMES[task.name] ?? task.name;
    const icon = STATUS_ICONS[task.status];
    const progressBar = formatProgressBar(task.progress);
    const duration = formatDuration(task.startedAt);
    const elements = [
        {
            tag: 'div',
            text: {
                tag: 'lark_md',
                content: `**${icon} ${taskName}**\n\n进度: \`[${progressBar}]\` ${task.progress}%\n耗时: ${duration}`
            }
        }
    ];
    // 添加进度详情
    if (config.showProgress && task.progress > 0) {
        elements.push({
            tag: 'div',
            text: {
                tag: 'lark_md',
                content: `\n正在处理...`
            }
        });
    }
    return {
        config: { wide_screen_mode: true },
        header: {
            title: {
                tag: 'plain_text',
                content: `⚙️ 后台任务进度`
            },
            template: 'wathet'
        },
        elements
    };
}
/**
 * 创建任务完成卡片
 */
export function createTaskCompleteCard(task, result, config = DEFAULT_CONFIG) {
    const taskName = TASK_TYPE_NAMES[task.name] ?? task.name;
    const icon = STATUS_ICONS.completed;
    const duration = formatDuration(task.startedAt, task.completedAt);
    const elements = [
        {
            tag: 'div',
            text: {
                tag: 'lark_md',
                content: `**${icon} ${taskName} 完成**\n\n耗时: ${duration}\n${result ? `\n结果:\n${result}` : ''}`
            }
        }
    ];
    // 添加交互按钮
    if (task.name === 'memory_maintenance') {
        elements.push({
            tag: 'action',
            actions: [
                {
                    tag: 'button',
                    text: { tag: 'plain_text', content: '查看 MEMORY.md' },
                    type: 'primary',
                    value: { action: 'view_memory', taskId: task.id }
                }
            ]
        });
    }
    return {
        config: { wide_screen_mode: true },
        header: {
            title: {
                tag: 'plain_text',
                content: `✅ 任务完成`
            },
            template: 'green'
        },
        elements
    };
}
/**
 * 创建任务失败卡片
 */
export function createTaskFailedCard(task, config = DEFAULT_CONFIG) {
    const taskName = TASK_TYPE_NAMES[task.name] ?? task.name;
    const icon = STATUS_ICONS.failed;
    const duration = formatDuration(task.startedAt, task.completedAt);
    return {
        config: { wide_screen_mode: true },
        header: {
            title: {
                tag: 'plain_text',
                content: `❌ 任务失败`
            },
            template: 'red'
        },
        elements: [
            {
                tag: 'div',
                text: {
                    tag: 'lark_md',
                    content: `**${taskName}**\n\n错误: ${task.error ?? '未知错误'}\n耗时: ${duration}`
                }
            },
            {
                tag: 'action',
                actions: [
                    {
                        tag: 'button',
                        text: { tag: 'plain_text', content: '查看详情' },
                        type: 'default',
                        value: { action: 'view_error', taskId: task.id }
                    }
                ]
            }
        ]
    };
}
/**
 * 创建多任务汇总卡片
 * 借鉴 Claude Code Shift+Down dialog 的多任务展示
 */
export function createTasksSummaryCard(tasks, config = DEFAULT_CONFIG) {
    const running = tasks.filter(t => t.status === 'running' || t.status === 'pending');
    const completed = tasks.filter(t => t.status === 'completed');
    const failed = tasks.filter(t => t.status === 'failed');
    // 构建任务列表
    const taskLines = [];
    for (const task of running) {
        const icon = STATUS_ICONS[task.status];
        const name = TASK_TYPE_NAMES[task.name] ?? task.name;
        const progress = formatProgressBar(task.progress, 8);
        taskLines.push(`${icon} ${name} \`[${progress}]\` ${task.progress}%`);
    }
    for (const task of completed.slice(-3)) { // 只显示最近3个完成的
        const icon = STATUS_ICONS.completed;
        const name = TASK_TYPE_NAMES[task.name] ?? task.name;
        taskLines.push(`${icon} ${name} 已完成`);
    }
    for (const task of failed.slice(-2)) { // 只显示最近2个失败的
        const icon = STATUS_ICONS.failed;
        const name = TASK_TYPE_NAMES[task.name] ?? task.name;
        taskLines.push(`${icon} ${name} 失败`);
    }
    return {
        config: { wide_screen_mode: true },
        header: {
            title: {
                tag: 'plain_text',
                content: `⚙️ 后台任务 (${running.length} 运行中)`
            },
            template: running.length > 0 ? 'blue' : 'grey'
        },
        elements: [
            {
                tag: 'div',
                text: {
                    tag: 'lark_md',
                    content: taskLines.join('\n')
                }
            },
            {
                tag: 'note',
                elements: [
                    { tag: 'plain_text', content: `总计: ${tasks.length} | 完成: ${completed.length} | 失败: ${failed.length}` }
                ]
            }
        ]
    };
}
/**
 * 根据任务状态选择合适的卡片
 */
export function createTaskCard(task, result, config = DEFAULT_CONFIG) {
    switch (task.status) {
        case 'pending':
        case 'running':
            if (task.progress === 0) {
                return createTaskStartCard(task, config);
            }
            return createTaskProgressCard(task, config);
        case 'completed':
            return createTaskCompleteCard(task, result, config);
        case 'failed':
            return createTaskFailedCard(task, config);
        case 'cancelled':
            return {
                config: { wide_screen_mode: true },
                header: {
                    title: { tag: 'plain_text', content: '🚫 任务已取消' },
                    template: 'grey'
                },
                elements: [
                    {
                        tag: 'div',
                        text: {
                            tag: 'lark_md',
                            content: `任务 ${TASK_TYPE_NAMES[task.name] ?? task.name} 已被取消`
                        }
                    }
                ]
            };
        default:
            return createTaskProgressCard(task, config);
    }
}
// 导出工具
export const backgroundTaskCard = {
    createTaskCard,
    createTaskStartCard,
    createTaskProgressCard,
    createTaskCompleteCard,
    createTaskFailedCard,
    createTasksSummaryCard,
    formatProgressBar,
    formatDuration,
    STATUS_ICONS,
    TASK_TYPE_NAMES,
    DEFAULT_CONFIG
};
export default backgroundTaskCard;
//# sourceMappingURL=background-task-card.js.map