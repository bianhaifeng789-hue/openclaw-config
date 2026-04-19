import { execSync } from 'child_process';
export class ReviewCommand {
    gitService;
    constructor(gitService) {
        this.gitService = gitService;
    }
    async execute(prNumber) {
        if (!this.gitService.isGitRepository()) {
            return 'Error: Not a git repository';
        }
        try {
            if (prNumber) {
                return await this.reviewPR(prNumber);
            }
            else {
                return await this.reviewCurrentBranch();
            }
        }
        catch (error) {
            return `Error during review: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
    async reviewPR(prNumber) {
        try {
            execSync('which gh', { encoding: 'utf-8' });
            const prDetails = execSync(`gh pr view ${prNumber} --json title,body,author,files`, { encoding: 'utf-8' });
            const pr = JSON.parse(prDetails);
            const diff = execSync(`gh pr diff ${prNumber}`, { encoding: 'utf-8' });
            return this.formatReview(pr, diff);
        }
        catch (error) {
            return `Error reviewing PR #${prNumber}: ${error instanceof Error ? error.message : String(error)}\n\nMake sure you have the GitHub CLI (gh) installed.`;
        }
    }
    async reviewCurrentBranch() {
        const status = this.gitService.getStatus();
        const diff = this.gitService.getDiff(false);
        const recentCommits = this.gitService.getRecentCommits(3);
        if (!diff.trim()) {
            return `No changes to review on branch "${status.branch}".`;
        }
        const stats = this.analyzeDiff(diff);
        return `## Code Review: ${status.branch}

### Summary
- Files changed: ${stats.filesChanged}
- Additions: +${stats.additions}
- Deletions: -${stats.deletions}

### Recent Commits
${recentCommits.map((c) => `${c.hash.slice(0, 7)} ${c.message}`).join('\n')}

### Files Changed
${stats.fileList.map((f) => `- ${f}`).join('\n')}

### Suggestions
${this.generateSuggestions(stats)}`;
    }
    analyzeDiff(diff) {
        const lines = diff.split('\n');
        const fileList = [];
        let additions = 0;
        let deletions = 0;
        for (const line of lines) {
            if (line.startsWith('+++ b/')) {
                fileList.push(line.slice(6));
            }
            else if (line.startsWith('+') && !line.startsWith('+++')) {
                additions++;
            }
            else if (line.startsWith('-') && !line.startsWith('---')) {
                deletions++;
            }
        }
        return {
            filesChanged: fileList.length,
            additions,
            deletions,
            fileList,
        };
    }
    generateSuggestions(stats) {
        const suggestions = [];
        if (stats.additions > 500) {
            suggestions.push('- Consider breaking this into smaller commits');
        }
        if (stats.filesChanged > 10) {
            suggestions.push('- Large number of files changed - ensure changes are related');
        }
        if (suggestions.length === 0) {
            suggestions.push('- Changes look reasonable in scope');
        }
        return suggestions.join('\n');
    }
    formatReview(pr, diff) {
        const stats = this.analyzeDiff(diff);
        return `## PR Review: #${pr.number || 'Unknown'}

**Title:** ${pr.title || 'N/A'}
**Author:** ${pr.author?.login || 'Unknown'}

### Changes
- Files changed: ${stats.filesChanged}
- Additions: +${stats.additions}
- Deletions: -${stats.deletions}

### Files
${stats.fileList.map((f) => `- ${f}`).join('\n')}`;
    }
}
//# sourceMappingURL=review.js.map