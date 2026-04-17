/**
 * Dangerous Patterns Detection - 危险模式检测
 *
 * 借鉴 Claude Code 的 dangerousPatterns.ts:
 * - permissions/dangerousPatterns.ts 的危险命令检测
 * - 智能识别危险操作
 * - 提供安全建议
 *
 * OpenClaw 适配：
 * - 飞书场景下的安全检查
 * - 自动模式下的风险评估
 * - 与 permission mode 整合
 */
// 借鉴 Claude Code 的危险模式列表
export const DANGEROUS_PATTERNS = [
    // === 文件删除 ===
    {
        name: 'rm_recursive',
        pattern: /\brm\s+(-[rfR]+\s+|--recursive\s+)/,
        dangerLevel: 'critical',
        description: '递归删除文件或目录',
        suggestion: '使用 trash 命令替代 rm，或先备份',
        recoverable: false,
        category: 'file_delete'
    },
    {
        name: 'rm_force',
        pattern: /\brm\s+(-f\s|--force\s+)/,
        dangerLevel: 'dangerous',
        description: '强制删除文件',
        suggestion: '先确认文件内容，使用普通 rm',
        recoverable: false,
        category: 'file_delete'
    },
    {
        name: 'rm_wildcard',
        pattern: /\brm\s+.*\*.*$/,
        dangerLevel: 'dangerous',
        description: '使用通配符删除',
        suggestion: '先用 ls 查看匹配的文件，再删除',
        recoverable: false,
        category: 'file_delete'
    },
    {
        name: 'rm_root',
        pattern: /\brm\s+.*\/$/,
        dangerLevel: 'critical',
        description: '删除根目录',
        suggestion: '绝对不要执行！',
        recoverable: false,
        category: 'file_delete'
    },
    // === 系统修改 ===
    {
        name: 'sudo_rm',
        pattern: /\bsudo\s+.*\brm\b/,
        dangerLevel: 'critical',
        description: '以 root 权限删除文件',
        suggestion: '谨慎使用 sudo rm，确认目标路径',
        recoverable: false,
        category: 'system_modify'
    },
    {
        name: 'sudo_chmod',
        pattern: /\bsudo\s+chmod\s+777/,
        dangerLevel: 'dangerous',
        description: '修改权限为 777（所有人可读写执行）',
        suggestion: '使用更严格的权限（如 755, 644）',
        recoverable: true,
        category: 'system_modify'
    },
    {
        name: 'sudo_dd',
        pattern: /\bsudo\s+dd\b/,
        dangerLevel: 'critical',
        description: '以 root 权限执行 dd（磁盘操作）',
        suggestion: 'dd 会直接写入磁盘，确认参数',
        recoverable: false,
        category: 'system_modify'
    },
    {
        name: 'mkfs',
        pattern: /\bmkfs\b/,
        dangerLevel: 'critical',
        description: '格式化磁盘',
        suggestion: '确认磁盘设备名，避免误操作',
        recoverable: false,
        category: 'system_modify'
    },
    // === 网络操作 ===
    {
        name: 'curl_to_bash',
        pattern: /\bcurl\s+.*\|\s*bash\b/,
        dangerLevel: 'critical',
        description: '从网络下载并直接执行脚本',
        suggestion: '先下载查看内容，确认安全后再执行',
        recoverable: false,
        category: 'network'
    },
    {
        name: 'wget_to_bash',
        pattern: /\bwget\s+.*\|\s*bash\b/,
        dangerLevel: 'critical',
        description: '从网络下载并直接执行脚本',
        suggestion: '先下载查看内容，确认安全后再执行',
        recoverable: false,
        category: 'network'
    },
    // === 进程管理 ===
    {
        name: 'killall',
        pattern: /\bkillall\b/,
        dangerLevel: 'caution',
        description: '批量杀死进程',
        suggestion: '确认进程名称，避免误杀',
        recoverable: true,
        category: 'process'
    },
    {
        name: 'kill_9',
        pattern: /\bkill\s+-9\b/,
        dangerLevel: 'caution',
        description: '强制杀死进程（SIGKILL）',
        suggestion: '优先尝试 SIGTERM（kill -15）',
        recoverable: true,
        category: 'process'
    },
    // === Git 操作 ===
    {
        name: 'git_reset_hard',
        pattern: /\bgit\s+reset\s+--hard\b/,
        dangerLevel: 'dangerous',
        description: '硬重置（丢弃所有未提交更改）',
        suggestion: '先 stash 或 commit，再 reset',
        recoverable: false,
        category: 'git'
    },
    {
        name: 'git_clean_force',
        pattern: /\bgit\s+clean\s+(-f|--force)\b/,
        dangerLevel: 'dangerous',
        description: '强制清理未跟踪文件',
        suggestion: '先 git clean -n 查看将被删除的文件',
        recoverable: false,
        category: 'git'
    },
    {
        name: 'git_push_force',
        pattern: /\bgit\s+push\s+.*(-f|--force)\b/,
        dangerLevel: 'dangerous',
        description: '强制推送（可能覆盖他人提交）',
        suggestion: '确认没有他人依赖此分支',
        recoverable: true,
        category: 'git'
    },
    // === 数据库操作 ===
    {
        name: 'drop_database',
        pattern: /\b(DROP\s+DATABASE|DROPDB)\b/i,
        dangerLevel: 'critical',
        description: '删除数据库',
        suggestion: '先备份，确认数据库名',
        recoverable: false,
        category: 'database'
    },
    {
        name: 'truncate_table',
        pattern: /\bTRUNCATE\s+TABLE\b/i,
        dangerLevel: 'dangerous',
        description: '清空表数据',
        suggestion: '先备份或使用 DELETE',
        recoverable: false,
        category: 'database'
    },
    // === 环境修改 ===
    {
        name: 'env_set_path',
        pattern: /\bexport\s+PATH\s*=/,
        dangerLevel: 'caution',
        description: '修改 PATH 环境变量',
        suggestion: '追加而非替换：export PATH=$PATH:/new/path',
        recoverable: true,
        category: 'environment'
    },
    {
        name: 'unset_important',
        pattern: /\bunset\s+(HOME|PATH|USER|SHELL)\b/,
        dangerLevel: 'dangerous',
        description: '取消重要环境变量',
        suggestion: '避免 unset 重要变量',
        recoverable: true,
        category: 'environment'
    },
    // === 磁盘清理 ===
    {
        name: 'disk_cleanup',
        pattern: /\b(ncdu|bleachbit|rm\s+-rf\s+\/tmp)/,
        dangerLevel: 'caution',
        description: '磁盘清理工具',
        suggestion: '先查看将被清理的内容',
        recoverable: false,
        category: 'disk'
    }
];
// ============================================================================
// Pattern Detection
// ============================================================================
/**
 * Check Pattern Exceptions
 *
 * 检查是否有例外情况（某些情况下该模式安全）
 */
function checkPatternExceptions(command, pattern) {
    if (!pattern.exceptions) {
        return false;
    }
    for (const exception of pattern.exceptions) {
        if (exception.test(command)) {
            return true;
        }
    }
    return false;
}
/**
 * Analyze Command for Dangerous Patterns
 *
 * 分析命令中的危险模式
 *
 * @param command - 要分析的命令
 * @returns 分析结果
 */
export function analyzeCommand(command) {
    const matches = [];
    // 检查所有危险模式
    for (const pattern of DANGEROUS_PATTERNS) {
        const regexMatch = pattern.pattern.exec(command);
        if (regexMatch) {
            // 检查例外
            const hasException = checkPatternExceptions(command, pattern);
            if (!hasException) {
                matches.push({
                    patternName: pattern.name,
                    dangerLevel: pattern.dangerLevel,
                    matchedText: regexMatch[0],
                    matchIndex: regexMatch.index,
                    description: pattern.description,
                    suggestion: pattern.suggestion,
                    recoverable: pattern.recoverable,
                    category: pattern.category
                });
            }
        }
    }
    // 计算最高危险等级
    const dangerLevels = matches.map(m => m.dangerLevel);
    const maxDangerLevel = dangerLevels.reduce((max, level) => {
        const order = { safe: 0, caution: 1, dangerous: 2, critical: 3 };
        return order[level] > order[max] ? level : max;
    }, 'safe');
    // 计算风险评分（0-100）
    const riskScore = calculateRiskScore(matches);
    // 判断是否需要确认
    const needsConfirmation = riskScore >= 30 || maxDangerLevel !== 'safe';
    // 判断是否可自动执行
    const canAutoExecute = riskScore < 30 && maxDangerLevel === 'safe';
    // 生成安全建议
    const safetySuggestions = matches
        .filter(m => m.suggestion)
        .map(m => `${m.patternName}: ${m.suggestion}`);
    return {
        command,
        isDangerous: matches.length > 0,
        maxDangerLevel,
        matches,
        riskScore,
        safetySuggestions,
        needsConfirmation,
        canAutoExecute
    };
}
/**
 * Calculate Risk Score
 *
 * 计算风险评分（0-100）
 */
function calculateRiskScore(matches) {
    if (matches.length === 0) {
        return 0;
    }
    // 危险等级权重
    const weights = {
        safe: 0,
        caution: 10,
        dangerous: 30,
        critical: 50
    };
    // 基础分数：危险等级总和
    let score = matches.reduce((sum, m) => sum + weights[m.dangerLevel], 0);
    // 多模式叠加
    score += matches.length * 5;
    // 不可恢复操作加分
    score += matches.filter(m => !m.recoverable).length * 10;
    // 上限 100
    return Math.min(score, 100);
}
// ============================================================================
// Quick Checks
// ============================================================================
/**
 * Quick Check if Command is Dangerous
 *
 * 快速检查命令是否危险（不返回详细信息）
 */
export function isCommandDangerous(command) {
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.dangerLevel !== 'caution' && pattern.pattern.test(command)) {
            if (!checkPatternExceptions(command, pattern)) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Quick Check if Command is Critical
 *
 * 快速检查命令是否极危险
 */
export function isCommandCritical(command) {
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.dangerLevel === 'critical' &&
            pattern.pattern.test(command)) {
            if (!checkPatternExceptions(command, pattern)) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Get Danger Level for Command
 *
 * 获取命令的危险等级
 */
export function getCommandDangerLevel(command) {
    const result = analyzeCommand(command);
    return result.maxDangerLevel;
}
/**
 * Suggest Safe Alternatives
 *
 * 建议安全替代方案
 */
export function suggestSafeAlternatives(command) {
    const alternatives = [];
    const analysis = analyzeCommand(command);
    for (const match of analysis.matches) {
        switch (match.category) {
            case 'file_delete':
                alternatives.push({
                    dangerousOperation: 'rm',
                    safeAlternative: 'trash',
                    explanation: 'trash 命令会将文件移到废纸篓，可恢复'
                });
                break;
            case 'git':
                alternatives.push({
                    dangerousOperation: 'git reset --hard',
                    safeAlternative: 'git stash && git reset',
                    explanation: '先 stash 保存更改，再 reset'
                });
                break;
            case 'network':
                alternatives.push({
                    dangerousOperation: 'curl | bash',
                    safeAlternative: 'curl > script.sh && less script.sh && bash script.sh',
                    explanation: '先下载查看脚本内容，确认安全后再执行'
                });
                break;
            case 'system_modify':
                alternatives.push({
                    dangerousOperation: 'sudo',
                    safeAlternative: '检查是否真的需要 sudo',
                    explanation: '避免使用 root 权限执行危险操作'
                });
                break;
        }
    }
    return alternatives;
}
// ============================================================================
// Export
// ============================================================================
export const dangerousPatterns = {
    // Patterns
    DANGEROUS_PATTERNS,
    // Analysis
    analyzeCommand,
    isCommandDangerous,
    isCommandCritical,
    getCommandDangerLevel,
    calculateRiskScore,
    // Alternatives
    suggestSafeAlternatives
};
export default dangerousPatterns;
//# sourceMappingURL=dangerous-patterns.js.map