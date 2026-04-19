/**
 * Vim Operators - Simplified for coding-agent
 */

import { resolveMotion } from './motions.js'
import { findTextObject } from './textObjects.js'
import { Cursor } from '../utils/Cursor.js'
import type { Operator, TextObjScope, RecordedChange } from './types.js'

export interface OperatorContext {
  cursor: Cursor
  text: string
  setText: (text: string) => void
  setOffset: (offset: number) => void
  enterInsert: (offset: number) => void
  setRegister: (content: string, linewise: boolean) => void
  recordChange: (change: RecordedChange) => void
}

export function executeDelete(ctx: OperatorContext, motion: string, count: number): void {
  const startOffset = ctx.cursor.offset
  const endCursor = resolveMotion(motion, ctx.cursor, count)
  const endOffset = endCursor.offset
  const start = Math.min(startOffset, endOffset)
  const end = Math.max(startOffset, endOffset)
  const deleted = ctx.text.slice(start, end)
  ctx.setRegister(deleted, false)
  const newText = ctx.text.slice(0, start) + ctx.text.slice(end)
  ctx.setText(newText)
  ctx.setOffset(start)
  ctx.recordChange({ type: 'delete', start, end, text: deleted })
}

export function executeChange(ctx: OperatorContext, motion: string, count: number): void {
  const startOffset = ctx.cursor.offset
  const endCursor = resolveMotion(motion, ctx.cursor, count)
  const endOffset = endCursor.offset
  const start = Math.min(startOffset, endOffset)
  const end = Math.max(startOffset, endOffset)
  const deleted = ctx.text.slice(start, end)
  ctx.setRegister(deleted, false)
  const newText = ctx.text.slice(0, start) + ctx.text.slice(end)
  ctx.setText(newText)
  ctx.enterInsert(start)
  ctx.recordChange({ type: 'change', start, end, text: deleted })
}

export function executeYank(ctx: OperatorContext, motion: string, count: number): void {
  const startOffset = ctx.cursor.offset
  const endCursor = resolveMotion(motion, ctx.cursor, count)
  const endOffset = endCursor.offset
  const start = Math.min(startOffset, endOffset)
  const end = Math.max(startOffset, endOffset)
  const yanked = ctx.text.slice(start, end)
  ctx.setRegister(yanked, false)
}

export function executeOperatorTextObj(
  operator: Operator,
  ctx: OperatorContext,
  obj: string,
  scope: TextObjScope,
): void {
  const range = findTextObject(ctx.text, ctx.cursor.offset, obj, scope)
  if (!range) return
  
  const deleted = ctx.text.slice(range.start, range.end)
  ctx.setRegister(deleted, false)
  const newText = ctx.text.slice(0, range.start) + ctx.text.slice(range.end)
  ctx.setText(newText)
  
  if (operator === 'c') {
    ctx.enterInsert(range.start)
  } else {
    ctx.setOffset(range.start)
  }
  
  ctx.recordChange({ type: operator === 'c' ? 'change' : 'delete', start: range.start, end: range.end, text: deleted })
}