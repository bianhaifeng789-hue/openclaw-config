// @ts-nocheck
class SyntheticOutputTool {
    outputs = [];
    outputCounter = 0;
    /**
     * Generate synthetic output
     */
    generate(type, template, metadata) {
        const id = `synthetic-${++this.outputCounter}-${Date.now()}`;
        const output = {
            id,
            type,
            output: this.applyTemplate(template, metadata),
            metadata: metadata ?? {},
            createdAt: Date.now()
        };
        this.outputs.push(output);
        return output;
    }
    /**
     * Apply template
     */
    applyTemplate(template, metadata) {
        if (!metadata)
            return template;
        let result = template;
        for (const [key, value] of Object.entries(metadata)) {
            result = result.replace(`{{${key}}}`, String(value));
        }
        return result;
    }
    /**
     * Generate mock
     */
    generateMock(template, metadata) {
        return this.generate('mock', template, metadata);
    }
    /**
     * Generate test
     */
    generateTest(template, metadata) {
        return this.generate('test', template, metadata);
    }
    /**
     * Generate simulation
     */
    generateSimulation(template, metadata) {
        return this.generate('simulation', template, metadata);
    }
    /**
     * Get outputs
     */
    getOutputs() {
        return [...this.outputs];
    }
    /**
     * Get outputs by type
     */
    getByType(type) {
        return this.outputs.filter(o => o.type === type);
    }
    /**
     * Get recent outputs
     */
    getRecent(count = 10) {
        return this.outputs.slice(-count);
    }
    /**
     * Get stats
     */
    getStats() {
        const byType = {
            mock: 0, test: 0, simulation: 0
        };
        for (const output of this.outputs)
            byType[output.type]++;
        const avgLength = this.outputs.length > 0
            ? this.outputs.reduce((sum, o) => sum + o.output.length, 0) / this.outputs.length
            : 0;
        return {
            outputsCount: this.outputs.length,
            byType,
            averageOutputLength: avgLength
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.outputs = [];
        this.outputCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const syntheticOutputTool = new SyntheticOutputTool();
export default syntheticOutputTool;
//# sourceMappingURL=synthetic-output-tool.js.map