// @ts-nocheck
class SessionStorageUtils {
    sessions = new Map();
    storagePath = '/tmp/sessions';
    maxSessionSize = 1024 * 1024; // 1MB
    compressionThreshold = 10240; // 10KB
    /**
     * Save session data
     */
    save(id, data) {
        const serialized = JSON.stringify(data);
        const size = serialized.length;
        if (size > this.maxSessionSize) {
            throw new Error(`Session data too large: ${size} bytes`);
        }
        const session = {
            id,
            data,
            createdAt: this.sessions.get(id)?.createdAt ?? Date.now(),
            updatedAt: Date.now(),
            size
        };
        this.sessions.set(id, session);
        return session;
    }
    /**
     * Load session data
     */
    load(id) {
        const session = this.sessions.get(id);
        if (!session)
            return undefined;
        return session.data;
    }
    /**
     * Delete session data
     */
    delete(id) {
        return this.sessions.delete(id);
    }
    /**
     * Check if session exists
     */
    exists(id) {
        return this.sessions.has(id);
    }
    /**
     * Export session to portable format
     */
    exportPortable(id) {
        const session = this.sessions.get(id);
        if (!session)
            return null;
        const portable = {
            version: 1,
            id: session.id,
            data: session.data,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        };
        const serialized = JSON.stringify(portable);
        // Would compress if over threshold
        // For demo, just return serialized
        return serialized;
    }
    /**
     * Import session from portable format
     */
    importPortable(portableStr) {
        const portable = JSON.parse(portableStr);
        // Validate format
        if (!portable.version || !portable.id || !portable.data) {
            throw new Error('Invalid portable format');
        }
        const session = {
            id: portable.id,
            data: portable.data,
            createdAt: portable.createdAt ?? Date.now(),
            updatedAt: portable.updatedAt ?? Date.now(),
            size: portableStr.length
        };
        this.sessions.set(session.id, session);
        return session;
    }
    /**
     * Get session metadata
     */
    getMetadata(id) {
        const session = this.sessions.get(id);
        if (!session)
            return undefined;
        return {
            ...session,
            data: {} // Exclude actual data
        };
    }
    /**
     * Get all session IDs
     */
    getAllIds() {
        return Array.from(this.sessions.keys());
    }
    /**
     * Get storage stats
     */
    getStats() {
        const sessions = Array.from(this.sessions.values());
        const totalSize = sessions.reduce((sum, s) => sum + s.size, 0);
        return {
            totalSessions: sessions.length,
            totalSize,
            averageSize: sessions.length > 0 ? totalSize / sessions.length : 0,
            maxSessionSize: this.maxSessionSize
        };
    }
    /**
     * Clear all sessions
     */
    clear() {
        this.sessions.clear();
    }
    /**
     * Set storage path
     */
    setStoragePath(path) {
        this.storagePath = path;
    }
    /**
     * Set max session size
     */
    setMaxSessionSize(size) {
        this.maxSessionSize = size;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.sessions.clear();
        this.storagePath = '/tmp/sessions';
        this.maxSessionSize = 1024 * 1024;
        this.compressionThreshold = 10240;
    }
}
// Global singleton
export const sessionStorageUtils = new SessionStorageUtils();
export default sessionStorageUtils;
//# sourceMappingURL=session-storage-utils.js.map