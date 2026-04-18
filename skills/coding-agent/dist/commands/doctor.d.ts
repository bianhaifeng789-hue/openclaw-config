import { GitService } from '../services/GitService.js';
export declare class DoctorCommand {
    private gitService;
    private issues;
    private warnings;
    private info;
    constructor(gitService: GitService);
    execute(): Promise<string>;
    private checkGitRepository;
    private checkNodeVersion;
    private checkPackageJson;
    private checkGitConfig;
    private checkEnvironment;
    private formatReport;
}
//# sourceMappingURL=doctor.d.ts.map