// @ts-nocheck

/**
 * XML Utils Pattern - XML工具
 * 
 * Source: Claude Code utils/xml.ts
 * Pattern: XML utils + XML parsing + XML handling + XML escape
 */

interface XMLParseResult {
  success: boolean
  data?: any
  error?: string
  timestamp: number
}

class XMLUtilsService {
  private parseResults: XMLParseResult[] = []

  /**
   * Escape XML
   */
  escape(xml: string): string {
    return xml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * Unescape XML
   */
  unescape(xml: string): string {
    return xml
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
  }

  /**
   * Is valid XML (basic check)
   */
  isValid(xml: string): boolean {
    try {
      // Basic validation - check for matching tags
      const openTags = xml.match(/<[^\/][^>]*>/g) ?? []
      const closeTags = xml.match(/<\/[^>]*>/g) ?? []

      return openTags.length === closeTags.length
    } catch {
      return false
    }
  }

  /**
   * Parse XML (basic)
   */
  parse(xml: string): XMLParseResult {
    const result: XMLParseResult = {
      success: false,
      timestamp: Date.now()
    }

    try {
      // Basic parsing - would use proper XML parser in production
      result.data = { raw: xml, parsed: true }
      result.success = true
    } catch (e: any) {
      result.error = e.message
    }

    this.parseResults.push(result)

    return result
  }

  /**
   * Build XML
   */
  build(tag: string, content: string, attributes?: Record<string, string>): string {
    const attrs = attributes
      ? Object.entries(attributes)
          .map(([k, v]) => ` ${k}="${this.escape(v)}"`)
          .join('')
      : ''

    return `<${tag}${attrs}>${this.escape(content)}</${tag}>`
  }

  /**
   * Get parse results
   */
  getParseResults(): XMLParseResult[] {
    return [...this.parseResults]
  }

  /**
   * Get stats
   */
  getStats(): {
    parseCount: number
    successCount: number
    failureCount: number
    successRate: number
  } {
    return {
      parseCount: this.parseResults.length,
      successCount: this.parseResults.filter(r => r.success).length,
      failureCount: this.parseResults.filter(r => !r.success).length,
      successRate: this.parseResults.length > 0
        ? this.parseResults.filter(r => r.success).length / this.parseResults.length
        : 0
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.parseResults = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const xmlUtilsService = new XMLUtilsService()

export default xmlUtilsService