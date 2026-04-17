// @ts-nocheck
class GitUtils {
    /**
     * Check if path is in git repo
     */
    async isGitRepo(path) {
        // Would use actual git commands
        // For demo, check for .git directory
        const gitPath = await this.findGitRoot(path);
        return gitPath !== null;
    }
    /**
     * Find git root directory
     */
    async findGitRoot(startPath) {
        // Walk up directories to find .git
        let currentPath = startPath;
        while (currentPath !== '/' && currentPath.length > 0) {
            // Would check for .git directory
            // For demo, return current path
            if (currentPath.endsWith('.git') || currentPath.includes('/.git')) {
                return currentPath.replace('/.git', '');
            }
            // Move up one directory
            const parts = currentPath.split('/');
            parts.pop();
            currentPath = parts.join('/');
        }
        return null;
    }
    /**
     * Get git status
     */
    async getStatus(repoPath) {
        const isRepo = await this.isGitRepo(repoPath);
        if (!isRepo) {
            return { isRepo: false, dirty: false };
        }
        const rootPath = await this.findGitRoot(repoPath);
        // Would use git commands to get actual status
        // For demo, return mock status
        return {
            isRepo: true,
            rootPath: rootPath ?? repoPath,
            branch: 'main',
            ahead: 0,
            behind: 0,
            dirty: false
        };
    }
    /**
     * Get current branch
     */
    async getCurrentBranch(repoPath) {
        const status = await this.getStatus(repoPath);
        return status.branch ?? null;
    }
    /**
     * Check if repo has uncommitted changes
     */
    async hasUncommittedChanges(repoPath) {
        const status = await this.getStatus(repoPath);
        return status.dirty;
    }
    /**
     * Get ahead/behind counts
     */
    async getAheadBehind(repoPath) {
        const status = await this.getStatus(repoPath);
        if (!status.isRepo)
            return null;
        return {
            ahead: status.ahead ?? 0,
            behind: status.behind ?? 0
        };
    }
    /**
     * Get remote URL
     */
    async getRemoteUrl(repoPath, remote = 'origin') {
        // Would use git remote get-url
        // For demo, return null
        return null;
    }
    /**
     * Check if path is in worktree
     */
    async isWorktree(path) {
        // Would check .git file (not directory) for worktree
        // For demo, return false
        return false;
    }
    /**
     * Get repo slug (owner/name from remote)
     */
    async getRepoSlug(repoPath) {
        const remoteUrl = await this.getRemoteUrl(repoPath);
        if (!remoteUrl)
            return null;
        // Parse GitHub/GitLab URL
        const match = remoteUrl.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
        if (match) {
            return match[1];
        }
        return null;
    }
    /**
     * Reset for testing
     */
    _reset() {
        // No state
    }
}
// Global singleton
export const gitUtils = new GitUtils();
export default gitUtils;
//# sourceMappingURL=git-utils.js.map