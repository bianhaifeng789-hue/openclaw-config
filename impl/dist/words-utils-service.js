// @ts-nocheck
class WordsUtilsService {
    analyses = [];
    /**
     * Extract words
     */
    extract(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const unique = new Set(words);
        const analysis = {
            words,
            count: words.length,
            uniqueCount: unique.size,
            averageLength: words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0,
            timestamp: Date.now()
        };
        this.analyses.push(analysis);
        return analysis;
    }
    /**
     * Count words
     */
    count(text) {
        return this.extract(text).count;
    }
    /**
     * Get unique words
     */
    unique(text) {
        return [...new Set(text.split(/\s+/).filter(w => w.length > 0))];
    }
    /**
     * Get word frequency
     */
    frequency(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const freq = {};
        for (const word of words) {
            freq[word] = (freq[word] ?? 0) + 1;
        }
        return freq;
    }
    /**
     * Find longest word
     */
    longest(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0)
            return '';
        return words.reduce((longest, current) => current.length > longest.length ? current : longest);
    }
    /**
     * Find shortest word
     */
    shortest(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0)
            return '';
        return words.reduce((shortest, current) => current.length < shortest.length ? current : shortest);
    }
    /**
     * Get analyses
     */
    getAnalyses() {
        return [...this.analyses];
    }
    /**
     * Get recent analyses
     */
    getRecent(count = 10) {
        return this.analyses.slice(-count);
    }
    /**
     * Get stats
     */
    getStats() {
        const avgWords = this.analyses.length > 0
            ? this.analyses.reduce((sum, a) => sum + a.count, 0) / this.analyses.length
            : 0;
        const avgUnique = this.analyses.length > 0
            ? this.analyses.reduce((sum, a) => sum + a.uniqueCount, 0) / this.analyses.length
            : 0;
        return {
            analysesCount: this.analyses.length,
            totalWordsCount: this.analyses.reduce((sum, a) => sum + a.count, 0),
            averageWordsCount: avgWords,
            averageUniqueCount: avgUnique
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.analyses = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const wordsUtilsService = new WordsUtilsService();
export default wordsUtilsService;
//# sourceMappingURL=words-utils-service.js.map