// @ts-nocheck
/**
 * In-Process Teammate Spawn Pattern - 进程内Teammate生成
 *
 * Source: Claude Code utils/swarm/spawnInProcess.ts
 * Pattern: AsyncLocalStorage context + AbortController + AppState task registration + teammateLifecycle
 */
import { AsyncLocalStorage } from 'async_hooks';
class InProcessTeammateSpawn {
    teammateALS = new AsyncLocalStorage();
    activeTeammates = new Map();
    taskCounter = 0;
    /**
     * Spawn teammate in-process (same Node process)
     * Uses AsyncLocalStorage for context isolation
     */
    async spawn(config) {
        const taskId = `teammate-${++this.taskCounter}-${Date.now()}`;
        const abortController = new AbortController();
        const context = {
            agentId: config.agentId,
            taskId,
            abortController,
            startTime: Date.now(),
            status: 'starting'
        };
        // Register in AppState (would integrate with actual AppState)
        this.activeTeammates.set(taskId, context);
        // Enter ALS context
        return this.teammateALS.run(context, async () => {
            try {
                context.status = 'running';
                // Would call actual agent runner here
                // For demo, simulate execution
                const result = await this.runTeammateTask(config, abortController.signal);
                context.status = 'completed';
                return result;
            }
            catch (error) {
                if (abortController.signal.aborted) {
                    context.status = 'aborted';
                }
                else {
                    context.status = 'failed';
                }
                throw error;
            }
            finally {
                // Cleanup
                this.activeTeammates.delete(taskId);
            }
        });
    }
    /**
     * Run teammate task (mock implementation)
     */
    async runTeammateTask(config, signal) {
        // Would integrate with actual agent runner
        // For demo, just return task ID
        return `Task ${config.agentId} completed`;
    }
    /**
     * Get current teammate context
     */
    getCurrentContext() {
        return this.teammateALS.getStore();
    }
    /**
     * Abort teammate by task ID
     */
    abort(taskId) {
        const context = this.activeTeammates.get(taskId);
        if (!context)
            return false;
        context.abortController.abort();
        return true;
    }
    /**
     * Abort all active teammates
     */
    abortAll() {
        let count = 0;
        for (const [taskId, context] of this.activeTeammates) {
            context.abortController.abort();
            count++;
        }
        return count;
    }
    /**
     * Get active teammates count
     */
    getActiveCount() {
        return this.activeTeammates.size;
    }
    /**
     * Get teammate status
     */
    getStatus(taskId) {
        return this.activeTeammates.get(taskId)?.status;
    }
    /**
     * List all active teammates
     */
    listActive() {
        return Array.from(this.activeTeammates.values());
    }
    /**
     * Cleanup completed teammates
     */
    cleanupCompleted() {
        let cleaned = 0;
        for (const [taskId, context] of this.activeTeammates) {
            if (context.status === 'completed' || context.status === 'failed' || context.status === 'aborted') {
                this.activeTeammates.delete(taskId);
                cleaned++;
            }
        }
        return cleaned;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.abortAll();
        this.activeTeammates.clear();
        this.taskCounter = 0;
    }
}
// Global singleton
export const inProcessTeammateSpawn = new InProcessTeammateSpawn();
export default inProcessTeammateSpawn;
//# sourceMappingURL=in-process-teammate-spawn.js.map