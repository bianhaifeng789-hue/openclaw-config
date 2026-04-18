/**
 * Vim Operators - Simplified for coding-agent
 */
import { Cursor } from '../utils/Cursor.js';
import type { Operator, TextObjScope, RecordedChange } from './types.js';
export interface OperatorContext {
    cursor: Cursor;
    text: string;
    setText: (text: string) => void;
    setOffset: (offset: number) => void;
    enterInsert: (offset: number) => void;
    setRegister: (content: string, linewise: boolean) => void;
    recordChange: (change: RecordedChange) => void;
}
export declare function executeDelete(ctx: OperatorContext, motion: string, count: number): void;
export declare function executeChange(ctx: OperatorContext, motion: string, count: number): void;
export declare function executeYank(ctx: OperatorContext, motion: string, count: number): void;
export declare function executeOperatorTextObj(operator: Operator, ctx: OperatorContext, obj: string, scope: TextObjScope): void;
//# sourceMappingURL=operators.d.ts.map