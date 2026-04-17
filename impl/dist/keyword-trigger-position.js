// @ts-nocheck
/**
 * Find keyword trigger positions in text
 * Handles quoted ranges and apostrophe vs quote distinction
 */
function findKeywordTriggerPositions(text, options) {
    const results = [];
    const { keywords, ignoreInQuotes = true, ignoreInPath = true } = options;
    // Track quote ranges
    const quoteRanges = findQuoteRanges(text);
    // Track path context (e.g., /path/to/file)
    const pathRanges = findPathRanges(text);
    // Search each keyword
    for (const keyword of keywords) {
        let searchPos = 0;
        while (searchPos < text.length) {
            const index = text.indexOf(keyword, searchPos);
            if (index === -1)
                break;
            const end = index + keyword.length;
            const line = getLineNumber(text, index);
            const column = getColumnNumber(text, index);
            // Check if in quote
            const inQuoteInfo = isInQuote(index, quoteRanges);
            // Check if in path
            const inPath = isInPath(index, pathRanges);
            // Skip if ignored
            if (ignoreInQuotes && inQuoteInfo.inQuote) {
                searchPos = end + 1;
                continue;
            }
            if (ignoreInPath && inPath) {
                searchPos = end + 1;
                continue;
            }
            results.push({
                keyword,
                start: index,
                end,
                line,
                column,
                inQuote: inQuoteInfo.inQuote,
                quoteType: inQuoteInfo.quoteType
            });
            searchPos = end + 1;
        }
    }
    // Sort by position
    results.sort((a, b) => a.start - b.start);
    return results;
}
/**
 * Find quote ranges in text
 * Handles apostrophe vs quote distinction
 */
function findQuoteRanges(text) {
    const ranges = [];
    const quoteChars = ['"', "'", '`'];
    for (const quoteChar of quoteChars) {
        let searchPos = 0;
        while (searchPos < text.length) {
            const start = text.indexOf(quoteChar, searchPos);
            if (start === -1)
                break;
            // Check if apostrophe (single quote after letter)
            if (quoteChar === "'") {
                const prevChar = text[start - 1];
                if (prevChar && /[a-zA-Z]/.test(prevChar)) {
                    // Likely apostrophe, skip
                    searchPos = start + 1;
                    continue;
                }
            }
            // Find matching end quote
            const end = findMatchingQuote(text, start + 1, quoteChar);
            if (end === -1) {
                searchPos = start + 1;
                continue;
            }
            ranges.push({ start, end, type: quoteChar });
            searchPos = end + 1;
        }
    }
    return ranges;
}
/**
 * Find matching quote (handle escape sequences)
 */
function findMatchingQuote(text, start, quoteChar) {
    for (let i = start; i < text.length; i++) {
        const char = text[i];
        // Escape sequence
        if (char === '\\') {
            i++; // Skip next char
            continue;
        }
        if (char === quoteChar) {
            return i;
        }
    }
    return -1; // No matching quote
}
/**
 * Find path ranges (e.g., /path/to/file, ./relative/path)
 */
function findPathRanges(text) {
    const ranges = [];
    // Match /path patterns
    const pathPattern = /(\/[\w\-./]+|\.[/][\w\-./]+)/g;
    let match;
    while ((match = pathPattern.exec(text)) !== null) {
        ranges.push({
            start: match.index,
            end: match.index + match[0].length
        });
    }
    return ranges;
}
/**
 * Check if position is in quote range
 */
function isInQuote(pos, ranges) {
    for (const range of ranges) {
        if (pos >= range.start && pos <= range.end) {
            return { inQuote: true, quoteType: range.type };
        }
    }
    return { inQuote: false };
}
/**
 * Check if position is in path range
 */
function isInPath(pos, ranges) {
    for (const range of ranges) {
        if (pos >= range.start && pos <= range.end) {
            return true;
        }
    }
    return false;
}
/**
 * Get line number from position
 */
function getLineNumber(text, pos) {
    const lines = text.slice(0, pos).split('\n');
    return lines.length;
}
/**
 * Get column number from position
 */
function getColumnNumber(text, pos) {
    const lines = text.slice(0, pos).split('\n');
    const lastLine = lines[lines.length - 1] ?? '';
    return lastLine.length + 1;
}
// Export
export { findKeywordTriggerPositions, findQuoteRanges, findPathRanges, isInQuote, isInPath };
//# sourceMappingURL=keyword-trigger-position.js.map