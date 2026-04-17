// @ts-nocheck
class DreamTaskService {
    dreams = new Map();
    dreamCounter = 0;
    queue = [];
    /**
     * Create dream
     */
    create(name, priority, scheduledAt) {
        const id = `dream-${++this.dreamCounter}-${Date.now()}`;
        const dream = {
            id,
            name,
            status: 'pending',
            priority: priority ?? 0,
            scheduledAt,
            startedAt: undefined,
            completedAt: undefined
        };
        this.dreams.set(id, dream);
        this.queue.push(id);
        this.sortQueue();
        return dream;
    }
    /**
     * Sort queue by priority
     */
    sortQueue() {
        this.queue.sort((a, b) => {
            const dreamA = this.dreams.get(a);
            const dreamB = this.dreams.get(b);
            return dreamB.priority - dreamA.priority;
        });
    }
    /**
     * Start dream
     */
    start(id) {
        const dream = this.dreams.get(id);
        if (!dream || dream.status !== 'pending')
            return false;
        dream.status = 'running';
        dream.startedAt = Date.now();
        const index = this.queue.indexOf(id);
        if (index !== -1)
            this.queue.splice(index, 1);
        return true;
    }
    /**
     * Complete dream
     */
    complete(id, result) {
        const dream = this.dreams.get(id);
        if (!dream || dream.status !== 'running')
            return false;
        dream.status = 'completed';
        dream.completedAt = Date.now();
        dream.result = result;
        return true;
    }
    /**
     * Fail dream
     */
    fail(id, error) {
        const dream = this.dreams.get(id);
        if (!dream || dream.status !== 'running')
            return false;
        dream.status = 'failed';
        dream.completedAt = Date.now();
        dream.error = error;
        return true;
    }
    /**
     * Get dream
     */
    getDream(id) {
        return this.dreams.get(id);
    }
    /**
     * Get pending dreams
     */
    getPending() {
        return this.queue
            .map(id => this.dreams.get(id))
            .filter(d => d !== undefined);
    }
    /**
     * Get running dreams
     */
    getRunning() {
        return Array.from(this.dreams.values())
            .filter(d => d.status === 'running');
    }
    /**
     * Get completed dreams
     */
    getCompleted() {
        return Array.from(this.dreams.values())
            .filter(d => d.status === 'completed');
    }
    /**
     * Get stats
     */
    getStats() {
        const dreams = Array.from(this.dreams.values());
        return {
            dreamsCount: dreams.length,
            pendingCount: dreams.filter(d => d.status === 'pending').length,
            runningCount: dreams.filter(d => d.status === 'running').length,
            completedCount: dreams.filter(d => d.status === 'completed').length,
            failedCount: dreams.filter(d => d.status === 'failed').length
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.dreams.clear();
        this.queue = [];
        this.dreamCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const dreamTaskService = new DreamTaskService();
export default dreamTaskService;
//# sourceMappingURL=dream-task-service.js.map