/**
 * Phase 16: MagicDocs 自动文档维护
 *
 * 借鉴 Claude Code 的 magicDocs.ts
 *
 * 功能：
 * - 检测 `# MAGIC DOC: [title]` 标记
 * - 斜体指令: `*instructions*`
 * - 后台 forked subagent 更新文档
 * - 从对话中提取新知识
 *
 * OpenClaw 飞书适配：
 * - 自动维护飞书文档
 * - 定期更新项目文档
 * - 减少手动维护工作量
 */
// ============================================================================
// Patterns
// ============================================================================
/**
 * Magic Doc 标记模式
 *
 * 格式: # MAGIC DOC: [title]
 * 匹配文件开头的标记
 */
const MAGIC_DOC_HEADER_PATTERN = /^#\s*MAGIC\s+DOC:\s*(.+)$/im;
/**
 * 斜体指令模式
 *
 * 格式: *instructions*
 * 匹配标记后的第一行斜体内容
 */
const ITALICS_PATTERN = /^[_*](.+?)[_*]\s*$/m;
// ============================================================================
// State Management
// ============================================================================
let state = {
    trackedDocs: new Map(),
    totalDocs: 0,
    totalUpdates: 0,
    lastScanAt: 0,
};
// ============================================================================
// Header Detection
// ============================================================================
/**
 * 检测文件是否包含 Magic Doc 标记
 *
 * 返回标题和可选指令，或 null 如果不是 Magic Doc
 */
export function detectMagicDocHeader(content) {
    const match = content.match(MAGIC_DOC_HEADER_PATTERN);
    if (!match || !match[1]) {
        return null;
    }
    const title = match[1].trim();
    // 查找标记后的斜体指令
    const headerEndIndex = match.index + match[0].length;
    const afterHeader = content.slice(headerEndIndex);
    // 匹配: newline, optional blank line, then content line
    const nextLineMatch = afterHeader.match(/^\s*\n(?:\s*\n)?(.+?)(?:\n|$)/);
    if (nextLineMatch && nextLineMatch[1]) {
        const nextLine = nextLineMatch[1];
        const italicsMatch = nextLine.match(ITALICS_PATTERN);
        if (italicsMatch && italicsMatch[1]) {
            const instructions = italicsMatch[1].trim();
            return {
                title,
                instructions,
            };
        }
    }
    return { title };
}
/**
 * 检查是否是 Magic Doc 文件
 */
export function isMagicDoc(content) {
    return detectMagicDocHeader(content) !== null;
}
// ============================================================================
// Doc Registration
// ============================================================================
/**
 * 注册 Magic Doc 文件
 *
 * 只注册一次，后续 hook 总是读取最新内容
 */
export function registerMagicDoc(filePath, content) {
    const header = detectMagicDocHeader(content);
    if (!header) {
        return null;
    }
    // 检查是否已跟踪
    if (state.trackedDocs.has(filePath)) {
        return state.trackedDocs.get(filePath);
    }
    // 创建新 Magic Doc
    const doc = {
        path: filePath,
        title: header.title,
        instructions: header.instructions,
        lastUpdateAt: Date.now(),
        updateCount: 0,
        tracked: true,
    };
    state.trackedDocs.set(filePath, doc);
    state.totalDocs++;
    return doc;
}
/**
 * 清除所有跟踪的 Magic Docs
 */
export function clearTrackedMagicDocs() {
    state.trackedDocs.clear();
    state.totalDocs = 0;
}
// ============================================================================
// Doc Update Logic
// ============================================================================
/**
 * 构建 Magic Doc 更新提示
 *
 * 借鉴 Claude Code 的 buildMagicDocsUpdatePrompt
 */
export function buildMagicDocUpdatePrompt(doc, conversationSummary) {
    const instructions = doc.instructions
        ? `\n指令: ${doc.instructions}`
        : '';
    return `# 更新 Magic Doc

请根据最近的对话内容更新以下文档：

## 文档信息
- 标题: ${doc.title}
- 路径: ${doc.path}${instructions}

## 最近对话摘要
${conversationSummary}

## 更新要求
1. 保持文档结构不变
2. 添加新的相关内容
3. 避免重复已有内容
4. 保持简洁、有价值

## 输出
请直接输出更新后的文档内容（保留 MAGIC DOC 标记）。
`;
}
/**
 * 更新 Magic Doc
 *
 * OpenClaw 适配：
 * - 使用 forked agent 更新文档
 * - 从最近对话提取内容
 * - 更新统计信息
 */
export async function updateMagicDoc(docPath, conversationSummary) {
    const doc = state.trackedDocs.get(docPath);
    if (!doc) {
        return {
            success: false,
            docPath,
            error: 'doc_not_tracked',
        };
    }
    try {
        // 构建更新提示
        const prompt = buildMagicDocUpdatePrompt(doc, conversationSummary);
        // TODO: 实际调用 sessions_spawn forked agent
        // 暂时返回成功（模拟）
        const updatedContent = `# MAGIC DOC: ${doc.title}
${doc.instructions ? `*${doc.instructions}*` : ''}

最后更新: ${new Date().toLocaleString('zh-CN')}
更新次数: ${doc.updateCount + 1}
`;
        // 更新统计
        doc.lastUpdateAt = Date.now();
        doc.updateCount++;
        state.totalUpdates++;
        state.trackedDocs.set(docPath, doc);
        return {
            success: true,
            docPath,
            content: updatedContent,
        };
    }
    catch (error) {
        return {
            success: false,
            docPath,
            error: String(error),
        };
    }
}
// ============================================================================
// Batch Update
// ============================================================================
/**
 * 批量更新所有 Magic Docs
 *
 * OpenClaw 适配：heartbeat 定期调用
 */
export async function updateAllMagicDocs(conversationSummary) {
    const results = [];
    for (const docPath of state.trackedDocs.keys()) {
        const result = await updateMagicDoc(docPath, conversationSummary);
        results.push(result);
    }
    return results;
}
// ============================================================================
// State Accessors
// ============================================================================
export function getState() {
    return {
        trackedDocs: new Map(state.trackedDocs),
        totalDocs: state.totalDocs,
        totalUpdates: state.totalUpdates,
        lastScanAt: state.lastScanAt,
    };
}
export function resetState() {
    state = {
        trackedDocs: new Map(),
        totalDocs: 0,
        totalUpdates: 0,
        lastScanAt: 0,
    };
}
export function getTrackedDocs() {
    return Array.from(state.trackedDocs.values());
}
export function getDoc(path) {
    return state.trackedDocs.get(path) || null;
}
// ============================================================================
// Feishu Card
// ============================================================================
/**
 * 构建飞书 Magic Docs 卡片
 */
export function createMagicDocsCard() {
    const docs = getTrackedDocs();
    if (docs.length === 0) {
        return {
            title: '📚 Magic Docs',
            content: '暂无跟踪的文档\n\n标记格式: `# MAGIC DOC: [title]`\n指令格式: `*instructions*`',
        };
    }
    const content = docs
        .map(d => `**${d.title}**\n路径: ${d.path}\n更新: ${d.updateCount} 次`)
        .join('\n\n');
    return {
        title: `📚 Magic Docs (${docs.length} 个)`,
        content: `${content}\n\n累计更新: ${state.totalUpdates} 次`,
    };
}
// ============================================================================
// Hook Integration
// ============================================================================
/**
 * 创建 Magic Docs Hook
 *
 * 供 postSamplingHooks 使用
 */
export function createMagicDocsHook() {
    return {
        name: 'magic_docs',
        onFileRead: (path, content) => {
            registerMagicDoc(path, content);
        },
        shouldUpdate: () => {
            // 检查是否有跟踪的文档且超过更新间隔
            const docs = getTrackedDocs();
            if (docs.length === 0)
                return false;
            // 检查是否有文档超过 5 分钟未更新
            const now = Date.now();
            return docs.some(d => now - d.lastUpdateAt > 5 * 60 * 1000);
        },
        runUpdate: async () => {
            // TODO: 获取对话摘要
            const summary = '最近对话摘要...';
            return updateAllMagicDocs(summary);
        },
    };
}
// ============================================================================
// Magic Docs Service Object
// ============================================================================
export const magicDocsService = {
    detectHeader: detectMagicDocHeader,
    isMagicDoc,
    register: registerMagicDoc,
    clear: clearTrackedMagicDocs,
    update: updateMagicDoc,
    updateAll: updateAllMagicDocs,
    getState,
    resetState,
    getTrackedDocs,
    getDoc,
    createCard: createMagicDocsCard,
    createHook: createMagicDocsHook,
    // Patterns
    MAGIC_DOC_HEADER_PATTERN,
    ITALICS_PATTERN,
};
export default magicDocsService;
//# sourceMappingURL=magic-docs-service.js.map