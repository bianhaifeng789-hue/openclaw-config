// @ts-nocheck
class ToolSchemaCache {
    schemaCache = new Map();
    hashCache = new Map(); // schema string → hash
    config = {
        maxSize: 50,
        ttlMs: 30 * 60 * 1000 // 30 minutes
    };
    /**
     * Cache tool schema
     */
    cacheSchema(toolName, schema) {
        const schemaHash = this.hashSchema(schema);
        this.ensureCapacity();
        this.schemaCache.set(toolName, {
            toolName,
            schema,
            schemaHash,
            cachedAt: Date.now(),
            hits: 0
        });
    }
    /**
     * Get cached schema
     */
    getSchema(toolName) {
        const cached = this.schemaCache.get(toolName);
        if (!cached)
            return undefined;
        // Check TTL
        if (Date.now() - cached.cachedAt > this.config.ttlMs) {
            this.schemaCache.delete(toolName);
            return undefined;
        }
        cached.hits++;
        return cached.schema;
    }
    /**
     * Hash schema for comparison
     */
    hashSchema(schema) {
        const schemaString = JSON.stringify(schema);
        // Check hash cache
        if (this.hashCache.has(schemaString)) {
            return this.hashCache.get(schemaString);
        }
        // Compute hash
        const hash = this.simpleHash(schemaString);
        this.hashCache.set(schemaString, hash);
        return hash;
    }
    /**
     * Simple hash function
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `schema-${hash.toString(16)}`;
    }
    /**
     * Compare schemas by hash
     */
    compareSchemas(schema1, schema2) {
        return this.hashSchema(schema1) === this.hashSchema(schema2);
    }
    /**
     * Invalidate tool schema
     */
    invalidate(toolName) {
        return this.schemaCache.delete(toolName);
    }
    /**
     * Invalidate all schemas
     */
    invalidateAll() {
        this.schemaCache.clear();
        this.hashCache.clear();
    }
    /**
     * Ensure capacity
     */
    ensureCapacity() {
        if (this.schemaCache.size >= this.config.maxSize) {
            // Evict lowest-hit
            let lowestKey = null;
            let lowestHits = Infinity;
            for (const [key, entry] of this.schemaCache) {
                if (entry.hits < lowestHits) {
                    lowestHits = entry.hits;
                    lowestKey = key;
                }
            }
            if (lowestKey) {
                this.schemaCache.delete(lowestKey);
            }
        }
    }
    /**
     * Get stats
     */
    getStats() {
        let totalHits = 0;
        for (const entry of this.schemaCache.values()) {
            totalHits += entry.hits;
        }
        return {
            schemaCacheSize: this.schemaCache.size,
            hashCacheSize: this.hashCache.size,
            totalHits,
            maxSize: this.config.maxSize
        };
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
        this.schemaCache.clear();
        this.hashCache.clear();
    }
}
// Global singleton
export const toolSchemaCache = new ToolSchemaCache();
export default toolSchemaCache;
//# sourceMappingURL=tool-schema-cache.js.map