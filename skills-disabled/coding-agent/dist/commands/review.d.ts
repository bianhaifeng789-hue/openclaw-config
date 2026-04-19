import { GitService } from '../services/GitService.js';
export declare class ReviewCommand {
    private gitService;
    constructor(gitService: GitService);
    execute(prNumber?: string): Promise<string>;
    private reviewPR;
    private reviewCurrentBranch;
    private analyzeDiff;
    private generateSuggestions;
    private formatReview;
}
//# sourceMappingURL=review.d.ts.map