/**
 * Performance Benchmark - Phase 1-8
 * 
 * 性能基准测试
 */

import { performance } from 'perf_hooks'

// Mock implementations for benchmark
const mockModules = {
  // Phase 1
  createTask: () => ({ taskId: `task_${Date.now()}`, status: 'idle' }),
  updateTask: () => {},
  createCard: () => ({ type: 'template' }),
  
  // Phase 2
  createCacheParams: (prompt: string) => ({ cacheKey: `key_${prompt.length}`, prompt }),
  checkCache: () => ({ hit: Math.random() > 0.5 }),
  
  // Phase 3
  estimateTokens: (text: string) => Math.ceil(text.length / 4),
  compactMemory: (content: string) => content.slice(0, content.length * 0.7),
  
  // Phase 4
  analyzeCommand: (cmd: string) => ({ isDangerous: cmd.includes('rm -rf'), level: 'safe' }),
  classifyCommand: () => ({ category: 'file_read', isDangerous: false }),
  checkPermission: () => ({ allowed: true }),
  
  // Phase 5
  logEvent: () => {},
  traceSession: () => ({ sessionId: 's1', events: [] }),
  
  // Phase 6
  canUseTool: () => ({ allowed: true }),
  setStatus: () => {},
  
  // Phase 7
  createTeammate: () => ({ teammateId: 't1', role: 'researcher' }),
  
  // Phase 8
  checkCapacity: () => ({ available: true, maxCapacity: 10 })
}

interface BenchmarkResult {
  operation: string
  iterations: number
  totalTimeMs: number
  avgTimeMs: number
  minTimeMs: number
  maxTimeMs: number
  opsPerSecond: number
}

function benchmark(
  name: string,
  fn: () => void,
  iterations: number = 10000
): BenchmarkResult {
  const times: number[] = []
  
  // Warmup
  for (let i = 0; i < 100; i++) {
    fn()
  }
  
  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    const end = performance.now()
    times.push(end - start)
  }
  
  const totalTimeMs = times.reduce((a, b) => a + b, 0)
  const avgTimeMs = totalTimeMs / iterations
  const minTimeMs = Math.min(...times)
  const maxTimeMs = Math.max(...times)
  const opsPerSecond = 1000 / avgTimeMs
  
  return {
    operation: name,
    iterations,
    totalTimeMs,
    avgTimeMs,
    minTimeMs,
    maxTimeMs,
    opsPerSecond
  }
}

// Run benchmarks
console.log('🚀 Phase 1-8 Performance Benchmark\n')
console.log('='.repeat(60))

const results: BenchmarkResult[] = []

// Phase 1: Background Task
results.push(benchmark('Phase 1: createTask', () => mockModules.createTask()))
results.push(benchmark('Phase 1: updateTask', () => mockModules.updateTask()))
results.push(benchmark('Phase 1: createCard', () => mockModules.createCard()))

// Phase 2: Cache
results.push(benchmark('Phase 2: createCacheParams', () => mockModules.createCacheParams('test prompt')))
results.push(benchmark('Phase 2: checkCache', () => mockModules.checkCache()))

// Phase 3: Memory Compact
const longText = 'Lorem ipsum '.repeat(1000)
results.push(benchmark('Phase 3: estimateTokens', () => mockModules.estimateTokens(longText)))
results.push(benchmark('Phase 3: compactMemory', () => mockModules.compactMemory(longText)))

// Phase 4: Permission
results.push(benchmark('Phase 4: analyzeCommand', () => mockModules.analyzeCommand('rm -rf /')))
results.push(benchmark('Phase 4: classifyCommand', () => mockModules.classifyCommand()))
results.push(benchmark('Phase 4: checkPermission', () => mockModules.checkPermission()))

// Phase 5: Analytics
results.push(benchmark('Phase 5: logEvent', () => mockModules.logEvent()))
results.push(benchmark('Phase 5: traceSession', () => mockModules.traceSession()))

// Phase 6: Hooks
results.push(benchmark('Phase 6: canUseTool', () => mockModules.canUseTool()))
results.push(benchmark('Phase 6: setStatus', () => mockModules.setStatus()))

// Phase 7: Swarm
results.push(benchmark('Phase 7: createTeammate', () => mockModules.createTeammate()))

// Phase 8: Bridge
results.push(benchmark('Phase 8: checkCapacity', () => mockModules.checkCapacity()))

// Print results
console.log('\n📊 Results\n')
console.log('Operation'.padEnd(40), 'Avg (ms)'.padStart(10), 'Ops/sec'.padStart(15))
console.log('-'.repeat(65))

for (const r of results) {
  console.log(
    r.operation.padEnd(40),
    r.avgTimeMs.toFixed(4).padStart(10),
    r.opsPerSecond.toFixed(0).padStart(15)
  )
}

// Summary
console.log('\n📈 Summary\n')
const totalOps = results.reduce((sum, r) => sum + r.opsPerSecond, 0)
const avgOpsPerSec = totalOps / results.length
const fastest = results.reduce((a, b) => a.opsPerSecond > b.opsPerSecond ? a : b)
const slowest = results.reduce((a, b) => a.opsPerSecond < b.opsPerSecond ? a : b)

console.log(`Total Operations Tested: ${results.length}`)
console.log(`Average Ops/sec: ${avgOpsPerSec.toFixed(0)}`)
console.log(`Fastest: ${fastest.operation} (${fastest.opsPerSecond.toFixed(0)} ops/sec)`)
console.log(`Slowest: ${slowest.operation} (${slowest.opsPerSecond.toFixed(0)} ops/sec)`)

// Performance grades
console.log('\n🏆 Performance Grades\n')
for (const r of results) {
  let grade = '🟢 Excellent'
  if (r.avgTimeMs > 0.1) grade = '🟡 Good'
  if (r.avgTimeMs > 1) grade = '🟠 Acceptable'
  if (r.avgTimeMs > 10) grade = '🔴 Slow'
  
  console.log(`${r.operation}: ${grade} (${r.avgTimeMs.toFixed(4)}ms)`)
}

export { results, benchmark }