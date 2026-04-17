// @ts-nocheck
class TempfileUtils {
    tempfiles = new Map();
    tempDir = '/tmp'; // Default temp directory
    counter = 0;
    cleanupIntervalId = null;
    config = {
        autoDelete: true,
        cleanupIntervalMs: 60000 // 1 minute
    };
    /**
     * Generate temp file path
     */
    generate(options) {
        const prefix = options?.prefix ?? 'temp';
        const suffix = options?.suffix ?? '';
        const extension = options?.extension ?? '';
        const dir = options?.dir ?? this.tempDir;
        const autoDelete = options?.autoDelete ?? this.config.autoDelete;
        const timestamp = Date.now();
        const id = ++this.counter;
        const random = Math.random().toString(36).slice(2, 8);
        const filename = `${prefix}-${timestamp}-${id}-${random}${suffix}${extension}`;
        const path = `${dir}/${filename}`;
        // Track tempfile
        this.tempfiles.set(path, {
            path,
            createdAt: Date.now(),
            autoDelete,
            deleted: false
        });
        // Start cleanup interval
        this.ensureCleanupInterval();
        return path;
    }
    /**
     * Generate temp directory path
     */
    generateDir(options) {
        const prefix = options?.prefix ?? 'tempdir';
        const dir = options?.dir ?? this.tempDir;
        const timestamp = Date.now();
        const id = ++this.counter;
        const random = Math.random().toString(36).slice(2, 8);
        const dirname = `${prefix}-${timestamp}-${id}-${random}`;
        const path = `${dir}/${dirname}`;
        return path;
    }
    /**
     * Mark tempfile as deleted
     */
    markDeleted(path) {
        const entry = this.tempfiles.get(path);
        if (!entry)
            return false;
        entry.deleted = true;
        return true;
    }
    /**
     * Cleanup auto-delete tempfiles
     */
    cleanup() {
        let cleaned = 0;
        for (const [path, entry] of this.tempfiles) {
            if (entry.autoDelete && !entry.deleted) {
                // Would delete actual file
                // For demo, just mark as deleted
                entry.deleted = true;
                cleaned++;
            }
        }
        // Remove deleted entries from tracking
        for (const [path, entry] of this.tempfiles) {
            if (entry.deleted) {
                this.tempfiles.delete(path);
            }
        }
        return cleaned;
    }
    /**
     * Ensure cleanup interval is running
     */
    ensureCleanupInterval() {
        if (this.cleanupIntervalId)
            return;
        this.cleanupIntervalId = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupIntervalMs);
        // Unref to not block exit
        if (typeof this.cleanupIntervalId.unref === 'function') {
            this.cleanupIntervalId.unref();
        }
    }
    /**
     * Get tempfiles count
     */
    getCount() {
        return this.tempfiles.size;
    }
    /**
     * Get active (not deleted) tempfiles
     */
    getActive() {
        return Array.from(this.tempfiles.values())
            .filter(e => !e.deleted)
            .map(e => e.path);
    }
    /**
     * Set temp directory
     */
    setTempDir(dir) {
        this.tempDir = dir;
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
        if (this.cleanupIntervalId) {
            clearInterval(this.cleanupIntervalId);
            this.cleanupIntervalId = null;
        }
        this.tempfiles.clear();
        this.counter = 0;
    }
}
// Global singleton
export const tempfileUtils = new TempfileUtils();
export default tempfileUtils;
//# sourceMappingURL=tempfile-utils.js.map