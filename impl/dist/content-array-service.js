// @ts-nocheck
class ContentArrayService {
    contents = [];
    contentCounter = 0;
    /**
     * Add content
     */
    add(type, content, metadata) {
        const id = `content-${++this.contentCounter}-${Date.now()}`;
        const item = {
            id,
            type,
            content,
            metadata,
            addedAt: Date.now()
        };
        this.contents.push(item);
        return item;
    }
    /**
     * Add text
     */
    addText(content) {
        return this.add('text', content);
    }
    /**
     * Add image
     */
    addImage(content, metadata) {
        return this.add('image', content, metadata);
    }
    /**
     * Add file
     */
    addFile(content, metadata) {
        return this.add('file', content, metadata);
    }
    /**
     * Add code
     */
    addCode(content, metadata) {
        return this.add('code', content, metadata);
    }
    /**
     * Get content
     */
    get(id) {
        return this.contents.find(c => c.id === id);
    }
    /**
     * Get by type
     */
    getByType(type) {
        return this.contents.filter(c => c.type === type);
    }
    /**
     * Get all contents
     */
    getAll() {
        return [...this.contents];
    }
    /**
     * Get recent
     */
    getRecent(count = 10) {
        return this.contents.slice(-count);
    }
    /**
     * Remove content
     */
    remove(id) {
        const index = this.contents.findIndex(c => c.id === id);
        if (index === -1)
            return false;
        this.contents.splice(index, 1);
        return true;
    }
    /**
     * Clear by type
     */
    clearByType(type) {
        const toRemove = this.getByType(type);
        this.contents = this.contents.filter(c => c.type !== type);
        return toRemove.length;
    }
    /**
     * Get stats
     */
    getStats() {
        const byType = {
            text: 0, image: 0, file: 0, code: 0
        };
        for (const content of this.contents) {
            byType[content.type]++;
        }
        const totalSize = this.contents.reduce((sum, c) => sum + c.content.length, 0);
        const avgSize = this.contents.length > 0 ? totalSize / this.contents.length : 0;
        return {
            contentsCount: this.contents.length,
            byType,
            averageContentSize: avgSize,
            totalSize: totalSize
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.contents = [];
        this.contentCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const contentArrayService = new ContentArrayService();
export default contentArrayService;
//# sourceMappingURL=content-array-service.js.map