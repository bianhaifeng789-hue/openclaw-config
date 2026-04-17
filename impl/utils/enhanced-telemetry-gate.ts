// @ts-nocheck

/**
 * Enhanced Telemetry Feature Gate Pattern - 遥测特性门控
 * 
 * Source: Claude Code utils/telemetry/instrumentation.ts
 * Pattern: env override > ant build > GrowthBook gate + fallback chain
 */

type FeatureGateStatus = 'enabled' | 'disabled' | 'forced' | 'fallback'

interface FeatureGateResult {
  enabled: boolean
  status: FeatureGateStatus
  source: 'env' | 'build' | 'growthbook' | 'fallback'
  reason?: string
}

interface GrowthBookConfig {
  apiKey?: string
  host?: string
  attributes?: Record<string, string | number | boolean>
}

class EnhancedTelemetryGate {
  private growthbookConfig: GrowthBookConfig = {}
  private gateCache = new Map<string, FeatureGateResult>()
  private cacheExpiryMs = 5 * 60 * 1000 // 5 minutes

  /**
   * Check if enhanced telemetry is enabled
   * Priority: env override > ant build > GrowthBook > fallback
   */
  async checkEnhancedTelemetry(): Promise<FeatureGateResult> {
    const cacheKey = 'enhanced_telemetry'
    const cached = this.gateCache.get(cacheKey)

    if (cached) {
      return cached
    }

    // Priority 1: Environment override
    const envOverride = this.checkEnvOverride()
    if (envOverride) {
      const result = {
        enabled: envOverride.enabled,
        status: 'forced' as FeatureGateStatus,
        source: 'env' as const,
        reason: envOverride.reason
      }
      this.gateCache.set(cacheKey, result)
      return result
    }

    // Priority 2: Ant build flag
    const buildFlag = this.checkBuildFlag()
    if (buildFlag !== undefined) {
      const result = {
        enabled: buildFlag,
        status: 'forced' as FeatureGateStatus,
        source: 'build' as const,
        reason: 'Build flag detected'
      }
      this.gateCache.set(cacheKey, result)
      return result
    }

    // Priority 3: GrowthBook gate
    const growthbookResult = await this.checkGrowthBookGate('enhanced_telemetry')
    if (growthbookResult) {
      this.gateCache.set(cacheKey, growthbookResult)
      return growthbookResult
    }

    // Priority 4: Fallback (disabled by default)
    const result = {
      enabled: false,
      status: 'fallback' as FeatureGateStatus,
      source: 'fallback' as const,
      reason: 'No gate configuration found'
    }
    this.gateCache.set(cacheKey, result)
    return result
  }

  /**
   * Check environment override
   */
  private checkEnvOverride(): { enabled: boolean; reason: string } | null {
    const envValue = process.env.OPENCLAW_ENHANCED_TELEMETRY

    if (envValue === 'true' || envValue === '1') {
      return { enabled: true, reason: 'OPENCLAW_ENHANCED_TELEMETRY=true' }
    }

    if (envValue === 'false' || envValue === '0') {
      return { enabled: false, reason: 'OPENCLAW_ENHANCED_TELEMETRY=false' }
    }

    return null
  }

  /**
   * Check ant build flag
   */
  private checkBuildFlag(): boolean | undefined {
    // Would check build metadata
    // For now, return undefined
    return undefined
  }

  /**
   * Check GrowthBook gate
   */
  private async checkGrowthBookGate(featureKey: string): Promise<FeatureGateResult | null> {
    if (!this.growthbookConfig.apiKey) {
      return null
    }

    try {
      // Would call GrowthBook API
      // For now, return fallback
      return {
        enabled: false,
        status: 'disabled',
        source: 'growthbook',
        reason: 'Feature not enabled in GrowthBook'
      }
    } catch (error) {
      console.warn(`[FeatureGate] GrowthBook error: ${error}`)
      return null
    }
  }

  /**
   * Set GrowthBook config
   */
  setGrowthBookConfig(config: GrowthBookConfig): void {
    this.growthbookConfig = config
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.gateCache.clear()
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.gateCache.size,
      keys: Array.from(this.gateCache.keys())
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.growthbookConfig = {}
    this.gateCache.clear()
  }
}

// Global singleton
export const enhancedTelemetryGate = new EnhancedTelemetryGate()

export default enhancedTelemetryGate