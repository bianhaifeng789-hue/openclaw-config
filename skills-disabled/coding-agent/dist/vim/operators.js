/**
 * Vim Operators - Simplified for coding-agent
 */
import { resolveMotion } from './motions.js';
import { findTextObject } from './textObjects.js';
export function executeDelete(ctx, motion, count) {
    const startOffset = ctx.cursor.offset;
    const endCursor = resolveMotion(motion, ctx.cursor, count);
    const endOffset = endCursor.offset;
    const start = Math.min(startOffset, endOffset);
    const end = Math.max(startOffset, endOffset);
    const deleted = ctx.text.slice(start, end);
    ctx.setRegister(deleted, false);
    const newText = ctx.text.slice(0, start) + ctx.text.slice(end);
    ctx.setText(newText);
    ctx.setOffset(start);
    ctx.recordChange({ type: 'delete', start, end, text: deleted });
}
export function executeChange(ctx, motion, count) {
    const startOffset = ctx.cursor.offset;
    const endCursor = resolveMotion(motion, ctx.cursor, count);
    const endOffset = endCursor.offset;
    const start = Math.min(startOffset, endOffset);
    const end = Math.max(startOffset, endOffset);
    const deleted = ctx.text.slice(start, end);
    ctx.setRegister(deleted, false);
    const newText = ctx.text.slice(0, start) + ctx.text.slice(end);
    ctx.setText(newText);
    ctx.enterInsert(start);
    ctx.recordChange({ type: 'change', start, end, text: deleted });
}
export function executeYank(ctx, motion, count) {
    const startOffset = ctx.cursor.offset;
    const endCursor = resolveMotion(motion, ctx.cursor, count);
    const endOffset = endCursor.offset;
    const start = Math.min(startOffset, endOffset);
    const end = Math.max(startOffset, endOffset);
    const yanked = ctx.text.slice(start, end);
    ctx.setRegister(yanked, false);
}
export function executeOperatorTextObj(operator, ctx, obj, scope) {
    const range = findTextObject(ctx.text, ctx.cursor.offset, obj, scope);
    if (!range)
        return;
    const deleted = ctx.text.slice(range.start, range.end);
    ctx.setRegister(deleted, false);
    const newText = ctx.text.slice(0, range.start) + ctx.text.slice(range.end);
    ctx.setText(newText);
    if (operator === 'c') {
        ctx.enterInsert(range.start);
    }
    else {
        ctx.setOffset(range.start);
    }
    ctx.recordChange({ type: operator === 'c' ? 'change' : 'delete', start: range.start, end: range.end, text: deleted });
}
//# sourceMappingURL=operators.js.map