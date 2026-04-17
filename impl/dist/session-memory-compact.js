/**
 * SessionMemoryCompact - Specialized session memory compression.
 *
 * Ensures key memories are protected during compaction.
 * Uses minTokens + minTextBlockMessages to preserve important context.
 *
 * Adapted from Claude Code's services/compact/sessionMemoryCompact.ts
 */
const DEFAULT_CONFIG = {
    minTokens: 10_000,
    minTextBlockMessages: 5,
    maxTokens: 40_000,
};
let config = DEFAULT_CONFIG;
/**
 * Set session memory compact configuration.
 */
export function setSessionMemoryCompactConfig(newConfig) {
    config = { ...config, ...newConfig };
}
/**
 * Get current configuration.
 */
export function getSessionMemoryCompactConfig() {
    return { ...config };
}
/**
 * Reset config to defaults.
 */
export function resetSessionMemoryCompactConfig() {
    config = DEFAULT_CONFIG;
}
/**
 * Check if message contains text blocks.
 */
export function hasTextBlocks(message) {
    if (message.type === 'assistant') {
        const content = message.content;
        if (Array.isArray(content)) {
            return content.some(block => block.type === 'text');
        }
        return typeof content === 'string' && content.length > 0;
    }
    if (message.type === 'user') {
        const content = message.content;
        if (typeof content === 'string') {
            return content.length > 0;
        }
        if (Array.isArray(content)) {
            return content.some(block => block.type === 'text');
        }
    }
    return false;
}
/**
 * Estimate token count for a message.
 * Simple heuristic: ~4 chars per token.
 */
export function estimateMessageTokens(messages) {
    let totalChars = 0;
    for (const msg of messages) {
        if (typeof msg.content === 'string') {
            totalChars += msg.content.length;
        }
        else if (Array.isArray(msg.content)) {
            for (const block of msg.content) {
                if (block.text) {
                    totalChars += block.text.length;
                }
            }
        }
    }
    return Math.ceil(totalChars / 4);
}
/**
 * Calculate the starting index for messages to keep after compaction.
 * Starts from lastSummarizedIndex, expands backwards to meet minimums.
 */
export function calculateMessagesToKeepIndex(messages, lastSummarizedIndex) {
    if (messages.length === 0) {
        return 0;
    }
    const cfg = getSessionMemoryCompactConfig();
    // Start from message after lastSummarizedIndex
    let startIndex = lastSummarizedIndex >= 0 ? lastSummarizedIndex + 1 : messages.length;
    // Calculate current tokens and text-block count
    let totalTokens = 0;
    let textBlockMessageCount = 0;
    for (let i = startIndex; i < messages.length; i++) {
        const msg = messages[i];
        if (!msg)
            continue;
        totalTokens += estimateMessageTokens([msg]);
        if (hasTextBlocks(msg)) {
            textBlockMessageCount++;
        }
    }
    // Check if already meets minimums or hits max
    if (totalTokens >= cfg.maxTokens) {
        return startIndex;
    }
    if (totalTokens >= cfg.minTokens &&
        textBlockMessageCount >= cfg.minTextBlockMessages) {
        return startIndex;
    }
    // Expand backwards until we meet minimums
    for (let i = startIndex - 1; i >= 0; i--) {
        const msg = messages[i];
        if (!msg)
            continue;
        const msgTokens = estimateMessageTokens([msg]);
        totalTokens += msgTokens;
        if (hasTextBlocks(msg)) {
            textBlockMessageCount++;
        }
        startIndex = i;
        // Stop if hit max cap
        if (totalTokens >= cfg.maxTokens) {
            break;
        }
        // Stop if meet both minimums
        if (totalTokens >= cfg.minTokens &&
            textBlockMessageCount >= cfg.minTextBlockMessages) {
            break;
        }
    }
    return startIndex;
}
/**
 * Perform session memory compaction.
 * Returns messages to keep and summary content.
 */
export function compactSessionMemory(messages, sessionMemory) {
    const cfg = getSessionMemoryCompactConfig();
    // Calculate last summarized index (-1 means no prior summary)
    const lastSummarizedIndex = -1;
    // Calculate start index for messages to keep
    const startIndex = calculateMessagesToKeepIndex(messages, lastSummarizedIndex);
    // Slice messages to keep
    const messagesToKeep = messages.slice(startIndex);
    // Build summary content from session memory
    // Truncate if too long
    let summaryContent = sessionMemory;
    const maxSummaryTokens = 5000;
    if (estimateMessageTokens([{ type: 'user', content: summaryContent }]) > maxSummaryTokens) {
        // Truncate to max tokens
        const maxChars = maxSummaryTokens * 4;
        summaryContent = sessionMemory.slice(0, maxChars) + '\n\n[Truncated for length]';
    }
    const preCompactTokenCount = estimateMessageTokens(messages);
    const postCompactTokenCount = estimateMessageTokens(messagesToKeep) +
        estimateMessageTokens([{ type: 'user', content: summaryContent }]);
    return {
        messagesToKeep,
        summaryContent,
        preCompactTokenCount,
        postCompactTokenCount,
    };
}
/**
 * Check if session memory compaction should be used.
 */
export function shouldUseSessionMemoryCompaction() {
    // Check env override
    if (process.env.ENABLE_SESSION_MEMORY_COMPACT === 'true') {
        return true;
    }
    if (process.env.DISABLE_SESSION_MEMORY_COMPACT === 'true') {
        return false;
    }
    // Default: enabled
    return true;
}
/**
 * Estimate memory tokens from content.
 */
export function estimateMemoryTokens(content) {
    return estimateMessageTokens([{ type: 'user', content }]);
}
// ============================================================================
// Compatibility exports for session-memory-service.ts
// ============================================================================
/** Alias for compactSessionMemory */
export const sessionMemoryCompact = compactSessionMemory;
/** Simple token estimation for content strings */
export function estimateTokenCount(content) {
    return estimateMemoryTokens(content);
}
/** Memory sections that can be auto-updated */
export const DEFAULT_MEMORY_SECTIONS = [
    'current_focus',
    'key_decisions',
    'user_profile',
    'learnings',
    'projects',
    'contacts',
    'notes',
];
/** Extract content from an AUTO_UPDATE block */
export function extractAutoUpdateBlock(content, blockName) {
    const startMarker = `<!-- AUTO_UPDATE: ${blockName} -->`;
    const endMarker = `<!-- END_AUTO_UPDATE -->`;
    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) {
        return { found: false, content: '', start: -1, end: -1 };
    }
    const endIndex = content.indexOf(endMarker, startIndex);
    if (endIndex === -1) {
        return { found: false, content: '', start: -1, end: -1 };
    }
    const blockContent = content
        .slice(startIndex + startMarker.length, endIndex)
        .trim();
    return {
        found: true,
        content: blockContent,
        start: startIndex,
        end: endIndex + endMarker.length,
    };
}
/** Update an AUTO_UPDATE block in memory content */
export function updateAutoUpdateBlock(content, blockName, newContent) {
    const block = extractAutoUpdateBlock(content, blockName);
    if (!block.found) {
        // Block not found, append at end before any trailing content
        const startMarker = `<!-- AUTO_UPDATE: ${blockName} -->`;
        const endMarker = `<!-- END_AUTO_UPDATE -->`;
        return `${content}\n\n${startMarker}\n${newContent}\n${endMarker}\n`;
    }
    // Replace existing block
    const startMarker = `<!-- AUTO_UPDATE: ${blockName} -->`;
    const endMarker = `<!-- END_AUTO_UPDATE -->`;
    return (content.slice(0, block.start) +
        startMarker +
        '\n' +
        newContent +
        '\n' +
        endMarker +
        content.slice(block.end));
}
//# sourceMappingURL=session-memory-compact.js.map