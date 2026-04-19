/**
 * Vim Text Object Functions
 * Simplified version for coding-agent
 */
import type { TextObjScope } from './types.js';
/**
 * Find a text object range.
 */
export declare function findTextObject(text: string, offset: number, obj: string, scope: TextObjScope): {
    start: number;
    end: number;
} | null;
//# sourceMappingURL=textObjects.d.ts.map