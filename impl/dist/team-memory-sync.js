// @ts-nocheck
class TeamMemorySync {
    memories = new Map();
    syncIntervalMs = 60 * 1000; // 1 minute
    lastSyncTime = 0;
    isSyncing = false;
    /**
     * Initialize team memory
     */
    initialize(teamId) {
        if (this.memories.has(teamId)) {
            return this.memories.get(teamId);
        }
        const memory = {
            teamId,
            entries: [],
            lastSync: 0,
            version: 1
        };
        this.memories.set(teamId, memory);
        return memory;
    }
    /**
     * Add memory entry
     */
    addEntry(teamId, key, value, author) {
        const memory = this.memories.get(teamId);
        if (!memory) {
            throw new Error(`Team ${teamId} not initialized`);
        }
        // Check for existing entry
        const existing = memory.entries.find(e => e.key === key);
        if (existing) {
            // Update existing
            existing.value = value;
            existing.author = author;
            existing.timestamp = Date.now();
            existing.version++;
        }
        else {
            // Create new
            const entry = {
                id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                key,
                value,
                author,
                timestamp: Date.now(),
                version: 1
            };
            memory.entries.push(entry);
        }
        memory.version++;
        return memory.entries.find(e => e.key === key);
    }
    /**
     * Get memory entry
     */
    getEntry(teamId, key) {
        const memory = this.memories.get(teamId);
        if (!memory)
            return undefined;
        return memory.entries.find(e => e.key === key);
    }
    /**
     * Delete memory entry
     */
    deleteEntry(teamId, key) {
        const memory = this.memories.get(teamId);
        if (!memory)
            return false;
        const index = memory.entries.findIndex(e => e.key === key);
        if (index < 0)
            return false;
        memory.entries.splice(index, 1);
        memory.version++;
        return true;
    }
    /**
     * Sync team memory
     */
    async sync(teamId) {
        if (this.isSyncing)
            return;
        this.isSyncing = true;
        try {
            const memory = this.memories.get(teamId);
            if (!memory)
                return;
            // Would sync with remote storage
            // For demo, just update timestamp
            memory.lastSync = Date.now();
            this.lastSyncTime = Date.now();
        }
        finally {
            this.isSyncing = false;
        }
    }
    /**
     * Merge memories (conflict resolution)
     */
    merge(teamId, remoteEntries) {
        const memory = this.memories.get(teamId);
        if (!memory)
            return;
        for (const remote of remoteEntries) {
            const local = memory.entries.find(e => e.key === remote.key);
            if (!local) {
                // Add remote entry
                memory.entries.push(remote);
            }
            else if (remote.version > local.version) {
                // Use remote version (higher version wins)
                local.value = remote.value;
                local.author = remote.author;
                local.timestamp = remote.timestamp;
                local.version = remote.version;
            }
            // If local version >= remote, keep local
        }
        memory.version++;
    }
    /**
     * Get all entries for team
     */
    getAllEntries(teamId) {
        const memory = this.memories.get(teamId);
        if (!memory)
            return [];
        return [...memory.entries];
    }
    /**
     * Get team memory stats
     */
    getStats(teamId) {
        const memory = this.memories.get(teamId);
        if (!memory) {
            return { entryCount: 0, lastSync: 0, version: 0 };
        }
        return {
            entryCount: memory.entries.length,
            lastSync: memory.lastSync,
            version: memory.version
        };
    }
    /**
     * Set sync interval
     */
    setSyncInterval(ms) {
        this.syncIntervalMs = ms;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.memories.clear();
        this.lastSyncTime = 0;
        this.isSyncing = false;
    }
}
// Global singleton
export const teamMemorySync = new TeamMemorySync();
export default teamMemorySync;
//# sourceMappingURL=team-memory-sync.js.map