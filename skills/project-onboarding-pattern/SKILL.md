# Project Onboarding Pattern Skill

Project Onboarding Pattern - Step type + getSteps + isProjectOnboardingComplete + shouldShowProjectOnboarding + memoize + incrementProjectOnboardingSeenCount + MAX_SEEN_COUNT=4。

## 功能概述

从Claude Code的projectOnboardingState.ts提取的项目引导模式，用于OpenClaw的新用户引导。

## 核心机制

### Step Type

```typescript
export type Step = {
  key: string
  text: string
  isComplete: boolean
  isCompletable: boolean
  isEnabled: boolean
}
// Step definition
// key: identifier
// text: instruction text
// isComplete: completion status
// isCompletable: can be completed
// isEnabled: currently active
```

### getSteps

```typescript
export function getSteps(): Step[] {
  const hasClaudeMd = getFsImplementation().existsSync(
    join(getCwd(), 'CLAUDE.md'),
  )
  const isWorkspaceDirEmpty = isDirEmpty(getCwd())

  return [
    {
      key: 'workspace',
      text: 'Ask Claude to create a new app or clone a repository',
      isComplete: false,
      isCompletable: true,
      isEnabled: isWorkspaceDirEmpty,
    },
    {
      key: 'claudemd',
      text: 'Run /init to create a CLAUDE.md file',
      isComplete: hasClaudeMd,
      isCompletable: true,
      isEnabled: !isWorkspaceDirEmpty,
    },
  ]
}
// Dynamic step generation
// File system checks
// Conditional enabling
```

### isProjectOnboardingComplete

```typescript
export function isProjectOnboardingComplete(): boolean {
  return getSteps()
    .filter(({ isCompletable, isEnabled }) => isCompletable && isEnabled)
    .every(({ isComplete }) => isComplete)
}
// Check all completable + enabled steps complete
// Filter + every pattern
```

### maybeMarkProjectOnboardingComplete

```typescript
export function maybeMarkProjectOnboardingComplete(): void {
  // Short-circuit on cached config — isProjectOnboardingComplete() hits
  // the filesystem, and REPL.tsx calls this on every prompt submit.
  if (getCurrentProjectConfig().hasCompletedProjectOnboarding) {
    return
  }
  if (isProjectOnboardingComplete()) {
    saveCurrentProjectConfig(current => ({
      ...current,
      hasCompletedProjectOnboarding: true,
    }))
  }
}
// Short-circuit on cached config
# Avoid filesystem hit on every prompt
# Cache-first pattern
```

### shouldShowProjectOnboarding

```typescript
export const shouldShowProjectOnboarding = memoize((): boolean => {
  const projectConfig = getCurrentProjectConfig()
  // Short-circuit on cached config before filesystem check
  if (
    projectConfig.hasCompletedProjectOnboarding ||
    projectConfig.projectOnboardingSeenCount >= 4 ||
    process.env.IS_DEMO
  ) {
    return false
  }

  return !isProjectOnboardingComplete()
})
// Memoized function
# Short-circuit checks
# MAX_SEEN_COUNT=4
```

### incrementProjectOnboardingSeenCount

```typescript
export function incrementProjectOnboardingSeenCount(): void {
  saveCurrentProjectConfig(current => ({
    ...current,
    projectOnboardingSeenCount:
      (current.projectOnboardingSeenCount ?? 0) + 1,
  }))
}
// Increment seen count
// Persist to config
```

### MAX_SEEN_COUNT=4 Pattern

```typescript
projectConfig.projectOnboardingSeenCount >= 4 → stop showing
// Seen count threshold
// 4 times max
// Auto-hide after threshold
```

## 实现建议

### OpenClaw适配

1. **stepType**: Step type definition
2. **getSteps**: Dynamic step generation
3. **isComplete**: isProjectOnboardingComplete pattern
4. **shouldShow**: shouldShowProjectOnboarding memoize
5. **seenCount**: incrementProjectOnboardingSeenCount

### 状态文件示例

```json
{
  "steps": [
    {"key": "workspace", "isComplete": false, "isEnabled": true}
  ],
  "hasCompletedOnboarding": false,
  "seenCount": 2
}
```

## 关键模式

### Filter + Every Completion Check

```
filter(isCompletable && isEnabled) → every(isComplete) → complete
// Filter可完成+启用的steps
// every检查所有完成
```

### Cache-First Short-Circuit

```
if (cachedConfig.hasCompletedOnboarding) return → avoid filesystem hit
// 缓存优先short-circuit
// 避免filesystem hit
// REPL调用频繁
```

### Memoize + Short-Circuit

```
memoize((): boolean) + short-circuit checks → efficient repeated calls
// Memoize避免重复计算
// Short-circuit加速检查
```

### Seen Count Threshold

```
projectOnboardingSeenCount >= 4 → stop showing → auto-hide
// 查看次数阈值=4
// 达到阈值后自动隐藏
// 防止过度显示
```

### Conditional isEnabled

```
isEnabled: isWorkspaceDirEmpty → dynamic enable → file system check
// 动态启用条件
// 文件系统检查
// 上下文相关
```

## 借用价值

- ⭐⭐⭐⭐⭐ Step type definition
- ⭐⭐⭐⭐⭐ Filter + every completion check
- ⭐⭐⭐⭐⭐ Cache-first short-circuit pattern
- ⭐⭐⭐⭐⭐ Memoize + short-circuit pattern
- ⭐⭐⭐⭐ Seen count threshold (MAX=4)

## 来源

- Claude Code: `projectOnboardingState.ts`
- 分析报告: P47-4