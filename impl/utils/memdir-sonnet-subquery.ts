/**
 * Memdir Sonnet Subquery Integration
 * 使用 sessions_spawn 实现智能记忆选择
 * 
 * 注意: sessions_spawn 是 OpenClaw 工具，在主会话中通过 tool 调用。
 * 此文件提供提示模板和辅助函数。
 */

// ============================================
// Sonnet Memory Selector Prompt
// ============================================

export const MEMORY_SELECTOR_SYSTEM_PROMPT = `你正在为 OpenClaw 选择处理用户查询时有用的记忆。
你将获得用户的查询和可用记忆文件列表（文件名和描述）。

返回对处理用户查询**明确有用**的记忆文件名列表（最多 5 个）。
只包含你**确定**有帮助的记忆，基于其名称和描述。

规则:
- 如果不确定某个记忆是否有用，不要包含它
- 如果列表中没有明确有用的记忆，返回空列表 []
- 考虑时间相关性：最近的记忆可能更有价值
- 考虑任务相关性：如果查询是关于代码的，优先选代码相关的记忆

输出格式（严格的 JSON 数组）:
["MEMORY_TYPE_1", "MEMORY_TYPE_2"]

示例:
输入: "What did I work on yesterday?"
输出: ["PROJECTS", "DAILY_NOTES"]

输入: "What tools do I have?"
输出: ["TOOLS", "SKILLS"]

输入: "What's the weather?"
输出: []`

// ============================================
// Helper Functions
// ============================================

/**
 * Build memory manifest for Sonnet prompt
 */
export function buildMemoryManifest(memories: Array<{ type: string; description: string }>): string {
  return memories.map(m => `- ${m.type}: ${m.description}`).join('\n')
}

/**
 * Build user prompt for memory selection
 */
export function buildMemorySelectionPrompt(
  query: string,
  memories: Array<{ type: string; description: string }>,
  recentTools: readonly string[]
): string {
  const manifest = buildMemoryManifest(memories)
  const tools = recentTools.length > 0 ? recentTools.join(', ') : 'none'
  
  return `
用户查询: ${query}

可用记忆:
${manifest}

最近使用的工具: ${tools}

请选择最相关的记忆文件（最多 5 个）。`
}

/**
 * Parse Sonnet response to extract selected memories
 */
export function parseMemorySelectionResponse(response: string): {
  selectedFiles: string[]
  reasoning: string
} {
  // 提取 JSON 数组
  const jsonMatch = response.match(/\[[\s\S]*?\]/)
  if (!jsonMatch) {
    return { selectedFiles: [], reasoning: response }
  }
  
  try {
    const selectedFiles = JSON.parse(jsonMatch[0]) as string[]
    return { selectedFiles, reasoning: response }
  } catch {
    return { selectedFiles: [], reasoning: response }
  }
}

/**
 * Create sessions_spawn parameters for memory selection
 * 
 * 调用者需要在主会话中使用 sessions_spawn tool
 */
export function createMemorySpawnParams(
  query: string,
  memories: Array<{ type: string; description: string }>,
  recentTools: readonly string[]
): {
  runtime: 'subagent'
  mode: 'run'
  task: string
  model: string
  lightContext: boolean
  timeoutSeconds: number
} {
  return {
    runtime: 'subagent',
    mode: 'run',
    task: `${MEMORY_SELECTOR_SYSTEM_PROMPT}\n\n${buildMemorySelectionPrompt(query, memories, recentTools)}`,
    model: 'sonnet',
    lightContext: true,
    timeoutSeconds: 30
  }
}

// ============================================
// Fallback Heuristic Selection
// ============================================

/**
 * Simple heuristic-based memory selection (no AI)
 * Used when sessions_spawn is not available
 */
export function heuristicMemorySelection(
  query: string,
  memories: Array<{ type: string; description: string }>,
  recentTools: readonly string[]
): string[] {
  const queryLower = query.toLowerCase()
  const selected: string[] = []
  
  // 关键词映射
  const keywordMap: Record<string, string[]> = {
    'project': ['PROJECTS'],
    'work': ['PROJECTS', 'DAILY_NOTES'],
    'yesterday': ['DAILY_NOTES', 'MEMORY'],
    'today': ['DAILY_NOTES', 'MEMORY'],
    'decision': ['KEY_DECISIONS', 'MEMORY'],
    'tool': ['TOOLS', 'SKILLS'],
    'skill': ['SKILLS', 'TOOLS'],
    'user': ['USER_PROFILE', 'MEMORY'],
    'contact': ['CONTACTS'],
    'note': ['NOTES', 'MEMORY'],
    'remember': ['MEMORY', 'DAILY_NOTES'],
    'error': ['LEARNINGS', 'NOTES'],
    'bug': ['LEARNINGS', 'NOTES'],
    'fix': ['LEARNINGS', 'NOTES'],
    'model': ['NOTES'],
    'phase': ['PROJECTS', 'NOTES'],
  }
  
  // 检查关键词
  for (const [keyword, types] of Object.entries(keywordMap)) {
    if (queryLower.includes(keyword)) {
      selected.push(...types)
    }
  }
  
  // 如果有最近工具，添加 TOOLS
  if (recentTools.length > 0) {
    selected.push('TOOLS')
  }
  
  // 去重并限制最多 5 个
  return [...new Set(selected)].slice(0, 5)
}