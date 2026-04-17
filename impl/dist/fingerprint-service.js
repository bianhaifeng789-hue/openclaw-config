// @ts-nocheck
class FingerprintService {
    fingerprints = new Map();
    currentFingerprint = null;
    fingerprintCounter = 0;
    /**
     * Generate fingerprint
     */
    generate(components) {
        const id = `fp-${++this.fingerprintCounter}-${Date.now()}`;
        // Generate hash from components
        const hash = this.hashComponents(components);
        const fingerprint = {
            id,
            components,
            hash,
            createdAt: Date.now()
        };
        this.fingerprints.set(id, fingerprint);
        return fingerprint;
    }
    /**
     * Hash components
     */
    hashComponents(components) {
        const values = Object.entries(components)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('|');
        // Simple hash
        let hash = 0;
        for (let i = 0; i < values.length; i++) {
            hash = ((hash << 5) - hash) + values.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }
    /**
     * Generate device fingerprint
     */
    generateDevice() {
        const components = {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            hostname: 'unknown' // Would get actual hostname
        };
        this.currentFingerprint = this.generate(components);
        return this.currentFingerprint;
    }
    /**
     * Generate session fingerprint
     */
    generateSession(sessionId) {
        const components = {
            sessionId,
            timestamp: Date.now().toString(),
            random: Math.random().toString(36).slice(2, 8)
        };
        return this.generate(components);
    }
    /**
     * Verify fingerprint
     */
    verify(id, components) {
        const fingerprint = this.fingerprints.get(id);
        if (!fingerprint)
            return false;
        const newHash = this.hashComponents(components);
        return fingerprint.hash === newHash;
    }
    /**
     * Get fingerprint
     */
    getFingerprint(id) {
        return this.fingerprints.get(id);
    }
    /**
     * Get current fingerprint
     */
    getCurrent() {
        return this.currentFingerprint;
    }
    /**
     * Find by hash
     */
    findByHash(hash) {
        return Array.from(this.fingerprints.values())
            .filter(fp => fp.hash === hash);
    }
    /**
     * Get stats
     */
    getStats() {
        const fingerprints = Array.from(this.fingerprints.values());
        const uniqueHashes = new Set(fingerprints.map(fp => fp.hash)).size;
        const timestamps = fingerprints.map(fp => fp.createdAt);
        const oldest = timestamps.length > 0 ? Math.min(...timestamps) : null;
        const newest = timestamps.length > 0 ? Math.max(...timestamps) : null;
        return {
            totalFingerprints: fingerprints.length,
            uniqueHashes,
            oldest,
            newest
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.fingerprints.clear();
        this.currentFingerprint = null;
        this.fingerprintCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const fingerprintService = new FingerprintService();
export default fingerprintService;
//# sourceMappingURL=fingerprint-service.js.map