// @ts-nocheck
class RepoAnalysisService {
    analyses = new Map();
    /**
     * Analyze repository
     */
    analyze(rootPath) {
        // Would scan directory and analyze files
        // For demo, simulate analysis
        const analysis = {
            languages: {
                'TypeScript': 60,
                'JavaScript': 30,
                'JSON': 10
            },
            frameworks: ['react', 'jest'],
            fileTypes: {
                '.ts': 50,
                '.js': 30,
                '.json': 20
            },
            totalFiles: 100,
            totalSize: 500000,
            hasTests: true,
            hasDocs: true,
            hasConfig: true
        };
        this.analyses.set(rootPath, analysis);
        return analysis;
    }
    /**
     * Detect language
     */
    detectLanguage(filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const langMap = {
            'ts': 'TypeScript',
            'tsx': 'TypeScript',
            'js': 'JavaScript',
            'jsx': 'JavaScript',
            'py': 'Python',
            'go': 'Go',
            'rs': 'Rust',
            'java': 'Java',
            'rb': 'Ruby',
            'php': 'PHP'
        };
        return langMap[ext ?? ''] ?? null;
    }
    /**
     * Detect framework
     */
    detectFrameworks(rootPath) {
        // Would check package.json, requirements.txt, etc.
        // For demo, return common frameworks
        const analysis = this.analyses.get(rootPath);
        return analysis?.frameworks ?? [];
    }
    /**
     * Check for tests
     */
    hasTests(rootPath) {
        const analysis = this.analyses.get(rootPath);
        return analysis?.hasTests ?? false;
    }
    /**
     * Check for docs
     */
    hasDocs(rootPath) {
        const analysis = this.analyses.get(rootPath);
        return analysis?.hasDocs ?? false;
    }
    /**
     * Get analysis
     */
    getAnalysis(rootPath) {
        return this.analyses.get(rootPath);
    }
    /**
     * Get language breakdown
     */
    getLanguageBreakdown(rootPath) {
        const analysis = this.analyses.get(rootPath);
        return analysis?.languages ?? {};
    }
    /**
     * Get dominant language
     */
    getDominantLanguage(rootPath) {
        const analysis = this.analyses.get(rootPath);
        if (!analysis)
            return null;
        const languages = analysis.languages;
        let dominant = '';
        let maxPercent = 0;
        for (const [lang, percent] of Object.entries(languages)) {
            if (percent > maxPercent) {
                maxPercent = percent;
                dominant = lang;
            }
        }
        return dominant;
    }
    /**
     * Get stats
     */
    getStats() {
        const analyses = Array.from(this.analyses.values());
        const avgFiles = analyses.length > 0
            ? analyses.reduce((sum, a) => sum + a.totalFiles, 0) / analyses.length
            : 0;
        const avgSize = analyses.length > 0
            ? analyses.reduce((sum, a) => sum + a.totalSize, 0) / analyses.length
            : 0;
        return {
            analysesCount: analyses.length,
            averageFiles: avgFiles,
            averageSize: avgSize
        };
    }
    /**
     * Clear analyses
     */
    clear() {
        this.analyses.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const repoAnalysisService = new RepoAnalysisService();
export default repoAnalysisService;
//# sourceMappingURL=repo-analysis-service.js.map