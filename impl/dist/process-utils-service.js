// @ts-nocheck
class ProcessUtilsService {
    processes = new Map();
    processCounter = 0;
    /**
     * Spawn process
     */
    spawn(command) {
        const pid = ++this.processCounter;
        const process = {
            pid,
            command,
            status: 'running',
            startedAt: Date.now()
        };
        this.processes.set(pid, process);
        return process;
    }
    /**
     * Complete process
     */
    complete(pid, exitCode, stdout, stderr) {
        const process = this.processes.get(pid);
        if (!process || process.status !== 'running')
            return false;
        process.status = exitCode === 0 ? 'completed' : 'failed';
        process.exitCode = exitCode;
        process.stdout = stdout;
        process.stderr = stderr;
        process.completedAt = Date.now();
        return true;
    }
    /**
     * Kill process
     */
    kill(pid) {
        const process = this.processes.get(pid);
        if (!process || process.status !== 'running')
            return false;
        process.status = 'killed';
        process.completedAt = Date.now();
        return true;
    }
    /**
     * Get process
     */
    getProcess(pid) {
        return this.processes.get(pid);
    }
    /**
     * Get running processes
     */
    getRunning() {
        return Array.from(this.processes.values())
            .filter(p => p.status === 'running');
    }
    /**
     * Get completed processes
     */
    getCompleted() {
        return Array.from(this.processes.values())
            .filter(p => p.status === 'completed');
    }
    /**
     * Get failed processes
     */
    getFailed() {
        return Array.from(this.processes.values())
            .filter(p => p.status === 'failed');
    }
    /**
     * Get stats
     */
    getStats() {
        const processes = Array.from(this.processes.values());
        const avgDuration = processes.filter(p => p.completedAt).length > 0
            ? processes.filter(p => p.completedAt).reduce((sum, p) => sum + ((p.completedAt ?? 0) - p.startedAt), 0) / processes.filter(p => p.completedAt).length
            : 0;
        return {
            processesCount: processes.length,
            runningCount: processes.filter(p => p.status === 'running').length,
            completedCount: processes.filter(p => p.status === 'completed').length,
            failedCount: processes.filter(p => p.status === 'failed').length,
            killedCount: processes.filter(p => p.status === 'killed').length,
            averageDuration: avgDuration
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.processes.clear();
        this.processCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const processUtilsService = new ProcessUtilsService();
export default processUtilsService;
//# sourceMappingURL=process-utils-service.js.map