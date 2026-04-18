/**
 * LSP Server Instance - Simplified for coding-agent
 */
import { spawn } from 'child_process';
export function createLSPServerInstance(command, args, cwd) {
    let childProcess;
    let capabilities;
    return {
        get capabilities() { return capabilities; },
        get isRunning() { return childProcess !== undefined; },
        async start() {
            childProcess = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd,
            });
            return new Promise((resolve, reject) => {
                childProcess?.on('spawn', () => resolve());
                childProcess?.on('error', (err) => reject(err));
            });
        },
        async stop() {
            if (childProcess) {
                childProcess.kill();
                childProcess = undefined;
            }
        },
    };
}
//# sourceMappingURL=LSPServerInstance.js.map