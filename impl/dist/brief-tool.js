// @ts-nocheck
class BriefTool {
    briefs = [];
    briefCounter = 0;
    maxLength = 200;
    /**
     * Generate brief
     */
    generate(input, context) {
        const id = ++this.briefCounter;
        // Would use AI for brief generation
        // For demo, truncate and extract key points
        const brief = this.truncateBrief(input);
        const keyPoints = this.extractKeyPoints(input);
        const result = {
            input,
            brief,
            keyPoints,
            context: context ?? '',
            generatedAt: Date.now()
        };
        this.briefs.push(result);
        return result;
    }
    /**
     * Truncate brief
     */
    truncateBrief(input) {
        const words = input.split(' ');
        const truncated = words.slice(0, 50).join(' ');
        return truncated.length > this.maxLength
            ? truncated.slice(0, this.maxLength) + '...'
            : truncated;
    }
    /**
     * Extract key points
     */
    extractKeyPoints(input) {
        // Would use NLP/AI
        // For demo, extract first sentences
        const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences.slice(0, 5).map(s => s.trim());
    }
    /**
     * Set max length
     */
    setMaxLength(length) {
        this.maxLength = length;
    }
    /**
     * Get max length
     */
    getMaxLength() {
        return this.maxLength;
    }
    /**
     * Get brief
     */
    getBrief(id) {
        return this.briefs.find(b => b.input.includes(`brief-${id}`));
    }
    /**
     * Get all briefs
     */
    getAllBriefs() {
        return [...this.briefs];
    }
    /**
     * Get recent briefs
     */
    getRecent(count = 5) {
        return this.briefs.slice(-count);
    }
    /**
     * Clear briefs
     */
    clear() {
        this.briefs = [];
        this.briefCounter = 0;
    }
    /**
     * Get stats
     */
    getStats() {
        const briefs = this.briefs;
        return {
            briefsCount: briefs.length,
            averageKeyPoints: briefs.length > 0
                ? briefs.reduce((sum, b) => sum + b.keyPoints.length, 0) / briefs.length
                : 0,
            averageBriefLength: briefs.length > 0
                ? briefs.reduce((sum, b) => sum + b.brief.length, 0) / briefs.length
                : 0
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.maxLength = 200;
    }
}
// Global singleton
export const briefTool = new BriefTool();
export default briefTool;
//# sourceMappingURL=brief-tool.js.map