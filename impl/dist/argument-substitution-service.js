/**
 * Phase 39: ArgumentSubstitution - 参数替换
 *
 * 借鉴 Claude Code 的 argumentSubstitution.ts
 *
 * 功能：$ARGUMENTS 参数替换，支持动态参数传递
 * 飞书场景：模板消息、动态命令参数
 */
// ============================================================================
// State
// ============================================================================
const DEFAULT_CONFIG = {
    maxSubstitutions: 100,
    escapeMode: 'double',
    enabled: true,
};
let stats = {
    totalSubstitutions: 0,
    userBindings: 0,
    systemBindings: 0,
    envBindings: 0,
    fileBindings: 0,
};
let bindings = new Map();
// ============================================================================
// Binding Management
// ============================================================================
/**
 * 设置参数绑定
 */
export function setBinding(key, value, source) {
    bindings.set(key, { key, value, source });
    switch (source) {
        case 'user':
            stats.userBindings++;
            break;
        case 'system':
            stats.systemBindings++;
            break;
        case 'env':
            stats.envBindings++;
            break;
        case 'file':
            stats.fileBindings++;
            break;
    }
}
/**
 * 获取参数绑定
 */
export function getBinding(key) {
    return bindings.get(key) || null;
}
/**
 * 删除参数绑定
 */
export function removeBinding(key) {
    return bindings.delete(key);
}
/**
 * 清除所有绑定
 */
export function clearBindings() {
    bindings.clear();
    stats.userBindings = 0;
    stats.systemBindings = 0;
    stats.envBindings = 0;
    stats.fileBindings = 0;
}
// ============================================================================
// Substitution
// ============================================================================
const ARGUMENT_PATTERN = /\$[A-Z_][A-Z0-9_]*|\$\{[A-Z_][A-Z0-9_]*\}/g;
/**
 * 执行参数替换
 */
export function substituteArguments(template) {
    let result = template;
    let substitutions = 0;
    result = result.replace(ARGUMENT_PATTERN, (match) => {
        if (substitutions >= DEFAULT_CONFIG.maxSubstitutions) {
            return match; // 达到限制，保留原值
        }
        // 提取变量名
        const key = match.startsWith('${')
            ? match.slice(2, -1) // ${VAR} → VAR
            : match.slice(1); // $VAR → VAR
        const binding = bindings.get(key);
        if (!binding) {
            // 尝试环境变量
            const envValue = process.env[key];
            if (envValue) {
                stats.envBindings++;
                stats.totalSubstitutions++;
                substitutions++;
                return envValue;
            }
            return match; // 未找到，保留原值
        }
        stats.totalSubstitutions++;
        substitutions++;
        // 根据转义模式处理
        switch (DEFAULT_CONFIG.escapeMode) {
            case 'single':
                return binding.value.replace(/'/g, "'\\''");
            case 'double':
                return binding.value.replace(/"/g, '\\"');
            default:
                return binding.value;
        }
    });
    return result;
}
/**
 * 批量替换
 */
export function substituteAll(templates) {
    return templates.map(t => substituteArguments(t));
}
/**
 * 检查模板中是否有未替换的参数
 */
export function hasUnresolvedArguments(template) {
    const unresolved = [];
    const matches = template.match(ARGUMENT_PATTERN);
    if (!matches)
        return unresolved;
    for (const match of matches) {
        const key = match.startsWith('${')
            ? match.slice(2, -1)
            : match.slice(1);
        if (!bindings.has(key) && !process.env[key]) {
            unresolved.push(key);
        }
    }
    return unresolved;
}
// ============================================================================
// Special Arguments
// ============================================================================
/**
 * 设置系统默认参数
 */
export function setSystemDefaults() {
    // 常用系统参数
    setBinding('HOME', process.env.HOME || '', 'system');
    setBinding('USER', process.env.USER || '', 'system');
    setBinding('SHELL', process.env.SHELL || '', 'system');
    setBinding('PWD', process.cwd(), 'system');
    setBinding('DATE', new Date().toISOString().split('T')[0], 'system');
    setBinding('TIME', new Date().toISOString().split('T')[1].split('.')[0], 'system');
    setBinding('WORKSPACE', process.env.WORKSPACE_ROOT || '', 'system');
}
/**
 * 从 JSON 文件加载参数
 */
export async function loadFromFile(filePath) {
    try {
        const content = await import('fs/promises').then(fs => fs.readFile(filePath, 'utf-8'));
        const data = JSON.parse(content);
        let loaded = 0;
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                setBinding(key.toUpperCase(), value, 'file');
                loaded++;
            }
        }
        return loaded;
    }
    catch {
        return 0;
    }
}
// ============================================================================
// Stats
// ============================================================================
export function getArgumentStats() {
    return {
        ...stats,
        config: DEFAULT_CONFIG,
        bindingCount: bindings.size,
    };
}
// ============================================================================
// Feishu Card
// ============================================================================
export function createArgumentSubstitutionCard() {
    const allBindings = Array.from(bindings.entries());
    return {
        title: '📝 参数绑定状态',
        content: `总绑定数: ${bindings.size}

用户绑定: ${stats.userBindings}
系统绑定: ${stats.systemBindings}
环境绑定: ${stats.envBindings}
文件绑定: ${stats.fileBindings}

总替换次数: ${stats.totalSubstitutions}`,
    };
}
// ============================================================================
// Service Object
// ============================================================================
export const argumentSubstitutionService = {
    set: setBinding,
    get: getBinding,
    remove: removeBinding,
    clear: clearBindings,
    substitute: substituteArguments,
    substituteAll,
    hasUnresolved: hasUnresolvedArguments,
    setDefaults: setSystemDefaults,
    loadFromFile,
    getStats: getArgumentStats,
    createCard: createArgumentSubstitutionCard,
};
export default argumentSubstitutionService;
//# sourceMappingURL=argument-substitution-service.js.map