/**
 * Vim Motion Functions
 * Simplified version adapted for coding-agent
 */
import { Cursor } from '../utils/Cursor.js';
/**
 * Resolve a motion to a target cursor position.
 */
export declare function resolveMotion(key: string, cursor: Cursor, count: number): Cursor;
/**
 * Check if a motion is linewise.
 */
export declare function isLinewiseMotion(key: string): boolean;
/**
 * Check if a motion is inclusive.
 */
export declare function isInclusiveMotion(key: string): boolean;
//# sourceMappingURL=motions.d.ts.map