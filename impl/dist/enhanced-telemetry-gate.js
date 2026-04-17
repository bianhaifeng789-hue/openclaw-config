// @ts-nocheck
class EnhancedTelemetryGate {
    growthbookConfig = {};
    gateCache = new Map();
    cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
    /**
     * Check if enhanced telemetry is enabled
     * Priority: env override > ant build > GrowthBook > fallback
     */
    async checkEnhancedTelemetry() {
        const cacheKey = 'enhanced_telemetry';
        const cached = this.gateCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        // Priority 1: Environment override
        const envOverride = this.checkEnvOverride();
        if (envOverride) {
            const result = {
                enabled: envOverride.enabled,
                status: 'forced',
                source: 'env',
                reason: envOverride.reason
            };
            this.gateCache.set(cacheKey, result);
            return result;
        }
        // Priority 2: Ant build flag
        const buildFlag = this.checkBuildFlag();
        if (buildFlag !== undefined) {
            const result = {
                enabled: buildFlag,
                status: 'forced',
                source: 'build',
                reason: 'Build flag detected'
            };
            this.gateCache.set(cacheKey, result);
            return result;
        }
        // Priority 3: GrowthBook gate
        const growthbookResult = await this.checkGrowthBookGate('enhanced_telemetry');
        if (growthbookResult) {
            this.gateCache.set(cacheKey, growthbookResult);
            return growthbookResult;
        }
        // Priority 4: Fallback (disabled by default)
        const result = {
            enabled: false,
            status: 'fallback',
            source: 'fallback',
            reason: 'No gate configuration found'
        };
        this.gateCache.set(cacheKey, result);
        return result;
    }
    /**
     * Check environment override
     */
    checkEnvOverride() {
        const envValue = process.env.OPENCLAW_ENHANCED_TELEMETRY;
        if (envValue === 'true' || envValue === '1') {
            return { enabled: true, reason: 'OPENCLAW_ENHANCED_TELEMETRY=true' };
        }
        if (envValue === 'false' || envValue === '0') {
            return { enabled: false, reason: 'OPENCLAW_ENHANCED_TELEMETRY=false' };
        }
        return null;
    }
    /**
     * Check ant build flag
     */
    checkBuildFlag() {
        // Would check build metadata
        // For now, return undefined
        return undefined;
    }
    /**
     * Check GrowthBook gate
     */
    async checkGrowthBookGate(featureKey) {
        if (!this.growthbookConfig.apiKey) {
            return null;
        }
        try {
            // Would call GrowthBook API
            // For now, return fallback
            return {
                enabled: false,
                status: 'disabled',
                source: 'growthbook',
                reason: 'Feature not enabled in GrowthBook'
            };
        }
        catch (error) {
            console.warn(`[FeatureGate] GrowthBook error: ${error}`);
            return null;
        }
    }
    /**
     * Set GrowthBook config
     */
    setGrowthBookConfig(config) {
        this.growthbookConfig = config;
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.gateCache.clear();
    }
    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.gateCache.size,
            keys: Array.from(this.gateCache.keys())
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.growthbookConfig = {};
        this.gateCache.clear();
    }
}
// Global singleton
export const enhancedTelemetryGate = new EnhancedTelemetryGate();
export default enhancedTelemetryGate;
//# sourceMappingURL=enhanced-telemetry-gate.js.map