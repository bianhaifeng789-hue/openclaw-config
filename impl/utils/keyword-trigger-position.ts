// @ts-nocheck

/**
 * Keyword Trigger Position Pattern - 关键词触发位置查找
 * 
 * Source: Claude Code utils/ultraplan/keyword.ts
 * Pattern: findKeywordTriggerPositions + quoted ranges + apostrophe handling + path context
 */

interface KeywordPosition {
  keyword: string
  start: number
  end: number
  line: number
  column: number
  inQuote: boolean
  quoteType?: '"' | "'" | '`'
}

interface FindOptions {
  ignoreInQuotes?: boolean
  ignoreInPath?: boolean
  keywords: string[]
}

/**
 * Find keyword trigger positions in text
 * Handles quoted ranges and apostrophe vs quote distinction
 */
function findKeywordTriggerPositions(text: string, options: FindOptions): KeywordPosition[] {
  const results: KeywordPosition[] = []
  const { keywords, ignoreInQuotes = true, ignoreInPath = true } = options

  // Track quote ranges
  const quoteRanges = findQuoteRanges(text)

  // Track path context (e.g., /path/to/file)
  const pathRanges = findPathRanges(text)

  // Search each keyword
  for (const keyword of keywords) {
    let searchPos = 0

    while (searchPos < text.length) {
      const index = text.indexOf(keyword, searchPos)
      if (index === -1) break

      const end = index + keyword.length
      const line = getLineNumber(text, index)
      const column = getColumnNumber(text, index)

      // Check if in quote
      const inQuoteInfo = isInQuote(index, quoteRanges)

      // Check if in path
      const inPath = isInPath(index, pathRanges)

      // Skip if ignored
      if (ignoreInQuotes && inQuoteInfo.inQuote) {
        searchPos = end + 1
        continue
      }

      if (ignoreInPath && inPath) {
        searchPos = end + 1
        continue
      }

      results.push({
        keyword,
        start: index,
        end,
        line,
        column,
        inQuote: inQuoteInfo.inQuote,
        quoteType: inQuoteInfo.quoteType
      })

      searchPos = end + 1
    }
  }

  // Sort by position
  results.sort((a, b) => a.start - b.start)

  return results
}

/**
 * Find quote ranges in text
 * Handles apostrophe vs quote distinction
 */
function findQuoteRanges(text: string): Array<{ start: number; end: number; type: '"' | "'" | '`' }> {
  const ranges: Array<{ start: number; end: number; type: '"' | "'" | '`' }> = []

  const quoteChars = ['"', "'", '`'] as const

  for (const quoteChar of quoteChars) {
    let searchPos = 0

    while (searchPos < text.length) {
      const start = text.indexOf(quoteChar, searchPos)
      if (start === -1) break

      // Check if apostrophe (single quote after letter)
      if (quoteChar === "'") {
        const prevChar = text[start - 1]
        if (prevChar && /[a-zA-Z]/.test(prevChar)) {
          // Likely apostrophe, skip
          searchPos = start + 1
          continue
        }
      }

      // Find matching end quote
      const end = findMatchingQuote(text, start + 1, quoteChar)
      if (end === -1) {
        searchPos = start + 1
        continue
      }

      ranges.push({ start, end, type: quoteChar })
      searchPos = end + 1
    }
  }

  return ranges
}

/**
 * Find matching quote (handle escape sequences)
 */
function findMatchingQuote(text: string, start: number, quoteChar: '"' | "'" | '`'): number {
  for (let i = start; i < text.length; i++) {
    const char = text[i]

    // Escape sequence
    if (char === '\\') {
      i++ // Skip next char
      continue
    }

    if (char === quoteChar) {
      return i
    }
  }

  return -1 // No matching quote
}

/**
 * Find path ranges (e.g., /path/to/file, ./relative/path)
 */
function findPathRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = []

  // Match /path patterns
  const pathPattern = /(\/[\w\-./]+|\.[/][\w\-./]+)/g

  let match
  while ((match = pathPattern.exec(text)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length
    })
  }

  return ranges
}

/**
 * Check if position is in quote range
 */
function isInQuote(pos: number, ranges: Array<{ start: number; end: number; type: any }>): { inQuote: boolean; quoteType?: any } {
  for (const range of ranges) {
    if (pos >= range.start && pos <= range.end) {
      return { inQuote: true, quoteType: range.type }
    }
  }
  return { inQuote: false }
}

/**
 * Check if position is in path range
 */
function isInPath(pos: number, ranges: Array<{ start: number; end: number }>): boolean {
  for (const range of ranges) {
    if (pos >= range.start && pos <= range.end) {
      return true
    }
  }
  return false
}

/**
 * Get line number from position
 */
function getLineNumber(text: string, pos: number): number {
  const lines = text.slice(0, pos).split('\n')
  return lines.length
}

/**
 * Get column number from position
 */
function getColumnNumber(text: string, pos: number): number {
  const lines = text.slice(0, pos).split('\n')
  const lastLine = lines[lines.length - 1] ?? ''
  return lastLine.length + 1
}

// Export
export {
  findKeywordTriggerPositions,
  findQuoteRanges,
  findPathRanges,
  isInQuote,
  isInPath
}

export type { KeywordPosition, FindOptions }