/**
 * Extract Memories Service
 * 借鉴 Claude Code extractMemories.ts
 * 飞书场景：从会话中提取持久记忆
 */

// 记忆类型
type MemoryType = 'decision' | 'preference' | 'progress' | 'insight' | 'contact' | 'project'

// 提取的记忆
interface ExtractedMemory {
  type: MemoryType
  content: string
  importance: 'high' | 'medium' | 'low'
  source: string  // 来源消息ID或上下文
  timestamp: number
}

// 提取状态
interface ExtractState {
  memories: ExtractedMemory[]
  stats: {
    totalExtracted: number
    highImportance: number
    lastExtraction: number
    sessionsProcessed: number
  }
}

// 单例状态
let state: ExtractState = {
  memories: [],
  stats: {
    totalExtracted: 0,
    highImportance: 0,
    lastExtraction: 0,
    sessionsProcessed: 0
  }
}

/**
 * 从会话历史提取记忆
 */
export function extractFromSession(messages: string[]): ExtractedMemory[] {
  const extracted: ExtractedMemory[] = []
  
  for (const msg of messages) {
    // 决策类记忆
    const decisionMatch = msg.match(/决定|确定|选择|采用(.{20,100})/i)
    if (decisionMatch) {
      extracted.push({
        type: 'decision',
        content: decisionMatch[1],
        importance: 'high',
        source: 'session',
        timestamp: Date.now()
      })
    }
    
    // 偏好类记忆
    const preferenceMatch = msg.match(/喜欢|偏好|倾向|习惯(.{20,100})/i)
    if (preferenceMatch) {
      extracted.push({
        type: 'preference',
        content: preferenceMatch[1],
        importance: 'medium',
        source: 'session',
        timestamp: Date.now()
      })
    }
    
    // 进度类记忆
    const progressMatch = msg.match(/完成|完成|实现了|已完成(.{20,100})/i)
    if (progressMatch) {
      extracted.push({
        type: 'progress',
        content: progressMatch[1],
        importance: 'medium',
        source: 'session',
        timestamp: Date.now()
      })
    }
    
    // 洞察类记忆
    const insightMatch = msg.match(/发现|注意到|观察到|关键(.{20,100})/i)
    if (insightMatch) {
      extracted.push({
        type: 'insight',
        content: insightMatch[1],
        importance: 'high',
        source: 'session',
        timestamp: Date.now()
      })
    }
  }
  
  // 更新状态
  state.memories.push(...extracted)
  state.stats.totalExtracted += extracted.length
  state.stats.highImportance += extracted.filter(m => m.importance === 'high').length
  state.stats.lastExtraction = Date.now()
  state.stats.sessionsProcessed++
  
  return extracted
}

/**
 * 从文本提取特定类型记忆
 */
export function extractByType(text: string, type: MemoryType): ExtractedMemory[] {
  const patterns: Record<MemoryType, RegExp[]> = {
    decision: [/决定(.{20,100})/i, /确定(.{20,100})/i, /选择(.{20,100})/i],
    preference: [/喜欢(.{20,100})/i, /偏好(.{20,100})/i, /倾向(.{20,100})/i],
    progress: [/完成(.{20,100})/i, /实现了(.{20,100})/i, /已完成(.{20,100})/i],
    insight: [/发现(.{20,100})/i, /注意到(.{20,100})/i, /关键(.{20,100})/i],
    contact: [/联系人|用户|同事(.{10,50})/i],
    project: [/项目|工程|任务(.{20,100})/i]
  }
  
  const extracted: ExtractedMemory[] = []
  const regexes = patterns[type] || []
  
  for (const regex of regexes) {
    const matches = text.matchAll(regex)
    for (const match of matches) {
      extracted.push({
        type,
        content: match[1],
        importance: type === 'decision' || type === 'insight' ? 'high' : 'medium',
        source: 'text',
        timestamp: Date.now()
      })
    }
  }
  
  return extracted
}

/**
 * 获取所有记忆
 */
export function getAllMemories(): ExtractedMemory[] {
  return [...state.memories]
}

/**
 * 获取高重要性记忆
 */
export function getHighImportanceMemories(): ExtractedMemory[] {
  return state.memories.filter(m => m.importance === 'high')
}

/**
 * 按类型获取记忆
 */
export function getMemoriesByType(type: MemoryType): ExtractedMemory[] {
  return state.memories.filter(m => m.type === type)
}

/**
 * 获取最近记忆
 */
export function getRecentMemories(hours: number = 24): ExtractedMemory[] {
  const cutoff = Date.now() - hours * 3_600_000
  return state.memories.filter(m => m.timestamp >= cutoff)
}

/**
 * 获取统计
 */
export function getStats(): ExtractState['stats'] {
  return { ...state.stats }
}

/**
 * 生成飞书记忆卡片
 */
export function generateMemoryCard(): object {
  const byType: Record<MemoryType, number> = {
    decision: 0,
    preference: 0,
    progress: 0,
    insight: 0,
    contact: 0,
    project: 0
  }
  
  for (const memory of state.memories) {
    byType[memory.type]++
  }
  
  const recent = getRecentMemories(24)
  
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { content: '🧠 记忆提取摘要', tag: 'plain_text' }
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { content: `${state.stats.totalExtracted}`, tag: 'lark_md' }, title: { content: '总记忆', tag: 'lark_md' } },
          { is_short: true, text: { content: `${state.stats.highImportance}`, tag: 'lark_md' }, title: { content: '高重要', tag: 'lark_md' } },
          { is_short: true, text: { content: `${recent.length}`, tag: 'lark_md' }, title: { content: '24h内', tag: 'lark_md' } },
          { is_short: true, text: { content: `${state.stats.sessionsProcessed}`, tag: 'lark_md' }, title: { content: '会话处理', tag: 'lark_md' } }
        ]
      },
      {
        tag: 'div',
        text: {
          content: '**按类型分布:**\n' + Object.entries(byType)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => `• ${type}: ${count}`)
            .join('\n'),
          tag: 'lark_md'
        }
      },
      state.memories.length > 0 ? {
        tag: 'div',
        text: {
          content: '**最近高重要记忆:**\n' + getHighImportanceMemories()
            .slice(-3)
            .map(m => `• [${m.type}] ${m.content.slice(0, 50)}...`)
            .join('\n'),
          tag: 'lark_md'
        }
      } : undefined,
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: `最后提取: ${new Date(state.stats.lastExtraction).toLocaleString('zh-CN')}` }]
      }
    ].filter(Boolean)
  }
}

/**
 * 清除记忆
 */
export function clearMemories(): void {
  state.memories = []
}

/**
 * 重置
 */
export function reset(): void {
  state = {
    memories: [],
    stats: {
      totalExtracted: 0,
      highImportance: 0,
      lastExtraction: 0,
      sessionsProcessed: 0
    }
  }
}

// 导出单例
export const extractMemoriesService = {
  extractFromSession,
  extractByType,
  getAllMemories,
  getHighImportanceMemories,
  getMemoriesByType,
  getRecentMemories,
  getStats,
  generateMemoryCard,
  clearMemories,
  reset
}

export default extractMemoriesService