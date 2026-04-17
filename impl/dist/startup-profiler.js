// @ts-nocheck
class StartupProfiler {
    phases = new Map();
    currentPhase = null;
    phaseStack = [];
    rootPhase = null;
    startTime = 0;
    /**
     * Start profiling
     */
    start() {
        this.startTime = Date.now();
        this.rootPhase = {
            name: 'startup',
            startTime: this.startTime,
            endTime: null,
            durationMs: null,
            children: []
        };
        this.currentPhase = this.rootPhase;
        this.phaseStack = [this.rootPhase];
    }
    /**
     * Begin phase
     */
    beginPhase(name) {
        const phase = {
            name,
            startTime: Date.now(),
            endTime: null,
            durationMs: null,
            children: []
        };
        if (this.currentPhase) {
            this.currentPhase.children.push(phase);
        }
        this.phases.set(name, phase);
        this.phaseStack.push(phase);
        this.currentPhase = phase;
    }
    /**
     * End phase
     */
    endPhase(name) {
        const phase = this.phases.get(name);
        if (!phase)
            return 0;
        phase.endTime = Date.now();
        phase.durationMs = phase.endTime - phase.startTime;
        // Pop from stack
        this.phaseStack.pop();
        this.currentPhase = this.phaseStack[this.phaseStack.length - 1] ?? null;
        return phase.durationMs;
    }
    /**
     * End profiling
     */
    end() {
        if (!this.rootPhase)
            return null;
        // End all remaining phases
        while (this.phaseStack.length > 1) {
            const phase = this.phaseStack[this.phaseStack.length - 1];
            if (phase.endTime === null) {
                phase.endTime = Date.now();
                phase.durationMs = phase.endTime - phase.startTime;
            }
            this.phaseStack.pop();
        }
        this.rootPhase.endTime = Date.now();
        this.rootPhase.durationMs = this.rootPhase.endTime - this.rootPhase.startTime;
        return this.rootPhase;
    }
    /**
     * Get phase
     */
    getPhase(name) {
        return this.phases.get(name);
    }
    /**
     * Get total duration
     */
    getTotalDuration() {
        return this.rootPhase?.durationMs ?? null;
    }
    /**
     * Find bottlenecks
     */
    findBottlenecks(thresholdMs = 100) {
        const bottlenecks = [];
        for (const phase of this.phases.values()) {
            if (phase.durationMs && phase.durationMs >= thresholdMs) {
                bottlenecks.push(phase);
            }
        }
        return bottlenecks.sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0));
    }
    /**
     * Format report
     */
    formatReport() {
        if (!this.rootPhase)
            return 'No profiling data';
        const lines = [];
        lines.push(`Startup Profile Report`);
        lines.push(`Total Duration: ${this.rootPhase.durationMs}ms`);
        lines.push(``);
        this.formatPhaseTree(this.rootPhase, lines, 0);
        const bottlenecks = this.findBottlenecks();
        if (bottlenecks.length > 0) {
            lines.push(``);
            lines.push(`Bottlenecks (>100ms):`);
            for (const b of bottlenecks) {
                lines.push(`  ${b.name}: ${b.durationMs}ms`);
            }
        }
        return lines.join('\n');
    }
    /**
     * Format phase tree
     */
    formatPhaseTree(phase, lines, indent) {
        const prefix = '  '.repeat(indent);
        const duration = phase.durationMs ? `${phase.durationMs}ms` : 'running';
        lines.push(`${prefix}${phase.name}: ${duration}`);
        for (const child of phase.children) {
            this.formatPhaseTree(child, lines, indent + 1);
        }
    }
    /**
     * Get stats
     */
    getStats() {
        const phases = Array.from(this.phases.values());
        const completed = phases.filter(p => p.durationMs !== null);
        let slowest = null;
        let maxDuration = 0;
        for (const phase of completed) {
            if (phase.durationMs > maxDuration) {
                maxDuration = phase.durationMs;
                slowest = phase.name;
            }
        }
        const avgDuration = completed.length > 0
            ? completed.reduce((sum, p) => sum + (p.durationMs ?? 0), 0) / completed.length
            : 0;
        return {
            phaseCount: phases.length,
            totalDurationMs: this.rootPhase?.durationMs ?? null,
            slowestPhase: slowest,
            averageDurationMs: avgDuration
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.phases.clear();
        this.currentPhase = null;
        this.phaseStack = [];
        this.rootPhase = null;
        this.startTime = 0;
    }
}
// Global singleton
export const startupProfiler = new StartupProfiler();
export default startupProfiler;
//# sourceMappingURL=startup-profiler.js.map