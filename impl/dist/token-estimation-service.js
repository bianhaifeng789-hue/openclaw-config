/**
 * Token Estimation Service
 * Phase 12 - Token 估算系统
 *
 * 借鉴 Claude Code services/tokenEstimation.ts (17KB)
 * 功能: 精确 token 估算、混合语言支持、工具调用估算
 */
// ============================================
// Constants
// ============================================
// Token 估算规则（基于实际测量）
const DEFAULT_CHARS_PER_TOKEN = {
    english: 4, // 英文 ~4 chars/token
    chinese: 1.5, // 中文 ~1.5 chars/token
    code: 3, // 代码 ~3 chars/token
    mixed: 2.5, // 混合 ~2.5 chars/token
};
const MESSAGE_OVERHEAD = 4; // 每条消息固定 overhead
const TOOL_OVERHEAD = 20; // 每个工具定义 overhead
const SYSTEM_PROMPT_OVERHEAD = 10;
const MAX_TOKENS_DEFAULT = 4096;
const MAX_CONTEXT_TOKENS = 200000;
// ============================================
// State Management
// ============================================
let _config = {
    charsPerToken: DEFAULT_CHARS_PER_TOKEN.mixed,
    overheadPerMessage: MESSAGE_OVERHEAD,
    overheadPerTool: TOOL_OVERHEAD,
    maxTokensDefault: MAX_TOKENS_DEFAULT,
};
let _lastEstimation = null;
export function getConfig() {
    return { ..._config };
}
export function setConfig(config) {
    _config = { ..._config, ...config };
}
export function getLastEstimation() {
    return _lastEstimation;
}
// ============================================
// Core Functions
// ============================================
/**
 * 估算文本 tokens（混合语言）
 */
export function estimateTextTokens(text) {
    if (!text)
        return 0;
    // 检测语言类型
    const langType = detectLanguageType(text);
    const charsPerToken = DEFAULT_CHARS_PER_TOKEN[langType];
    // 基础估算
    const baseTokens = Math.ceil(text.length / charsPerToken);
    // 考虑特殊字符（换行、代码块标记等）
    const specialChars = countSpecialChars(text);
    const specialTokens = Math.ceil(specialChars * 0.5);
    return baseTokens + specialTokens;
}
/**
 * 检测语言类型
 */
function detectLanguageType(text) {
    const chineseRatio = (text.match(/[\u4e00-\u9fa5]/g) || []).length / text.length;
    const codeRatio = (text.match(/[{}\[\]();=<>]/g) || []).length / text.length;
    if (chineseRatio > 0.3) {
        if (codeRatio > 0.1)
            return 'mixed';
        return 'chinese';
    }
    if (codeRatio > 0.15)
        return 'code';
    return 'english';
}
/**
 * 计算特殊字符数量
 */
function countSpecialChars(text) {
    const specialPatterns = [
        /\n/g, // 换行
        /```/g, // 代码块标记
        /#{1,6}/g, // Markdown 标题
        /\*\*/g, // 粗体
        /\_\_/g, // 斜体
        /\[.*?\]/g, // 链接
        /<.*?>/g, // HTML/XML 标签
    ];
    let count = 0;
    for (const pattern of specialPatterns) {
        const matches = text.match(pattern);
        if (matches)
            count += matches.length;
    }
    return count;
}
/**
 * 估算消息 tokens
 */
export function estimateMessagesTokens(messages) {
    let total = 0;
    for (const msg of messages) {
        // 消息 overhead
        total += MESSAGE_OVERHEAD;
        // 角色 tokens
        total += 1; // role: "user" 或 "assistant"
        // 内容 tokens
        if (typeof msg.content === 'string') {
            total += estimateTextTokens(msg.content);
        }
        else if (Array.isArray(msg.content)) {
            // 多块内容（图片 + 文本）
            for (const block of msg.content) {
                if (block.type === 'text') {
                    total += estimateTextTokens(block.text || '');
                }
                else if (block.type === 'image') {
                    // 图片 tokens（简化估算）
                    total += 85; // Anthropic 图片基础 tokens
                }
            }
        }
    }
    return total;
}
/**
 * 估算工具定义 tokens
 */
export function estimateToolsTokens(tools) {
    let total = 0;
    for (const tool of tools) {
        // 工具 overhead
        total += TOOL_OVERHEAD;
        // 名称 tokens
        total += estimateTextTokens(tool.name);
        // 描述 tokens
        if (tool.description) {
            total += estimateTextTokens(tool.description);
        }
        // Schema tokens（简化估算）
        if (tool.input_schema) {
            const schemaStr = JSON.stringify(tool.input_schema);
            total += estimateTextTokens(schemaStr) * 0.5; // Schema 压缩率高
        }
    }
    return total;
}
/**
 * 估算系统提示 tokens
 */
export function estimateSystemPromptTokens(systemPrompt) {
    return SYSTEM_PROMPT_OVERHEAD + estimateTextTokens(systemPrompt);
}
/**
 * 完整估算
 */
export function estimateTokens(params) {
    const breakdown = {
        systemPrompt: 0,
        messages: 0,
        tools: 0,
        attachments: 0,
    };
    // 系统提示
    if (params.systemPrompt) {
        breakdown.systemPrompt = estimateSystemPromptTokens(params.systemPrompt);
    }
    // 消息
    if (params.messages) {
        breakdown.messages = estimateMessagesTokens(params.messages);
    }
    // 工具
    if (params.tools) {
        breakdown.tools = estimateToolsTokens(params.tools);
    }
    // 附件（简化估算）
    if (params.attachments) {
        for (const att of params.attachments) {
            if (att.type === 'image') {
                breakdown.attachments += 85;
            }
            else {
                // 文件按大小估算
                breakdown.attachments += Math.ceil(att.size / 1000);
            }
        }
    }
    const inputTokens = breakdown.systemPrompt + breakdown.messages + breakdown.tools + breakdown.attachments;
    const outputTokens = _config.maxTokensDefault;
    const totalTokens = inputTokens + outputTokens;
    const toolTokens = breakdown.tools;
    _lastEstimation = {
        totalTokens,
        inputTokens,
        outputTokens,
        toolTokens,
        breakdown,
    };
    return _lastEstimation;
}
/**
 * 计算剩余 token budget
 */
export function calculateBudget(usedTokens, maxContext = MAX_CONTEXT_TOKENS) {
    const remaining = maxContext - usedTokens;
    const percentage = Math.round((usedTokens / maxContext) * 100);
    return {
        total: maxContext,
        used: usedTokens,
        remaining,
        percentage,
    };
}
/**
 * 生成预算警告
 */
export function getBudgetWarning(budget) {
    if (budget.percentage < 50) {
        return '';
    }
    if (budget.percentage < 75) {
        return `⚠️ Context 已使用 ${budget.percentage}%（${budget.used} tokens）
剩余: ${budget.remaining} tokens`;
    }
    if (budget.percentage < 90) {
        return `⚠️ **Context 接近上限**
已使用 ${budget.percentage}%（${budget.used} tokens）
建议触发 compact 或减少对话长度`;
    }
    return `❌ **Context 即将耗尽**
已使用 ${budget.percentage}%（${budget.used} tokens）
必须触发 compact 或新建会话`;
}
// ============================================
// OpenClaw Integration Hooks
// ============================================
/**
 * 创建 token 估算 Hook（接入消息生成）
 */
export function createTokenEstimationHook() {
    return {
        name: 'token-estimation',
        beforeMessage: (params) => {
            const estimation = estimateTokens(params);
            const budget = calculateBudget(estimation.inputTokens);
            return {
                estimation,
                budget,
                warning: getBudgetWarning(budget),
            };
        },
        afterResponse: (usage) => {
            // 更新实际 token 使用
            const actualTotal = usage.input_tokens + usage.output_tokens;
            const budget = calculateBudget(actualTotal);
            return {
                actualUsage: usage,
                budget,
            };
        },
    };
}
/**
 * 导出统计信息
 */
export function getSystemStats() {
    return {
        config: getConfig(),
        lastEstimation: getLastEstimation(),
        languageRatios: DEFAULT_CHARS_PER_TOKEN,
    };
}
/**
 * 重置所有状态
 */
export function resetAll() {
    _lastEstimation = null;
    _config = {
        charsPerToken: DEFAULT_CHARS_PER_TOKEN.mixed,
        overheadPerMessage: MESSAGE_OVERHEAD,
        overheadPerTool: TOOL_OVERHEAD,
        maxTokensDefault: MAX_TOKENS_DEFAULT,
    };
}
//# sourceMappingURL=token-estimation-service.js.map