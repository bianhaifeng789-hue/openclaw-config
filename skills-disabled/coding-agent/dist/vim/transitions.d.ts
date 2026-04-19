/**
 * Vim State Transitions - Simplified for coding-agent
 */
import { Cursor } from '../utils/Cursor.js';
import type { VimState } from './types.js';
export interface VimTransitionContext {
    state: VimState;
    text: string;
    setText: (text: string) => void;
    cursor: Cursor;
    setCursor: (cursor: Cursor) => void;
}
export declare function processKey(key: string, ctx: VimTransitionContext): VimTransitionContext;
//# sourceMappingURL=transitions.d.ts.map