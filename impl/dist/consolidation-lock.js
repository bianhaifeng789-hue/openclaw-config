/**
 * Consolidation lock mechanism for AutoDream.
 *
 * Lock file whose mtime IS lastConsolidatedAt.
 * Prevents concurrent consolidation runs.
 *
 * Adapted from Claude Code's services/autoDream/consolidationLock.ts
 */
import { mkdir, readFile, stat, unlink, utimes, writeFile } from 'fs/promises';
import { join } from 'path';
const LOCK_FILE = '.consolidate-lock';
// Stale past this even if the PID is live (PID reuse guard)
const HOLDER_STALE_MS = 60 * 60 * 1000; // 1 hour
/**
 * Get the lock file path.
 * Uses OpenClaw's memory directory.
 */
export function getLockPath(memoryRoot) {
    return join(memoryRoot, LOCK_FILE);
}
/**
 * Read lastConsolidatedAt from lock file mtime.
 * Returns 0 if lock file doesn't exist.
 */
export async function readLastConsolidatedAt(memoryRoot) {
    const path = getLockPath(memoryRoot);
    try {
        const s = await stat(path);
        return s.mtimeMs;
    }
    catch {
        return 0;
    }
}
/**
 * Acquire consolidation lock.
 * Returns priorMtime for rollback, or null if blocked.
 *
 * Success → do nothing, mtime stays at now.
 * Failure → rollbackConsolidationLock(priorMtime) rewinds mtime.
 * Crash   → mtime stuck, dead PID → next process reclaims.
 */
export async function tryAcquireConsolidationLock(memoryRoot) {
    const path = getLockPath(memoryRoot);
    let mtimeMs;
    let holderPid;
    try {
        const [s, raw] = await Promise.all([stat(path), readFile(path, 'utf8')]);
        mtimeMs = s.mtimeMs;
        const parsed = parseInt(raw.trim(), 10);
        holderPid = Number.isFinite(parsed) ? parsed : undefined;
    }
    catch {
        // ENOENT — no prior lock
    }
    // Check if lock is stale or holder is dead
    if (mtimeMs !== undefined && Date.now() - mtimeMs < HOLDER_STALE_MS) {
        if (holderPid !== undefined && isProcessRunning(holderPid)) {
            console.log(`[ConsolidationLock] Lock held by live PID ${holderPid}`);
            return null;
        }
        // Dead PID or unparseable body — reclaim
    }
    // Ensure memory directory exists
    await mkdir(memoryRoot, { recursive: true });
    await writeFile(path, String(process.pid));
    // Verify we won the race
    let verify;
    try {
        verify = await readFile(path, 'utf8');
    }
    catch {
        return null;
    }
    if (parseInt(verify.trim(), 10) !== process.pid) {
        return null; // Lost the race
    }
    return mtimeMs ?? 0;
}
/**
 * Rollback lock after failed consolidation.
 * priorMtime 0 → unlink (restore no-file).
 */
export async function rollbackConsolidationLock(memoryRoot, priorMtime) {
    const path = getLockPath(memoryRoot);
    try {
        if (priorMtime === 0) {
            await unlink(path);
            return;
        }
        await writeFile(path, '');
        const t = priorMtime / 1000; // utimes wants seconds
        await utimes(path, t, t);
    }
    catch (e) {
        console.error(`[ConsolidationLock] Rollback failed: ${e.message}`);
    }
}
/**
 * Check if a process is running.
 */
function isProcessRunning(pid) {
    try {
        // Send signal 0 to check if process exists
        process.kill(pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Stamp from manual consolidation.
 */
export async function recordConsolidation(memoryRoot) {
    try {
        await mkdir(memoryRoot, { recursive: true });
        await writeFile(getLockPath(memoryRoot), String(process.pid));
    }
    catch (e) {
        console.error(`[ConsolidationLock] Record failed: ${e.message}`);
    }
}
//# sourceMappingURL=consolidation-lock.js.map