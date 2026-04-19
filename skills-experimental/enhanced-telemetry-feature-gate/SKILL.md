# Enhanced Telemetry Feature Gate Pattern

## Source
Claude Code: `utils/telemetry/sessionTracing.ts` (isEnhancedTelemetryEnabled)

## Pattern
Feature gate check: env var override > ant build > GrowthBook gate.

## Code Example
```typescript
import { feature } from 'bun:bundle'
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook.js'

/**
 * Check if enhanced telemetry is enabled.
 * Priority: env var override > ant build > GrowthBook gate
 */
export function isEnhancedTelemetryEnabled(): boolean {
  if (feature('ENHANCED_TELEMETRY_BETA')) {
    const env =
      process.env.CLAUDE_CODE_ENHANCED_TELEMETRY_BETA ??
      process.env.ENABLE_ENHANCED_TELEMETRY_BETA

    // Env var override: explicit true/false
    if (isEnvTruthy(env)) {
      return true
    }
    if (isEnvDefinedFalsy(env)) {
      return false
    }

    // No env override - check ant build or GrowthBook
    return (
      process.env.USER_TYPE === 'ant' ||
      getFeatureValue_CACHED_MAY_BE_STALE('enhanced_telemetry_beta', false)
    )
  }
  return false  // Feature flag not in build
}

/**
 * Check if any tracing is enabled (standard OR beta)
 */
function isAnyTracingEnabled(): boolean {
  return isEnhancedTelemetryEnabled() || isBetaTracingEnabled()
}

// Priority order:
// 1. CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1 → true (explicit enable)
// 2. CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=0 → false (explicit disable)
// 3. USER_TYPE='ant' → true (ant build)
// 4. GrowthBook 'enhanced_telemetry_beta' → true/false (feature gate)
// 5. Else → false (feature not available)
```

## Key Concepts
1. **feature() Bundle Check**: ENHANCED_TELEMETRY_BETA feature flag existence
2. **Env Var Override**: CLAUDE_CODE_ENHANCED_TELEMETRY_BETA first, ENABLE_* fallback
3. **isEnvTruthy**: 1, true, yes, on → true
4. **isEnvDefinedFalsy**: 0, false, no, off → false (not undefined)
5. **USER_TYPE='ant'**: Ant build gets feature by default
6. **GrowthBook Cache**: getFeatureValue_CACHED_MAY_BE_STALE (async-safe)

## Benefits
- User can override feature gate
- Explicit disable prevents GrowthBook override
- Ant build default enable

## When to Use
- Feature gate implementation
- Env var override pattern
- Beta feature rollout

## Related Patterns
- Feature Conditional Import (feature-conditional-import)
- Growthbook Service (services/analytics/growthbook.ts)
- Env Truthy/Falsy Pattern (envUtils.ts)