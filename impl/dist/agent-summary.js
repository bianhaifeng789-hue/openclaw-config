// @ts-nocheck
/**
 * AgentSummary - Periodic background summarization for subagents.
 *
 * Forks subagent's conversation every ~30s to generate progress summary.
 * Summary stored for UI display (Feishu cards in OpenClaw).
 *
 * Adapted from Claude Code's services/AgentSummary/agentSummary.ts
 */
import { runForkedAgent } from './forked-agent.js';
const SUMMARY_INTERVAL_MS = 30_000; // 30 seconds
/**
 * Summary manager for multiple agents
 */
const summaryStates = new Map();
const timers = new Map();
const abortControllers = new Map();
/**
 * Build summary prompt.
 */
function buildSummaryPrompt(previousSummary) {
    const prevLine = previousSummary
        ? `\nPrevious: "${previousSummary}" — say something NEW.\n`
        : '';
    return `Describe your most recent action in 3-5 words using present tense (-ing). Name the file or function, not the branch. Do not use tools.
${prevLine}
Good: "Reading runAgent.ts"
Good: "Fixing null check in validate.ts"
Good: "Running auth module tests"
Good: "Adding retry logic to fetchUser"

Bad (past tense): "Analyzed the branch diff"
Bad (too vague): "Investigating the issue"
Bad (too long): "Reviewing full branch diff and AgentTool.tsx integration"
Bad (branch name): "Analyzed adam/background-summary branch diff"`;
}
/**
 * Start summarization for a task.
 */
export function startAgentSummarization(taskId, agentId, cacheSafeParams) {
    console.log(`[AgentSummary] Starting for task ${taskId}`);
    summaryStates.set(taskId, {
        taskId,
        agentId,
        lastSummary: null,
        lastSummaryAt: 0,
        running: false,
    });
    scheduleNextSummary(taskId, cacheSafeParams);
}
/**
 * Stop summarization for a task.
 */
export function stopAgentSummarization(taskId) {
    console.log(`[AgentSummary] Stopping for task ${taskId}`);
    // Clear timer
    const timer = timers.get(taskId);
    if (timer) {
        clearTimeout(timer);
        timers.delete(taskId);
    }
    // Abort running summary
    const abortController = abortControllers.get(taskId);
    if (abortController) {
        abortController.abort();
        abortControllers.delete(taskId);
    }
    // Remove state
    summaryStates.delete(taskId);
}
/**
 * Schedule next summary run.
 */
function scheduleNextSummary(taskId, cacheSafeParams) {
    const timer = setTimeout(() => runSummary(taskId, cacheSafeParams), SUMMARY_INTERVAL_MS);
    timers.set(taskId, timer);
}
/**
 * Run summary for a task.
 */
async function runSummary(taskId, cacheSafeParams) {
    const state = summaryStates.get(taskId);
    if (!state)
        return;
    if (state.running) {
        console.log(`[AgentSummary] Already running for ${taskId}`);
        scheduleNextSummary(taskId, cacheSafeParams);
        return;
    }
    state.running = true;
    console.log(`[AgentSummary] Timer fired for ${taskId}`);
    try {
        // Create abort controller for this run
        const abortController = new AbortController();
        abortControllers.set(taskId, abortController);
        // Deny tools via callback
        const canUseTool = async () => ({
            behavior: 'deny',
            message: 'No tools needed for summary',
        });
        // Run forked agent for summary
        const result = await runForkedAgent({
            promptMessages: [
                { type: 'user', content: buildSummaryPrompt(state.lastSummary) },
            ],
            cacheSafeParams: cacheSafeParams || {
                systemPrompt: '',
                userContext: {},
                systemContext: {},
                model: 'bailian/glm-5',
                forkContextMessages: [],
            },
            canUseTool,
            querySource: 'agent_summary',
            forkLabel: 'agent_summary',
            skipTranscript: true,
        });
        // Extract summary from result
        for (const msg of result.messages) {
            if (msg.type !== 'assistant')
                continue;
            if (msg.content && typeof msg.content === 'string') {
                const summaryText = msg.content.trim();
                if (summaryText) {
                    console.log(`[AgentSummary] Summary for ${taskId}: ${summaryText}`);
                    state.lastSummary = summaryText;
                    state.lastSummaryAt = Date.now();
                    // Notify listeners (would integrate with Feishu cards)
                    notifySummaryUpdate(taskId, summaryText);
                    break;
                }
            }
        }
    }
    catch (e) {
        console.error(`[AgentSummary] Error for ${taskId}: ${e.message}`);
    }
    finally {
        state.running = false;
        abortControllers.delete(taskId);
        scheduleNextSummary(taskId, cacheSafeParams);
    }
}
/**
 * Notify summary update.
 * Would integrate with Feishu card generation.
 */
function notifySummaryUpdate(taskId, summary) {
    // Placeholder: would send Feishu card
    console.log(`[AgentSummary] Notify: ${taskId} -> ${summary}`);
}
/**
 * Get current summary for a task.
 */
export function getAgentSummary(taskId) {
    const state = summaryStates.get(taskId);
    return state?.lastSummary ?? null;
}
/**
 * Get all active summaries.
 */
export function getAllAgentSummaries() {
    return Array.from(summaryStates.values());
}
/**
 * Update summary manually.
 */
export function updateAgentSummary(taskId, summary) {
    const state = summaryStates.get(taskId);
    if (state) {
        state.lastSummary = summary;
        state.lastSummaryAt = Date.now();
    }
}
//# sourceMappingURL=agent-summary.js.map