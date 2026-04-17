// @ts-nocheck
class UUIDUtilsService {
    generated = [];
    generateCounter = 0;
    /**
     * Generate v4 UUID
     */
    v4() {
        const uuid = this.generateV4();
        this.generated.push({ uuid, type: 'v4', createdAt: Date.now() });
        return uuid;
    }
    /**
     * Generate v4
     */
    generateV4() {
        const bytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
        // Version 4
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        // Variant
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        return this.formatUUID(bytes);
    }
    /**
     * Format UUID
     */
    formatUUID(bytes) {
        const hex = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'));
        return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
    }
    /**
     * Generate custom ID
     */
    custom(prefix, length) {
        const len = length ?? 8;
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = '';
        for (let i = 0; i < len; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        const uuid = prefix ? `${prefix}-${id}` : id;
        this.generated.push({ uuid, type: 'custom', createdAt: Date.now() });
        return uuid;
    }
    /**
     * Generate timestamp ID
     */
    timestamp(prefix) {
        const ts = Date.now().toString(36);
        const uuid = prefix ? `${prefix}-${ts}` : ts;
        this.generated.push({ uuid, type: 'v1', createdAt: Date.now() });
        return uuid;
    }
    /**
     * Validate UUID
     */
    isValid(uuid) {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return regex.test(uuid);
    }
    /**
     * Get generated
     */
    getGenerated() {
        return [...this.generated];
    }
    /**
     * Get recent
     */
    getRecent(count = 10) {
        return this.generated.slice(-count);
    }
    /**
     * Get stats
     */
    getStats() {
        const byType = { v4: 0, v1: 0, custom: 0 };
        for (const info of this.generated) {
            byType[info.type]++;
        }
        return {
            generatedCount: this.generated.length,
            byType
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.generated = [];
        this.generateCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const uuidUtilsService = new UUIDUtilsService();
export default uuidUtilsService;
//# sourceMappingURL=uuid-utils-service.js.map