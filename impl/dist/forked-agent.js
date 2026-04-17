/**
 * Forked Agent helper for running subagent query loops with cache sharing.
 *
 * Adapted from Claude Code's utils/forkedAgent.ts for OpenClaw integration.
 * Key concepts:
 * 1. Share identical cache-critical params with parent for prompt cache hits
 * 2. Track full usage metrics across query loop
 * 3. Isolate mutable state to prevent interference with main agent
 */
import { randomUUID } from 'crypto';
// Slot for last cache-safe params (for post-turn forks)
let lastCacheSafeParams = null;
export function saveCacheSafeParams(params) {
    lastCacheSafeParams = params;
}
export function getLastCacheSafeParams() {
    return lastCacheSafeParams;
}
/**
 * Creates CacheSafeParams from a context object.
 */
export function createCacheSafeParams(context) {
    return {
        systemPrompt: context.systemPrompt,
        userContext: context.userContext,
        systemContext: context.systemContext,
        model: context.model,
        forkContextMessages: context.messages,
    };
}
/**
 * Creates an isolated context for subagents.
 * By default, ALL mutable state is isolated to prevent interference.
 */
export function createSubagentContext(parentContext, overrides) {
    // In OpenClaw, we create a fresh context with overrides
    return {
        ...parentContext,
        ...overrides,
        // Isolate mutable state
        readFileState: new Map(),
        nestedMemoryAttachmentTriggers: new Set(),
        loadedNestedMemoryPaths: new Set(),
        toolDecisions: undefined,
        // New abort controller linked to parent
        abortController: new AbortController(),
        // Generate new query tracking
        queryTracking: {
            chainId: randomUUID(),
            depth: 0,
        },
    };
}
/**
 * Runs a forked agent query loop with cache sharing.
 *
 * In OpenClaw, this would integrate with sessions_spawn (subagent API).
 * This is a simplified version for background tasks like AutoDream.
 */
export async function runForkedAgent(config) {
    const startTime = Date.now();
    const outputMessages = [];
    const totalUsage = {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
    };
    // For OpenClaw integration, we would use sessions_spawn here
    // For now, return placeholder structure
    console.log(`[ForkedAgent] Starting: ${config.forkLabel}`);
    // Placeholder: would call OpenClaw subagent API
    // const result = await sessions_spawn({ ... })
    const durationMs = Date.now() - startTime;
    // Log fork query metrics
    logForkAgentQueryEvent({
        forkLabel: config.forkLabel,
        querySource: config.querySource,
        durationMs,
        messageCount: outputMessages.length,
        totalUsage,
    });
    return {
        messages: outputMessages,
        totalUsage,
    };
}
/**
 * Logs fork agent query event.
 */
function logForkAgentQueryEvent(data) {
    const totalInputTokens = data.totalUsage.input_tokens +
        data.totalUsage.cache_creation_input_tokens +
        data.totalUsage.cache_read_input_tokens;
    const cacheHitRate = totalInputTokens > 0
        ? data.totalUsage.cache_read_input_tokens / totalInputTokens
        : 0;
    console.log(`[ForkedAgent] ${data.forkLabel}: duration=${data.durationMs}ms, messages=${data.messageCount}, cacheHitRate=${cacheHitRate.toFixed(2)}`);
}
/**
 * Extract result text from agent messages.
 */
export function extractResultText(messages, defaultText = 'Execution completed') {
    // Placeholder: would extract from last assistant message
    return defaultText;
}
//# sourceMappingURL=forked-agent.js.map