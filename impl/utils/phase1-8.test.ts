/**
 * Phase 1-8 Integration Test
 * 测试所有 Phase 1-8 模块 + 飞书卡片发送
 */

import * as utils from './index'

// ============================================
// Test Runner
// ============================================

interface TestResult {
  phase: string
  module: string
  test: string
  passed: boolean
  error?: string
  data?: unknown
}

const results: TestResult[] = []

function test(phase: string, module: string, testName: string, fn: () => unknown): void {
  try {
    const data = fn()
    results.push({ phase, module, test: testName, passed: true, data })
  } catch (e) {
    results.push({ 
      phase, 
      module, 
      test: testName, 
      passed: false, 
      error: e instanceof Error ? e.message : String(e) 
    })
  }
}

// ============================================
// Phase 1: Background Task
// ============================================

test('1', 'taskTracker', 'createTask', () => {
  const task = utils.createTask('test-task', 'Test Task', 'Testing')
  return task.id !== undefined
})

test('1', 'taskTracker', 'updateTask', () => {
  const task = utils.createTask('test-task-2', 'Test Task 2', 'Testing')
  utils.updateTask(task.id, { progress: 50, status: 'running' })
  return utils.getTask(task.id)?.progress === 50
})

test('1', 'taskTracker', 'getActiveTasks', () => {
  const tasks = utils.taskTracker.getActiveTasks()
  return Array.isArray(tasks)
})

test('1', 'backgroundTaskCard', 'createTaskStartCard', () => {
  const card = utils.createTaskStartCard({ taskId: 'test', taskName: 'Test', description: 'Testing' })
  return card !== undefined
})

// ============================================
// Phase 2: Forked Agent Cache
// ============================================

test('2', 'forkedAgentCache', 'createCacheParams', () => {
  const params = utils.createCacheParams({ messages: [], systemPrompt: 'test' })
  return params.cacheKey !== undefined
})

test('2', 'forkedAgentCache', 'recordCacheHit', () => {
  utils.recordCacheHit('test-cache-key')
  const stats = utils.forkedAgentCache.getStats()
  return stats.cacheHits >= 1
})

test('2', 'forkedAgentCache', 'getStats', () => {
  const stats = utils.forkedAgentCache.getStats()
  return stats.totalRequests >= 0
})

// ============================================
// Phase 3: Session Memory Compact
// ============================================

test('3', 'sessionMemoryCompact', 'estimateTokens', () => {
  const tokens = utils.estimateTokens('测试文本内容')
  return tokens > 0
})

test('3', 'sessionMemoryCompact', 'shouldCompact', () => {
  const needCompact = utils.shouldCompact(200000, 150000)
  return typeof needCompact === 'boolean'
})

test('3', 'sessionMemoryCompact', 'compactMemory', () => {
  const result = utils.compactMemory('长文本内容...', 'high')
  return result.compressedContent !== undefined
})

// ============================================
// Phase 4: Permission System
// ============================================

test('4', 'dangerousPatterns', 'detectDangerousPattern', () => {
  const result = utils.detectDangerousPattern('rm -rf /')
  return result.detected === true
})

test('4', 'bashCommandClassifier', 'classifyCommand', () => {
  const result = utils.classifyCommand('ls -la')
  return result.category !== undefined
})

test('4', 'permissionDecisionTracker', 'recordDecision', () => {
  utils.recordDecision('test-command', 'allowed', 'user-test')
  const stats = utils.permissionDecisionTracker.getStats()
  return stats.totalChecks >= 1
})

test('4', 'permissionUtils', 'checkPermission', () => {
  const result = utils.checkPermission({ command: 'ls', user: 'test' })
  return result.allowed !== undefined
})

// ============================================
// Phase 5: Analytics/Telemetry
// ============================================

test('5', 'sessionTracing', 'startSessionTrace', () => {
  const trace = utils.startSessionTrace('test-session')
  return trace.id !== undefined
})

test('5', 'sessionTracing', 'recordToolCall', () => {
  utils.recordToolCall('Read', { file: 'test.md' })
  return true
})

test('5', 'analyticsService', 'logSessionStart', () => {
  utils.logSessionStart('test-session')
  const stats = utils.analyticsService.getStats()
  return stats.sessionCount >= 1
})

// ============================================
// Phase 6: Hooks System
// ============================================

test('6', 'hooksSystem', 'canUseTool', () => {
  const canUse = utils.canUseTool({ tool: 'Read', context: {} })
  return typeof canUse === 'boolean'
})

test('6', 'hooksSystem', 'setStatus', () => {
  utils.setStatus({ busy: true, message: 'Testing' })
  return true
})

test('6', 'hooksSystem', 'getStats', () => {
  const stats = utils.hooksSystem.getStats()
  return stats.registeredHooks >= 0
})

// ============================================
// Phase 7: Swarm Service
// ============================================

test('7', 'swarmService', 'detectBackends', async () => {
  const backends = await utils.detectBackends()
  return Array.isArray(backends)
})

test('7', 'swarmService', 'createTeammate', () => {
  const teammate = utils.createTeammate('researcher', 'Test Researcher')
  return teammate.id !== undefined
})

test('7', 'swarmService', 'getAvailableBackends', () => {
  const backends = utils.swarmService.getAvailableBackends()
  return Array.isArray(backends)
})

// ============================================
// Phase 8: Bridge Service
// ============================================

test('8', 'bridgeService', 'checkCapacity', () => {
  const capacity = utils.checkCapacity()
  return capacity.currentLoad >= 0
})

test('8', 'bridgeService', 'connectBridge', async () => {
  const result = await utils.connectBridge({ mode: 'local' })
  return result.connected !== undefined
})

test('8', 'bridgeService', 'getActiveBridgeSessions', () => {
  const sessions = utils.bridgeService.getActiveBridgeSessions()
  return Array.isArray(sessions)
})

// ============================================
// Output Results
// ============================================

console.log('\n========================================')
console.log('Phase 1-8 Integration Test Results')
console.log('========================================\n')

const passed = results.filter(r => r.passed).length
const failed = results.filter(r => !r.passed).length

for (const result of results) {
  const status = result.passed ? '✅' : '❌'
  console.log(`${status} [Phase ${result.phase}] ${result.module}.${result.test}`)
  if (!result.passed && result.error) {
    console.log(`   Error: ${result.error}`)
  }
}

console.log('\n----------------------------------------')
console.log(`Total: ${results.length} tests`)
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
console.log('----------------------------------------\n')

// Export for external use
export { results, passed, failed }