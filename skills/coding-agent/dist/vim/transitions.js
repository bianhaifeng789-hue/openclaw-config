/**
 * Vim State Transitions - Simplified for coding-agent
 */
import { resolveMotion } from './motions.js';
import { findTextObject } from './textObjects.js';
import { Cursor } from '../utils/Cursor.js';
export function processKey(key, ctx) {
    const { state } = ctx;
    if (state.mode === 'normal')
        return processNormalMode(key, ctx);
    if (state.mode === 'insert')
        return processInsertMode(key, ctx);
    if (state.mode === 'visual')
        return processVisualMode(key, ctx);
    return ctx;
}
function processNormalMode(key, ctx) {
    const { state, cursor, text, setText, setCursor } = ctx;
    // Mode switches
    if (key === 'i')
        return { ...ctx, state: { ...state, mode: 'insert' } };
    if (key === 'a') {
        const newCursor = cursor.right();
        setCursor(newCursor);
        return { ...ctx, state: { ...state, mode: 'insert' }, cursor: newCursor };
    }
    if (key === 'v')
        return { ...ctx, state: { ...state, mode: 'visual', visualStart: cursor.offset } };
    // Operator pending
    if (state.pendingOperator) {
        const op = state.pendingOperator;
        const count = state.count;
        if (key === 'i' || key === 'a') {
            const scope = key === 'i' ? 'inner' : 'around';
            return { ...ctx, state: { ...state, pendingTextObjScope: scope } };
        }
        if (isMotion(key)) {
            const newCursor = resolveMotion(key, cursor, count);
            setCursor(newCursor);
            const newMode = op === 'c' ? 'insert' : 'normal';
            return { ...ctx, state: { ...state, mode: newMode, pendingOperator: null } };
        }
        if (state.pendingTextObjScope) {
            const range = findTextObject(text, cursor.offset, key, state.pendingTextObjScope);
            if (range) {
                const newText = text.slice(0, range.start) + text.slice(range.end);
                setText(newText);
                setCursor(new Cursor(newText, range.start));
            }
            const newMode = op === 'c' ? 'insert' : 'normal';
            return { ...ctx, state: { ...state, mode: newMode, pendingOperator: null, pendingTextObjScope: null } };
        }
    }
    // Start operator
    if (isOperator(key)) {
        return { ...ctx, state: { ...state, pendingOperator: key, count: state.count || 1 } };
    }
    // Motion
    if (isMotion(key)) {
        const newCursor = resolveMotion(key, cursor, state.count || 1);
        setCursor(newCursor);
        return { ...ctx, cursor: newCursor, state: { ...state, count: 1 } };
    }
    // Count
    if (/[1-9]/.test(key)) {
        return { ...ctx, state: { ...state, count: (state.count || 0) * 10 + parseInt(key) } };
    }
    return ctx;
}
function processInsertMode(key, ctx) {
    const { cursor, text, setText, setCursor, state } = ctx;
    if (key === '<Esc>') {
        const newCursor = cursor.left();
        setCursor(newCursor);
        return { ...ctx, state: { ...state, mode: 'normal' }, cursor: newCursor };
    }
    const offset = cursor.offset;
    const newText = text.slice(0, offset) + key + text.slice(offset);
    setText(newText);
    const newCursor = new Cursor(newText, offset + 1);
    setCursor(newCursor);
    return { ...ctx, text: newText, cursor: newCursor };
}
function processVisualMode(key, ctx) {
    const { state, cursor, setCursor } = ctx;
    if (key === '<Esc>')
        return { ...ctx, state: { ...state, mode: 'normal', visualStart: null } };
    if (isMotion(key)) {
        const count = state.count ?? 1;
        const newCursor = resolveMotion(key, cursor, count);
        setCursor(newCursor);
        return { ...ctx, cursor: newCursor };
    }
    const vs = state.visualStart;
    if (isOperator(key) && vs !== null) {
        const start = Math.min(vs, cursor.offset);
        const end = Math.max(vs, cursor.offset);
        if (key === 'd' || key === 'x') {
            const newText = ctx.text.slice(0, start) + ctx.text.slice(end + 1);
            ctx.setText(newText);
            const nc = new Cursor(newText, start);
            setCursor(nc);
            return { ...ctx, text: newText, cursor: nc, state: { ...state, mode: 'normal', visualStart: null } };
        }
        return { ...ctx, state: { ...state, mode: 'normal', visualStart: null } };
    }
    return ctx;
}
function isOperator(key) {
    return ['d', 'c', 'y', 'x'].includes(key);
}
function isMotion(key) {
    return ['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', 'g', 'G', '^'].includes(key);
}
//# sourceMappingURL=transitions.js.map