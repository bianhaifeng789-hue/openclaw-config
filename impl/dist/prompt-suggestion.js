/**
 * PromptSuggestion - Next step prediction.
 *
 * Predicts what the user might want to do next and generates suggestions.
 * Uses forked agent for speculation (fire-and-forget).
 *
 * Adapted from Claude Code's services/PromptSuggestion/promptSuggestion.ts
 */
import { runForkedAgent } from './forked-agent.js';
let state = {
    enabled: true,
    lastSuggestionAt: 0,
    suggestionsToday: 0,
    maxSuggestionsPerDay: 5,
    minIntervalMs: 30 * 60 * 1000, // 30 minutes
};
const recentSuggestions = [];
/**
 * Check if prompt suggestion should run.
 */
export function shouldRunPromptSuggestion() {
    if (!state.enabled) {
        return false;
    }
    // Check daily limit
    if (state.suggestionsToday >= state.maxSuggestionsPerDay) {
        return false;
    }
    // Check minimum interval
    const sinceLast = Date.now() - state.lastSuggestionAt;
    if (sinceLast < state.minIntervalMs) {
        return false;
    }
    return true;
}
/**
 * Build suggestion prompt.
 */
function buildSuggestionPrompt(context) {
    return `# Predict Next Step

Based on recent activity, predict what the user might want to do next.

---

## Recent Context

**Recent tasks completed:**
${context.recentTasks.map(t => `- ${t}`).join('\n') || 'None'}

**Current memory state:**
${context.currentMemory.slice(0, 500) || 'Empty'}

**User habits:**
${context.userHabits.map(h => `- ${h}`).join('\n') || 'None known'}

---

## Task

Generate 1-2 sentence suggestions for what the user might want to do next. Focus on:
- Natural follow-up actions
- Maintenance tasks
- Quick wins

## Format

Return suggestions in this format:\n\`\`\`\nSUGGESTION: <text>\nREASON: <why this is relevant>\nCONFIDENCE: <high|medium|low>\n\`\`\`\n\nBe specific and actionable. Avoid generic suggestions like "check your inbox" or "review recent work".`;
}
/**
 * Generate prompt suggestion.
 */
export async function generatePromptSuggestion(context, cacheSafeParams) {
    if (!shouldRunPromptSuggestion()) {
        return null;
    }
    console.log('[PromptSuggestion] Generating suggestion...');
    const prompt = buildSuggestionPrompt(context);
    try {
        const result = await runForkedAgent({
            promptMessages: [{ type: 'user', content: prompt }],
            cacheSafeParams: cacheSafeParams || {
                systemPrompt: '',
                userContext: {},
                systemContext: {},
                model: 'bailian/glm-5',
                forkContextMessages: [],
            },
            canUseTool: async () => ({
                behavior: 'deny',
                message: 'No tools for suggestion',
            }),
            querySource: 'prompt_suggestion',
            forkLabel: 'prompt_suggestion',
            skipTranscript: true,
            skipCacheWrite: true, // Fire-and-forget
        });
        // Extract suggestion from result
        for (const msg of result.messages) {
            if (msg.type !== 'assistant')
                continue;
            if (msg.content && typeof msg.content === 'string') {
                const suggestion = parseSuggestion(msg.content);
                if (suggestion) {
                    // Update state
                    state.lastSuggestionAt = Date.now();
                    state.suggestionsToday++;
                    // Track suggestion
                    recentSuggestions.push(suggestion);
                    if (recentSuggestions.length > 10) {
                        recentSuggestions.shift();
                    }
                    console.log(`[PromptSuggestion] Generated: ${suggestion.text}`);
                    return suggestion;
                }
            }
        }
    }
    catch (e) {
        console.error(`[PromptSuggestion] Error: ${e.message}`);
    }
    return null;
}
/**
 * Parse suggestion from response.
 */
function parseSuggestion(content) {
    const suggestionMatch = content.match(/SUGGESTION:\s*(.+)/i);
    const reasonMatch = content.match(/REASON:\s*(.+)/i);
    const confidenceMatch = content.match(/CONFIDENCE:\s*(high|medium|low)/i);
    if (!suggestionMatch) {
        return null;
    }
    return {
        text: suggestionMatch[1].trim(),
        reason: reasonMatch?.[1]?.trim() || '',
        confidence: confidenceMatch?.[1]?.toLowerCase() || 'medium',
        timestamp: Date.now(),
    };
}
/**
 * Get recent suggestions.
 */
export function getRecentSuggestions() {
    return [...recentSuggestions];
}
/**
 * Get suggestion state.
 */
export function getPromptSuggestionState() {
    return { ...state };
}
/**
 * Reset daily suggestion counter (call at midnight).
 */
export function resetDailySuggestionCounter() {
    state.suggestionsToday = 0;
}
/**
 * Enable/disable prompt suggestions.
 */
export function setPromptSuggestionEnabled(enabled) {
    state.enabled = enabled;
}
/**
 * Configure suggestion limits.
 */
export function configurePromptSuggestion(config) {
    if (config.maxSuggestionsPerDay) {
        state.maxSuggestionsPerDay = config.maxSuggestionsPerDay;
    }
    if (config.minIntervalMs) {
        state.minIntervalMs = config.minIntervalMs;
    }
}
/**
 * Quick suggestion for Feishu reply.
 * Returns formatted suggestion text.
 */
export function formatSuggestionForFeishu(suggestion) {
    const emoji = suggestion.confidence === 'high' ? '💡' :
        suggestion.confidence === 'medium' ? '💭' :
            '🤔';
    return `${emoji} **建议**: ${suggestion.text}\n_${suggestion.reason}_`;
}
//# sourceMappingURL=prompt-suggestion.js.map