/**
 * Phase 31: AgenticSessionSearch 智能会话搜索
 * 
 * 借鉴 Claude Code 的 agenticSessionSearch.ts (300+ 行)
 * 
 * 功能：
 * - 智能搜索历史会话
 * - 标签匹配（最高优先级）
 * - 语义相似度匹配
 * - 返回相关会话索引
 * 
 * OpenClaw 飞书适配：
 * - 搜索飞书私聊历史记录
 * - 按标签、标题、摘要、内容搜索
 */

// ============================================================================
// Types
// ============================================================================

export interface SearchableSession {
  title?: string                  // 会话标题
  tag?: string                    // 用户分配的标签
  branch?: string                 // Git 分支名
  summary?: string                // AI 生成的摘要
  firstMessage?: string           // 第一条消息
  transcript?: string             // 对话内容摘要
}

export interface SearchResult {
  relevantIndices: number[]       // 相关会话索引（按相关性排序）
  query: string                   // 搜索查询
  totalSessions: number           // 总会话数
}

export interface SessionSearchState {
  sessions: SearchableSession[]   // 会话列表
  lastQuery: string | null        // 上次搜索
  totalSearches: number           // 总搜索数
  lastSearchAt: number            // 上次搜索时间
}

// ============================================================================
// Constants
// ============================================================================

const MAX_TRANSCRIPT_CHARS = 2000  // 每会话最大 transcript 字符数
const MAX_MESSAGES_TO_SCAN = 100   // 扫描的最大消息数
const MAX_SESSIONS_TO_SEARCH = 100 // 发送到 API 的最大会话数

const SESSION_SEARCH_SYSTEM_PROMPT = `Your goal is to find relevant sessions based on a user's search query.

You will be given a list of sessions with their metadata and a search query. Identify which sessions are most relevant to the query.

Each session may include:
- Title (display name or custom title)
- Tag (user-assigned category, shown as [tag: name] - users tag sessions with /tag command to categorize them)
- Branch (git branch name, shown as [branch: name])
- Summary (AI-generated summary)
- First message (beginning of the conversation)
- Transcript (excerpt of conversation content)

IMPORTANT: Tags are user-assigned labels that indicate the session's topic or category. If the query matches a tag exactly or partially, those sessions should be highly prioritized.

For each session, consider (in order of priority):
1. Exact tag matches (highest priority - user explicitly categorized this session)
2. Partial tag matches or tag-related terms
3. Title matches (custom titles or first message content)
4. Branch name matches
5. Summary and transcript content matches
6. Semantic similarity and related concepts

CRITICAL: Be VERY inclusive in your matching. Include sessions that:
- Contain the query term anywhere in any field
- Are semantically related to the query (e.g., "testing" matches sessions about "tests", "unit tests", "QA", etc.)
- Discuss topics that could be related to the query
- Have transcripts that mention the concept even in passing

When in doubt, INCLUDE the session. It's better to return too many results than too few. The user can easily scan through results, but missing relevant sessions is frustrating.

Return sessions ordered by relevance (most relevant first). If truly no sessions have ANY connection to the query, return an empty array - but this should be rare.

Respond with ONLY the JSON object, no markdown formatting:
{"relevant_indices": [2, 5, 0]}`

// ============================================================================
// State Management
// ============================================================================

let state: SessionSearchState = {
  sessions: [],
  lastQuery: null,
  totalSearches: 0,
  lastSearchAt: 0,
}

// ============================================================================
// Session Registration
// ============================================================================

/**
 * 注册会话到搜索列表
 */
export function registerSession(session: SearchableSession): void {
  state.sessions.push(session)
}

/**
 * 批量注册会话
 */
export function registerSessions(sessions: SearchableSession[]): void {
  state.sessions.push(...sessions)
}

/**
 * 清空会话列表
 */
export function clearSessions(): void {
  state.sessions = []
}

// ============================================================================
// Search Functions
// ============================================================================

/**
 * 简化版搜索（不调用模型）
 * 
 * 基于关键词匹配
 */
export function searchSessionsSimple(query: string): SearchResult {
  const lowerQuery = query.toLowerCase()
  const relevantIndices: number[] = []
  
  for (let i = 0; i < state.sessions.length; i++) {
    const session = state.sessions[i]
    
    // 标签匹配（最高优先级）
    if (session.tag && session.tag.toLowerCase().includes(lowerQuery)) {
      relevantIndices.unshift(i) // 添加到开头
      continue
    }
    
    // 标题匹配
    if (session.title && session.title.toLowerCase().includes(lowerQuery)) {
      relevantIndices.push(i)
      continue
    }
    
    // 分支匹配
    if (session.branch && session.branch.toLowerCase().includes(lowerQuery)) {
      relevantIndices.push(i)
      continue
    }
    
    // 摘要匹配
    if (session.summary && session.summary.toLowerCase().includes(lowerQuery)) {
      relevantIndices.push(i)
      continue
    }
    
    // transcript 匹配
    if (session.transcript && session.transcript.toLowerCase().includes(lowerQuery)) {
      relevantIndices.push(i)
      continue
    }
    
    // 第一条消息匹配
    if (session.firstMessage && session.firstMessage.toLowerCase().includes(lowerQuery)) {
      relevantIndices.push(i)
      continue
    }
  }
  
  // 更新状态
  state.lastQuery = query
  state.totalSearches++
  state.lastSearchAt = Date.now()
  
  return {
    relevantIndices,
    query,
    totalSessions: state.sessions.length,
  }
}

/**
 * 智能搜索（调用模型）
 * 
 * 需要实际调用模型进行语义搜索
 */
export async function searchSessionsAgentic(
  query: string,
): Promise<SearchResult> {
  // 简化版：直接使用关键词搜索
  // 完整版需要调用模型进行语义搜索
  return searchSessionsSimple(query)
}

// ============================================================================
// State Accessors
// ============================================================================

export function getState(): SessionSearchState {
  return {
    sessions: [...state.sessions],
    lastQuery: state.lastQuery,
    totalSearches: state.totalSearches,
    lastSearchAt: state.lastSearchAt,
  }
}

export function getSessions(): SearchableSession[] {
  return [...state.sessions]
}

export function resetState(): void {
  state = {
    sessions: [],
    lastQuery: null,
    totalSearches: 0,
    lastSearchAt: 0,
  }
}

// ============================================================================
// Feishu Card
// ============================================================================

/**
 * 创建飞书搜索结果卡片
 */
export function createSearchResultCard(
  result: SearchResult,
): {
  title: string
  content: string
} {
  if (result.relevantIndices.length === 0) {
    return {
      title: '🔍 搜索结果',
      content: `查询: "${result.query}"
结果: 无匹配会话`,
    }
  }
  
  const sessions = result.relevantIndices
    .slice(0, 5)
    .map(i => state.sessions[i])
    .filter(Boolean)
    .map(s => `- ${s.title || s.tag || 'Untitled'}`)
    .join('\n')
  
  return {
    title: '🔍 搜索结果',
    content: `查询: "${result.query}"
匹配: ${result.relevantIndices.length}/${result.totalSessions}

**最相关会话**:
${sessions}`,
  }
}

// ============================================================================
// Session Search Service Object
// ============================================================================

export const agenticSessionSearchService = {
  registerSession,
  registerSessions,
  clearSessions,
  searchSessionsSimple,
  searchSessionsAgentic,
  getState,
  getSessions,
  resetState,
  createCard: createSearchResultCard,
}

export default agenticSessionSearchService