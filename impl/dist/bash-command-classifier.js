/**
 * Bash Command Classifier - Bash 命令分类器
 *
 * 借鉴 Claude Code 的 bashClassifier.ts:
 * - permissions/bashClassifier.ts 的命令分类逻辑
 * - 智能识别命令类型和风险
 * - 为权限系统提供输入
 *
 * OpenClaw 适配：
 * - 飞书场景下的命令审批
 * - 自动模式下的风险评估
 */
// 分类规则表（借鉴 Claude Code）
const CLASSIFICATION_RULES = [
    // === 只读操作 ===
    {
        pattern: /^(ls|lsd|tree|find|locate|whereis|which)\b/,
        category: 'read',
        isSafe: true,
        isReadOnly: true,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.95,
        description: '查看文件/目录'
    },
    {
        pattern: /^(cat|less|more|head|tail|bat)\b/,
        category: 'read',
        isSafe: true,
        isReadOnly: true,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.95,
        description: '查看文件内容'
    },
    {
        pattern: /^(grep|rg|ack|ag)\b/,
        category: 'read',
        isSafe: true,
        isReadOnly: true,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.9,
        description: '搜索文件内容'
    },
    {
        pattern: /^(pwd|date|whoami|hostname|uname|echo)\b/,
        category: 'read',
        isSafe: true,
        isReadOnly: true,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.95,
        description: '查看系统信息'
    },
    {
        pattern: /^(git\s+(status|log|branch|diff|show|ls-files|grep))\b/,
        category: 'git',
        isSafe: true,
        isReadOnly: true,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.9,
        description: '查看 git 状态'
    },
    // === 写入操作 ===
    {
        pattern: /^(mkdir|touch)\b/,
        category: 'write',
        isSafe: true,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: true,
        confidence: 0.9,
        description: '创建文件/目录'
    },
    {
        pattern: /^(mv|cp)\b/,
        category: 'write',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: true,
        confidence: 0.9,
        description: '移动/复制文件'
    },
    {
        pattern: /^(rm|rmdir)\b/,
        category: 'dangerous',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: false,
        confidence: 0.95,
        description: '删除文件'
    },
    {
        pattern: /^(git\s+(add|commit|stash|reset|checkout))\b/,
        category: 'git',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: true,
        confidence: 0.85,
        description: '修改 git 状态'
    },
    // === 执行操作 ===
    {
        pattern: /^(node|python|python3|ruby|java|go run)\b/,
        category: 'execute',
        isSafe: true,
        isReadOnly: false,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.85,
        description: '运行代码'
    },
    {
        pattern: /\.(sh|bash|zsh|py|rb|js|ts)\b/,
        category: 'execute',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: false,
        confidence: 0.8,
        description: '执行脚本文件'
    },
    // === 网络操作 ===
    {
        pattern: /^(curl|wget|http|aria2c)\b/,
        category: 'network',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: false,
        confidence: 0.9,
        description: '下载文件'
    },
    {
        pattern: /^(ssh|scp|rsync|ftp)\b/,
        category: 'network',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: false,
        confidence: 0.9,
        description: '远程连接'
    },
    // === npm/yarn/pnpm ===
    {
        pattern: /^(npm\s+(install|i|add|update|upgrade))\b/,
        category: 'npm',
        isSafe: true,
        isReadOnly: false,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.9,
        description: '安装依赖'
    },
    {
        pattern: /^(npm\s+(uninstall|remove|rm|delete))\b/,
        category: 'npm',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: true,
        confidence: 0.9,
        description: '移除依赖'
    },
    {
        pattern: /^(npm\s+(run|exec|test))\b/,
        category: 'npm',
        isSafe: true,
        isReadOnly: false,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.9,
        description: '运行 npm 脚本'
    },
    {
        pattern: /^(yarn\s+(add|install))\b/,
        category: 'npm',
        isSafe: true,
        isReadOnly: false,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.9,
        description: '安装依赖 (yarn)'
    },
    {
        pattern: /^(pnpm\s+(add|install))\b/,
        category: 'npm',
        isSafe: true,
        isReadOnly: false,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.9,
        description: '安装依赖 (pnpm)'
    },
    // === Docker ===
    {
        pattern: /^(docker\s+(ps|logs|images|inspect))\b/,
        category: 'docker',
        isSafe: true,
        isReadOnly: true,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.9,
        description: '查看 docker 状态'
    },
    {
        pattern: /^(docker\s+(run|exec|build|push|pull))\b/,
        category: 'docker',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: true,
        confidence: 0.85,
        description: 'docker 操作'
    },
    {
        pattern: /^(docker\s+(rm|rmi|stop|kill))\b/,
        category: 'docker',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: false,
        confidence: 0.9,
        description: '删除 docker 容器/镜像'
    },
    // === 构建/测试 ===
    {
        pattern: /^(make|cmake|gradle|maven|cargo)\b/,
        category: 'build',
        isSafe: true,
        isReadOnly: false,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.85,
        description: '构建工具'
    },
    {
        pattern: /^(jest|vitest|mocha|pytest|test)\b/,
        category: 'test',
        isSafe: true,
        isReadOnly: false,
        needsConfirmation: false,
        allowedInAuto: true,
        confidence: 0.9,
        description: '运行测试'
    },
    // === 系统操作 ===
    {
        pattern: /^(sudo|su)\b/,
        category: 'system',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: false,
        confidence: 0.95,
        description: '提升权限'
    },
    {
        pattern: /^(chmod|chown|chgrp)\b/,
        category: 'system',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: false,
        confidence: 0.9,
        description: '修改权限/所有权'
    },
    {
        pattern: /^(kill|killall|pkill)\b/,
        category: 'system',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: false,
        confidence: 0.85,
        description: '杀死进程'
    },
    // === 危险操作 ===
    {
        pattern: /^(dd|mkfs|fdisk|parted)\b/,
        category: 'dangerous',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: false,
        confidence: 0.95,
        description: '磁盘操作'
    },
    {
        pattern: /\| (sh|bash|zsh)\b/,
        category: 'dangerous',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: false,
        confidence: 0.9,
        description: '管道执行脚本'
    }
];
// ============================================================================
// Classification Logic
// ============================================================================
/**
 * Parse Bash Command
 *
 * 解析 Bash 命令（提取工具名）
 */
function parseBashCommand(command) {
    // 分割命令
    const parts = command.trim().split(/\s+/);
    const tool = parts[0] ?? '';
    const args = parts.slice(1);
    // 检测管道命令
    const subCommands = command.split('|')
        .map(s => s.trim().split(/\s+/)[0] ?? '')
        .filter(s => s.length > 0);
    return { tool, args, subCommands };
}
/**
 * Classify Bash Command
 *
 * 分类 Bash 命令
 *
 * @param command - Bash 命令
 * @returns 分类结果
 */
export function classifyBashCommand(command) {
    const parsed = parseBashCommand(command);
    // 遍历规则表
    for (const rule of CLASSIFICATION_RULES) {
        if (rule.pattern.test(command)) {
            return {
                command,
                category: rule.category,
                isSafe: rule.isSafe,
                isReadOnly: rule.isReadOnly,
                needsConfirmation: rule.needsConfirmation,
                allowedInAuto: rule.allowedInAuto,
                confidence: rule.confidence,
                subCommands: parsed.subCommands,
                detectedTools: [parsed.tool],
                description: rule.description
            };
        }
    }
    // 未匹配的命令（misc）
    return {
        command,
        category: 'misc',
        isSafe: false,
        isReadOnly: false,
        needsConfirmation: true,
        allowedInAuto: false,
        confidence: 0.5,
        subCommands: parsed.subCommands,
        detectedTools: [parsed.tool],
        description: '未分类命令'
    };
}
/**
 * Quick Check: Is Command Safe?
 *
 * 快速检查命令是否安全
 */
export function isCommandSafe(command) {
    const result = classifyBashCommand(command);
    return result.isSafe && result.isReadOnly;
}
/**
 * Quick Check: Is Command Allowed in Auto Mode?
 *
 * 快速检查命令是否在自动模式允许
 */
export function isCommandAllowedInAuto(command) {
    const result = classifyBashCommand(command);
    return result.allowedInAuto;
}
/**
 * Get Command Category
 *
 * 获取命令类别
 */
export function getCommandCategory(command) {
    const result = classifyBashCommand(command);
    return result.category;
}
// ============================================================================
// Batch Classification
// ============================================================================
/**
 * Classify Multiple Commands
 *
 * 批量分类命令
 */
export function classifyCommands(commands) {
    return commands.map(cmd => classifyBashCommand(cmd));
}
/**
 * Filter Safe Commands
 *
 * 过滤安全命令
 */
export function filterSafeCommands(commands) {
    return commands.filter(cmd => isCommandSafe(cmd));
}
/**
 * Filter Commands Needing Confirmation
 *
 * 过滤需要确认的命令
 */
export function filterCommandsNeedingConfirmation(commands) {
    return commands.filter(cmd => classifyBashCommand(cmd).needsConfirmation);
}
/**
 * Get Classification Statistics
 *
 * 获取分类统计
 */
export function getClassificationStats(results) {
    const categoryCounts = {
        read: 0, write: 0, execute: 0, network: 0, system: 0, dangerous: 0,
        git: 0, npm: 0, docker: 0, build: 0, test: 0, deploy: 0, misc: 0
    };
    for (const result of results) {
        categoryCounts[result.category]++;
    }
    return {
        totalCommands: results.length,
        safeCount: results.filter(r => r.isSafe).length,
        dangerousCount: results.filter(r => !r.isSafe).length,
        categoryCounts,
        avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    };
}
// ============================================================================
// Export
// ============================================================================
export const bashCommandClassifier = {
    // Classification
    classifyBashCommand,
    classifyCommands,
    // Quick Checks
    isCommandSafe,
    isCommandAllowedInAuto,
    getCommandCategory,
    // Filtering
    filterSafeCommands,
    filterCommandsNeedingConfirmation,
    // Statistics
    getClassificationStats,
    // Types
};
// Types (moved to separate export)
export default bashCommandClassifier;
//# sourceMappingURL=bash-command-classifier.js.map