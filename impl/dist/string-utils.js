// @ts-nocheck
/**
 * String Utils Pattern - 字符串工具
 *
 * Source: Claude Code utils/stringUtils.ts + utils/words.ts
 * Pattern: case conversion + whitespace handling + slugify + word boundary
 */
class StringUtils {
    /**
     * Convert to camelCase
     */
    camelCase(str) {
        return str
            .split(/[-_\s]+/)
            .map((word, index) => index === 0 ? word.toLowerCase() : this.capitalize(word))
            .join('');
    }
    /**
     * Convert to PascalCase
     */
    pascalCase(str) {
        return str
            .split(/[-_\s]+/)
            .map(word => this.capitalize(word))
            .join('');
    }
    /**
     * Convert to snake_case
     */
    snakeCase(str) {
        return str
            .split(/[-\s]+/)
            .map(word => word.toLowerCase())
            .join('_');
    }
    /**
     * Convert to kebab-case
     */
    kebabCase(str) {
        return str
            .split(/[_\s]+/)
            .map(word => word.toLowerCase())
            .join('-');
    }
    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (str.length === 0)
            return str;
        return str[0].toUpperCase() + str.slice(1).toLowerCase();
    }
    /**
     * Convert to sentence case
     */
    sentenceCase(str) {
        return str
            .split(/[.!?]+/)
            .map(sentence => this.capitalize(sentence.trim()))
            .join('. ');
    }
    /**
     * Slugify (URL-safe)
     */
    slugify(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove non-word chars
            .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphen
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }
    /**
     * Trim whitespace (including newlines)
     */
    trimAll(str) {
        return str.trim().replace(/\s+/g, ' ');
    }
    /**
     * Strip ANSI codes
     */
    stripANSI(str) {
        return str.replace(/\x1b\[[0-9;]*m/g, '');
    }
    /**
     * Pad string to length
     */
    pad(str, length, char = ' ', side = 'right') {
        if (str.length >= length)
            return str;
        const padLength = length - str.length;
        switch (side) {
            case 'left':
                return char.repeat(padLength) + str;
            case 'right':
                return str + char.repeat(padLength);
            case 'both':
                const leftPad = Math.floor(padLength / 2);
                const rightPad = padLength - leftPad;
                return char.repeat(leftPad) + str + char.repeat(rightPad);
        }
    }
    /**
     * Repeat string
     */
    repeat(str, count) {
        return str.repeat(Math.max(0, count));
    }
    /**
     * Count words
     */
    wordCount(str) {
        return str.trim().split(/\s+/).filter(w => w.length > 0).length;
    }
    /**
     * Get word at position
     */
    getWordAt(str, position) {
        const words = str.split(/\s+/);
        let currentPos = 0;
        for (const word of words) {
            const wordStart = str.indexOf(word, currentPos);
            const wordEnd = wordStart + word.length;
            if (position >= wordStart && position <= wordEnd) {
                return word;
            }
            currentPos = wordEnd + 1;
        }
        return null;
    }
    /**
     * Escape regex special chars
     */
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Escape HTML entities
     */
    escapeHTML(str) {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, char => entities[char] ?? char);
    }
    /**
     * Unescape HTML entities
     */
    unescapeHTML(str) {
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'"
        };
        return str.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => entities[entity] ?? entity);
    }
    /**
     * Is empty or whitespace
     */
    isEmpty(str) {
        return str.trim().length === 0;
    }
    /**
     * Is numeric
     */
    isNumeric(str) {
        return /^\d+$/.test(str);
    }
    /**
     * Is alphanumeric
     */
    isAlphanumeric(str) {
        return /^[a-zA-Z0-9]+$/.test(str);
    }
    /**
     * Reset for testing
     */
    _reset() {
        // No state
    }
}
// Global singleton
export const stringUtils = new StringUtils();
export default stringUtils;
//# sourceMappingURL=string-utils.js.map