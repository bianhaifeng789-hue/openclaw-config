import type { GitStatus, CommitInfo } from '../types.js';
export declare class GitService {
    private isRepo;
    isGitRepository(): boolean;
    getCurrentBranch(): string;
    getStatus(): GitStatus;
    getDiff(stagedOnly?: boolean): string;
    getRecentCommits(count?: number): CommitInfo[];
    stageFiles(files: string[]): void;
    stageAll(): void;
    commit(message: string): string;
}
//# sourceMappingURL=GitService.d.ts.map