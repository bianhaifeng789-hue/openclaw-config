// @ts-nocheck
class TruncateUtils {
    /**
     * Truncate string with ellipsis
     */
    truncate(str, options) {
        const { maxLength, ellipsis = '...', preserveANSI = false, preserveWordBoundary = false } = options;
        if (str.length <= maxLength)
            return str;
        // Handle ANSI sequences
        if (preserveANSI && this.hasANSI(str)) {
            return this.truncateANSI(str, maxLength, ellipsis);
        }
        // Handle word boundary
        if (preserveWordBoundary) {
            return this.truncateWordBoundary(str, maxLength, ellipsis);
        }
        // Simple truncate
        return str.slice(0, maxLength - ellipsis.length) + ellipsis;
    }
    /**
     * Check if string has ANSI sequences
     */
    hasANSI(str) {
        return /\x1b\[[0-9;]*m/.test(str);
    }
    /**
     * Truncate preserving ANSI sequences
     */
    truncateANSI(str, maxLength, ellipsis) {
        const visibleLength = this.getVisibleLength(str);
        if (visibleLength <= maxLength)
            return str;
        // Extract ANSI sequences and visible chars
        const parts = this.splitANSI(str);
        let result = '';
        let visibleCount = 0;
        for (const part of parts) {
            if (this.isANSISequence(part)) {
                result += part; // Keep ANSI sequence
            }
            else {
                const remaining = maxLength - ellipsis.length - visibleCount;
                if (remaining <= 0)
                    break;
                const toAdd = part.slice(0, remaining);
                result += toAdd;
                visibleCount += toAdd.length;
            }
        }
        return result + '\x1b[0m' + ellipsis; // Reset ANSI + ellipsis
    }
    /**
     * Get visible length (excluding ANSI)
     */
    getVisibleLength(str) {
        return str.replace(/\x1b\[[0-9;]*m/g, '').length;
    }
    /**
     * Split string into ANSI sequences and visible chars
     */
    splitANSI(str) {
        const result = [];
        const regex = /\x1b\[[0-9;]*m|[^\x1b]+/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
            result.push(match[0]);
        }
        return result;
    }
    /**
     * Check if part is ANSI sequence
     */
    isANSISequence(part) {
        return part.startsWith('\x1b[');
    }
    /**
     * Truncate at word boundary
     */
    truncateWordBoundary(str, maxLength, ellipsis) {
        if (str.length <= maxLength)
            return str;
        // Find last word boundary within limit
        const limit = maxLength - ellipsis.length;
        const truncated = str.slice(0, limit);
        // Find last space
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > limit * 0.5) {
            return truncated.slice(0, lastSpace) + ellipsis;
        }
        return truncated + ellipsis;
    }
    /**
     * Truncate middle (keep start and end)
     */
    truncateMiddle(str, maxLength, ellipsis = '...') {
        if (str.length <= maxLength)
            return str;
        const ellipsisLength = ellipsis.length;
        const startLength = Math.floor((maxLength - ellipsisLength) / 2);
        const endLength = maxLength - ellipsisLength - startLength;
        return str.slice(0, startLength) + ellipsis + str.slice(-endLength);
    }
    /**
     * Truncate end (keep start)
     */
    truncateEnd(str, maxLength, ellipsis = '...') {
        return this.truncate(str, { maxLength, ellipsis });
    }
    /**
     * Truncate start (keep end)
     */
    truncateStart(str, maxLength, ellipsis = '...') {
        if (str.length <= maxLength)
            return str;
        return ellipsis + str.slice(-(maxLength - ellipsis.length));
    }
    /**
     * Width-aware truncate (consider character width for display)
     */
    truncateByWidth(str, maxWidth, ellipsis = '...') {
        // Would integrate with stringWidth utils
        // For demo, use simple approach
        return this.truncate(str, { maxLength: maxWidth, ellipsis });
    }
    /**
     * Reset for testing
     */
    _reset() {
        // No state
    }
}
// Global singleton
export const truncateUtils = new TruncateUtils();
export default truncateUtils;
//# sourceMappingURL=truncate-utils.js.map