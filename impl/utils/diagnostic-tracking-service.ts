/**
 * Diagnostic Tracking Service
 * 借鉴 Claude Code diagnosticTracking.ts
 * 飞书场景：追踪错误/警告，发送通知卡片
 */

// 诊断信息接口
export interface Diagnostic {
  message: string
  severity: 'Error' | 'Warning' | 'Info' | 'Hint'
  range: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  }
  source?: string
  code?: string
}

export interface DiagnosticFile {
  uri: string
  diagnostics: Diagnostic[]
}

// 诊断追踪状态
interface DiagnosticTrackingState {
  baseline: Map<string, Diagnostic[]>
  newDiagnostics: Map<string, Diagnostic[]>
  stats: {
    filesTracked: number
    errorsFound: number
    warningsFound: number
    totalProcessed: number
  }
}

// 单例状态
let state: DiagnosticTrackingState = {
  baseline: new Map(),
  newDiagnostics: new Map(),
  stats: {
    filesTracked: 0,
    errorsFound: 0,
    warningsFound: 0,
    totalProcessed: 0
  }
}

const MAX_DIAGNOSTICS_SUMMARY_CHARS = 4000

/**
 * 获取严重程度符号
 */
export function getSeveritySymbol(severity: Diagnostic['severity']): string {
  switch (severity) {
    case 'Error': return '❌'
    case 'Warning': return '⚠️'
    case 'Info': return 'ℹ️'
    case 'Hint': return '💡'
    default: return '•'
  }
}

/**
 * 添加文件到基线（编辑前）
 */
export function beforeFileEdited(filePath: string, diagnostics: Diagnostic[]): void {
  state.baseline.set(filePath, diagnostics)
  state.stats.filesTracked++
}

/**
 * 添加新诊断（编辑后）
 */
export function addNewDiagnostics(filePath: string, diagnostics: Diagnostic[]): void {
  const baseline = state.baseline.get(filePath) || []
  
  // 找出新增的诊断（不在基线中的）
  const newItems = diagnostics.filter(d => 
    !baseline.some(b => 
      b.message === d.message &&
      b.severity === d.severity &&
      b.range.start.line === d.range.start.line
    )
  )
  
  if (newItems.length > 0) {
    state.newDiagnostics.set(filePath, newItems)
    
    // 更新统计
    state.stats.errorsFound += newItems.filter(d => d.severity === 'Error').length
    state.stats.warningsFound += newItems.filter(d => d.severity === 'Warning').length
    state.stats.totalProcessed++
  }
}

/**
 * 获取所有新诊断
 */
export function getNewDiagnostics(): DiagnosticFile[] {
  return Array.from(state.newDiagnostics.entries()).map(([uri, diagnostics]) => ({
    uri,
    diagnostics
  }))
}

/**
 * 格式化诊断摘要
 */
export function formatDiagnosticsSummary(files: DiagnosticFile[]): string {
  const truncationMarker = '…[truncated]'
  const result = files
    .map(file => {
      const filename = file.uri.split('/').pop() || file.uri
      const diagnostics = file.diagnostics
        .map(d => {
          const symbol = getSeveritySymbol(d.severity)
          return `  ${symbol} [Line ${d.range.start.line + 1}:${d.range.start.character + 1}] ${d.message}${d.code ? ` [${d.code}]` : ''}${d.source ? ` (${d.source})` : ''}`
        })
        .join('\n')

      return `${filename}:\n${diagnostics}`
    })
    .join('\n\n')

  if (result.length > MAX_DIAGNOSTICS_SUMMARY_CHARS) {
    return result.slice(0, MAX_DIAGNOSTICS_SUMMARY_CHARS - truncationMarker.length) + truncationMarker
  }
  return result
}

/**
 * 生成飞书诊断卡片
 */
export function generateDiagnosticCard(files: DiagnosticFile[]): object {
  const errorCount = files.reduce((sum, f) => sum + f.diagnostics.filter(d => d.severity === 'Error').length, 0)
  const warningCount = files.reduce((sum, f) => sum + f.diagnostics.filter(d => d.severity === 'Warning').length, 0)
  const infoCount = files.reduce((sum, f) => sum + f.diagnostics.filter(d => d.severity === 'Info').length, 0)
  
  return {
    config: { wide_screen_mode: true },
    header: {
      template: errorCount > 0 ? 'red' : 'orange',
      title: { content: '⚠️ 新诊断发现', tag: 'plain_text' }
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { content: `${errorCount}`, tag: 'lark_md' }, title: { content: '错误', tag: 'lark_md' } },
          { is_short: true, text: { content: `${warningCount}`, tag: 'lark_md' }, title: { content: '警告', tag: 'lark_md' } },
          { is_short: true, text: { content: `${infoCount}`, tag: 'lark_md' }, title: { content: '信息', tag: 'lark_md' } },
          { is_short: true, text: { content: `${files.length}`, tag: 'lark_md' }, title: { content: '文件', tag: 'lark_md' } }
        ]
      },
      {
        tag: 'div',
        text: { content: '**详情:**\n' + formatDiagnosticsSummary(files.slice(0, 5)), tag: 'lark_md' }
      },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: `总计 ${files.length} 个文件有新诊断` }]
      }
    ]
  }
}

/**
 * 获取统计信息
 */
export function getStats(): DiagnosticTrackingState['stats'] {
  return { ...state.stats }
}

/**
 * 清除文件追踪
 */
export function clearFile(filePath: string): void {
  state.baseline.delete(filePath)
  state.newDiagnostics.delete(filePath)
}

/**
 * 重置所有状态
 */
export function reset(): void {
  state = {
    baseline: new Map(),
    newDiagnostics: new Map(),
    stats: {
      filesTracked: 0,
      errorsFound: 0,
      warningsFound: 0,
      totalProcessed: 0
    }
  }
}

// 导出单例
export const diagnosticTrackingService = {
  beforeFileEdited,
  addNewDiagnostics,
  getNewDiagnostics,
  formatDiagnosticsSummary,
  generateDiagnosticCard,
  getStats,
  clearFile,
  reset,
  getSeveritySymbol
}

export default diagnosticTrackingService