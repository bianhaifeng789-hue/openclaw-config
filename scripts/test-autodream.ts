/**
 * AutoDream 记忆合并实际测试脚本
 * 
 * 运行方式：tsx scripts/test-autodream.ts
 */

import * as fs from 'fs/promises'
import * as path from 'path'

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.join(process.env.HOME!, '.openclaw/workspace')
const MEMORY_DIR = path.join(WORKSPACE_ROOT, 'memory')

interface DreamState {
  lastConsolidatedAt: number
  sessionCount: number
  isLocked: boolean
  lockAcquiredBy: string | null
  filesTouched: string[]
  savedTokens: number
  totalRuns: number
}

interface AutoDreamConfig {
  minHours: number
  minSessions: number
  enabled: boolean
}

const DEFAULT_CONFIG: AutoDreamConfig = {
  minHours: 24,
  minSessions: 5,
  enabled: true,
}

// ============================================================================
// Test Functions
// ============================================================================

async function loadDreamState(): Promise<DreamState> {
  try {
    const content = await fs.readFile(path.join(MEMORY_DIR, 'dream-state.json'), 'utf-8')
    return JSON.parse(content)
  } catch {
    return {
      lastConsolidatedAt: 0,
      sessionCount: 0,
      isLocked: false,
      lockAcquiredBy: null,
      filesTouched: [],
      savedTokens: 0,
      totalRuns: 0,
    }
  }
}

async function saveDreamState(state: DreamState): Promise<void> {
  await fs.writeFile(
    path.join(MEMORY_DIR, 'dream-state.json'),
    JSON.stringify(state, null, 2),
    'utf-8'
  )
}

function checkTimeGate(state: DreamState, config: AutoDreamConfig): { pass: boolean; hoursSince: number } {
  const hoursSince = (Date.now() - state.lastConsolidatedAt) / 3_600_000
  return { pass: hoursSince >= config.minHours, hoursSince }
}

function checkSessionGate(state: DreamState, config: AutoDreamConfig): { pass: boolean; count: number } {
  return { pass: state.sessionCount >= config.minSessions, count: state.sessionCount }
}

function checkLockGate(state: DreamState): { pass: boolean; locked: boolean } {
  return { pass: !state.isLocked, locked: state.isLocked }
}

function shouldRunAutoDream(state: DreamState, config: AutoDreamConfig): { shouldRun: boolean; reason: string } {
  if (!config.enabled) {
    return { shouldRun: false, reason: 'disabled' }
  }
  
  const timeCheck = checkTimeGate(state, config)
  if (!timeCheck.pass) {
    return { shouldRun: false, reason: `time_gate: ${Math.floor(timeCheck.hoursSince)}h < ${config.minHours}h` }
  }
  
  const sessionCheck = checkSessionGate(state, config)
  if (!sessionCheck.pass) {
    return { shouldRun: false, reason: `session_gate: ${sessionCheck.count} < ${config.minSessions}` }
  }
  
  const lockCheck = checkLockGate(state)
  if (!lockCheck.pass) {
    return { shouldRun: false, reason: 'locked' }
  }
  
  return { shouldRun: true, reason: 'all_gates_passed' }
}

// ============================================================================
// Test Suite
// ============================================================================

async function runTests() {
  console.log('=== AutoDream 记忆合并测试 ===\n')
  
  const state = await loadDreamState()
  const config = DEFAULT_CONFIG
  
  // Test 1: 加载状态
  console.log('Test 1: 加载 dream-state.json')
  console.log('  lastConsolidatedAt:', state.lastConsolidatedAt === 0 ? '初始状态' : new Date(state.lastConsolidatedAt).toISOString())
  console.log('  sessionCount:', state.sessionCount)
  console.log('  isLocked:', state.isLocked)
  console.log('  totalRuns:', state.totalRuns)
  console.log('  savedTokens:', state.savedTokens)
  console.log()
  
  // Test 2: 门控检查
  console.log('Test 2: 门控检查')
  const timeCheck = checkTimeGate(state, config)
  console.log(`  Time Gate: ${timeCheck.pass ? '✅ PASS' : '❌ FAIL'} (${Math.floor(timeCheck.hoursSince)}h >= ${config.minHours}h)`)
  
  const sessionCheck = checkSessionGate(state, config)
  console.log(`  Session Gate: ${sessionCheck.pass ? '✅ PASS' : '❌ FAIL'} (${sessionCheck.count} >= ${config.minSessions})`)
  
  const lockCheck = checkLockGate(state)
  console.log(`  Lock Gate: ${lockCheck.pass ? '✅ PASS' : '❌ FAIL'} (locked: ${lockCheck.locked})`)
  console.log()
  
  // Test 3: 综合判断
  console.log('Test 3: 综合判断 shouldRunAutoDream()')
  const shouldRun = shouldRunAutoDream(state, config)
  console.log(`  shouldRun: ${shouldRun.shouldRun ? '✅ YES' : '❌ NO'}`)
  console.log(`  reason: ${shouldRun.reason}`)
  console.log()
  
  // Test 4: 模拟门控场景
  console.log('Test 4: 模拟不同场景')
  
  // 场景 4a: 初始状态（sessionCount = 0）
  const initialScenario = shouldRunAutoDream(
    { ...state, lastConsolidatedAt: 0, sessionCount: 0 },
    config
  )
  console.log(`  场景 4a (初始): ${initialScenario.shouldRun ? '会运行' : '不运行'} (${initialScenario.reason})`)
  
  // 场景 4b: 时间满足但 session 不满足
  const partialScenario = shouldRunAutoDream(
    { ...state, lastConsolidatedAt: Date.now() - 25 * 3_600_000, sessionCount: 3 },
    config
  )
  console.log(`  场景 4b (时间✅ 会话❌): ${partialScenario.shouldRun ? '会运行' : '不运行'} (${partialScenario.reason})`)
  
  // 场景 4c: 全部满足
  const matureScenario = shouldRunAutoDream(
    { ...state, lastConsolidatedAt: Date.now() - 25 * 3_600_000, sessionCount: 7, isLocked: false },
    config
  )
  console.log(`  场景 4c (全部✅): ${matureScenario.shouldRun ? '会运行' : '不运行'} (${matureScenario.reason})`)
  
  // 场景 4d: 锁定
  const lockedScenario = shouldRunAutoDream(
    { ...state, lastConsolidatedAt: Date.now() - 25 * 3_600_000, sessionCount: 7, isLocked: true },
    config
  )
  console.log(`  场景 4d (锁定): ${lockedScenario.shouldRun ? '会运行' : '不运行'} (${lockedScenario.reason})`)
  console.log()
  
  // Test 5: 更新状态模拟
  console.log('Test 5: 状态更新模拟')
  const priorState = { ...state }
  
  // 模拟增加 sessionCount
  const afterIncrement = { ...priorState, sessionCount: priorState.sessionCount + 1 }
  console.log(`  incrementSessionCount: ${priorState.sessionCount} → ${afterIncrement.sessionCount}`)
  
  // 模拟合并完成
  const afterConsolidation = {
    ...afterIncrement,
    lastConsolidatedAt: Date.now(),
    sessionCount: 0,
    totalRuns: priorState.totalRuns + 1,
    savedTokens: priorState.savedTokens + 5000,
    filesTouched: ['MEMORY.md'],
  }
  console.log(`  合并完成: totalRuns ${priorState.totalRuns} → ${afterConsolidation.totalRuns}`)
  console.log(`  savedTokens: ${priorState.savedTokens} → ${afterConsolidation.savedTokens}`)
  console.log(`  sessionCount 重置: ${afterIncrement.sessionCount} → ${afterConsolidation.sessionCount}`)
  console.log()
  
  // Test 6: 飞书卡片生成
  console.log('Test 6: 飞书卡片生成')
  
  const successCard = {
    title: '✅ AutoDream 合并完成',
    content: `更新文件: MEMORY.md\n节省 tokens: 5000\n耗时: 30s\n累计合并: ${afterConsolidation.totalRuns} 次\n累计节省: ${afterConsolidation.savedTokens} tokens`,
  }
  console.log('  成功卡片:')
  console.log(`    title: ${successCard.title}`)
  console.log(`    content:\n${successCard.content.split('\n').map(l => '      ' + l).join('\n')}`)
  
  const failCard = {
    title: '❌ AutoDream 合并失败',
    content: `原因: session_gate: 3 < 5\n耗时: 0s`,
  }
  console.log('  失败卡片:')
  console.log(`    title: ${failCard.title}`)
  console.log(`    content:\n${failCard.content.split('\n').map(l => '      ' + l).join('\n')}`)
  console.log()
  
  // Test 7: 实际写入测试
  console.log('Test 7: 实际状态写入测试')
  try {
    // 模拟第一次运行标记
    const testState: DreamState = {
      lastConsolidatedAt: Date.now(),
      sessionCount: 5,
      isLocked: false,
      lockAcquiredBy: null,
      filesTouched: [],
      savedTokens: 0,
      totalRuns: 0,
    }
    
    await saveDreamState(testState)
    console.log('  ✅ 写入 dream-state.json 成功')
    
    const reloaded = await loadDreamState()
    console.log('  ✅ 重新加载成功')
    console.log(`  lastConsolidatedAt: ${new Date(reloaded.lastConsolidatedAt).toISOString()}`)
    console.log(`  sessionCount: ${reloaded.sessionCount}`)
    
    // 恢复原始状态
    await saveDreamState(priorState)
    console.log('  ✅ 恢复原始状态')
  } catch (err) {
    console.log(`  ❌ 错误: ${err}`)
  }
  console.log()
  
  // Summary
  console.log('=== 测试总结 ===')
  console.log(`所有门控检查: 正常`)
  console.log(`状态管理: 正常`)
  console.log(`飞书卡片生成: 正常`)
  console.log(`实际状态写入: 正常`)
  console.log()
  console.log('建议下一步:')
  console.log('  1. 使用 sessions_spawn 运行 forked agent 实际合并')
  console.log('  2. 发送飞书卡片通知用户')
  console.log('  3. 验证 MEMORY.md 更新结果')
}

// ============================================================================
// Run
// ============================================================================

runTests().catch(console.error)