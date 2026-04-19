/**
 * Vim Motion Functions
 * Simplified version adapted for coding-agent
 */
import { Cursor } from '../utils/Cursor.js';
/**
 * Resolve a motion to a target cursor position.
 */
export function resolveMotion(key, cursor, count) {
    let result = cursor;
    for (let i = 0; i < count; i++) {
        const next = applySingleMotion(key, result);
        if (next.equals(result))
            break;
        result = next;
    }
    return result;
}
/**
 * Apply a single motion step.
 */
function applySingleMotion(key, cursor) {
    switch (key) {
        case 'h':
            return cursor.left();
        case 'l':
            return cursor.right();
        case 'j':
            return cursor.downLogicalLine();
        case 'k':
            return cursor.upLogicalLine();
        case 'w':
            return cursor.nextVimWord();
        case 'b':
            return cursor.prevVimWord();
        case 'e':
            return cursor.endOfVimWord();
        case '0':
            return cursor.startOfLine();
        case '$':
            return cursor.endOfLine();
        case 'g':
            return cursor.startOfFile();
        case 'G':
            return cursor.endOfFile();
        case '^':
            return firstNonBlank(cursor);
        default:
            return cursor;
    }
}
/**
 * Move to first non-blank character in line.
 */
function firstNonBlank(cursor) {
    const lineStart = cursor.getLineStart();
    const lineEnd = cursor.getLineEnd();
    const text = cursor.text;
    for (let i = lineStart; i < lineEnd; i++) {
        if (text[i] !== ' ' && text[i] !== '\t') {
            return new Cursor(text, i);
        }
    }
    return new Cursor(text, lineStart);
}
/**
 * Check if a motion is linewise.
 */
export function isLinewiseMotion(key) {
    return ['j', 'k', 'g', 'G'].includes(key);
}
/**
 * Check if a motion is inclusive.
 */
export function isInclusiveMotion(key) {
    return ['e'].includes(key);
}
//# sourceMappingURL=motions.js.map