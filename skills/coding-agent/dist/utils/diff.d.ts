/**
 * Utility functions for diff operations and text processing
 */
/**
 * Calculate line-by-line diff between two strings
 */
export declare function diffLines(oldText: string, newText: string): Array<{
    type: 'added' | 'removed' | 'unchanged';
    line: string;
    oldLineNum?: number;
    newLineNum?: number;
}>;
/**
 * Truncate text to a maximum length with ellipsis
 */
export declare function truncate(text: string, maxLength: number): string;
/**
 * Escape special regex characters in a string
 */
export declare function escapeRegex(str: string): string;
/**
 * Find the line number of a string in text
 */
export declare function findLineNumber(text: string, search: string, startIndex?: number): number;
/**
 * Get context lines around a specific line number
 */
export declare function getContextLines(text: string, lineNum: number, contextLines?: number): Array<{
    lineNum: number;
    content: string;
}>;
/**
 * Normalize line endings to LF
 */
export declare function normalizeLineEndings(text: string): string;
/**
 * Detect the indentation style of a file
 */
export declare function detectIndentation(text: string): {
    type: 'tabs' | 'spaces';
    size: number;
};
//# sourceMappingURL=diff.d.ts.map