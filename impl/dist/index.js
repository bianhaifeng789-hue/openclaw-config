/**
 * Claude Code Patterns for OpenClaw
 *
 * Unified export of all Claude Code-inspired modules.
 *
 * High-priority features:
 * - AutoDream: Background memory consolidation
 * - SessionMemoryCompact: Memory compression protection
 * - ForkedAgentCache: Subagent cache sharing
 * - AgentSummary: Progress summaries (30s intervals)
 * - MagicDocs: Automatic documentation maintenance
 * - PromptSuggestion: Next step prediction
 */
// Core infrastructure
export * from './forked-agent.js';
export * from './consolidation-lock.js';
export * from './consolidation-prompt.js';
// AutoDream
export * from './auto-dream.js';
// SessionMemoryCompact
export * from './session-memory-compact.js';
// AgentSummary
export * from './agent-summary.js';
// MagicDocs
export * from './magic-docs.js';
// PromptSuggestion
export * from './prompt-suggestion.js';
// Feishu cards
export * from './feishu-cards.js';
// Integration entry point
export * from './openclaw-integration.js';
// HEARTBEAT executor
export * from './heartbeat-executor.js';
// New services (2026-04-13) - use named exports to avoid conflicts
export { mcpServerApprovalService } from './mcp-server-approval.js';
export { diagnosticTrackingService } from './diagnostic-tracking-service.js';
export { internalLoggingService } from './internal-logging-service.js';
export { rateLimitMessagesService } from './rate-limit-messages-service.js';
export { smartDispatcher, smartDispatch } from './smart-dispatcher.js';
export { serviceRegistry, autoEnableAll } from './service-registry.js';
export { taskTracker } from './task-tracker.js';
// Additional services (2026-04-13)
export { extractMemoriesService } from './extract-memories-service.js';
export { toolUseSummaryService } from './tool-use-summary-service.js';
export { feishuInteractionService } from './feishu-interaction-handler.js';
// Hooks services (2026-04-13)
export { taskListWatcherService } from './task-list-watcher-service.js';
export { backgroundTaskNavigationService } from './background-task-navigation-service.js';
export { inboxPollerService } from './inbox-poller-service.js';
export { scheduledTasksService } from './scheduled-tasks-service.js';
/**
 * Module metadata
 */
export const MODULE_INFO = {
    name: '@openclaw/claude-code-patterns',
    version: '0.1.0',
    features: [
        'AutoDream',
        'SessionMemoryCompact',
        'ForkedAgentCache',
        'AgentSummary',
        'MagicDocs',
        'PromptSuggestion',
        'FeishuCards',
        'MCPServerApproval',
        'DiagnosticTracking',
        'InternalLogging',
        'RateLimitMessages',
        'SmartDispatcher',
        'ServiceRegistry',
        'TaskTracker',
    ],
    description: 'Claude Code patterns adapted for OpenClaw integration',
    author: 'OpenClaw',
    license: 'MIT',
};
/**
 * Quick feature check
 */
export function isFeatureEnabled(feature) {
    const featureMap = {
        autoDream: () => true,
        sessionMemoryCompact: () => shouldUseSessionMemoryCompaction(),
        agentSummary: () => true,
        magicDocs: () => getMagicDocsState?.()?.enabled ?? true,
        promptSuggestion: () => true,
    };
    const check = featureMap[feature];
    return check ? check() : false;
}
// Import for isFeatureEnabled
import { shouldUseSessionMemoryCompaction } from './session-memory-compact.js';
import { getMagicDocsState } from './magic-docs.js';
// Phase 58-60: New Borrowable Features (2026-04-14)
export { QueryEngine, queryEngineService, createBudgetTracker, checkTokenBudget, buildQueryConfig } from './query-engine-service.js';
export { ReplProcessor, replModeService, isReplModeEnabled, REPL_ONLY_TOOLS } from './repl-mode-service.js';
export { teamMemoryService, createTeamMemoryService, createMemoryEntry, buildMemoryFileContent, MEMORY_TYPES } from './team-memory-service.js';
// Smart Heartbeat Scheduler (2026-04-14)
export { smartHeartbeatScheduler, SmartHeartbeatScheduler, getPendingTasks, runTasks, getSchedulerStats } from './smart-heartbeat-scheduler.js';
// Auto-trigger Service (2026-04-14)
export { autoTriggerService, initializeHeartbeatState } from './auto-trigger-service.js';
//# sourceMappingURL=index.js.map