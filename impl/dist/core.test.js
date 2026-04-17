/**
 * Core Integration Tests - Phase 1-8
 *
 * 简化版测试，验证核心模块基本功能
 */
import { describe, it, expect, beforeEach } from 'vitest';
// Phase 1: Background Task
import { taskTracker, createTask, updateTask, getTask } from './task-tracker';
import { createTaskStartCard } from './background-task-card';
// Phase 2: Forked Agent Cache
import { forkedAgentCache, createCacheParams, recordCacheHit } from './forked-agent-cache';
// Phase 3: Session Memory Compact
import { sessionMemoryCompact, estimateTokens, shouldCompact } from './session-memory-compact';
// Phase 4: Permission System
import { dangerousPatterns, detectDangerousPattern } from './dangerous-patterns';
import { classifyCommand } from './bash-command-classifier';
import { permissionDecisionTracker, recordDecision, getUserPreference } from './permission-decision-tracker';
// Phase 5: Analytics
import { analyticsService, logSessionStart, logToolUsage } from './analytics-service';
import { startSessionTrace, recordToolCall } from './session-tracing';
// Phase 6: Hooks
import { hooksSystem, canUseTool, setStatus, matchTypeahead } from './hooks-system';
// Phase 7: Swarm
import { detectBackends, createTeammate } from './swarm-service';
// Phase 8: Bridge
import { bridgeService, connectBridge, createBridgeSession, checkCapacity } from './bridge-service';
describe('Phase 1: Background Task', () => {
    beforeEach(() => taskTracker._reset());
    it('creates and tracks tasks', () => {
        const task = createTask('t1', 'Test', 'Testing');
        expect(task.taskId).toBe('t1');
        expect(taskTracker.getStats().totalCreated).toBe(1);
    });
    it('updates task progress', () => {
        createTask('t1', 'Test', 'Testing');
        updateTask('t1', { status: 'running', progress: 50 });
        expect(getTask('t1')?.progress).toBe(50);
    });
    it('creates task cards', () => {
        const startCard = createTaskStartCard({ taskId: 't1', taskName: 'Test', description: 'D' });
        expect(startCard.type).toBe('template');
    });
});
describe('Phase 2: Forked Agent Cache', () => {
    beforeEach(() => forkedAgentCache._reset());
    it('creates cache params', () => {
        const params = createCacheParams('prompt', 'system', []);
        expect(params.cacheKey).toBeDefined();
    });
    it('records cache hits', () => {
        recordCacheHit('key', 5000);
        expect(forkedAgentCache.getStats().tokensSaved).toBe(5000);
    });
});
describe('Phase 3: Session Memory Compact', () => {
    beforeEach(() => sessionMemoryCompact._reset());
    it('estimates tokens', () => {
        const tokens = estimateTokens('Hello World 你好');
        expect(tokens).toBeGreaterThan(0);
    });
    it('detects need for compact', () => {
        expect(shouldCompact('Small', 40000)).toBe(false);
        expect(shouldCompact('Huge', 100)).toBe(true);
    });
});
describe('Phase 4: Permission System', () => {
    beforeEach(() => {
        permissionDecisionTracker._reset();
        dangerousPatterns._reset();
    });
    it('classifies commands', () => {
        const safe = classifyCommand('cat file.txt');
        expect(safe.isDangerous).toBe(false);
        const danger = classifyCommand('rm -rf /');
        expect(danger.isDangerous).toBe(true);
    });
    it('detects dangerous patterns', () => {
        const result = detectDangerousPattern('rm -rf /home');
        expect(result.isDangerous).toBe(true);
    });
    it('learns user preferences', () => {
        for (let i = 0; i < 5; i++) {
            recordDecision('user1', 'rm', 'file', 'allowed');
        }
        expect(getUserPreference('user1', 'rm')).toBe('always_allow');
    });
});
describe('Phase 5: Analytics', () => {
    beforeEach(() => analyticsService._reset());
    it('logs session events', () => {
        logSessionStart('s1', 'feishu', 'user1');
        logToolUsage('read', true, 100, 's1');
        expect(analyticsService.getStats().totalSessions).toBe(1);
    });
    it('traces sessions', () => {
        const trace = startSessionTrace('s1', 'test', 'feishu', 'user1');
        recordToolCall('read', true, 100);
        expect(trace.sessionId).toBe('s1');
    });
});
describe('Phase 6: Hooks System', () => {
    it('checks tool permissions', () => {
        const result = canUseTool('read');
        expect(result.allowed).toBe(true);
    });
    it('manages status', () => {
        setStatus('thinking', 'Processing');
        expect(hooksSystem.getStatus().status).toBe('thinking');
    });
    it('matches typeahead', () => {
        const options = [{ id: '1', label: 'Read', value: 'read' }];
        const result = matchTypeahead('re', options);
        expect(result.hasMatch).toBe(true);
    });
});
describe('Phase 7: Swarm Service', () => {
    it('detects backends', async () => {
        const backends = await detectBackends();
        expect(backends.length).toBeGreaterThan(0);
    });
    it('creates teammates', () => {
        const t = createTeammate('researcher', 'Search');
        expect(t.role).toBe('researcher');
    });
});
describe('Phase 8: Bridge Service', () => {
    it('connects bridge', async () => {
        bridgeService.setBridgeConfig({ mode: 'local' });
        const connected = await connectBridge();
        expect(connected).toBe(true);
    });
    it('creates sessions', () => {
        const session = createBridgeSession('local', 'user1');
        expect(session.source).toBe('local');
    });
    it('checks capacity', () => {
        const cap = checkCapacity();
        expect(cap.maxCapacity).toBeGreaterThan(0);
    });
});
describe('Cross-Phase Integration', () => {
    beforeEach(() => {
        taskTracker._reset();
        forkedAgentCache._reset();
        analyticsService._reset();
    });
    it('tracks task with tracing', () => {
        startSessionTrace('s1', 'test', 'feishu', 'user1');
        createTask('t1', 'Test', 'Testing');
        recordToolCall('read', true, 100);
        recordCacheHit('key', 5000);
        expect(taskTracker.getStats().totalCreated).toBe(1);
        expect(forkedAgentCache.getStats().tokensSaved).toBe(5000);
    });
});
//# sourceMappingURL=core.test.js.map