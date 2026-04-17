// @ts-nocheck
class MessageLimits {
    config = {
        maxMessagesPerConversation: 200,
        maxTokensPerMessage: 4000,
        maxContextTokens: 200000,
        maxFilesPerContext: 50,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxUrlsPerMessage: 10
    };
    /**
     * Check if message count within limit
     */
    isWithinMessageLimit(count) {
        return count <= this.config.maxMessagesPerConversation;
    }
    /**
     * Check if tokens within limit
     */
    isWithinTokenLimit(tokens, perMessage = true) {
        const limit = perMessage ? this.config.maxTokensPerMessage : this.config.maxContextTokens;
        return tokens <= limit;
    }
    /**
     * Check if file count within limit
     */
    isWithinFileLimit(count) {
        return count <= this.config.maxFilesPerContext;
    }
    /**
     * Check if file size within limit
     */
    isWithinFileSize(size) {
        return size <= this.config.maxFileSize;
    }
    /**
     * Check if URL count within limit
     */
    isWithinUrlLimit(count) {
        return count <= this.config.maxUrlsPerMessage;
    }
    /**
     * Get remaining messages
     */
    getRemainingMessages(current) {
        return Math.max(0, this.config.maxMessagesPerConversation - current);
    }
    /**
     * Get remaining tokens
     */
    getRemainingTokens(current, perMessage = true) {
        const limit = perMessage ? this.config.maxTokensPerMessage : this.config.maxContextTokens;
        return Math.max(0, limit - current);
    }
    /**
     * Get remaining files
     */
    getRemainingFiles(current) {
        return Math.max(0, this.config.maxFilesPerContext - current);
    }
    /**
     * Validate message
     */
    validateMessage(message) {
        const warnings = [];
        if (message.tokens && !this.isWithinTokenLimit(message.tokens)) {
            warnings.push(`Message exceeds token limit (${message.tokens} > ${this.config.maxTokensPerMessage})`);
        }
        if (message.files && !this.isWithinFileLimit(message.files)) {
            warnings.push(`Too many files (${message.files} > ${this.config.maxFilesPerContext})`);
        }
        if (message.urls && !this.isWithinUrlLimit(message.urls)) {
            warnings.push(`Too many URLs (${message.urls} > ${this.config.maxUrlsPerMessage})`);
        }
        return {
            valid: warnings.length === 0,
            warnings
        };
    }
    /**
     * Get limits config
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Set limits config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get max values
     */
    getMaxValues() {
        return {
            messages: this.config.maxMessagesPerConversation,
            tokensPerMessage: this.config.maxTokensPerMessage,
            contextTokens: this.config.maxContextTokens,
            files: this.config.maxFilesPerContext,
            fileSize: this.config.maxFileSize,
            urls: this.config.maxUrlsPerMessage
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.config = {
            maxMessagesPerConversation: 200,
            maxTokensPerMessage: 4000,
            maxContextTokens: 200000,
            maxFilesPerContext: 50,
            maxFileSize: 5 * 1024 * 1024,
            maxUrlsPerMessage: 10
        };
    }
}
// Global singleton
export const messageLimits = new MessageLimits();
export default messageLimits;
//# sourceMappingURL=message-limits.js.map