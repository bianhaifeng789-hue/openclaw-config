/**
 * Team Memory Service - 团队记忆共享
 *
 * 借鉴 Claude Code 的 teamMemPaths 模块，支持：
 * - 团队记忆路径管理
 * - 私人/团队记忆分离
 * - 记忆类型分类（user/feedback/project/reference）
 * - 记忆同步状态
 */
import { join } from 'path';
// ============================================================================
// Constants
// ============================================================================
export const ENTRYPOINT_NAME = 'MEMORY.md';
export const MAX_ENTRYPOINT_LINES = 200;
export const MAX_ENTRYPOINT_BYTES = 25_000;
export const MEMORY_TYPES = ['user', 'feedback', 'project', 'reference'];
/**
 * 记忆类型对应的 scope
 */
export const MEMORY_TYPE_SCOPE = {
    user: 'private', // 用户偏好 - 私人
    feedback: 'team', // 反馈信息 - 团队共享
    project: 'team', // 项目进展 - 团队共享
    reference: 'team', // 参考资料 - 团队共享
};
/**
 * 记忆类型说明
 */
export const MEMORY_TYPE_DESCRIPTIONS = {
    user: 'User preferences, personal context, individual decisions',
    feedback: 'Team feedback, lessons learned, improvement suggestions',
    project: 'Project progress, milestones, key decisions',
    reference: 'Reference materials, documentation, best practices',
};
// ============================================================================
// Error Classes
// ============================================================================
export class PathTraversalError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PathTraversalError';
    }
}
// ============================================================================
// Path Sanitization
// ============================================================================
/**
 * 清理路径键，防止路径遍历攻击
 */
export function sanitizePathKey(key) {
    // Null bytes can truncate paths in C-based syscalls
    if (key.includes('\0')) {
        throw new PathTraversalError(`Null byte in path key: "${key}"`);
    }
    // URL-encoded traversals (e.g. %2e%2e%2f = ../)
    let decoded;
    try {
        decoded = decodeURIComponent(key);
    }
    catch {
        decoded = key;
    }
    if (decoded !== key && (decoded.includes('..') || decoded.includes('/'))) {
        throw new PathTraversalError(`URL-encoded traversal in path key: "${key}"`);
    }
    // Unicode normalization attacks
    const normalized = key.normalize('NFKC');
    if (normalized !== key &&
        (normalized.includes('..') ||
            normalized.includes('/') ||
            normalized.includes('\\') ||
            normalized.includes('\0'))) {
        throw new PathTraversalError(`Unicode-normalized traversal in path key: "${key}"`);
    }
    // Reject backslashes
    if (key.includes('\\')) {
        throw new PathTraversalError(`Backslash in path key: "${key}"`);
    }
    // Reject absolute paths
    if (key.startsWith('/')) {
        throw new PathTraversalError(`Absolute path key: "${key}"`);
    }
    return key;
}
// ============================================================================
// Memory Path Management
// ============================================================================
/**
 * 获取私人记忆路径
 */
export function getPrivateMemPath(workspaceRoot) {
    return join(workspaceRoot, 'memory', 'private');
}
/**
 * 获取团队记忆路径
 */
export function getTeamMemPath(workspaceRoot) {
    return join(workspaceRoot, 'memory', 'team');
}
/**
 * 根据类型获取对应的记忆路径
 */
export function getMemoryPathByType(workspaceRoot, type) {
    const scope = MEMORY_TYPE_SCOPE[type];
    return scope === 'private'
        ? getPrivateMemPath(workspaceRoot)
        : getTeamMemPath(workspaceRoot);
}
/**
 * 检查团队记忆是否启用
 */
export function isTeamMemoryEnabled(config) {
    if (!config.autoMemoryEnabled) {
        return false;
    }
    return config.enabled;
}
// ============================================================================
// Memory Entry Builder
// ============================================================================
/**
 * 记忆文件 Frontmatter 格式示例
 */
export const MEMORY_FRONTMATTER_EXAMPLE = [
    '```markdown',
    '---',
    'name: Memory title',
    'description: One-line hook for recall',
    'type: user | feedback | project | reference',
    '---',
    '',
    'Memory content here...',
    '```',
];
/**
 * 创建记忆条目
 */
export function createMemoryEntry(name, description, type, content) {
    const now = Date.now();
    const scope = MEMORY_TYPE_SCOPE[type];
    return {
        name,
        description,
        type,
        scope,
        path: '', // 实际写入时填充
        content,
        createdAt: now,
        updatedAt: now,
    };
}
/**
 * 构建记忆文件内容（带 Frontmatter）
 */
export function buildMemoryFileContent(entry) {
    return [
        '---',
        `name: ${entry.name}`,
        `description: ${entry.description}`,
        `type: ${entry.type}`,
        `created: ${new Date(entry.createdAt).toISOString()}`,
        `updated: ${new Date(entry.updatedAt).toISOString()}`,
        '---',
        '',
        entry.content || '',
    ].join('\n');
}
// ============================================================================
// Memory Index Management
// ============================================================================
/**
 * 构建 MEMORY.md 入口点索引
 */
export function buildMemoryIndexContent(entries) {
    const lines = [
        '# Memory Index',
        '',
        `Last updated: ${new Date().toISOString()}`,
        '',
        '## Private Memories',
        '',
    ];
    // 私人记忆
    const privateEntries = entries.filter(e => e.scope === 'private');
    for (const entry of privateEntries) {
        lines.push(`- [${entry.name}](private/${entry.path}) — ${entry.description}`);
    }
    lines.push('', '## Team Memories', '');
    // 团队记忆
    const teamEntries = entries.filter(e => e.scope === 'team');
    for (const entry of teamEntries) {
        lines.push(`- [${entry.name}](team/${entry.path}) — ${entry.description}`);
    }
    // 添加类型说明
    lines.push('', '## Memory Types', '');
    for (const type of MEMORY_TYPES) {
        const scope = MEMORY_TYPE_SCOPE[type];
        const desc = MEMORY_TYPE_DESCRIPTIONS[type];
        lines.push(`- **${type}** (${scope}): ${desc}`);
    }
    return lines.join('\n');
}
/**
 * 检查入口点是否需要截断
 */
export function checkEntrypointTruncation(content) {
    const lines = content.split('\n');
    const byteCount = Buffer.byteLength(content, 'utf-8');
    return {
        wasLineTruncated: lines.length > MAX_ENTRYPOINT_LINES,
        wasByteTruncated: byteCount > MAX_ENTRYPOINT_BYTES,
        lineCount: lines.length,
        byteCount,
    };
}
class TeamMemorySyncServiceImpl {
    config;
    workspaceRoot;
    entriesCreated = 0;
    indicesBuilt = 0;
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.config = {
            enabled: process.env.OPENCLAW_TEAM_MEMORY === 'true',
            autoMemoryEnabled: true,
            privateDir: getPrivateMemPath(workspaceRoot),
            teamDir: getTeamMemPath(workspaceRoot),
            featureFlag: 'openclaw_team_memory',
        };
    }
    getPrivatePath() {
        return this.config.privateDir;
    }
    getTeamPath() {
        return this.config.teamDir;
    }
    isEnabled() {
        return isTeamMemoryEnabled(this.config);
    }
    createEntry(name, description, type, content) {
        this.entriesCreated++;
        return createMemoryEntry(name, description, type, content);
    }
    buildIndex(entries) {
        this.indicesBuilt++;
        return buildMemoryIndexContent(entries);
    }
    getSyncStatus() {
        return {
            lastSyncAt: Date.now(),
            pendingWrites: 0,
            pendingDeletes: 0,
            conflicts: [],
        };
    }
    getStats() {
        return {
            entriesCreated: this.entriesCreated,
            indicesBuilt: this.indicesBuilt,
        };
    }
    reset() {
        this.entriesCreated = 0;
        this.indicesBuilt = 0;
    }
}
// ============================================================================
// Factory
// ============================================================================
export function createTeamMemoryService(workspaceRoot) {
    return new TeamMemorySyncServiceImpl(workspaceRoot);
}
// Default instance
export const teamMemoryService = createTeamMemoryService(process.env.OPENCLAW_WORKSPACE || process.cwd());
// ============================================================================
// Export Stats for Heartbeat
// ============================================================================
export function getStats() {
    return teamMemoryService.getStats();
}
export function reset() {
    teamMemoryService.reset();
}
//# sourceMappingURL=team-memory-service.js.map