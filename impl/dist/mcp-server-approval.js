/**
 * MCP Server Approval Service
 * 借鉴 Claude Code mcpServerApproval.tsx
 * 飞书场景：用卡片实现审批交互
 */
// 单例状态
let state = {
    pendingApprovals: new Map(),
    approvedServers: new Set(),
    deniedServers: new Set(),
    stats: {
        totalApprovals: 0,
        approved: 0,
        denied: 0,
        autoApproved: 0
    }
};
// 安全服务器列表（自动批准）
const SAFE_SERVERS = new Set([
    'filesystem',
    'memory',
    'brave-search',
    'github'
]);
// 危险能力列表（需要审批）
const DANGEROUS_CAPABILITIES = new Set([
    'code-execution',
    'shell-execution',
    'file-write',
    'network-access',
    'env-access'
]);
/**
 * 检查服务器是否需要审批
 */
export function needsApproval(serverName, capabilities) {
    // 已批准的服务器不需要重复审批
    if (state.approvedServers.has(serverName)) {
        return false;
    }
    // 安全服务器自动批准
    if (SAFE_SERVERS.has(serverName)) {
        return false;
    }
    // 有危险能力需要审批
    return capabilities.some(cap => DANGEROUS_CAPABILITIES.has(cap));
}
/**
 * 创建审批请求
 */
export function requestApproval(serverId, serverName, serverUrl, capabilities, reason) {
    const approval = {
        serverId,
        serverName,
        serverUrl,
        requestedAt: new Date(),
        capabilities,
        reason
    };
    state.pendingApprovals.set(serverId, approval);
    state.stats.totalApprovals++;
    return approval;
}
/**
 * 批准服务器
 */
export function approveServer(serverId) {
    const approval = state.pendingApprovals.get(serverId);
    if (!approval) {
        return false;
    }
    state.approvedServers.add(approval.serverName);
    state.pendingApprovals.delete(serverId);
    state.stats.approved++;
    return true;
}
/**
 * 拒绝服务器
 */
export function denyServer(serverId) {
    const approval = state.pendingApprovals.get(serverId);
    if (!approval) {
        return false;
    }
    state.deniedServers.add(approval.serverName);
    state.pendingApprovals.delete(serverId);
    state.stats.denied++;
    return true;
}
/**
 * 自动批准安全服务器
 */
export function autoApproveSafe(serverId) {
    const approval = state.pendingApprovals.get(serverId);
    if (!approval) {
        return false;
    }
    if (SAFE_SERVERS.has(approval.serverName)) {
        state.approvedServers.add(approval.serverName);
        state.pendingApprovals.delete(serverId);
        state.stats.autoApproved++;
        return true;
    }
    return false;
}
/**
 * 获取待审批列表
 */
export function getPendingApprovals() {
    return Array.from(state.pendingApprovals.values());
}
/**
 * 检查服务器是否已批准
 */
export function isApproved(serverName) {
    return state.approvedServers.has(serverName);
}
/**
 * 检查服务器是否已拒绝
 */
export function isDenied(serverName) {
    return state.deniedServers.has(serverName);
}
/**
 * 获取统计信息
 */
export function getStats() {
    return { ...state.stats };
}
/**
 * 重置状态（测试用）
 */
export function _reset() {
    state = {
        pendingApprovals: new Map(),
        approvedServers: new Set(),
        deniedServers: new Set(),
        stats: {
            totalApprovals: 0,
            approved: 0,
            denied: 0,
            autoApproved: 0
        }
    };
}
/**
 * 生成飞书审批卡片
 */
export function generateApprovalCard(approval) {
    const dangerousCaps = approval.capabilities.filter(cap => DANGEROUS_CAPABILITIES.has(cap));
    const safeCaps = approval.capabilities.filter(cap => !DANGEROUS_CAPABILITIES.has(cap));
    return {
        config: {
            wide_screen_mode: true
        },
        header: {
            template: 'orange',
            title: {
                content: '⚠️ MCP 服务器审批请求',
                tag: 'plain_text'
            }
        },
        elements: [
            {
                tag: 'div',
                text: {
                    content: `**服务器名称**: ${approval.serverName}\n**服务器地址**: ${approval.serverUrl}\n**请求原因**: ${approval.reason}`,
                    tag: 'lark_md'
                }
            },
            {
                tag: 'div',
                text: {
                    content: '**危险能力**:\n' + (dangerousCaps.length > 0 ? dangerousCaps.map(cap => `• ${cap}`).join('\n') : '无'),
                    tag: 'lark_md'
                }
            },
            {
                tag: 'div',
                text: {
                    content: '**安全能力**:\n' + (safeCaps.length > 0 ? safeCaps.map(cap => `• ${cap}`).join('\n') : '无'),
                    tag: 'lark_md'
                }
            },
            {
                tag: 'action',
                actions: [
                    {
                        tag: 'button',
                        text: {
                            content: '✅ 批准',
                            tag: 'plain_text'
                        },
                        type: 'primary',
                        value: {
                            action: 'approve',
                            serverId: approval.serverId
                        }
                    },
                    {
                        tag: 'button',
                        text: {
                            content: '❌ 拒绝',
                            tag: 'plain_text'
                        },
                        type: 'danger',
                        value: {
                            action: 'deny',
                            serverId: approval.serverId
                        }
                    }
                ]
            },
            {
                tag: 'note',
                elements: [
                    {
                        tag: 'plain_text',
                        content: `请求时间: ${approval.requestedAt.toLocaleString('zh-CN')}`
                    }
                ]
            }
        ]
    };
}
// 导出单例
export const mcpServerApprovalService = {
    needsApproval,
    requestApproval,
    approveServer,
    denyServer,
    autoApproveSafe,
    getPendingApprovals,
    isApproved,
    isDenied,
    getStats,
    generateApprovalCard,
    _reset
};
export default mcpServerApprovalService;
//# sourceMappingURL=mcp-server-approval.js.map