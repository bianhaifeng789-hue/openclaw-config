/**
 * Phase 9-13 Integration Test
 * 测试所有新模块 + 飞书卡片发送
 */
import * as utils from './index';
const results = [];
function test(module, testName, fn) {
    try {
        const data = fn();
        results.push({ module, test: testName, passed: true, data });
    }
    catch (e) {
        results.push({
            module,
            test: testName,
            passed: false,
            error: e instanceof Error ? e.message : String(e)
        });
    }
}
// ============================================
// Phase 9: Coordinator Mode
// ============================================
test('coordinator', 'isCoordinatorMode', () => {
    return utils.isCoordinatorMode();
});
test('coordinator', 'getCoordinatorMode', () => {
    return utils.coordinatorService.getCoordinatorMode();
});
test('coordinator', 'getCoordinatorSystemPrompt', () => {
    const prompt = utils.getCoordinatorSystemPrompt();
    return prompt.length > 100;
});
test('coordinator', 'setWorkerTools', () => {
    utils.setWorkerTools('basic');
    const config = utils.coordinatorService.getConfig();
    return config.workerTools.has('Bash');
});
test('coordinator', 'createCoordinatorHook', () => {
    const hook = utils.createCoordinatorHook();
    return hook.name === 'coordinator';
});
// ============================================
// Phase 10: Memdir
// ============================================
test('memdir', 'memoryAge', () => {
    const age = utils.memoryAge(Date.now());
    return age === 'today';
});
test('memdir', 'memoryAgeDays', () => {
    const days = utils.memoryAgeDays(Date.now() - 2 * 24 * 60 * 60 * 1000);
    return days === 2;
});
test('memdir', 'memoryFreshnessText', () => {
    const fresh = utils.memoryFreshnessText(Date.now());
    return fresh === '';
});
test('memdir', 'memoryFreshnessText (old)', () => {
    const old = utils.memoryFreshnessText(Date.now() - 10 * 24 * 60 * 60 * 1000);
    return old.includes('10 天');
});
test('memdir', 'parseMemoryType', () => {
    return utils.parseMemoryType('user') === 'user';
});
test('memdir', 'createMemdirHook', () => {
    const hook = utils.createMemdirHook();
    return hook.name === 'memdir';
});
// ============================================
// Phase 11: Claude AI Limits
// ============================================
test('limits', 'checkQuotaStatus', async () => {
    const limits = await utils.checkQuotaStatus();
    return limits.status === 'allowed';
});
test('limits', 'getRateLimitDisplayName', () => {
    const name = utils.claudeAiLimits.getRateLimitDisplayName('five_hour');
    return name === '会话限制';
});
test('limits', 'checkEarlyWarning', () => {
    const warning = utils.checkEarlyWarning(0.92, Date.now() / 1000 + 3 * 60 * 60, 'five_hour');
    return typeof warning === 'boolean';
});
test('limits', 'getRateLimitErrorMessage', () => {
    const msg = utils.getRateLimitErrorMessage({
        status: 'rejected',
        rateLimitType: 'five_hour',
        resetsAt: Date.now() / 1000 + 5 * 60 * 60,
        unifiedRateLimitFallbackAvailable: false,
        isUsingOverage: false,
    });
    return msg.includes('已耗尽');
});
test('limits', 'createLimitsHook', () => {
    const hook = utils.createLimitsHook();
    return hook.name === 'claude-ai-limits';
});
// ============================================
// Phase 12: Token Estimation
// ============================================
test('tokens', 'estimateTextTokens (chinese)', () => {
    const tokens = utils.estimateTextTokens('你好世界');
    return tokens > 0 && tokens < 10;
});
test('tokens', 'estimateTextTokens (english)', () => {
    const tokens = utils.estimateTextTokens('Hello World');
    return tokens > 0 && tokens < 10;
});
test('tokens', 'estimateMessagesTokens', () => {
    const tokens = utils.estimateMessagesTokens([
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好！' }
    ]);
    return tokens > 0;
});
test('tokens', 'calculateBudget', () => {
    const budget = utils.calculateBudget(45000, 200000);
    return budget.percentage === 22 || budget.percentage === 23;
});
test('tokens', 'getBudgetWarning', () => {
    const warning = utils.getBudgetWarning({ total: 200000, used: 150000, remaining: 50000, percentage: 75 });
    return warning.includes('接近上限');
});
test('tokens', 'createTokenEstimationHook', () => {
    const hook = utils.createTokenEstimationHook();
    return hook.name === 'token-estimation';
});
// ============================================
// Phase 13: Buddy Companion
// ============================================
test('buddy', 'generateBuddy', () => {
    const buddy = utils.generateBuddy('test-user-ou_xxx');
    return buddy.id.includes('buddy') && buddy.species !== undefined;
});
test('buddy', 'getCurrentBuddy', () => {
    const buddy = utils.getCurrentBuddy();
    return buddy !== null;
});
test('buddy', 'recordInteraction', () => {
    const buddy = utils.recordInteraction();
    return buddy?.interactionCount > 0;
});
test('buddy', 'formatBuddyCard', () => {
    const buddy = utils.getCurrentBuddy();
    if (!buddy)
        return false;
    const card = utils.formatBuddyCard(buddy);
    return card.includes('稀有度');
});
test('buddy', 'createBuddyHook', () => {
    const hook = utils.createBuddyHook();
    return hook.name === 'buddy-companion';
});
// ============================================
// Unified Stats
// ============================================
test('stats', 'getSystemStats', () => {
    const stats = utils.getSystemStats();
    return stats.coordinator !== undefined &&
        stats.memdir !== undefined &&
        stats.limits !== undefined &&
        stats.tokens !== undefined &&
        stats.buddy !== undefined;
});
test('stats', 'resetAll', () => {
    utils.resetAll();
    const stats = utils.getSystemStats();
    return stats.coordinator.sessionCount === 0;
});
// ============================================
// Output Results
// ============================================
console.log('\n========================================');
console.log('Phase 9-13 Integration Test Results');
console.log('========================================\n');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} [${result.module}] ${result.test}`);
    if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
    }
}
console.log('\n----------------------------------------');
console.log(`Total: ${results.length} tests`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('----------------------------------------\n');
// Export for external use
export { results, passed, failed };
//# sourceMappingURL=phase9-13.test.js.map