import { execSync } from 'child_process';
import { existsSync } from 'fs';
import type { GitStatus, CommitInfo } from '../types.js';

export class GitService {
  private isRepo: boolean | null = null;

  isGitRepository(): boolean {
    if (this.isRepo !== null) return this.isRepo;
    
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      this.isRepo = true;
      return true;
    } catch {
      this.isRepo = false;
      return false;
    }
  }

  getCurrentBranch(): string {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getStatus(): GitStatus {
    const status: GitStatus = {
      branch: this.getCurrentBranch(),
      ahead: 0,
      behind: 0,
      staged: [],
      unstaged: [],
      untracked: [],
    };

    try {
      // Get branch tracking info
      const trackingOutput = execSync('git rev-list --left-right --count HEAD...@{upstream} 2>/dev/null || echo "0\t0"', { 
        encoding: 'utf8' 
      }).trim();
      const [ahead, behind] = trackingOutput.split('\t').map(n => parseInt(n) || 0);
      status.ahead = ahead;
      status.behind = behind;

      // Parse git status
      const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
      
      for (const line of statusOutput.split('\n')) {
        if (!line.trim()) continue;
        
        const staged = line.slice(0, 2);
        const filename = line.slice(3).trim();

        if (staged[0] !== ' ' && staged[0] !== '?') {
          status.staged.push(filename);
        } else if (staged[1] !== ' ') {
          status.unstaged.push(filename);
        } else if (staged === '??') {
          status.untracked.push(filename);
        }
      }
    } catch {
      // Ignore errors
    }

    return status;
  }

  getDiff(stagedOnly = false): string {
    try {
      const cmd = stagedOnly ? 'git diff --cached' : 'git diff HEAD';
      return execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    } catch {
      return '';
    }
  }

  getRecentCommits(count = 10): CommitInfo[] {
    try {
      const output = execSync(
        `git log --pretty=format:"%H|%s|%an|%ad" --date=short -${count}`,
        { encoding: 'utf8' }
      );

      return output.split('\n').filter(Boolean).map(line => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date };
      });
    } catch {
      return [];
    }
  }

  stageFiles(files: string[]): void {
    if (files.length === 0) return;
    
    const fileList = files.map(f => `"${f.replace(/"/g, '\\"')}"`).join(' ');
    execSync(`git add ${fileList}`, { encoding: 'utf8' });
  }

  stageAll(): void {
    execSync('git add -A', { encoding: 'utf8' });
  }

  commit(message: string): string {
    const escapedMessage = message.replace(/"/g, '\\"');
    return execSync(`git commit -m "${escapedMessage}"`, { encoding: 'utf8' });
  }
}
