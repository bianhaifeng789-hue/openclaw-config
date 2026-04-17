// @ts-nocheck
class RepositoryDetection {
    detectedRepos = new Map();
    /**
     * Detect repository
     */
    detect(startPath) {
        // Would walk up directory tree to find .git, .svn, .hg
        // For demo, simulate detection
        const info = {
            root: startPath,
            type: 'git',
            name: this.extractName(startPath),
            branch: 'main',
            remote: 'https://github.com/example/repo',
            isWorktree: false
        };
        this.detectedRepos.set(startPath, info);
        return info;
    }
    /**
     * Extract repo name from path
     */
    extractName(path) {
        const parts = path.split('/');
        return parts[parts.length - 1] ?? 'unknown';
    }
    /**
     * Check if is git repository
     */
    isGitRepo(path) {
        const info = this.detectedRepos.get(path);
        if (info)
            return info.type === 'git';
        // Would check for .git directory
        return true; // Simulated
    }
    /**
     * Find git root
     */
    findGitRoot(startPath) {
        const info = this.detect(startPath);
        return info.type === 'git' ? info.root : null;
    }
    /**
     * Get current branch
     */
    getCurrentBranch(path) {
        const info = this.detectedRepos.get(path);
        return info?.branch ?? null;
    }
    /**
     * Get remote URL
     */
    getRemoteUrl(path) {
        const info = this.detectedRepos.get(path);
        return info?.remote ?? null;
    }
    /**
     * Check if worktree
     */
    isWorktree(path) {
        const info = this.detectedRepos.get(path);
        return info?.isWorktree ?? false;
    }
    /**
     * Get repository info
     */
    getInfo(path) {
        return this.detectedRepos.get(path);
    }
    /**
     * Get all detected repos
     */
    getAllRepos() {
        return Array.from(this.detectedRepos.values());
    }
    /**
     * Get stats
     */
    getStats() {
        const repos = Array.from(this.detectedRepos.values());
        return {
            reposCount: repos.length,
            gitRepos: repos.filter(r => r.type === 'git').length,
            worktrees: repos.filter(r => r.isWorktree).length
        };
    }
    /**
     * Clear detected repos
     */
    clear() {
        this.detectedRepos.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const repositoryDetection = new RepositoryDetection();
export default repositoryDetection;
//# sourceMappingURL=repository-detection.js.map