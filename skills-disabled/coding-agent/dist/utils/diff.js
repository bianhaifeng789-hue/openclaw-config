/**
 * Utility functions for diff operations and text processing
 */
/**
 * Calculate line-by-line diff between two strings
 */
export function diffLines(oldText, newText) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const result = [];
    let oldIdx = 0;
    let newIdx = 0;
    while (oldIdx < oldLines.length || newIdx < newLines.length) {
        const oldLine = oldLines[oldIdx];
        const newLine = newLines[newIdx];
        if (oldIdx >= oldLines.length) {
            // Remaining lines are all additions
            result.push({ type: 'added', line: newLine, newLineNum: newIdx + 1 });
            newIdx++;
        }
        else if (newIdx >= newLines.length) {
            // Remaining lines are all removals
            result.push({ type: 'removed', line: oldLine, oldLineNum: oldIdx + 1 });
            oldIdx++;
        }
        else if (oldLine === newLine) {
            // Lines match
            result.push({
                type: 'unchanged',
                line: oldLine,
                oldLineNum: oldIdx + 1,
                newLineNum: newIdx + 1,
            });
            oldIdx++;
            newIdx++;
        }
        else {
            // Lines differ - mark as removal and addition
            result.push({ type: 'removed', line: oldLine, oldLineNum: oldIdx + 1 });
            result.push({ type: 'added', line: newLine, newLineNum: newIdx + 1 });
            oldIdx++;
            newIdx++;
        }
    }
    return result;
}
/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength - 3) + '...';
}
/**
 * Escape special regex characters in a string
 */
export function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Find the line number of a string in text
 */
export function findLineNumber(text, search, startIndex = 0) {
    const index = text.indexOf(search, startIndex);
    if (index === -1)
        return -1;
    // Count newlines before the found position
    return text.slice(0, index).split('\n').length;
}
/**
 * Get context lines around a specific line number
 */
export function getContextLines(text, lineNum, contextLines = 3) {
    const lines = text.split('\n');
    const start = Math.max(0, lineNum - contextLines - 1);
    const end = Math.min(lines.length, lineNum + contextLines);
    const result = [];
    for (let i = start; i < end; i++) {
        result.push({ lineNum: i + 1, content: lines[i] });
    }
    return result;
}
/**
 * Normalize line endings to LF
 */
export function normalizeLineEndings(text) {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
/**
 * Detect the indentation style of a file
 */
export function detectIndentation(text) {
    const lines = text.split('\n');
    const indentCounts = new Map();
    let tabCount = 0;
    for (const line of lines) {
        if (!line.trim())
            continue;
        if (line.startsWith('\t')) {
            tabCount++;
            continue;
        }
        // Count leading spaces
        const match = line.match(/^( +)/);
        if (match) {
            const spaces = match[1].length;
            indentCounts.set(spaces, (indentCounts.get(spaces) || 0) + 1);
        }
    }
    // If more tabs than spaces, assume tabs
    if (tabCount > lines.length / 4) {
        return { type: 'tabs', size: 1 };
    }
    // Find most common space indentation
    let maxCount = 0;
    let commonSize = 2;
    for (const [size, count] of indentCounts) {
        if (count > maxCount) {
            maxCount = count;
            commonSize = size;
        }
    }
    // Determine if it's 2 or 4 spaces (most common)
    if (commonSize >= 4)
        return { type: 'spaces', size: 4 };
    if (commonSize >= 2)
        return { type: 'spaces', size: 2 };
    return { type: 'spaces', size: 2 };
}
//# sourceMappingURL=diff.js.map