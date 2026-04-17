// @ts-nocheck
class BriefToolService {
    briefs = [];
    briefCounter = 0;
    /**
     * Generate brief
     */
    brief(input) {
        const id = `brief-${++this.briefCounter}-${Date.now()}`;
        // Would generate actual brief
        // For demo, simulate
        const output = this.generateBrief(input);
        const result = {
            id,
            input,
            output,
            length: output.length,
            timestamp: Date.now()
        };
        this.briefs.push(result);
        return result;
    }
    /**
     * Generate brief (simulated)
     */
    generateBrief(input) {
        const words = input.split(' ').slice(0, 10).join(' ');
        return `Brief: ${words}...`;
    }
    /**
     * Get brief
     */
    getBrief(id) {
        return this.briefs.find(b => b.id === id);
    }
    /**
     * Get recent briefs
     */
    getRecent(count = 10) {
        return this.briefs.slice(-count);
    }
    /**
     * Get stats
     */
    getStats() {
        const avgLength = this.briefs.length > 0
            ? this.briefs.reduce((sum, b) => sum + b.length, 0) / this.briefs.length
            : 0;
        const avgInputLength = this.briefs.length > 0
            ? this.briefs.reduce((sum, b) => sum + b.input.length, 0) / this.briefs.length
            : 0;
        return {
            briefsCount: this.briefs.length,
            totalLength: this.briefs.reduce((sum, b) => sum + b.length, 0),
            averageLength: avgLength,
            averageInputLength: avgInputLength
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.briefs = [];
        this.briefCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const briefToolService = new BriefToolService();
export default briefToolService;
//# sourceMappingURL=brief-tool-service.js.map