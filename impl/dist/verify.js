/**
 * Integration Verification - Phase 1-8
 *
 * 直接验证各模块导出，不依赖测试框架
 */
import * as taskTracker from './task-tracker';
import * as backgroundTaskCard from './background-task-card';
import * as forkedAgentCache from './forked-agent-cache';
import * as sessionMemoryCompact from './session-memory-compact';
import * as dangerousPatterns from './dangerous-patterns';
import * as bashCommandClassifier from './bash-command-classifier';
import * as permissionDecisionTracker from './permission-decision-tracker';
import * as analyticsService from './analytics-service';
import * as sessionTracing from './session-tracing';
import * as hooksSystem from './hooks-system';
import * as swarmService from './swarm-service';
import * as bridgeService from './bridge-service';
// Verification results
const results = {};
function verify(name, fn) {
    try {
        fn();
        results[name] = { success: true };
        console.log(`✅ ${name}`);
    }
    catch (error) {
        results[name] = { success: false, error: String(error) };
        console.log(`❌ ${name}: ${error}`);
    }
}
// Phase 1: Background Task
verify('Phase 1: taskTracker exists', () => {
    if (!taskTracker.taskTracker)
        throw new Error('Missing taskTracker');
});
verify('Phase 1: createTask works', () => {
    const task = taskTracker.registerTask('test-1');
    if (!task.id)
        throw new Error('No id');
});
verify('Phase 1: backgroundTaskCard exists', () => {
    if (!backgroundTaskCard.backgroundTaskCard)
        throw new Error('Missing backgroundTaskCard');
});
// Phase 2: Forked Agent Cache
verify('Phase 2: forkedAgentCache exists', () => {
    if (!forkedAgentCache.forkedAgentCache)
        throw new Error('Missing forkedAgentCache');
});
verify('Phase 2: createCacheParams works', () => {
    const params = forkedAgentCache.createCacheSafeParams({
        systemPrompt: 'system',
        userContext: {},
        model: 'default'
    });
    if (!params.systemPrompt)
        throw new Error('No systemPrompt');
});
// Phase 3: Session Memory Compact
verify('Phase 3: sessionMemoryCompact exists', () => {
    if (!sessionMemoryCompact.compactSessionMemory)
        throw new Error('Missing compactSessionMemory');
});
verify('Phase 3: estimateTokens works', () => {
    const tokens = sessionMemoryCompact.estimateMemoryTokens('Hello 你好');
    if (tokens <= 0)
        throw new Error('Invalid token count');
});
// Phase 4: Permission System
verify('Phase 4: dangerousPatterns exists', () => {
    if (!dangerousPatterns.dangerousPatterns)
        throw new Error('Missing dangerousPatterns');
});
verify('Phase 4: detectDangerousPattern works', () => {
    const result = dangerousPatterns.analyzeCommand('rm -rf /');
    if (!result.isDangerous)
        throw new Error('Should detect rm -rf /');
});
verify('Phase 4: bashCommandClassifier exists', () => {
    if (!bashCommandClassifier.bashCommandClassifier)
        throw new Error('Missing bashCommandClassifier');
});
verify('Phase 4: classifyCommand works', () => {
    const result = bashCommandClassifier.classifyBashCommand('cat file.txt');
    if (!result.category)
        throw new Error('No category');
});
verify('Phase 4: permissionDecisionTracker exists', () => {
    if (!permissionDecisionTracker.permissionDecisionTracker)
        throw new Error('Missing tracker');
});
// Phase 5: Analytics
verify('Phase 5: analyticsService exists', () => {
    if (!analyticsService.analyticsService)
        throw new Error('Missing analyticsService');
});
verify('Phase 5: sessionTracing exists', () => {
    if (!sessionTracing.sessionTracing)
        throw new Error('Missing sessionTracing');
});
// Phase 6: Hooks System
verify('Phase 6: hooksSystem exists', () => {
    if (!hooksSystem.hooksSystem)
        throw new Error('Missing hooksSystem');
});
verify('Phase 6: canUseTool works', () => {
    const result = hooksSystem.canUseTool('read');
    if (typeof result.allowed !== 'boolean')
        throw new Error('Invalid result');
});
// Phase 7: Swarm Service
verify('Phase 7: swarmService exists', () => {
    if (!swarmService.swarmService)
        throw new Error('Missing swarmService');
});
verify('Phase 7: createTeammate works', () => {
    const teammate = swarmService.createTeammate('researcher', 'Search');
    if (!teammate.teammateId)
        throw new Error('No teammateId');
});
// Phase 8: Bridge Service
verify('Phase 8: bridgeService exists', () => {
    if (!bridgeService.bridgeService)
        throw new Error('Missing bridgeService');
});
verify('Phase 8: checkCapacity works', () => {
    const cap = bridgeService.checkCapacity();
    if (typeof cap.available !== 'boolean')
        throw new Error('Invalid capacity');
});
// Summary
console.log('\n--- Verification Summary ---');
const passed = Object.values(results).filter(r => r.success).length;
const failed = Object.values(results).filter(r => !r.success).length;
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);
// Export results
export { results };
//# sourceMappingURL=verify.js.map