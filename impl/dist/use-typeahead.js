// @ts-nocheck
class UseTypeahead {
    options = [];
    selectedIndex = 0;
    visible = false;
    query = '';
    maxVisible = 10;
    listeners = new Set();
    /**
     * Set options
     */
    setOptions(options) {
        this.options = options.map(o => ({ ...o, score: 0 }));
    }
    /**
     * Add option
     */
    addOption(id, label, value, category) {
        this.options.push({ id, label, value, category, score: 0 });
    }
    /**
     * Remove option
     */
    removeOption(id) {
        const index = this.options.findIndex(o => o.id === id);
        if (index === -1)
            return false;
        this.options.splice(index, 1);
        return true;
    }
    /**
     * Set query
     */
    setQuery(query) {
        this.query = query;
        if (query === '') {
            this.visible = false;
            return [];
        }
        // Score options
        const scored = this.scoreOptions(query);
        this.visible = true;
        this.selectedIndex = 0;
        this.notifyListeners(scored.slice(0, this.maxVisible));
        return scored.slice(0, this.maxVisible);
    }
    /**
     * Score options
     */
    scoreOptions(query) {
        const lowerQuery = query.toLowerCase();
        return this.options
            .map(o => {
            const lowerLabel = o.label.toLowerCase();
            let score = 0;
            // Exact match
            if (lowerLabel === lowerQuery) {
                score = 100;
            }
            // Starts with
            else if (lowerLabel.startsWith(lowerQuery)) {
                score = 80;
            }
            // Contains
            else if (lowerLabel.includes(lowerQuery)) {
                score = 60 - (lowerLabel.indexOf(lowerQuery) * 2);
            }
            // Fuzzy match
            else {
                score = this.fuzzyScore(lowerQuery, lowerLabel);
            }
            return { ...o, score };
        })
            .sort((a, b) => b.score - a.score);
    }
    /**
     * Fuzzy score
     */
    fuzzyScore(query, target) {
        let score = 0;
        let queryIndex = 0;
        for (let i = 0; i < target.length && queryIndex < query.length; i++) {
            if (target[i] === query[queryIndex]) {
                score += 10;
                queryIndex++;
            }
        }
        return queryIndex === query.length ? score : 0;
    }
    /**
     * Get visible options
     */
    getVisibleOptions() {
        if (!this.visible)
            return [];
        return this.scoreOptions(this.query).slice(0, this.maxVisible);
    }
    /**
     * Get selected
     */
    getSelected() {
        const visible = this.getVisibleOptions();
        return visible[this.selectedIndex] ?? null;
    }
    /**
     * Select next
     */
    selectNext() {
        const visible = this.getVisibleOptions();
        if (visible.length === 0)
            return false;
        if (this.selectedIndex < visible.length - 1) {
            this.selectedIndex++;
            return true;
        }
        return false;
    }
    /**
     * Select previous
     */
    selectPrevious() {
        if (this.selectedIndex > 0) {
            this.selectedIndex--;
            return true;
        }
        return false;
    }
    /**
     * Confirm selection
     */
    confirm() {
        const selected = this.getSelected();
        this.visible = false;
        this.query = '';
        return selected;
    }
    /**
     * Cancel
     */
    cancel() {
        this.visible = false;
        this.selectedIndex = 0;
        this.query = '';
    }
    /**
     * Is visible
     */
    isVisible() {
        return this.visible;
    }
    /**
     * Subscribe
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Notify listeners
     */
    notifyListeners(options) {
        for (const listener of this.listeners) {
            listener(options);
        }
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            optionsCount: this.options.length,
            visibleCount: this.getVisibleOptions().length,
            selectedIndex: this.selectedIndex,
            visible: this.visible,
            query: this.query
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.options = [];
        this.selectedIndex = 0;
        this.visible = false;
        this.query = '';
        this.listeners.clear();
    }
}
// Global singleton
export const useTypeahead = new UseTypeahead();
export default useTypeahead;
//# sourceMappingURL=use-typeahead.js.map