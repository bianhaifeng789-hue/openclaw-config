// @ts-nocheck
class SpawnInProcess {
    configs = new Map();
    workers = new Map();
    messageQueue = new Map();
    /**
     * Configure worker
     */
    configure(agentId, config) {
        this.configs.set(agentId, config);
    }
    /**
     * Spawn in-process worker
     */
    spawn(agentId) {
        const config = this.configs.get(agentId);
        // Would spawn actual worker thread or subprocess
        // For demo, simulate
        const worker = {
            agentId,
            status: 'running',
            startTime: Date.now(),
            messagesReceived: 0,
            messagesSent: 0
        };
        this.workers.set(agentId, worker);
        this.messageQueue.set(agentId, []);
        return worker;
    }
    /**
     * Send message to worker
     */
    send(agentId, type, data) {
        const worker = this.workers.get(agentId);
        if (!worker)
            return false;
        const queue = this.messageQueue.get(agentId) ?? [];
        queue.push({ type, data });
        this.messageQueue.set(agentId, queue);
        worker.messagesReceived++;
        return true;
    }
    /**
     * Receive message from worker
     */
    receive(agentId) {
        const queue = this.messageQueue.get(agentId) ?? [];
        this.messageQueue.set(agentId, []);
        const worker = this.workers.get(agentId);
        if (worker) {
            worker.messagesSent += queue.length;
        }
        return queue;
    }
    /**
     * Stop worker
     */
    stop(agentId) {
        const worker = this.workers.get(agentId);
        if (!worker)
            return false;
        worker.status = 'stopped';
        return true;
    }
    /**
     * Get worker
     */
    getWorker(agentId) {
        return this.workers.get(agentId);
    }
    /**
     * Get config
     */
    getConfig(agentId) {
        return this.configs.get(agentId);
    }
    /**
     * Get running workers
     */
    getRunning() {
        return Array.from(this.workers.values())
            .filter(w => w.status === 'running');
    }
    /**
     * Get stats
     */
    getStats() {
        const workers = Array.from(this.workers.values());
        return {
            workersCount: workers.length,
            runningCount: workers.filter(w => w.status === 'running').length,
            stoppedCount: workers.filter(w => w.status === 'stopped').length,
            errorCount: workers.filter(w => w.status === 'error').length,
            totalMessagesReceived: workers.reduce((sum, w) => sum + w.messagesReceived, 0),
            totalMessagesSent: workers.reduce((sum, w) => sum + w.messagesSent, 0)
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.configs.clear();
        this.workers.clear();
        this.messageQueue.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const spawnInProcess = new SpawnInProcess();
export default spawnInProcess;
//# sourceMappingURL=spawn-in-process.js.map