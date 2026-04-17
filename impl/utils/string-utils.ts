// @ts-nocheck

/**
 * String Utils Pattern - 字符串工具
 * 
 * Source: Claude Code utils/stringUtils.ts + utils/words.ts
 * Pattern: case conversion + whitespace handling + slugify + word boundary
 */

class StringUtils {
  /**
   * Convert to camelCase
   */
  camelCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map((word, index) => index === 0 ? word.toLowerCase() : this.capitalize(word))
      .join('')
  }

  /**
   * Convert to PascalCase
   */
  pascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => this.capitalize(word))
      .join('')
  }

  /**
   * Convert to snake_case
   */
  snakeCase(str: string): string {
    return str
      .split(/[-\s]+/)
      .map(word => word.toLowerCase())
      .join('_')
  }

  /**
   * Convert to kebab-case
   */
  kebabCase(str: string): string {
    return str
      .split(/[_\s]+/)
      .map(word => word.toLowerCase())
      .join('-')
  }

  /**
   * Capitalize first letter
   */
  capitalize(str: string): string {
    if (str.length === 0) return str
    return str[0].toUpperCase() + str.slice(1).toLowerCase()
  }

  /**
   * Convert to sentence case
   */
  sentenceCase(str: string): string {
    return str
      .split(/[.!?]+/)
      .map(sentence => this.capitalize(sentence.trim()))
      .join('. ')
  }

  /**
   * Slugify (URL-safe)
   */
  slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }

  /**
   * Trim whitespace (including newlines)
   */
  trimAll(str: string): string {
    return str.trim().replace(/\s+/g, ' ')
  }

  /**
   * Strip ANSI codes
   */
  stripANSI(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, '')
  }

  /**
   * Pad string to length
   */
  pad(str: string, length: number, char = ' ', side: 'left' | 'right' | 'both' = 'right'): string {
    if (str.length >= length) return str

    const padLength = length - str.length

    switch (side) {
      case 'left':
        return char.repeat(padLength) + str
      case 'right':
        return str + char.repeat(padLength)
      case 'both':
        const leftPad = Math.floor(padLength / 2)
        const rightPad = padLength - leftPad
        return char.repeat(leftPad) + str + char.repeat(rightPad)
    }
  }

  /**
   * Repeat string
   */
  repeat(str: string, count: number): string {
    return str.repeat(Math.max(0, count))
  }

  /**
   * Count words
   */
  wordCount(str: string): number {
    return str.trim().split(/\s+/).filter(w => w.length > 0).length
  }

  /**
   * Get word at position
   */
  getWordAt(str: string, position: number): string | null {
    const words = str.split(/\s+/)
    let currentPos = 0

    for (const word of words) {
      const wordStart = str.indexOf(word, currentPos)
      const wordEnd = wordStart + word.length

      if (position >= wordStart && position <= wordEnd) {
        return word
      }

      currentPos = wordEnd + 1
    }

    return null
  }

  /**
   * Escape regex special chars
   */
  escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Escape HTML entities
   */
  escapeHTML(str: string): string {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }

    return str.replace(/[&<>"']/g, char => entities[char] ?? char)
  }

  /**
   * Unescape HTML entities
   */
  unescapeHTML(str: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'"
    }

    return str.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => entities[entity] ?? entity)
  }

  /**
   * Is empty or whitespace
   */
  isEmpty(str: string): boolean {
    return str.trim().length === 0
  }

  /**
   * Is numeric
   */
  isNumeric(str: string): boolean {
    return /^\d+$/.test(str)
  }

  /**
   * Is alphanumeric
   */
  isAlphanumeric(str: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(str)
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    // No state
  }
}

// Global singleton
export const stringUtils = new StringUtils()

export default stringUtils