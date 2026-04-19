# OTLP Exporter Lazy Import Pattern

## Source
Claude Code: `utils/telemetry/instrumentation.ts` (getOtlpReaders, parseExporterTypes)

## Pattern
Dynamic import for OTLP exporters by protocol + none exclusion + console resource attrs.

## Code Example
```typescript
/**
 * Per OTEL spec, "none" means no automatically configured exporter.
 * https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/
 */
export function parseExporterTypes(value: string | undefined): string[] {
  return (value || '')
    .trim()
    .split(',')
    .filter(Boolean)
    .map(t => t.trim())
    .filter(t => t !== 'none')  // Exclude 'none'
}

async function getOtlpReaders() {
  const exporterTypes = parseExporterTypes(process.env.OTEL_METRICS_EXPORTER)

  const exporters = []

  for (const exporterType of exporterTypes) {
    if (exporterType === 'console') {
      const consoleExporter = new ConsoleMetricExporter()

      // Custom: show resource attributes
      const originalExport = consoleExporter.export.bind(consoleExporter)
      consoleExporter.export = (metrics, callback) => {
        if (metrics.resource?.attributes) {
          logForDebugging('\n=== Resource Attributes ===')
          logForDebugging(jsonStringify(metrics.resource.attributes))
          logForDebugging('===========================\n')
        }
        return originalExport(metrics, callback)
      }
      exporters.push(consoleExporter)
    } else if (exporterType === 'otlp') {
      const protocol =
        process.env.OTEL_EXPORTER_OTLP_METRICS_PROTOCOL?.trim() ||
        process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim()

      const httpConfig = getOTLPExporterConfig()

      switch (protocol) {
        case 'grpc': {
          // Lazy-import ~700KB grpc-js
          const { OTLPMetricExporter } = await import(
            '@opentelemetry/exporter-metrics-otlp-grpc'
          )
          exporters.push(new OTLPMetricExporter())
          break
        }
        case 'http/json': {
          const { OTLPMetricExporter } = await import(
            '@opentelemetry/exporter-metrics-otlp-http'
          )
          exporters.push(new OTLPMetricExporter(httpConfig))
          break
        }
        case 'http/protobuf': {
          const { OTLPMetricExporter } = await import(
            '@opentelemetry/exporter-metrics-otlp-proto'
          )
          exporters.push(new OTLPMetricExporter(httpConfig))
          break
        }
        default:
          throw new Error(`Unknown protocol: ${protocol}`)
      }
    } else if (exporterType === 'prometheus') {
      const { PrometheusExporter } = await import(
        '@opentelemetry/exporter-prometheus'
      )
      exporters.push(new PrometheusExporter())
    }
  }

  return exporters
}

// Why lazy import?
// - @grpc/grpc-js is ~700KB
// - Process uses at most ONE protocol variant per signal
// - Static imports would load ALL 6 exporters (~1.2MB) on every startup
```

## Key Concepts
1. **parseExporterTypes**: Split by comma + filter 'none' + trim
2. **Lazy Import**: Dynamic await import() for protocol-specific exporters
3. **Protocol Selection**: grpc, http/json, http/protobuf variants
4. **Console Resource Attributes**: Custom export wrapper logs resource attrs
5. **Size Savings**: ~1.2MB avoided by loading only one protocol

## Benefits
- Smaller startup bundle
- Only needed exporter loaded
- Console exporter enhanced with resource attrs

## When to Use
- OTLP exporter configuration
- Dynamic module loading for size optimization
- OTEL protocol selection

## Related Patterns
- Feature Conditional Import (feature-conditional-import)
- OTel Instrumentation Bootstrap (instrumentation.ts)
- Settings Dynamic Import (settings.ts)