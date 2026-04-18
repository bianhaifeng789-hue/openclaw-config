import { GitService } from '../services/GitService.js';
import type { GitStatus, CommitInfo } from '../types.js';

export class CommitCommand {
  private gitService: GitService;

  constructor(gitService: GitService) {
    this.gitService = gitService;
  }

  async execute(): Promise<string> {
    // Check if we're in a git repository
    if (!this.gitService.isGitRepository()) {
      return 'Error: Not a git repository';
    }

    // Get current status
    const status = this.gitService.getStatus();
    
    if (status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0) {
      return 'No changes to commit. Use `git add` to stage files first.';
    }

    // Analyze changes
    const analysis = this.analyzeChanges(status);
    
    // Generate commit message based on analysis
    const commitMessage = this.generateCommitMessage(analysis, status);

    try {
      // Stage unstaged files if none are staged
      if (status.staged.length === 0 && (status.unstaged.length > 0 || status.untracked.length > 0)) {
        this.gitService.stageAll();
      }

      // Create the commit
      const result = this.gitService.commit(commitMessage);
      return `✅ Created commit:\n\n${commitMessage}`;
    } catch (error) {
      return `Failed to commit: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private analyzeChanges(status: GitStatus): ChangeAnalysis {
    const allFiles = [...status.staged, ...status.unstaged, ...status.untracked];
    const fileTypes = this.analyzeFileTypes(allFiles);
    const changeType = this.determineChangeType(allFiles);
    
    return {
      fileTypes,
      changeType,
      fileCount: allFiles.length,
    };
  }

  private analyzeFileTypes(files: string[]): Set<string> {
    const types = new Set<string>();
    
    for (const file of files) {
      if (file.includes('test')) types.add('test');
      if (file.endsWith('.md')) types.add('docs');
      if (file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')) {
        types.add('config');
      }
      if (file.match(/\.(ts|tsx|js|jsx|py|rs|go|java)$/)) types.add('code');
    }

    return types;
  }

  private determineChangeType(files: string[]): string {
    // Simple heuristic based on file names
    for (const file of files) {
      if (file.toLowerCase().includes('fix')) return 'fix';
      if (file.toLowerCase().includes('add') || file.toLowerCase().includes('new')) return 'feat';
    }
    
    // Check for new files
    const hasNewFiles = files.some(f => !f.includes('/') || f.startsWith('src/') || f.startsWith('lib/'));
    if (hasNewFiles) return 'feat';
    
    return 'chore';
  }

  private generateCommitMessage(analysis: ChangeAnalysis, status: GitStatus): string {
    const { changeType, fileCount, fileTypes } = analysis;
    
    let scope = '';
    if (fileCount === 1) {
      scope = status.staged[0] || status.unstaged[0] || status.untracked[0];
      scope = scope.split('/').pop() || scope;
    } else {
      scope = `${fileCount} files`;
    }

    const descriptions: Record<string, string> = {
      feat: `add ${scope}`,
      fix: `fix ${scope}`,
      docs: `update documentation for ${scope}`,
      refactor: `refactor ${scope}`,
      test: `add tests for ${scope}`,
      chore: `update ${scope}`,
    };

    let message = `${changeType}: ${descriptions[changeType] || `update ${scope}`}`;
    
    // Add body for multiple files
    if (fileCount > 1) {
      const fileList = [...status.staged, ...status.unstaged, ...status.untracked]
        .map((f: string) => `- ${f}`)
        .join('\n');
      message += `\n\nChanges:\n${fileList}`;
    }

    return message;
  }
}

interface ChangeAnalysis {
  fileTypes: Set<string>;
  changeType: string;
  fileCount: number;
}