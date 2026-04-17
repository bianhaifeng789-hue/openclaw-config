// @ts-nocheck
class NotebookEditTool {
    edits = [];
    notebookCounter = 0;
    /**
     * Edit cell
     */
    editCell(notebookPath, cellIndex, content) {
        const result = {
            notebookPath,
            success: true,
            changes: [{ cellIndex, action: 'edit' }],
            timestamp: Date.now()
        };
        this.edits.push(result);
        return result;
    }
    /**
     * Add cell
     */
    addCell(notebookPath, type, content, position) {
        const index = position ?? this.notebookCounter++;
        const result = {
            notebookPath,
            success: true,
            changes: [{ cellIndex: index, action: 'add' }],
            timestamp: Date.now()
        };
        this.edits.push(result);
        return result;
    }
    /**
     * Delete cell
     */
    deleteCell(notebookPath, cellIndex) {
        const result = {
            notebookPath,
            success: true,
            changes: [{ cellIndex, action: 'delete' }],
            timestamp: Date.now()
        };
        this.edits.push(result);
        return result;
    }
    /**
     * Move cell
     */
    moveCell(notebookPath, fromIndex, toIndex) {
        const result = {
            notebookPath,
            success: true,
            changes: [{ cellIndex: fromIndex, action: `move to ${toIndex}` }],
            timestamp: Date.now()
        };
        this.edits.push(result);
        return result;
    }
    /**
     * Execute cell
     */
    executeCell(notebookPath, cellIndex) {
        const result = {
            notebookPath,
            success: true,
            changes: [{ cellIndex, action: 'execute' }],
            timestamp: Date.now()
        };
        this.edits.push(result);
        return result;
    }
    /**
     * Get edits
     */
    getEdits() {
        return [...this.edits];
    }
    /**
     * Get edits for notebook
     */
    getEditsForNotebook(notebookPath) {
        return this.edits.filter(e => e.notebookPath === notebookPath);
    }
    /**
     * Get recent edits
     */
    getRecent(count = 10) {
        return this.edits.slice(-count);
    }
    /**
     * Get stats
     */
    getStats() {
        const successful = this.edits.filter(e => e.success);
        const totalChanges = successful.reduce((sum, e) => sum + e.changes.length, 0);
        const byAction = {};
        for (const edit of successful) {
            for (const change of edit.changes) {
                byAction[change.action] = (byAction[change.action] ?? 0) + 1;
            }
        }
        return {
            editsCount: this.edits.length,
            successfulCount: successful.length,
            totalChanges: totalChanges,
            byAction
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.edits = [];
        this.notebookCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const notebookEditTool = new NotebookEditTool();
export default notebookEditTool;
//# sourceMappingURL=notebook-edit-tool.js.map