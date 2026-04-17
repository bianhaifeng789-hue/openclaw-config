/**
 * Permission Utils - 权限系统工具入口
 *
 * 整合 OpenClaw 权限增强工具：
 * - dangerous-patterns.ts - 危险模式检测
 * - bash-command-classifier.ts - 命令分类器
 * - permission-decision-tracker.ts - 决策追踪
 *
 * 借鉴 Claude Code 的 permissions 系统
 */
// ============================================================================
// Imports
// ============================================================================
import { dangerousPatterns, analyzeCommand, isCommandDangerous, isCommandCritical, getCommandDangerLevel, suggestSafeAlternatives, } from './dangerous-patterns';
import { bashCommandClassifier, classifyBashCommand, isCommandSafe, isCommandAllowedInAuto, getCommandCategory, } from './bash-command-classifier';
import { permissionDecisionTracker, recordDecision, getDecisionSummary, getGlobalDenialCount, hasRecentDenials, learnPreference, shouldAutoApprove, shouldAutoDeny, createPermissionDecisionHook, } from './permission-decision-tracker';
import { postSamplingHooksSystem, registerPostSamplingHook, createPermissionTrackingHook, } from './post-sampling-hooks';
/**
 * Analyze Command for Permission Decision
 *
 * 综合分析命令，为权限决策提供依据
 *
 * 流程：
 * 1. 分类命令（category）
 * 2. 检测危险模式
 * 3. 查询用户偏好
 * 4. 综合决策建议
 *
 * @param command - 要分析的命令
 * @returns 综合分析结果
 */
export function analyzeCommandForPermission(command) {
    // 1. 分类命令
    const classification = classifyBashCommand(command);
    // 2. 检测危险模式
    const dangerAnalysis = analyzeCommand(command);
    // 3. 查询用户偏好
    const preference = classification.category !== 'misc'
        ? learnPreference(classification.category)
        : null;
    // 4. 综合决策建议
    const recommendation = determineRecommendation(classification, dangerAnalysis, preference);
    // 5. 安全建议
    const safetySuggestions = [
        ...dangerAnalysis.safetySuggestions,
        ...suggestSafeAlternatives(command).map(a => a.explanation)
    ];
    return {
        command,
        classification,
        dangerAnalysis,
        preference,
        recommendation,
        safetySuggestions
    };
}
/**
 * Determine Recommendation
 *
 * 确定决策建议
 */
function determineRecommendation(classification, dangerAnalysis, preference) {
    // 极危险操作 → forbidden
    if (dangerAnalysis.maxDangerLevel === 'critical') {
        return {
            action: 'forbidden',
            reason: '命令包含极危险操作（不可逆）',
            confidence: 0.95
        };
    }
    // 用户偏好 → auto_approve/auto_deny
    if (preference) {
        if (shouldAutoApprove(classification.category)) {
            return {
                action: 'auto_allow',
                reason: `用户已连续允许 ${classification.category} 操作`,
                confidence: preference.confidence
            };
        }
        if (shouldAutoDeny(classification.category)) {
            return {
                action: 'auto_deny',
                reason: `用户已连续拒绝 ${classification.category} 操作`,
                confidence: preference.confidence
            };
        }
    }
    // 分类规则 → auto_allow
    if (classification.isSafe && classification.isReadOnly) {
        return {
            action: 'auto_allow',
            reason: '只读操作，安全',
            confidence: classification.confidence
        };
    }
    // 分类规则 + 自动模式 → auto_allow
    if (classification.allowedInAuto && dangerAnalysis.riskScore < 30) {
        return {
            action: 'auto_allow',
            reason: '低风险操作，自动模式允许',
            confidence: 0.8
        };
    }
    // 危险模式 → ask_user
    if (dangerAnalysis.isDangerous) {
        return {
            action: 'ask_user',
            reason: `命令包含危险模式: ${dangerAnalysis.matches.map(m => m.patternName).join(', ')}`,
            confidence: 0.7
        };
    }
    // 有最近拒绝 → ask_user
    if (hasRecentDenials()) {
        return {
            action: 'ask_user',
            reason: '用户最近有拒绝操作，需要谨慎',
            confidence: 0.6
        };
    }
    // 默认 → ask_user
    return {
        action: 'ask_user',
        reason: '未分类或低置信度操作',
        confidence: 0.5
    };
}
/**
 * Run Permission Decision Flow
 *
 * 运行完整的权限决策流程
 *
 * 流程顺序：
 * 1. 危险模式检测
 * 2. 命令分类
 * 3. 用户偏好检查
 * 4. 综合决策
 *
 * @param command - 要检查的命令
 * @returns 决策流程记录
 */
export function runPermissionDecisionFlow(command) {
    const flows = [];
    // 1. 危险模式检测
    if (isCommandCritical(command)) {
        flows.push({
            step: 'critical_pattern_check',
            result: 'fail',
            description: '命令包含极危险模式'
        });
        // 记录决策
        recordDecision({
            id: `decision_${Date.now()}`,
            timestamp: Date.now(),
            operationType: 'critical_pattern',
            requestedItem: command,
            decision: 'deny'
        });
        return {
            flows,
            finalDecision: 'deny',
            analysis: analyzeCommandForPermission(command)
        };
    }
    flows.push({
        step: 'critical_pattern_check',
        result: 'pass',
        description: '无极危险模式'
    });
    // 2. 命令分类
    const classification = classifyBashCommand(command);
    flows.push({
        step: 'command_classification',
        result: classification.category !== 'dangerous' ? 'pass' : 'fail',
        description: `分类: ${classification.category}`
    });
    if (classification.category === 'dangerous') {
        recordDecision({
            id: `decision_${Date.now()}`,
            timestamp: Date.now(),
            operationType: classification.category,
            requestedItem: command,
            decision: 'deny'
        });
        return {
            flows,
            finalDecision: 'deny',
            analysis: analyzeCommandForPermission(command)
        };
    }
    // 3. 用户偏好检查
    const preference = learnPreference(classification.category);
    if (preference.learnedPolicy === 'always_allow') {
        flows.push({
            step: 'user_preference_check',
            result: 'pass',
            description: `用户偏好: 永久允许 ${classification.category}`
        });
        recordDecision({
            id: `decision_${Date.now()}`,
            timestamp: Date.now(),
            operationType: classification.category,
            requestedItem: command,
            decision: 'allow_always'
        });
        return {
            flows,
            finalDecision: 'allow_always',
            analysis: analyzeCommandForPermission(command)
        };
    }
    if (preference.learnedPolicy === 'always_deny') {
        flows.push({
            step: 'user_preference_check',
            result: 'fail',
            description: `用户偏好: 永久拒绝 ${classification.category}`
        });
        recordDecision({
            id: `decision_${Date.now()}`,
            timestamp: Date.now(),
            operationType: classification.category,
            requestedItem: command,
            decision: 'deny'
        });
        return {
            flows,
            finalDecision: 'deny',
            analysis: analyzeCommandForPermission(command)
        };
    }
    flows.push({
        step: 'user_preference_check',
        result: 'skip',
        description: '无明确偏好'
    });
    // 4. 综合决策
    const analysis = analyzeCommandForPermission(command);
    const decision = analysis.recommendation.action;
    flows.push({
        step: 'final_decision',
        result: decision === 'auto_allow' ? 'pass' : decision === 'forbidden' ? 'fail' : 'skip',
        description: `决策: ${decision} (${analysis.recommendation.reason})`
    });
    // 转换决策类型
    const finalDecision = decision === 'auto_allow' ? 'allow' :
        decision === 'auto_deny' ? 'deny' :
            decision === 'forbidden' ? 'deny' :
                'allow_once'; // ask_user 情况下等待用户确认
    recordDecision({
        id: `decision_${Date.now()}`,
        timestamp: Date.now(),
        operationType: classification.category,
        requestedItem: command,
        decision: finalDecision,
        context: {
            riskScore: analysis.dangerAnalysis.riskScore
        }
    });
    return {
        flows,
        finalDecision,
        analysis
    };
}
// ============================================================================
// Feishu Integration
// ============================================================================
/**
 * Create Feishu Permission Card
 *
 * 创建飞书权限审批卡片
 */
export function createFeishuPermissionCard(analysis) {
    const { classification, dangerAnalysis, recommendation } = analysis;
    // 卡片内容
    const cardContent = {
        type: 'template',
        data: {
            template_id: 'blue_card',
            template_version_name: '1.0.0.17',
            template_variable: {
                title: `⚠️ 权限审批`,
                content: [
                    `**命令**: ${analysis.command}`,
                    `**分类**: ${classification.category}`,
                    `**风险**: ${dangerAnalysis.riskScore}/100`,
                    `**建议**: ${recommendation.reason}`,
                    dangerAnalysis.matches.length > 0
                        ? `**危险模式**: ${dangerAnalysis.matches.map(m => m.patternName).join(', ')}`
                        : '',
                    classification.isSafe ? '✅ 安全操作' : '⚠️ 需要确认'
                ].filter(Boolean).join('\n'),
                icon: recommendation.action === 'forbidden' ? 'error' : 'warning'
            }
        }
    };
    return cardContent;
}
// ============================================================================
// Export All
// ============================================================================
export { 
// Dangerous Patterns
dangerousPatterns, analyzeCommand, isCommandDangerous, isCommandCritical, getCommandDangerLevel, suggestSafeAlternatives, 
// Command Classifier
bashCommandClassifier, classifyBashCommand, isCommandSafe, isCommandAllowedInAuto, getCommandCategory, 
// Decision Tracker
permissionDecisionTracker, recordDecision, getDecisionSummary, getGlobalDenialCount, hasRecentDenials, learnPreference, shouldAutoApprove, shouldAutoDeny, createPermissionDecisionHook, 
// Post-Sampling Hooks
postSamplingHooksSystem, registerPostSamplingHook, createPermissionTrackingHook, };
// 默认导出
export const permissionUtils = {
    // Combined Analysis
    analyzeCommandForPermission,
    runPermissionDecisionFlow,
    // Feishu Integration
    createFeishuPermissionCard,
    // All sub-modules
    dangerousPatterns,
    bashCommandClassifier,
    permissionDecisionTracker,
    postSamplingHooksSystem
};
// Types (moved to separate export)
export default permissionUtils;
//# sourceMappingURL=permission-utils.js.map