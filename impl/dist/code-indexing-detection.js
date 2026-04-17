// @ts-nocheck
class CodeIndexingDetection {
    status = {
        indexedFiles: 0,
        indexedTokens: 0,
        lastIndexed: 0,
        languageCounts: {}
    };
    config = {
        enabled: true,
        languages: ['typescript', 'javascript', 'python', 'go', 'rust', 'java'],
        excludePatterns: ['node_modules', '.git', 'dist', 'build'],
        maxFileSize: 100 * 1024 // 100KB
    };
    /**
     * Detect language from file path
     */
    detectLanguage(filePath) {
        const extension = filePath.split('.').pop()?.toLowerCase();
        const languageMap = {
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'py': 'python',
            'go': 'go',
            'rs': 'rust',
            'java': 'java',
            'kt': 'kotlin',
            'cpp': 'cpp',
            'c': 'c',
            'h': 'c',
            'hpp': 'cpp',
            'rb': 'ruby',
            'php': 'php',
            'swift': 'swift',
            'm': 'objective-c',
            'scala': 'scala',
            'cs': 'csharp'
        };
        return languageMap[extension ?? ''] ?? null;
    }
    /**
     * Check if file should be indexed
     */
    shouldIndex(filePath, fileSize) {
        if (!this.config.enabled)
            return false;
        // Check size
        if (fileSize > this.config.maxFileSize)
            return false;
        // Check language
        const language = this.detectLanguage(filePath);
        if (!language || !this.config.languages.includes(language))
            return false;
        // Check exclude patterns
        for (const pattern of this.config.excludePatterns) {
            if (filePath.includes(pattern))
                return false;
        }
        return true;
    }
    /**
     * Update indexing status
     */
    updateStatus(fileCount, tokenCount, language) {
        this.status.indexedFiles += fileCount;
        this.status.indexedTokens += tokenCount;
        this.status.lastIndexed = Date.now();
        this.status.languageCounts[language] =
            (this.status.languageCounts[language] ?? 0) + fileCount;
    }
    /**
     * Get status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Get config
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Reset status
     */
    resetStatus() {
        this.status = {
            indexedFiles: 0,
            indexedTokens: 0,
            lastIndexed: 0,
            languageCounts: {}
        };
    }
    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return [...this.config.languages];
    }
    /**
     * Add supported language
     */
    addLanguage(language) {
        if (!this.config.languages.includes(language)) {
            this.config.languages.push(language);
        }
    }
    /**
     * Add exclude pattern
     */
    addExcludePattern(pattern) {
        if (!this.config.excludePatterns.includes(pattern)) {
            this.config.excludePatterns.push(pattern);
        }
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.resetStatus();
        this.config = {
            enabled: true,
            languages: ['typescript', 'javascript', 'python', 'go', 'rust', 'java'],
            excludePatterns: ['node_modules', '.git', 'dist', 'build'],
            maxFileSize: 100 * 1024
        };
    }
}
// Global singleton
export const codeIndexingDetection = new CodeIndexingDetection();
export default codeIndexingDetection;
//# sourceMappingURL=code-indexing-detection.js.map