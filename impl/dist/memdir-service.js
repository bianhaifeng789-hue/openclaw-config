/**
 * Memdir Service - 智能记忆选择
 * Phase 10 - Claude Code 记忆系统
 *
 * 借鉴 Claude Code memdir/ 目录
 * 功能: 智能选择相关记忆、避免加载所有记忆、节省 tokens
 */
import { readdir, stat } from 'fs/promises';
import { basename, join } from 'path';
// ============================================
// Constants
// ============================================
export const MEMORY_TYPES = [
    'user',
    'feedback',
    'project',
    'reference',
];
const MAX_MEMORY_FILES = 200;
const FRONTMATTER_MAX_LINES = 30;
const MAX_RELEVANT_MEMORIES = 5;
// ============================================
// State Management
// ============================================
let _state = {
    totalFiles: 0,
    lastScan: null,
    selectedCount: 0,
    savedTokens: 0,
};
let _config = {
    memoryDir: '',
    maxFiles: MAX_MEMORY_FILES,
    maxLines: FRONTMATTER_MAX_LINES,
    autoMemoryEnabled: true,
};
export function getState() {
    return { ..._state };
}
export function resetState() {
    _state = {
        totalFiles: 0,
        lastScan: null,
        selectedCount: 0,
        savedTokens: 0,
    };
}
export function setConfig(config) {
    _config = { ..._config, ...config };
}
export function getConfig() {
    return { ..._config };
}
// ============================================
// Core Functions
// ============================================
/**
 * 解析记忆类型
 */
export function parseMemoryType(raw) {
    if (typeof raw !== 'string')
        return undefined;
    return MEMORY_TYPES.find(t => t === raw);
}
/**
 * 计算记忆年龄（天数）
 */
export function memoryAgeDays(mtimeMs) {
    return Math.max(0, Math.floor((Date.now() - mtimeMs) / 86_400_000));
}
/**
 * 人类可读年龄字符串
 */
export function memoryAge(mtimeMs) {
    const d = memoryAgeDays(mtimeMs);
    if (d === 0)
        return 'today';
    if (d === 1)
        return 'yesterday';
    return `${d} days ago`;
}
/**
 * 记忆新鲜度警告
 */
export function memoryFreshnessText(mtimeMs) {
    const d = memoryAgeDays(mtimeMs);
    if (d <= 1)
        return '';
    return (`此记忆已 ${d} 天。记忆是时间点观察，非实时状态 — ` +
        `代码行为或文件引用可能已过期。请在断言前验证当前代码。`);
}
/**
 * 解析 Frontmatter（简化版）
 */
export function parseFrontmatter(content) {
    const lines = content.split('\n');
    const frontmatter = {};
    let bodyStart = 0;
    // 检查 YAML frontmatter (--- 开始)
    if (lines[0] === '---') {
        let i = 1;
        while (i < lines.length && lines[i] !== '---') {
            const line = lines[i];
            const match = line.match(/^(\w+):\s*(.*)$/);
            if (match) {
                frontmatter[match[1]] = match[2].trim();
            }
            i++;
        }
        bodyStart = i + 1;
    }
    const body = lines.slice(bodyStart).join('\n').trim();
    return { frontmatter, body };
}
/**
 * 扫描记忆目录
 * 对应 Claude Code scanMemoryFiles()
 */
export async function scanMemoryFiles(memoryDir, signal) {
    try {
        const entries = await readdir(memoryDir, { recursive: true });
        const mdFiles = entries.filter(f => typeof f === 'string' &&
            f.endsWith('.md') &&
            basename(f) !== 'MEMORY.md');
        const headerResults = await Promise.allSettled(mdFiles.map(async (relativePath) => {
            const filePath = join(memoryDir, relativePath);
            // 获取文件状态
            const stats = await stat(filePath);
            const mtimeMs = stats.mtimeMs;
            // 读取前几行获取 frontmatter
            const content = await readFileHead(filePath, FRONTMATTER_MAX_LINES, signal);
            const { frontmatter } = parseFrontmatter(content);
            return {
                filename: relativePath,
                filePath,
                mtimeMs,
                description: frontmatter.description || null,
                type: parseMemoryType(frontmatter.type),
            };
        }));
        const headers = headerResults
            .filter((r) => r.status === 'fulfilled')
            .map(r => r.value)
            .sort((a, b) => b.mtimeMs - a.mtimeMs)
            .slice(0, _config.maxFiles);
        _state.totalFiles = headers.length;
        _state.lastScan = new Date().toISOString();
        return headers;
    }
    catch {
        return [];
    }
}
/**
 * 读取文件头部（简化版）
 */
async function readFileHead(filePath, maxLines, signal) {
    // 这里简化实现，实际应该用 fs.promises.readFile 限制行数
    // Claude Code 用 readFileInRange 工具
    const { readFile } = await import('fs/promises');
    try {
        const content = await readFile(filePath, { encoding: 'utf8', signal });
        const lines = content.split('\n').slice(0, maxLines);
        return lines.join('\n');
    }
    catch {
        return '';
    }
}
/**
 * 格式化记忆清单
 */
export function formatMemoryManifest(memories) {
    return memories
        .map(m => {
        const tag = m.type ? `[${m.type}] ` : '';
        const ts = new Date(m.mtimeMs).toISOString();
        return m.description
            ? `- ${tag}${m.filename} (${ts}): ${m.description}`
            : `- ${tag}${m.filename} (${ts})`;
    })
        .join('\n');
}
/**
 * 查找相关记忆（核心功能）
 * 对应 Claude Code findRelevantMemories()
 *
 * **关键**: 使用小模型（如 Sonnet）选择，而非手动匹配
 */
export async function findRelevantMemories(query, memoryDir, signal, recentTools = [], alreadySurfaced = new Set()) {
    // 扫描记忆文件
    const memories = await scanMemoryFiles(memoryDir, signal);
    if (memories.length === 0) {
        return [];
    }
    // 过滤已展示的
    const candidates = memories.filter(m => !alreadySurfaced.has(m.filePath));
    if (candidates.length === 0) {
        return [];
    }
    // **核心**: 用 Sonnet 子查询选择最相关的 5 个
    // 这是 Claude Code 的关键创新 —— 不加载所有记忆，而是智能选择
    const selected = await selectRelevantMemoriesWithModel(query, candidates, signal, recentTools);
    // 更新统计
    _state.selectedCount += selected.length;
    // 估算节省的 tokens
    const totalTokens = estimateTokensForMemories(memories);
    const selectedTokens = estimateTokensForMemories(selected);
    _state.savedTokens += totalTokens - selectedTokens;
    return selected.map(m => ({
        path: m.filePath,
        mtimeMs: m.mtimeMs,
        ageDays: memoryAgeDays(m.mtimeMs),
        freshness: memoryFreshnessText(m.mtimeMs),
    }));
}
/**
 * 用模型选择相关记忆（子查询）
 *
 * **这是关键创新点**：
 * - Claude Code 用 Sonnet 模型选择，而非简单关键词匹配
 * - 模型根据 query + memory manifest 决定哪些有用
 * - 最多选择 5 个，节省大量 tokens
 */
async function selectRelevantMemoriesWithModel(query, memories, signal, recentTools = []) {
    // 构建选择提示
    const manifest = formatMemoryManifest(memories);
    const systemPrompt = `你正在为 OpenClaw 选择处理用户查询时有用的记忆。
你将获得用户的查询和可用记忆文件列表（文件名和描述）。

返回对处理用户查询**明确有用**的记忆文件名列表（最多 5 个）。
只包含你**确定**有帮助的记忆，基于其名称和描述。
- 如果不确定某个记忆是否有用，不要包含它。要选择性和审慎。
- 如果列表中没有明确有用的记忆，返回空列表。
- 如果提供了最近使用的工具列表，不要选择那些工具的使用参考或 API 文档记忆（OpenClaw 已在使用）。但**仍要选择**包含这些工具警告、陷阱或已知问题的记忆 —— 使用时正是这些重要的时候。

格式: 返回 JSON 数组 ["filename1.md", "filename2.md"]`;
    // **实际实现需要调用 OpenClaw sessions_spawn**
    // 这里简化为启发式选择（实际应该用 Sonnet 子查询）
    // 启发式选择（临时方案）
    const heuristicsSelected = heuristicSelect(query, memories, recentTools);
    // TODO: 接入 OpenClaw sessions_spawn
    // const result = await sessions_spawn({
    //   task: `Query: ${query}\n\nMemories:\n${manifest}\n\nRecent tools: ${recentTools.join(', ')}`,
    //   model: 'sonnet', // 小模型
    //   lightContext: true,
    // })
    return heuristicsSelected;
}
/**
 * 启发式选择（临时方案，直到接入 sessions_spawn）
 */
function heuristicSelect(query, memories, recentTools) {
    // 关键词匹配
    const queryLower = query.toLowerCase();
    const scored = memories.map(m => {
        let score = 0;
        // 描述匹配
        if (m.description) {
            const descLower = m.description.toLowerCase();
            // 描述中出现查询关键词
            for (const word of queryLower.split(/\s+/)) {
                if (word.length > 3 && descLower.includes(word)) {
                    score += 10;
                }
            }
        }
        // 文件名匹配
        const filenameLower = m.filename.toLowerCase();
        for (const word of queryLower.split(/\s+/)) {
            if (word.length > 3 && filenameLower.includes(word)) {
                score += 5;
            }
        }
        // 类型偏好
        if (m.type === 'user')
            score += 15; // 用户偏好优先
        if (m.type === 'feedback')
            score += 10; // 反馈其次
        if (m.type === 'project')
            score += 8; // 项目信息
        // 新鲜度偏好
        const ageDays = memoryAgeDays(m.mtimeMs);
        if (ageDays === 0)
            score += 20; // 今天
        if (ageDays === 1)
            score += 15; // 昨天
        if (ageDays <= 7)
            score += 10; // 一周内
        // 避免工具参考文档（已在用）
        for (const tool of recentTools) {
            if (filenameLower.includes(tool.toLowerCase()) &&
                !filenameLower.includes('warning') &&
                !filenameLower.includes('gotcha')) {
                score -= 50;
            }
        }
        return { memory: m, score };
    });
    // 按分数排序，取前 5
    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RELEVANT_MEMORIES)
        .map(s => s.memory);
}
/**
 * 估算记忆 tokens
 */
function estimateTokensForMemories(memories) {
    // 简化估算：平均每个记忆 ~500 tokens
    return memories.length * 500;
}
/**
 * 获取记忆目录路径
 */
export function getMemoryDir(baseDir) {
    return join(baseDir, 'memory');
}
/**
 * 检查自动记忆是否启用
 */
export function isAutoMemoryEnabled() {
    // 检查环境变量
    const envVal = process.env.OPENCLAW_DISABLE_AUTO_MEMORY;
    if (envVal === '1' || envVal === 'true') {
        return false;
    }
    return _config.autoMemoryEnabled;
}
// ============================================
// OpenClaw Integration Hooks
// ============================================
/**
 * 创建记忆选择 Hook（接入系统提示）
 */
export function createMemdirHook() {
    return {
        name: 'memdir',
        beforePrompt: async (params) => {
            if (!isAutoMemoryEnabled()) {
                return { memories: [] };
            }
            const memoryDir = getMemoryDir(_config.memoryDir || process.cwd());
            const memories = await findRelevantMemories(params.query, memoryDir, undefined, params.recentTools, params.alreadySurfaced);
            return { memories };
        },
        formatMemoriesForPrompt: (memories) => {
            if (memories.length === 0)
                return '';
            const lines = memories.map(m => {
                const age = memoryAge(m.mtimeMs);
                const freshness = m.freshness ? ` (${m.freshness})` : '';
                return `- ${m.path} (${age})${freshness}`;
            });
            return `<relevant_memories>
相关记忆（${memories.length} 个，按相关性选择）:
${lines.join('\n')}
</relevant_memories>`;
        },
    };
}
/**
 * 导出统计信息
 */
export function getSystemStats() {
    const avgSelected = _state.totalFiles > 0
        ? Math.round(_state.selectedCount / (_state.totalFiles / MAX_RELEVANT_MEMORIES) * 100) / 100
        : 0;
    const selectionRate = _state.totalFiles > 0
        ? `${Math.round(MAX_RELEVANT_MEMORIES / _state.totalFiles * 100)}%`
        : '0%';
    return {
        state: getState(),
        config: getConfig(),
        efficiency: {
            avgSelected: MAX_RELEVANT_MEMORIES,
            avgSavedTokens: _state.savedTokens,
            selectionRate,
        },
    };
}
/**
 * 重置所有状态
 */
export function resetAll() {
    resetState();
    _config = {
        memoryDir: '',
        maxFiles: MAX_MEMORY_FILES,
        maxLines: FRONTMATTER_MAX_LINES,
        autoMemoryEnabled: true,
    };
}
//# sourceMappingURL=memdir-service.js.map