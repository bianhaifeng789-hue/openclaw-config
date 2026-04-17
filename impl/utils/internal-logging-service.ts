/**
 * Internal Logging Service
 * 借鉴 Claude Code internalLogging.ts
 * 飞书场景：记录内部日志，追踪环境信息
 */

import * as os from 'os'
import * as fs from 'fs/promises'

// 日志级别
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 日志条目
interface LogEntry {
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  metadata?: Record<string, unknown>
}

// 内部日志状态
interface InternalLoggingState {
  logs: LogEntry[]
  maxLogs: number
  environmentInfo: {
    platform: string
    nodeVersion: string
    hostname: string
    homedir: string
    userType: string
  }
  stats: {
    totalLogs: number
    errorsLogged: number
    warningsLogged: number
  }
}

// 单例状态
let state: InternalLoggingState = {
  logs: [],
  maxLogs: 1000,
  environmentInfo: {
    platform: os.platform(),
    nodeVersion: process.version,
    hostname: os.hostname(),
    homedir: os.homedir(),
    userType: process.env.USER_TYPE || 'local'
  },
  stats: {
    totalLogs: 0,
    errorsLogged: 0,
    warningsLogged: 0
  }
}

/**
 * 记录日志
 */
export function log(
  level: LogLevel,
  category: string,
  message: string,
  metadata?: Record<string, unknown>
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date(),
    level,
    category,
    message,
    metadata
  }
  
  state.logs.push(entry)
  
  // 超过最大数量时删除旧日志
  if (state.logs.length > state.maxLogs) {
    state.logs.shift()
  }
  
  // 更新统计
  state.stats.totalLogs++
  if (level === 'error') state.stats.errorsLogged++
  if (level === 'warn') state.stats.warningsLogged++
  
  return entry
}

/**
 * 快捷方法
 */
export const logDebug = (category: string, message: string, metadata?: Record<string, unknown>) => 
  log('debug', category, message, metadata)

export const logInfo = (category: string, message: string, metadata?: Record<string, unknown>) => 
  log('info', category, message, metadata)

export const logWarn = (category: string, message: string, metadata?: Record<string, unknown>) => 
  log('warn', category, message, metadata)

export const logError = (category: string, message: string, metadata?: Record<string, unknown>) => 
  log('error', category, message, metadata)

/**
 * 获取环境信息
 */
export function getEnvironmentInfo(): InternalLoggingState['environmentInfo'] {
  return { ...state.environmentInfo }
}

/**
 * 获取所有日志
 */
export function getLogs(): LogEntry[] {
  return [...state.logs]
}

/**
 * 获取特定级别的日志
 */
export function getLogsByLevel(level: LogLevel): LogEntry[] {
  return state.logs.filter(entry => entry.level === level)
}

/**
 * 获取特定类别的日志
 */
export function getLogsByCategory(category: string): LogEntry[] {
  return state.logs.filter(entry => entry.category === category)
}

/**
 * 获取统计信息
 */
export function getStats(): InternalLoggingState['stats'] {
  return { ...state.stats }
}

/**
 * 导出日志到文件
 */
export async function exportLogs(filePath: string): Promise<void> {
  const content = state.logs
    .map(entry => {
      const timestamp = entry.timestamp.toISOString()
      const metadataStr = entry.metadata ? JSON.stringify(entry.metadata) : ''
      return `${timestamp} [${entry.level.toUpperCase()}] ${entry.category}: ${entry.message} ${metadataStr}`
    })
    .join('\n')
  
  await fs.writeFile(filePath, content, 'utf-8')
}

/**
 * 格式化日志摘要（飞书卡片用）
 */
export function formatLogsSummary(entries: LogEntry[]): string {
  return entries
    .slice(0, 10)
    .map(entry => {
      const symbol = entry.level === 'error' ? '❌' : entry.level === 'warn' ? '⚠️' : 'ℹ️'
      const time = entry.timestamp.toLocaleTimeString('zh-CN')
      return `${symbol} ${time} ${entry.category}: ${entry.message}`
    })
    .join('\n')
}

/**
 * 生成飞书日志卡片
 */
export function generateLogCard(): object {
  const recentErrors = getLogsByLevel('error').slice(-5)
  const recentWarnings = getLogsByLevel('warn').slice(-5)
  
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { content: '📋 内部日志摘要', tag: 'plain_text' }
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { content: `${state.stats.totalLogs}`, tag: 'lark_md' }, title: { content: '总日志', tag: 'lark_md' } },
          { is_short: true, text: { content: `${state.stats.errorsLogged}`, tag: 'lark_md' }, title: { content: '错误', tag: 'lark_md' } },
          { is_short: true, text: { content: `${state.stats.warningsLogged}`, tag: 'lark_md' }, title: { content: '警告', tag: 'lark_md' } },
          { is_short: true, text: { content: state.environmentInfo.platform, tag: 'lark_md' }, title: { content: '平台', tag: 'lark_md' } }
        ]
      },
      {
        tag: 'div',
        text: { content: '**最近错误:**\n' + (recentErrors.length > 0 ? formatLogsSummary(recentErrors) : '无'), tag: 'lark_md' }
      },
      {
        tag: 'div',
        text: { content: '**最近警告:**\n' + (recentWarnings.length > 0 ? formatLogsSummary(recentWarnings) : '无'), tag: 'lark_md' }
      },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: `环境: ${state.environmentInfo.hostname} | Node: ${state.environmentInfo.nodeVersion}` }]
      }
    ]
  }
}

/**
 * 清除日志
 */
export function clearLogs(): void {
  state.logs = []
  state.stats.totalLogs = 0
  state.stats.errorsLogged = 0
  state.stats.warningsLogged = 0
}

/**
 * 重置所有状态
 */
export function reset(): void {
  state = {
    logs: [],
    maxLogs: 1000,
    environmentInfo: {
      platform: os.platform(),
      nodeVersion: process.version,
      hostname: os.hostname(),
      homedir: os.homedir(),
      userType: process.env.USER_TYPE || 'local'
    },
    stats: {
      totalLogs: 0,
      errorsLogged: 0,
      warningsLogged: 0
    }
  }
}

// 导出单例
export const internalLoggingService = {
  log,
  logDebug,
  logInfo,
  logWarn,
  logError,
  getEnvironmentInfo,
  getLogs,
  getLogsByLevel,
  getLogsByCategory,
  getStats,
  exportLogs,
  formatLogsSummary,
  generateLogCard,
  clearLogs,
  reset
}

export default internalLoggingService