/**
 * Vim Text Object Functions
 * Simplified version for coding-agent
 */

import type { TextObjScope } from './types.js'

/**
 * Find a text object range.
 */
export function findTextObject(
  text: string,
  offset: number,
  obj: string,
  scope: TextObjScope,
): { start: number; end: number } | null {
  switch (obj) {
    case 'w':
      return findWord(text, offset, scope)
    case '"':
      return findQuotes(text, offset, '"', scope)
    case "'":
      return findQuotes(text, offset, "'", scope)
    case '(':
    case ')':
      return findBrackets(text, offset, '(', ')', scope)
    case '[':
    case ']':
      return findBrackets(text, offset, '[', ']', scope)
    case '{':
    case '}':
      return findBrackets(text, offset, '{', '}', scope)
    default:
      return null
  }
}

/**
 * Find word text object.
 */
function findWord(text: string, offset: number, scope: TextObjScope): { start: number; end: number } | null {
  // Find word boundaries
  let start = offset
  let end = offset
  
  // Find start of word
  while (start > 0 && isWordChar(text[start - 1])) {
    start--
  }
  
  // Find end of word
  while (end < text.length && isWordChar(text[end])) {
    end++
  }
  
  if (start === end) return null
  
  // 'around' includes trailing whitespace
  if (scope === 'around') {
    while (end < text.length && text[end].match(/\s/)) {
      end++
    }
  }
  
  return { start, end }
}

/**
 * Find quoted text object.
 */
function findQuotes(
  text: string,
  offset: number,
  quote: string,
  scope: TextObjScope,
): { start: number; end: number } | null {
  // Find opening quote
  let openQuote = -1
  for (let i = offset; i >= 0; i--) {
    if (text[i] === quote) {
      if (i > 0 && text[i - 1] === '\\') continue // Escaped
      openQuote = i
      break
    }
  }
  
  if (openQuote === -1) {
    // Search forward for opening quote
    for (let i = offset; i < text.length; i++) {
      if (text[i] === quote) {
        openQuote = i
        break
      }
    }
  }
  
  if (openQuote === -1) return null
  
  // Find closing quote
  let closeQuote = -1
  for (let i = openQuote + 1; i < text.length; i++) {
    if (text[i] === quote && text[i - 1] !== '\\') {
      closeQuote = i
      break
    }
  }
  
  if (closeQuote === -1) return null
  
  // 'inner' excludes quotes
  if (scope === 'inner') {
    return { start: openQuote + 1, end: closeQuote }
  }
  
  return { start: openQuote, end: closeQuote + 1 }
}

/**
 * Find bracket text object.
 */
function findBrackets(
  text: string,
  offset: number,
  openBracket: string,
  closeBracket: string,
  scope: TextObjScope,
): { start: number; end: number } | null {
  // Find opening bracket by counting nesting
  let depth = 0
  let openPos = -1
  
  for (let i = offset; i >= 0; i--) {
    if (text[i] === closeBracket) depth++
    if (text[i] === openBracket) {
      if (depth === 0) {
        openPos = i
        break
      }
      depth--
    }
  }
  
  if (openPos === -1) {
    // Search forward
    depth = 0
    for (let i = offset; i < text.length; i++) {
      if (text[i] === openBracket) {
        openPos = i
        break
      }
    }
  }
  
  if (openPos === -1) return null
  
  // Find closing bracket
  depth = 0
  let closePos = -1
  for (let i = openPos; i < text.length; i++) {
    if (text[i] === openBracket) depth++
    if (text[i] === closeBracket) {
      depth--
      if (depth === 0) {
        closePos = i
        break
      }
    }
  }
  
  if (closePos === -1) return null
  
  // 'inner' excludes brackets
  if (scope === 'inner') {
    return { start: openPos + 1, end: closePos }
  }
  
  return { start: openPos, end: closePos + 1 }
}

/**
 * Check if character is a word character.
 */
function isWordChar(char: string): boolean {
  return /[a-zA-Z0-9_]/.test(char)
}