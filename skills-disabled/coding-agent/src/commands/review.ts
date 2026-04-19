import { GitService } from '../services/GitService.js';
import { execSync } from 'child_process';
import type { GitStatus } from '../types.js';

export class ReviewCommand {
  private gitService: GitService;

  constructor(gitService: GitService) {
    this.gitService = gitService;
  }

  async execute(prNumber?: string): Promise<string> {
    if (!this.gitService.isGitRepository()) {
      return 'Error: Not a git repository';
    }

    try {
      if (prNumber) {
        return await this.reviewPR(prNumber);
      } else {
        return await this.reviewCurrentBranch();
      }
    } catch (error) {
      return `Error during review: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async reviewPR(prNumber: string): Promise<string> {
    try {
      execSync('which gh', { encoding: 'utf-8' });
      
      const prDetails = execSync(
        `gh pr view ${prNumber} --json title,body,author,files`,
        { encoding: 'utf-8' }
      );
      
      const pr = JSON.parse(prDetails);
      const diff = execSync(`gh pr diff ${prNumber}`, { encoding: 'utf-8' });

      return this.formatReview(pr, diff);
    } catch (error) {
      return `Error reviewing PR #${prNumber}: ${error instanceof Error ? error.message : String(error)}\n\nMake sure you have the GitHub CLI (gh) installed.`;
    }
  }

  private async reviewCurrentBranch(): Promise<string> {
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
${stats.fileList.map((f: string) => `- ${f}`).join('\n')}

### Suggestions
${this.generateSuggestions(stats)}`;
  }

  private analyzeDiff(diff: string): DiffStats {
    const lines = diff.split('\n');
    const fileList: string[] = [];
    let additions = 0;
    let deletions = 0;

    for (const line of lines) {
      if (line.startsWith('+++ b/')) {
        fileList.push(line.slice(6));
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
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

  private generateSuggestions(stats: DiffStats): string {
    const suggestions: string[] = [];

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

  private formatReview(pr: any, diff: string): string {
    const stats = this.analyzeDiff(diff);

    return `## PR Review: #${pr.number || 'Unknown'}

**Title:** ${pr.title || 'N/A'}
**Author:** ${pr.author?.login || 'Unknown'}

### Changes
- Files changed: ${stats.filesChanged}
- Additions: +${stats.additions}
- Deletions: -${stats.deletions}

### Files
${stats.fileList.map((f: string) => `- ${f}`).join('\n')}`;
  }
}

interface DiffStats {
  filesChanged: number;
  additions: number;
  deletions: number;
  fileList: string[];
}