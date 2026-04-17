/**
 * Integration Tests - Phase 1-8
 *
 * 测试所有核心模块的基本功能和协作
 */
import { describe, it, expect, beforeEach } from 'vitest';
// Import all modules
import * as utils from './index';
describe('Phase 1: Background Task Visualization', () => {
    beforeEach(() => {
        utils.taskTracker._reset();
    });
    it('should create and track task', () => {
        const task = utils.createTask('test-task', 'Test Task', 'Testing task creation');
        expect(task).toBeDefined();
        expect(task.taskId).toBe('test-task');
        expect(task.status).toBe('idle');
        const stats = utils.taskTracker.getStats();
        expect(stats.totalCreated).toBe(1);
    });
    it('should update task progress', () => {
        const task = utils.createTask('test-task', 'Test Task', 'Testing progress');
        utils.updateTask('test-task', { status: 'running', progress: 50 });
        const updated = utils.getTask('test-task');
        expect(updated?.status).toBe('running');
        expect(updated?.progress).toBe(50);
    });
    it('should create task cards', () => {
        const startCard = utils.createTaskStartCard({
            taskId: 'test-task',
            taskName: 'Test Task',
            description: 'Testing card generation'
        });
        expect(startCard).toBeDefined();
        expect(startCard.type).toBe('template');
        const progressCard = utils.createTaskProgressCard({
            taskId: 'test-task',
            taskName: 'Test Task',
            progress: 75
        });
        expect(progressCard).toBeDefined();
        const completeCard = utils.createTaskCompleteCard({
            taskId: 'test-task',
            taskName: 'Test Task',
            success: true
        });
        expect(completeCard).toBeDefined();
    });
});
describe('Phase 2: Forked Agent Cache', () => {
    beforeEach(() => {
        utils.forkedAgentCache._reset();
    });
    it('should create cache params', () => {
        const params = utils.createCacheParams('test-prompt', 'system-prompt', []);
        expect(params).toBeDefined();
        expect(params.cacheKey).toBeDefined();
    });
    it('should record cache hit', () => {
        utils.recordCacheHit('test-key', 5000);
        const stats = utils.forkedAgentCache.getStats();
        expect(stats.totalHits).toBe(1);
        expect(stats.tokensSaved).toBe(5000);
    });
    it('should get or create cache entry', () => {
        const entry = utils.getOrCreateCache('test-key', () => ({
            prompt: 'test',
            tokens: 100,
            createdAt: Date.now()
        }));
        expect(entry).toBeDefined();
        expect(entry.prompt).toBe('test');
    });
});
describe('Phase 3: Session Memory Compact', () => {
    beforeEach(() => {
        utils.sessionMemoryCompact._reset();
    });
    it('should estimate tokens correctly', () => {
        const englishText = 'Hello World'; // 11 chars, ~3 tokens
        const tokens = utils.estimateTokens(englishText);
        expect(tokens).toBeGreaterThan(0);
        const chineseText = '你好世界'; // 4 chars, ~2 tokens
        const chineseTokens = utils.estimateTokens(chineseText);
        expect(chineseTokens).toBeGreaterThan(0);
    });
    it('should determine if compact needed', () => {
        // Small content - no need to compact
        const small = utils.shouldCompact('Small content', 40000);
        expect(small).toBe(false);
        // Large content - needs compact
        const large = utils.shouldCompact('Very large content...', 1000);
        expect(large).toBe(true);
    });
    it('should compact memory', () => {
        const content = `
<!-- AUTO_UPDATE: test -->
Line 1: Keep this
Line 2: Keep this too
<!-- END_AUTO_UPDATE -->
Low priority line 1
Low priority line 2
Low priority line 3
`;
        const result = utils.compactMemory(content, 100);
        expect(result).toBeDefined();
        expect(result.compressedContent.length).toBeLessThan(content.length);
        expect(result.sectionsRemoved).toBeGreaterThan(0);
    });
});
describe('Phase 4: Permission System', () => {
    beforeEach(() => {
        utils.permissionDecisionTracker._reset();
        utils.dangerousPatterns._reset();
    });
    it('should classify bash commands', () => {
        const readCmd = utils.classifyCommand('cat file.txt');
        expect(readCmd.category).toBe('file_read');
        expect(readCmd.isDangerous).toBe(false);
        const rmCmd = utils.classifyCommand('rm -rf /');
        expect(rmCmd.isDangerous).toBe(true);
        expect(rmCmd.dangerLevel).toBe('critical');
    });
    it('should detect dangerous patterns', () => {
        const result = utils.detectDangerousPattern('rm -rf /home');
        expect(result).toBeDefined();
        expect(result.isDangerous).toBe(true);
        expect(result.pattern.category).toBe('destructive');
    });
    it('should track permission decisions', () => {
        utils.recordDecision('ou_test', 'rm', 'file.txt', 'allowed');
        utils.recordDecision('ou_test', 'rm', 'file.txt', 'allowed');
        utils.recordDecision('ou_test', 'rm', 'file.txt', 'allowed');
        utils.recordDecision('ou_test', 'rm', 'file.txt', 'allowed');
        utils.recordDecision('ou_test', 'rm', 'file.txt', 'allowed');
        const preference = utils.getUserPreference('ou_test', 'rm');
        expect(preference).toBe('always_allow');
    });
    it('should check permission', () => {
        const result = utils.checkPermission('read', 'file.txt', 'ou_test');
        expect(result.allowed).toBe(true); // Read is generally safe
    });
});
describe('Phase 5: Analytics/Telemetry', () => {
    beforeEach(() => {
        utils.analyticsService._reset();
        utils.sessionTracing._reset?.();
    });
    it('should log session events', () => {
        utils.logSessionStart('session-1', 'feishu', 'ou_test');
        utils.logToolUsage('read', true, 150, 'session-1');
        utils.logSessionEnd('session-1', 300000, 10, 5, 5000);
        const stats = utils.analyticsService.getStats();
        expect(stats.totalSessions).toBe(1);
        expect(stats.totalToolCalls).toBe(1);
    });
    it('should generate analytics report', () => {
        utils.logSessionStart('session-1', 'feishu', 'ou_test');
        utils.logSessionStart('session-2', 'feishu', 'ou_test');
        const report = utils.generateAnalyticsReport(Date.now() - 60000, Date.now());
        expect(report).toBeDefined();
        expect(report.summary.totalSessions).toBe(2);
    });
    it('should track session tracing', () => {
        const trace = utils.startSessionTrace('session-1', 'feishu_message', 'feishu', 'ou_test');
        expect(trace).toBeDefined();
        expect(trace.sessionId).toBe('session-1');
        utils.recordToolCall('read', true, 150);
        utils.recordApiRequest('claude-sonnet-4', 5000, 1000, 0, 0, 2500);
        const ended = utils.sessionTracing.endSessionTrace('session-1');
        expect(ended).toBeDefined();
        expect(ended.events.length).toBeGreaterThan(0);
    });
});
describe('Phase 6: Hooks System', () => {
    it('should check tool permission', () => {
        const result = utils.canUseTool('read');
        expect(result.allowed).toBe(true);
        // Set auto mode
        utils.hooksSystem.setPermissionContext({ permissionMode: 'auto' });
        const autoResult = utils.canUseTool('bash');
        expect(autoResult.allowed).toBe(true);
    });
    it('should manage status', () => {
        utils.setStatus('thinking', 'Processing request');
        const status = utils.hooksSystem.getStatus();
        expect(status.status).toBe('thinking');
        expect(status.description).toBe('Processing request');
    });
    it('should match typeahead', () => {
        const options = [
            { id: '1', label: 'Read File', value: 'read' },
            { id: '2', label: 'Write File', value: 'write' },
            { id: '3', label: 'Execute', value: 'bash' }
        ];
        const result = utils.matchTypeahead('re', options);
        expect(result.hasMatch).toBe(true);
        expect(result.options[0].value).toBe('read');
    });
    it('should handle cancel request', () => {
        const controller = new AbortController();
        utils.hooksSystem.setCanCancel(true, controller);
        const cancelled = utils.cancelRequest();
        expect(cancelled).toBe(true);
        const context = utils.hooksSystem.getCancelContext();
        expect(context.isCancelled).toBe(true);
    });
});
describe('Phase 7: Swarm Service', () => {
    beforeEach(() => {
        // Reset teammates
        const teammates = utils.swarmService.getTeammates();
        teammates.forEach(t => {
            t.status = 'ended';
        });
    });
    it('should detect backends', async () => {
        const backends = await utils.detectBackends();
        expect(backends).toBeDefined();
        expect(backends.length).toBeGreaterThan(0);
        expect(backends.some(b => b.backendType === 'in_process')).toBe(true);
    });
    it('should create teammate', () => {
        const teammate = utils.swarmService.createTeammate('researcher', 'Search for similar implementations');
        expect(teammate).toBeDefined();
        expect(teammate.role).toBe('researcher');
        expect(teammate.status).toBe('idle');
    });
    it('should create swarm plan', () => {
        const plan = utils.swarmService.createSwarmPlan('Test Task', [
            { role: 'researcher', task: 'Research' },
            { role: 'planner', task: 'Plan' }
        ], 'parallel');
        expect(plan).toBeDefined();
        expect(plan.subtasks.length).toBe(2);
        expect(plan.layoutType).toBe('parallel');
    });
});
describe('Phase 8: Bridge Service', () => {
    beforeEach(() => {
        utils.bridgeService.disconnectBridge();
    });
    it('should connect bridge', async () => {
        utils.bridgeService.setBridgeConfig({ mode: 'local' });
        const connected = await utils.connectBridge();
        expect(connected).toBe(true);
        const state = utils.bridgeService.getBridgeState();
        expect(state.connectionState).toBe('connected');
    });
    it('should create bridge session', () => {
        const session = utils.createBridgeSession('local', 'ou_test', 'device-1', 'feishu');
        expect(session).toBeDefined();
        expect(session.source).toBe('local');
        expect(session.userId).toBe('ou_test');
    });
    it('should check capacity', () => {
        const capacity = utils.checkCapacity();
        expect(capacity).toBeDefined();
        expect(capacity.maxCapacity).toBeGreaterThan(0);
    });
    it('should send bridge message', async () => {
        await utils.connectBridge();
        const message = await utils.sendBridgeMessage({ type: 'test' }, 'local');
        expect(message).toBeDefined();
        expect(message.direction).toBe('outbound');
    });
});
describe('Cross-Phase Integration', () => {
    beforeEach(() => {
        utils.resetAll();
    });
    it('should track background task with tracing', async () => {
        // Start tracing
        const trace = utils.startSessionTrace('session-1', 'task_test', 'feishu', 'ou_test');
        // Create and run task
        const task = utils.createTask('task-1', 'Integration Test', 'Testing cross-phase integration');
        utils.updateTask('task-1', { status: 'running' });
        // Record tool call in tracing
        utils.recordToolCall('read', true, 150);
        // Complete task
        utils.completeTask('task-1');
        // End tracing
        const endedTrace = utils.sessionTracing.endSessionTrace('session-1');
        // Verify integration
        expect(endedTrace.events.length).toBeGreaterThan(0);
        expect(endedTrace.events.some(e => e.eventType === 'tool_call')).toBe(true);
        const stats = utils.taskTracker.getStats();
        expect(stats.totalCompleted).toBe(1);
    });
    it('should use cache in forked agent', () => {
        // Create cache params
        const params = utils.createCacheParams('test-prompt', 'system', []);
        // Check cache hit
        utils.recordCacheHit(params.cacheKey, 5000);
        // Verify stats
        const cacheStats = utils.forkedAgentCache.getStats();
        expect(cacheStats.tokensSaved).toBe(5000);
    });
    it('should check permission before dangerous command', () => {
        // Track decision history
        utils.recordDecision('ou_test', 'rm', 'test.txt', 'denied');
        utils.recordDecision('ou_test', 'rm', 'test.txt', 'denied');
        // Check permission for dangerous command
        const cmdResult = utils.classifyCommand('rm -rf test.txt');
        expect(cmdResult.isDangerous).toBe(true);
        const permResult = utils.checkPermission('bash', 'rm -rf test.txt', 'ou_test');
        expect(permResult.allowed).toBe(false);
    });
    it('should get system stats from all modules', () => {
        // Generate some activity
        utils.createTask('task-1', 'Test', 'Test');
        utils.logSessionStart('session-1', 'feishu', 'ou_test');
        utils.recordCacheHit('key-1', 5000);
        // Get unified stats
        const stats = utils.getSystemStats();
        expect(stats.backgroundTasks.totalCreated).toBe(1);
        expect(stats.analytics.totalSessions).toBe(1);
        expect(stats.cache.tokensSaved).toBe(5000);
        expect(stats.memory).toBeDefined();
        expect(stats.permission).toBeDefined();
        expect(stats.swarm).toBeDefined();
        expect(stats.bridge).toBeDefined();
    });
});
describe('Model Router Integration', () => {
    it('should get active model', () => {
        const model = utils.getActiveModel();
        expect(model).toBeDefined();
    });
    it('should record and handle errors', () => {
        utils.recordError('claude-sonnet-4', {
            type: 'rateLimit',
            message: 'Rate limit exceeded',
            timestamp: Date.now()
        });
        const state = utils.modelRouter.getState();
        expect(state.errors.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=integration.test.js.map