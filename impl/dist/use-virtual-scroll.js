// @ts-nocheck
class UseVirtualScroll {
    config = {
        itemHeight: 40,
        viewportHeight: 400,
        totalItems: 0,
        overscan: 3
    };
    scrollTop = 0;
    listeners = new Set();
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
        this.notifyListeners();
    }
    /**
     * Set scroll position
     */
    setScrollTop(scrollTop) {
        this.scrollTop = scrollTop;
        const state = this.calculateVisibleRange();
        this.notifyListeners();
        return state;
    }
    /**
     * Calculate visible range
     */
    calculateVisibleRange() {
        const { itemHeight, viewportHeight, totalItems, overscan } = this.config;
        const startIndex = Math.max(0, Math.floor(this.scrollTop / itemHeight) - overscan);
        const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
        const endIndex = Math.min(totalItems - 1, startIndex + visibleCount);
        const offsetY = startIndex * itemHeight;
        return {
            startIndex,
            endIndex,
            offsetY,
            visibleCount: endIndex - startIndex + 1
        };
    }
    /**
     * Get visible range
     */
    getVisibleRange() {
        return this.calculateVisibleRange();
    }
    /**
     * Get total height
     */
    getTotalHeight() {
        return this.config.totalItems * this.config.itemHeight;
    }
    /**
     * Scroll to index
     */
    scrollToIndex(index) {
        const { itemHeight, viewportHeight } = this.config;
        const scrollTop = Math.max(0, index * itemHeight - viewportHeight / 2);
        this.scrollTop = scrollTop;
        this.notifyListeners();
        return scrollTop;
    }
    /**
     * Scroll to top
     */
    scrollToTop() {
        this.scrollTop = 0;
        this.notifyListeners();
    }
    /**
     * Scroll to bottom
     */
    scrollToBottom() {
        const totalHeight = this.getTotalHeight();
        this.scrollTop = totalHeight - this.config.viewportHeight;
        this.notifyListeners();
    }
    /**
     * Get item position
     */
    getItemPosition(index) {
        return index * this.config.itemHeight;
    }
    /**
     * Get item at scroll position
     */
    getItemAtPosition(position) {
        return Math.floor(position / this.config.itemHeight);
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
    notifyListeners() {
        for (const listener of this.listeners) {
            listener(this.getVisibleRange());
        }
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            config: this.config,
            scrollTop: this.scrollTop,
            totalHeight: this.getTotalHeight(),
            visibleRange: this.getVisibleRange(),
            listenersCount: this.listeners.size
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.config = {
            itemHeight: 40,
            viewportHeight: 400,
            totalItems: 0,
            overscan: 3
        };
        this.scrollTop = 0;
        this.listeners.clear();
    }
}
// Global singleton
export const useVirtualScroll = new UseVirtualScroll();
export default useVirtualScroll;
//# sourceMappingURL=use-virtual-scroll.js.map