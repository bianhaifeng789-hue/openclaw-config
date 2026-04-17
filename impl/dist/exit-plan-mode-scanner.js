// @ts-nocheck
// Precedence order: approved > terminated > rejected > pending
const PRECEDENCE_ORDER = ['approved', 'terminated', 'rejected', 'pending'];
class ExitPlanModeScanner {
    events = [];
    targets = new Map();
    lastScanResult = 'pending';
    newestApprovedTarget = null;
    newestNonRejectedTarget = null;
    /**
     * Ingest CCR event stream
     */
    ingest(event) {
        this.events.push(event);
        this.updateTargetState(event);
    }
    /**
     * Update target state from event
     */
    updateTargetState(event) {
        const target = this.targets.get(event.targetId) ?? {
            id: event.targetId,
            status: 'pending'
        };
        // Apply precedence: only update if new status has higher precedence
        const currentPrecedence = PRECEDENCE_ORDER.indexOf(target.status);
        const newPrecedence = PRECEDENCE_ORDER.indexOf(event.type);
        if (newPrecedence < currentPrecedence) {
            target.status = event.type;
            if (event.type === 'approved') {
                target.approvedAt = event.timestamp;
                this.newestApprovedTarget = event.targetId;
            }
            else if (event.type === 'rejected') {
                target.rejectedAt = event.timestamp;
                target.rejectionReason = event.reason;
                // Trigger rescan
                this.rescanAfterRejection();
            }
            else if (event.type === 'terminated') {
                target.terminatedAt = event.timestamp;
            }
        }
        this.targets.set(event.targetId, target);
    }
    /**
     * Rescan after rejection: find newest non-rejected target
     */
    rescanAfterRejection() {
        let newestTime = 0;
        let newestId = null;
        for (const [id, target] of this.targets) {
            if (target.status !== 'rejected') {
                // Use approvedAt or earliest timestamp
                const time = target.approvedAt ?? target.terminatedAt ?? 0;
                if (time > newestTime) {
                    newestTime = time;
                    newestId = id;
                }
            }
        }
        this.newestNonRejectedTarget = newestId;
    }
    /**
     * Scan current state and determine plan status
     */
    scan() {
        // Check for any approved target
        if (this.newestApprovedTarget) {
            this.lastScanResult = 'approved';
            return 'approved';
        }
        // Check for all terminated
        const allTerminated = this.targets.size > 0 &&
            Array.from(this.targets.values()).every(t => t.status === 'terminated');
        if (allTerminated) {
            this.lastScanResult = 'terminated';
            return 'terminated';
        }
        // Check for newest non-rejected
        if (this.newestNonRejectedTarget) {
            const target = this.targets.get(this.newestNonRejectedTarget);
            if (target?.status === 'approved') {
                this.lastScanResult = 'approved';
                return 'approved';
            }
        }
        // Default: pending
        this.lastScanResult = 'pending';
        return 'pending';
    }
    /**
     * Get newest approved target
     */
    getNewestApproved() {
        return this.newestApprovedTarget;
    }
    /**
     * Get newest non-rejected target
     */
    getNewestNonRejected() {
        return this.newestNonRejectedTarget;
    }
    /**
     * Get target state
     */
    getTarget(id) {
        return this.targets.get(id);
    }
    /**
     * Get all targets
     */
    getAllTargets() {
        return Array.from(this.targets.values());
    }
    /**
     * Get last scan result
     */
    getLastScanResult() {
        return this.lastScanResult;
    }
    /**
     * Get events count
     */
    getEventsCount() {
        return this.events.length;
    }
    /**
     * Clear state
     */
    clear() {
        this.events = [];
        this.targets.clear();
        this.lastScanResult = 'pending';
        this.newestApprovedTarget = null;
        this.newestNonRejectedTarget = null;
    }
}
// Global singleton
export const exitPlanModeScanner = new ExitPlanModeScanner();
export default exitPlanModeScanner;
//# sourceMappingURL=exit-plan-mode-scanner.js.map