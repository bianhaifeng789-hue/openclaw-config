import { GitService } from '../services/GitService.js';
export declare class CommitCommand {
    private gitService;
    constructor(gitService: GitService);
    execute(): Promise<string>;
    private analyzeChanges;
    private analyzeFileTypes;
    private determineChangeType;
    private generateCommitMessage;
}
//# sourceMappingURL=commit.d.ts.map