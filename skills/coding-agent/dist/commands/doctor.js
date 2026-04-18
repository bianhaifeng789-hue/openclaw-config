import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
export class DoctorCommand {
    gitService;
    issues = [];
    warnings = [];
    info = [];
    constructor(gitService) {
        this.gitService = gitService;
    }
    async execute() {
        this.issues = [];
        this.warnings = [];
        this.info = [];
        await this.checkGitRepository();
        await this.checkNodeVersion();
        await this.checkPackageJson();
        await this.checkGitConfig();
        await this.checkEnvironment();
        return this.formatReport();
    }
    async checkGitRepository() {
        if (!this.gitService.isGitRepository()) {
            this.issues.push('Not a git repository');
            return;
        }
        this.info.push('Git repository detected');
        const status = this.gitService.getStatus();
        if (status.staged.length > 0 || status.unstaged.length > 0 || status.untracked.length > 0) {
            this.warnings.push('Uncommitted changes detected');
        }
    }
    async checkNodeVersion() {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        if (major < 18) {
            this.issues.push(`Node.js version ${version} is too old (requires >= 18)`);
        }
        else if (major < 20) {
            this.warnings.push(`Node.js ${version} works but >= 20 is recommended`);
        }
        else {
            this.info.push(`Node.js ${version} ✓`);
        }
    }
    async checkPackageJson() {
        if (!existsSync('package.json')) {
            this.warnings.push('No package.json found');
            return;
        }
        this.info.push('package.json found');
        try {
            const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
            if (!pkg.name) {
                this.warnings.push('package.json missing "name" field');
            }
            if (pkg.scripts && pkg.scripts.test) {
                this.info.push('Test script defined');
            }
            else {
                this.warnings.push('No test script defined');
            }
        }
        catch {
            this.issues.push('package.json is invalid JSON');
        }
    }
    async checkGitConfig() {
        try {
            const name = execSync('git config user.name', { encoding: 'utf-8' }).trim();
            const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
            if (!name) {
                this.issues.push('Git user.name not configured');
            }
            if (!email) {
                this.issues.push('Git user.email not configured');
            }
            if (name && email) {
                this.info.push(`Git configured: ${name} <${email}>`);
            }
        }
        catch {
            this.issues.push('Could not check git configuration');
        }
    }
    async checkEnvironment() {
        if (process.env.ANTHROPIC_API_KEY) {
            this.info.push('ANTHROPIC_API_KEY is set');
        }
        else {
            this.warnings.push('ANTHROPIC_API_KEY not set (needed for AI features)');
        }
    }
    formatReport() {
        const lines = ['## 🔍 Project Diagnosis\n'];
        if (this.issues.length > 0) {
            lines.push('### ❌ Issues');
            lines.push(...this.issues.map(i => `- ${i}`));
            lines.push('');
        }
        if (this.warnings.length > 0) {
            lines.push('### ⚠️ Warnings');
            lines.push(...this.warnings.map(w => `- ${w}`));
            lines.push('');
        }
        if (this.info.length > 0) {
            lines.push('### ℹ️ Info');
            lines.push(...this.info.map(i => `- ${i}`));
            lines.push('');
        }
        const total = this.issues.length + this.warnings.length;
        if (total === 0) {
            lines.push('✅ All checks passed!');
        }
        else {
            lines.push(`Found ${this.issues.length} issues and ${this.warnings.length} warnings.`);
        }
        return lines.join('\n');
    }
}
//# sourceMappingURL=doctor.js.map