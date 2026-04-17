// @ts-nocheck

/**
 * Detect Repository Pattern - 仓库检测
 * 
 * Source: Claude Code utils/detectRepository.ts
 * Pattern: repository detection + git repo + root detection + project type
 */

interface RepositoryInfo {
  root: string
  type: 'git' | 'svn' | 'hg' | 'none'
  name: string
  branch?: string
  remote?: string
  isWorktree: boolean
}

class RepositoryDetection {
  private detectedRepos = new Map<string, RepositoryInfo>()

  /**
   * Detect repository
   */
  detect(startPath: string): RepositoryInfo {
    // Would walk up directory tree to find .git, .svn, .hg
    // For demo, simulate detection
    const info: RepositoryInfo = {
      root: startPath,
      type: 'git',
      name: this.extractName(startPath),
      branch: 'main',
      remote: 'https://github.com/example/repo',
      isWorktree: false
    }

    this.detectedRepos.set(startPath, info)

    return info
  }

  /**
   * Extract repo name from path
   */
  private extractName(path: string): string {
    const parts = path.split('/')
    return parts[parts.length - 1] ?? 'unknown'
  }

  /**
   * Check if is git repository
   */
  isGitRepo(path: string): boolean {
    const info = this.detectedRepos.get(path)
    if (info) return info.type === 'git'

    // Would check for .git directory
    return true // Simulated
  }

  /**
   * Find git root
   */
  findGitRoot(startPath: string): string | null {
    const info = this.detect(startPath)
    return info.type === 'git' ? info.root : null
  }

  /**
   * Get current branch
   */
  getCurrentBranch(path: string): string | null {
    const info = this.detectedRepos.get(path)
    return info?.branch ?? null
  }

  /**
   * Get remote URL
   */
  getRemoteUrl(path: string): string | null {
    const info = this.detectedRepos.get(path)
    return info?.remote ?? null
  }

  /**
   * Check if worktree
   */
  isWorktree(path: string): boolean {
    const info = this.detectedRepos.get(path)
    return info?.isWorktree ?? false
  }

  /**
   * Get repository info
   */
  getInfo(path: string): RepositoryInfo | undefined {
    return this.detectedRepos.get(path)
  }

  /**
   * Get all detected repos
   */
  getAllRepos(): RepositoryInfo[] {
    return Array.from(this.detectedRepos.values())
  }

  /**
   * Get stats
   */
  getStats(): {
    reposCount: number
    gitRepos: number
    worktrees: number
  } {
    const repos = Array.from(this.detectedRepos.values())

    return {
      reposCount: repos.length,
      gitRepos: repos.filter(r => r.type === 'git').length,
      worktrees: repos.filter(r => r.isWorktree).length
    }
  }

  /**
   * Clear detected repos
   */
  clear(): void {
    this.detectedRepos.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const repositoryDetection = new RepositoryDetection()

export default repositoryDetection