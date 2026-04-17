// @ts-nocheck
class FileHistory {
    histories = new Map();
    versionCounter = 0;
    maxVersions = 50;
    /**
     * Track file
     */
    track(path, content) {
        const existing = this.histories.get(path);
        const version = {
            version: existing ? existing.currentVersion + 1 : 1,
            content,
            timestamp: Date.now(),
            size: content.length,
            checksum: this.hash(content)
        };
        const entry = {
            path,
            versions: existing ? [...existing.versions, version] : [version],
            currentVersion: version.version
        };
        // Trim old versions
        while (entry.versions.length > this.maxVersions) {
            entry.versions.shift();
        }
        this.histories.set(path, entry);
        this.versionCounter++;
        return version;
    }
    /**
     * Get history
     */
    getHistory(path) {
        return this.histories.get(path);
    }
    /**
     * Get version
     */
    getVersion(path, version) {
        const history = this.histories.get(path);
        if (!history)
            return undefined;
        return history.versions.find(v => v.version === version);
    }
    /**
     * Get current version
     */
    getCurrent(path) {
        const history = this.histories.get(path);
        if (!history)
            return undefined;
        return history.versions[history.versions.length - 1];
    }
    /**
     * Rollback to version
     */
    rollback(path, version) {
        const v = this.getVersion(path, version);
        if (!v)
            return null;
        const history = this.histories.get(path);
        if (history) {
            history.currentVersion = version;
        }
        return v.content;
    }
    /**
     * Get diff between versions
     */
    getDiff(path, versionA, versionB) {
        const a = this.getVersion(path, versionA);
        const b = this.getVersion(path, versionB);
        if (!a || !b)
            return 'Versions not found';
        // Would use actual diff algorithm
        // For demo, return simple comparison
        return `Diff between v${versionA} and v${versionB}: ${a.size} -> ${b.size} bytes`;
    }
    /**
     * Hash content
     */
    hash(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            hash = ((hash << 5) - hash) + content.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
    /**
     * Clear history for file
     */
    clearFile(path) {
        return this.histories.delete(path);
    }
    /**
     * Clear all
     */
    clearAll() {
        this.histories.clear();
        this.versionCounter = 0;
    }
    /**
     * Get stats
     */
    getStats() {
        const filesTracked = this.histories.size;
        const totalVersions = Array.from(this.histories.values())
            .reduce((sum, h) => sum + h.versions.length, 0);
        return { filesTracked, totalVersions, maxVersions: this.maxVersions };
    }
    /**
     * Set max versions
     */
    setMaxVersions(max) {
        this.maxVersions = max;
        // Trim existing histories
        for (const entry of this.histories.values()) {
            while (entry.versions.length > max) {
                entry.versions.shift();
            }
        }
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearAll();
        this.maxVersions = 50;
    }
}
// Global singleton
export const fileHistory = new FileHistory();
export default fileHistory;
//# sourceMappingURL=file-history.js.map