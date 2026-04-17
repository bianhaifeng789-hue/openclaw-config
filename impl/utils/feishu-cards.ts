// @ts-nocheck
/**
 * Feishu Card Generators for Claude Code patterns.
 *
 * Generates interactive Feishu cards for:
 * - AutoDream completion notification
 * - AgentSummary progress display
 * - Task tracking visualization
 */

/**
 * Card element types
 */
type CardElement = {
  tag: string
  text?: { content: string; tag: string }
  actions?: Array<{ tag: string; text?: { content: string }; url?: string; callback?: string }>
  fields?: Array<{ is_short: boolean; text: { content: string; tag: string } }>
  icon?: { tag: string; icon_id: string }
  color?: string
}

type CardConfig = {
  config: { wide_screen_mode: boolean }
  elements: CardElement[]
}

/**
 * Create AutoDream completion card.
 */
export function createAutoDreamCard(data: {
  sessionsReviewed: number
  filesTouched: string[]
  cacheRead: number
  cacheCreated: number
  durationMs: number
}): CardConfig {
  const elements: CardElement[] = [
    {
      tag: 'div',
      text: {
        content: '**🌙 记忆合并完成**',
        tag: 'lark_md',
      },
    },
    {
      tag: 'div',
      fields: [
        {
          is_short: true,
          text: {
            content: `**审查会话**: ${data.sessionsReviewed}`,
            tag: 'lark_md',
          },
        },
        {
          is_short: true,
          text: {
            content: `**更新文件**: ${data.filesTouched.length}`,
            tag: 'lark_md',
          },
        },
      ],
    },
    {
      tag: 'div',
      fields: [
        {
          is_short: true,
          text: {
            content: `**缓存读取**: ${formatTokens(data.cacheRead)}`,
            tag: 'lark_md',
          },
        },
        {
          is_short: true,
          text: {
            content: `**缓存创建**: ${formatTokens(data.cacheCreated)}`,
            tag: 'lark_md',
          },
        },
      ],
    },
    {
      tag: 'div',
      text: {
        content: `耗时: ${formatDuration(data.durationMs)}`,
        tag: 'lark_md',
      },
    },
  ]

  if (data.filesTouched.length > 0) {
    elements.push({
      tag: 'div',
      text: {
        content: `**更新的文件:**\n${data.filesTouched.map(f => `- ${f}`).join('\n')}`,
        tag: 'lark_md',
      },
    })
  }

  return {
    config: { wide_screen_mode: true },
    elements,
  }
}

/**
 * Create AgentSummary progress card.
 */
export function createAgentSummaryCard(data: {
  taskId: string
  summary: string
  agentId: string
  lastUpdate: number
}): CardConfig {
  const timeSince = Date.now() - data.lastUpdate
  const status = timeSince < 60_000 ? '🟢 运行中' : '🔴 可能停止'

  return {
    config: { wide_screen_mode: true },
    elements: [
      {
        tag: 'div',
        text: {
          content: `**⚡ 代理进度摘要**`,
          tag: 'lark_md',
        },
      },
      {
        tag: 'div',
        fields: [
          {
            is_short: true,
            text: {
              content: `**任务ID**: ${data.taskId.slice(0, 8)}`,
              tag: 'lark_md',
            },
          },
          {
            is_short: true,
            text: {
              content: `**状态**: ${status}`,
              tag: 'lark_md',
            },
          },
        ],
      },
      {
        tag: 'div',
        text: {
          content: `**最新进度:** ${data.summary}`,
          tag: 'lark_md',
        },
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `更新于 ${formatTimeAgo(data.lastUpdate)}`,
          },
        ],
      },
    ],
  }
}

/**
 * Create task tracking card (multiple tasks).
 */
export function createTasksSummaryCard(tasks: Array<{
  taskId: string
  summary: string | null
  status: 'running' | 'completed' | 'failed'
}>): CardConfig {
  const runningTasks = tasks.filter(t => t.status === 'running')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const failedTasks = tasks.filter(t => t.status === 'failed')

  const elements: CardElement[] = [
    {
      tag: 'div',
      text: {
        content: '**📊 后台任务状态**',
        tag: 'lark_md',
      },
    },
  ]

  if (runningTasks.length > 0) {
    elements.push({
      tag: 'div',
      text: {
        content: `**运行中 (${runningTasks.length})**\n${runningTasks
          .map(t => `- ${t.taskId.slice(0, 8)}: ${t.summary || '等待摘要...'}`)
          .join('\n')}`,
        tag: 'lark_md',
      },
    })
  }

  if (completedTasks.length > 0) {
    elements.push({
      tag: 'div',
      text: {
        content: `**已完成 (${completedTasks.length})** ✅`,
        tag: 'lark_md',
      },
    })
  }

  if (failedTasks.length > 0) {
    elements.push({
      tag: 'div',
      text: {
        content: `**失败 (${failedTasks.length})** ❌`,
        tag: 'lark_md',
      },
    })
  }

  if (tasks.length === 0) {
    elements.push({
      tag: 'div',
      text: {
        content: '暂无后台任务',
        tag: 'lark_md',
      },
    })
  }

  return {
    config: { wide_screen_mode: true },
    elements,
  }
}

/**
 * Create memory compaction card.
 */
export function createMemoryCompactCard(data: {
  preCompactTokens: number
  postCompactTokens: number
  savedTokens: number
  messagesKept: number
}): CardConfig {
  const savedPercent =
    data.preCompactTokens > 0
      ? ((data.savedTokens / data.preCompactTokens) * 100).toFixed(1)
      : 0

  return {
    config: { wide_screen_mode: true },
    elements: [
      {
        tag: 'div',
        text: {
          content: '**🗜️ 记忆压缩完成**',
          tag: 'lark_md',
        },
      },
      {
        tag: 'div',
        fields: [
          {
            is_short: true,
            text: {
              content: `**压缩前**: ${formatTokens(data.preCompactTokens)}`,
              tag: 'lark_md',
            },
          },
          {
            is_short: true,
            text: {
              content: `**压缩后**: ${formatTokens(data.postCompactTokens)}`,
              tag: 'lark_md',
            },
          },
        ],
      },
      {
        tag: 'div',
        fields: [
          {
            is_short: true,
            text: {
              content: `**节省**: ${formatTokens(data.savedTokens)} (${savedPercent}%)`,
              tag: 'lark_md',
            },
          },
          {
            is_short: true,
            text: {
              content: `**保留消息**: ${data.messagesKept}`,
              tag: 'lark_md',
            },
          },
        ],
      },
    ],
  }
}

/**
 * Format tokens to human-readable.
 */
function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`
  }
  return `${tokens}`
}

/**
 * Format duration to human-readable.
 */
function formatDuration(ms: number): string {
  if (ms >= 60_000) {
    const minutes = Math.floor(ms / 60_000)
    const seconds = Math.floor((ms % 60_000) / 1_000)
    return `${minutes}m ${seconds}s`
  }
  if (ms >= 1_000) {
    return `${(ms / 1_000).toFixed(1)}s`
  }
  return `${ms}ms`
}

/**
 * Format time ago.
 */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1_000)

  if (seconds < 60) {
    return `${seconds}秒前`
  }
  if (seconds < 3_600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}分钟前`
  }
  const hours = Math.floor(seconds / 3_600)
  return `${hours}小时前`
}

/**
 * Export card JSON for Feishu message tool.
 */
export function cardToJson(card: CardConfig): string {
  return JSON.stringify(card)
}