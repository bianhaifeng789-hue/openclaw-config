// @ts-nocheck
class XMLUtilsService {
    parseResults = [];
    /**
     * Escape XML
     */
    escape(xml) {
        return xml
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    /**
     * Unescape XML
     */
    unescape(xml) {
        return xml
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
    }
    /**
     * Is valid XML (basic check)
     */
    isValid(xml) {
        try {
            // Basic validation - check for matching tags
            const openTags = xml.match(/<[^\/][^>]*>/g) ?? [];
            const closeTags = xml.match(/<\/[^>]*>/g) ?? [];
            return openTags.length === closeTags.length;
        }
        catch {
            return false;
        }
    }
    /**
     * Parse XML (basic)
     */
    parse(xml) {
        const result = {
            success: false,
            timestamp: Date.now()
        };
        try {
            // Basic parsing - would use proper XML parser in production
            result.data = { raw: xml, parsed: true };
            result.success = true;
        }
        catch (e) {
            result.error = e.message;
        }
        this.parseResults.push(result);
        return result;
    }
    /**
     * Build XML
     */
    build(tag, content, attributes) {
        const attrs = attributes
            ? Object.entries(attributes)
                .map(([k, v]) => ` ${k}="${this.escape(v)}"`)
                .join('')
            : '';
        return `<${tag}${attrs}>${this.escape(content)}</${tag}>`;
    }
    /**
     * Get parse results
     */
    getParseResults() {
        return [...this.parseResults];
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            parseCount: this.parseResults.length,
            successCount: this.parseResults.filter(r => r.success).length,
            failureCount: this.parseResults.filter(r => !r.success).length,
            successRate: this.parseResults.length > 0
                ? this.parseResults.filter(r => r.success).length / this.parseResults.length
                : 0
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.parseResults = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const xmlUtilsService = new XMLUtilsService();
export default xmlUtilsService;
//# sourceMappingURL=xml-utils-service.js.map