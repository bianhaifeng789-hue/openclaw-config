// @ts-nocheck
class ThreePhaseBackup {
    backups = new Map();
    activeBackup = null;
    backupCounter = 0;
    config = {
        maxBackups: 10,
        validateBeforeCommit: true,
        autoRotate: true
    };
    /**
     * Phase 1: Create backup
     */
    createBackup(content) {
        const id = `backup-${++this.backupCounter}-${Date.now()}`;
        const entry = {
            id,
            phase: 'created',
            content: this.deepClone(content),
            createdAt: Date.now()
        };
        this.backups.set(id, entry);
        this.activeBackup = entry;
        // Rotate old backups
        if (this.config.autoRotate) {
            this.rotateBackups();
        }
        return id;
    }
    /**
     * Phase 2: Validate backup
     */
    validateBackup(backupId) {
        const entry = this.backups.get(backupId);
        if (!entry || entry.phase !== 'created') {
            return false;
        }
        // Validate content
        const isValid = this.validateContent(entry.content);
        if (isValid) {
            entry.phase = 'validated';
            entry.validatedAt = Date.now();
            return true;
        }
        else {
            // Invalid: rollback
            this.rollbackBackup(backupId, 'Validation failed');
            return false;
        }
    }
    /**
     * Phase 3: Commit backup
     */
    commitBackup(backupId) {
        const entry = this.backups.get(backupId);
        if (!entry)
            return false;
        // Must be validated first (if configured)
        if (this.config.validateBeforeCommit && entry.phase !== 'validated') {
            this.rollbackBackup(backupId, 'Not validated');
            return false;
        }
        // Commit
        entry.phase = 'committed';
        entry.committedAt = Date.now();
        // Clear active backup
        if (this.activeBackup?.id === backupId) {
            this.activeBackup = null;
        }
        return true;
    }
    /**
     * Rollback backup
     */
    rollbackBackup(backupId, reason) {
        const entry = this.backups.get(backupId);
        if (!entry)
            return false;
        entry.phase = 'rolledback';
        entry.rolledbackAt = Date.now();
        entry.error = reason;
        // Clear active backup
        if (this.activeBackup?.id === backupId) {
            this.activeBackup = null;
        }
        return true;
    }
    /**
     * Restore from backup
     */
    restoreFromBackup(backupId) {
        const entry = this.backups.get(backupId);
        if (!entry || entry.phase !== 'committed') {
            return null;
        }
        return this.deepClone(entry.content);
    }
    /**
     * Validate content (mock)
     */
    validateContent(content) {
        // Would do actual validation
        // For now, check if non-empty
        return Object.keys(content).length > 0;
    }
    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    /**
     * Rotate backups (keep last N)
     */
    rotateBackups() {
        if (this.backups.size <= this.config.maxBackups)
            return;
        // Find oldest to remove
        const entries = Array.from(this.backups.values())
            .filter(e => e.phase === 'committed')
            .sort((a, b) => a.createdAt - b.createdAt);
        // Remove oldest
        const toRemove = entries.slice(0, entries.length - this.config.maxBackups);
        for (const entry of toRemove) {
            this.backups.delete(entry.id);
        }
    }
    /**
     * Get backup by ID
     */
    getBackup(backupId) {
        return this.backups.get(backupId);
    }
    /**
     * Get active backup
     */
    getActiveBackup() {
        return this.activeBackup;
    }
    /**
     * Get committed backups
     */
    getCommittedBackups() {
        return Array.from(this.backups.values())
            .filter(e => e.phase === 'committed')
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    /**
     * Get stats
     */
    getStats() {
        let created = 0, validated = 0, committed = 0, rolledback = 0;
        for (const entry of this.backups.values()) {
            if (entry.phase === 'created')
                created++;
            else if (entry.phase === 'validated')
                validated++;
            else if (entry.phase === 'committed')
                committed++;
            else
                rolledback++;
        }
        return { total: this.backups.size, created, validated, committed, rolledback };
    }
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.backups.clear();
        this.activeBackup = null;
        this.backupCounter = 0;
    }
}
// Global singleton
export const threePhaseBackup = new ThreePhaseBackup();
export default threePhaseBackup;
//# sourceMappingURL=three-phase-backup.js.map