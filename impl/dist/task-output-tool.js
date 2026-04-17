// @ts-nocheck
class TaskOutputTool {
    outputs = new Map();
    streamListeners = new Map();
    /**
     * Get output
     */
    getOutput(taskId) {
        const outputs = this.outputs.get(taskId) ?? [];
        return outputs.map(o => o.output).join('');
    }
    /**
     * Get full output
     */
    getFullOutput(taskId) {
        return this.outputs.get(taskId) ?? [];
    }
    /**
     * Append output
     */
    appendOutput(taskId, output) {
        const outputs = this.outputs.get(taskId) ?? [];
        const entry = {
            taskId,
            output,
            timestamp: Date.now()
        };
        outputs.push(entry);
        this.outputs.set(taskId, outputs);
        // Notify stream listeners
        const listeners = this.streamListeners.get(taskId);
        if (listeners) {
            for (const listener of listeners) {
                listener(output);
            }
        }
    }
    /**
     * Clear output
     */
    clearOutput(taskId) {
        this.outputs.delete(taskId);
    }
    /**
     * Stream output
     */
    stream(taskId, listener) {
        const listeners = this.streamListeners.get(taskId) ?? new Set();
        listeners.add(listener);
        this.streamListeners.set(taskId, listeners);
        return () => {
            listeners.delete(listener);
        };
    }
    /**
     * Stop streaming
     */
    stopStream(taskId) {
        return this.streamListeners.delete(taskId);
    }
    /**
     * Get recent output
     */
    getRecentOutput(taskId, count = 10) {
        const outputs = this.outputs.get(taskId) ?? [];
        const recent = outputs.slice(-count);
        return recent.map(o => o.output).join('');
    }
    /**
     * Get output length
     */
    getOutputLength(taskId) {
        return this.getOutput(taskId).length;
    }
    /**
     * Get output entries count
     */
    getEntriesCount(taskId) {
        return (this.outputs.get(taskId) ?? []).length;
    }
    /**
     * Search output
     */
    searchOutput(taskId, query) {
        const output = this.getOutput(taskId);
        const lines = output.split('\n');
        return lines.filter(line => line.toLowerCase().includes(query.toLowerCase()));
    }
    /**
     * Get stats
     */
    getStats() {
        const tasks = Array.from(this.outputs.keys());
        return {
            tasksCount: tasks.length,
            totalOutputs: tasks.reduce((sum, id) => sum + (this.outputs.get(id)?.length ?? 0), 0),
            totalLength: tasks.reduce((sum, id) => sum + this.getOutputLength(id), 0),
            activeStreams: this.streamListeners.size
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.outputs.clear();
        this.streamListeners.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const taskOutputTool = new TaskOutputTool();
export default taskOutputTool;
//# sourceMappingURL=task-output-tool.js.map