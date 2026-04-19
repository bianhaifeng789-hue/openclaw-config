/**
 * Vim Types - Simplified for coding-agent
 */

export type VimMode = 'normal' | 'insert' | 'visual'

export type Operator = 'd' | 'c' | 'y'

export type TextObjScope = 'inner' | 'around'

export interface VimState {
  mode: VimMode
  count: number
  pendingOperator: Operator | null
  pendingTextObjScope: TextObjScope | null
  visualStart: number | null
}

export interface RecordedChange {
  type: 'delete' | 'change' | 'insert'
  start: number
  end: number
  text: string
}

export const defaultVimState: VimState = {
  mode: 'normal',
  count: 1,
  pendingOperator: null,
  pendingTextObjScope: null,
  visualStart: null,
}

export function createInitialVimState(): VimState {
  return defaultVimState
}