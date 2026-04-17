// @ts-nocheck
/**
 * Parse exporter types from env string
 * Per OTEL spec, "none" means no automatically configured exporter
 */
export function parseExporterTypes(value) {
    return (value || '')
        .trim()
        .split(',')
        .filter(Boolean)
        .map(t => t.trim())
        .filter(t => t !== 'none'); // Exclude 'none' per spec
}
/**
 * Lazy import OTLP exporter by protocol
 * Avoids loading ~700KB grpc-js when not needed
 */
async function lazyImportExporter(protocol, config) {
    switch (protocol) {
        case 'grpc': {
            // Lazy import: ~700KB grpc-js
            // Dynamic import only when actually needed
            console.log('[OTLP] Lazy importing grpc exporter (~700KB)');
            // In production: return await import('@opentelemetry/exporter-trace-otlp-grpc')
            // Mock for demo
            return { type: 'OTLPTraceExporter-grpc', ...config };
        }
        case 'http/json': {
            // Smaller footprint
            console.log('[OTLP] Lazy importing http/json exporter');
            // In production: return await import('@opentelemetry/exporter-trace-otlp-http')
            return { type: 'OTLPTraceExporter-http-json', ...config };
        }
        case 'http/protobuf': {
            // Most efficient for production
            console.log('[OTLP] Lazy importing http/protobuf exporter');
            // In production: return await import('@opentelemetry/exporter-trace-otlp-proto')
            return { type: 'OTLPTraceExporter-http-protobuf', ...config };
        }
        default:
            throw new Error(`Unknown OTLP protocol: ${protocol}`);
    }
}
/**
 * Get exporters based on env config
 * Dynamically imports only needed exporters
 */
async function getExporters(exporterTypes, protocol) {
    const exporters = [];
    for (const type of exporterTypes) {
        if (type === 'console') {
            // Console exporter always available (no import needed)
            exporters.push({ type: 'ConsoleExporter' });
        }
        else if (type === 'otlp') {
            const exporter = await lazyImportExporter(protocol ?? 'http/protobuf');
            exporters.push(exporter);
        }
        else if (type === 'prometheus') {
            // Lazy import Prometheus exporter
            console.log('[OTLP] Lazy importing prometheus exporter');
            // In production: await import('@opentelemetry/exporter-prometheus')
            exporters.push({ type: 'PrometheusExporter' });
        }
    }
    return exporters;
}
/**
 * OTLP Lazy Import Manager
 */
class OTLPLazyImporter {
    exportersLoaded = false;
    loadedExporters = [];
    /**
     * Initialize exporters from environment
     */
    async initialize() {
        if (this.exportersLoaded)
            return;
        const exporterTypes = parseExporterTypes(process.env.OTEL_TRACES_EXPORTER);
        const protocol = process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL;
        if (exporterTypes.length === 0) {
            console.log('[OTLP] No exporters configured');
            return;
        }
        console.log(`[OTLP] Loading exporters: ${exporterTypes.join(', ')}`);
        this.loadedExporters = await getExporters(exporterTypes, protocol);
        this.exportersLoaded = true;
        const savingsEstimate = this.estimateSizeSavings(exporterTypes, protocol);
        console.log(`[OTLP] Estimated bundle savings: ${savingsEstimate}KB`);
    }
    /**
     * Estimate bundle size savings from lazy imports
     */
    estimateSizeSavings(types, protocol) {
        let saved = 0;
        // If not using grpc, saved ~700KB
        if (!types.includes('otlp') || protocol !== 'grpc') {
            saved += 700;
        }
        // If not using prometheus, saved ~150KB
        if (!types.includes('prometheus')) {
            saved += 150;
        }
        // If using http/protobuf instead of grpc, additional savings
        if (protocol === 'http/protobuf' || protocol === 'http/json') {
            saved += 200;
        }
        return saved;
    }
    /**
     * Get loaded exporters
     */
    getExporters() {
        return [...this.loadedExporters];
    }
    /**
     * Check if initialized
     */
    isInitialized() {
        return this.exportersLoaded;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.exportersLoaded = false;
        this.loadedExporters = [];
    }
}
// Global singleton
export const otlpLazyImporter = new OTLPLazyImporter();
export default otlpLazyImporter;
//# sourceMappingURL=telemetry-import.js.map