// @ts-nocheck
class NotebookProcessor {
    notebooks = new Map();
    cellCounter = 0;
    /**
     * Parse notebook
     */
    parse(content) {
        const parsed = JSON.parse(content);
        const cells = parsed.cells?.map((cell) => ({
            id: cell.id ?? `cell-${++this.cellCounter}`,
            type: cell.cell_type ?? 'code',
            source: Array.isArray(cell.source) ? cell.source.join('\n') : cell.source,
            outputs: cell.outputs?.map((o) => o.text ?? o.data),
            executionCount: cell.execution_count
        })) ?? [];
        return {
            cells,
            metadata: parsed.metadata ?? {},
            format: 'ipynb'
        };
    }
    /**
     * Create notebook
     */
    create() {
        return {
            cells: [],
            metadata: {},
            format: 'ipynb'
        };
    }
    /**
     * Add cell
     */
    addCell(notebookId, type, source) {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook)
            throw new Error('Notebook not found');
        const cell = {
            id: `cell-${++this.cellCounter}`,
            type,
            source,
            outputs: []
        };
        notebook.cells.push(cell);
        return cell;
    }
    /**
     * Edit cell
     */
    editCell(notebookId, cellId, source) {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook)
            return null;
        const cell = notebook.cells.find(c => c.id === cellId);
        if (!cell)
            return null;
        cell.source = source;
        return cell;
    }
    /**
     * Delete cell
     */
    deleteCell(notebookId, cellId) {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook)
            return false;
        const index = notebook.cells.findIndex(c => c.id === cellId);
        if (index === -1)
            return false;
        notebook.cells.splice(index, 1);
        return true;
    }
    /**
     * Execute cell (simulated)
     */
    async executeCell(notebookId, cellId) {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook)
            return [];
        const cell = notebook.cells.find(c => c.id === cellId);
        if (!cell || cell.type !== 'code')
            return [];
        // Would actually execute
        // For demo, return placeholder output
        cell.outputs = ['Output placeholder'];
        cell.executionCount = notebook.cells.filter(c => c.executionCount).length + 1;
        return cell.outputs;
    }
    /**
     * Serialize notebook
     */
    serialize(notebook) {
        const cells = notebook.cells.map(cell => ({
            cell_type: cell.type,
            id: cell.id,
            source: cell.source.split('\n'),
            outputs: cell.outputs?.map(o => ({ output_type: 'stream', text: o })) ?? [],
            execution_count: cell.executionCount
        }));
        return JSON.stringify({
            cells,
            metadata: notebook.metadata,
            nbformat: 4,
            nbformat_minor: 5
        }, null, 2);
    }
    /**
     * Register notebook
     */
    register(id, notebook) {
        this.notebooks.set(id, notebook);
    }
    /**
     * Get notebook
     */
    getNotebook(id) {
        return this.notebooks.get(id);
    }
    /**
     * Get stats
     */
    getStats() {
        const notebooks = Array.from(this.notebooks.values());
        const cells = notebooks.flatMap(n => n.cells);
        return {
            notebookCount: this.notebooks.size,
            totalCells: cells.length,
            codeCells: cells.filter(c => c.type === 'code').length,
            markdownCells: cells.filter(c => c.type === 'markdown').length
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.notebooks.clear();
        this.cellCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const notebookProcessor = new NotebookProcessor();
export default notebookProcessor;
//# sourceMappingURL=notebook-processor.js.map