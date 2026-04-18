# Bundled Skills Pattern Skill

Bundled Skills Pattern - BundledSkillDefinition + registerBundledSkill + files extraction + Closure-local memoization + extractionPromise + prependBaseDir。

## 功能概述

从Claude Code的skills/bundledSkills.ts提取的bundled skills模式，用于OpenClaw的内置技能。

## 核心机制

### BundledSkillDefinition Type

```typescript
export type BundledSkillDefinition = {
  name: string
  description: string
  aliases?: string[]
  whenToUse?: string
  argumentHint?: string
  allowedTools?: string[]
  model?: string
  disableModelInvocation?: boolean
  userInvocable?: boolean
  isEnabled?: () => boolean
  hooks?: HooksSettings
  context?: 'inline' | 'fork'
  agent?: string
  /**
   * Additional reference files to extract to disk on first invocation.
   * Keys are relative paths (forward slashes, no `..`), values are content.
   * When set, the skill prompt is prefixed with a "Base directory for this
   * skill: <dir>" line so the model can Read/Grep these files on demand.
   */
  files?: Record<string, string>
  getPromptForCommand: (
    args: string,
    context: ToolUseContext,
  ) => Promise<ContentBlockParam[]>
}
// Comprehensive skill definition
// files: reference files to extract on first invocation
// getPromptForCommand: async function
```

### registerBundledSkill

```typescript
export function registerBundledSkill(definition: BundledSkillDefinition): void {
  const { files } = definition

  let skillRoot: string | undefined
  let getPromptForCommand = definition.getPromptForCommand

  if (files && Object.keys(files).length > 0) {
    skillRoot = getBundledSkillExtractDir(definition.name)
    // Closure-local memoization
    let extractionPromise: Promise<string | null> | undefined
    const inner = definition.getPromptForCommand
    getPromptForCommand = async (args, ctx) => {
      extractionPromise ??= extractBundledSkillFiles(definition.name, files)
      const extractedDir = await extractionPromise
      const blocks = await inner(args, ctx)
      if (extractedDir === null) return blocks
      return prependBaseDir(blocks, extractedDir)
    }
  }

  const command: Command = {
    type: 'prompt',
    name: definition.name,
    // ...
  }

  bundledSkills.push(command)
}
// Register skill to internal registry
// files: extract on first invocation
// Closure-local memoization (extract once per process)
```

### Closure-Local Memoization

```typescript
// Closure-local memoization: extract once per process.
// Memoize the promise (not the result) so concurrent callers await
// the same extraction instead of racing into separate writes.
let extractionPromise: Promise<string | null> | undefined
extractionPromise ??= extractBundledSkillFiles(definition.name, files)
const extractedDir = await extractionPromise
// Memoize promise (not result)
# Concurrent callers await same extraction
# Prevent race condition
```

### prependBaseDir

```typescript
return prependBaseDir(blocks, extractedDir)
// Prefix prompt with "Base directory for this skill: <dir>"
// Model can Read/Grep these files on demand
// Same contract as disk-based skills
```

### getBundledSkillExtractDir

```typescript
skillRoot = getBundledSkillExtractDir(definition.name)
// Get extract directory for bundled skill files
// Unique directory per skill
```

### extractBundledSkillFiles

```typescript
const extractedDir = await extractionPromise
// Extract files to disk on first invocation
// Keys are relative paths (forward slashes, no `..`)
// Values are content
```

## 实现建议

### OpenClaw适配

1. **bundledSkillDefinition**: BundledSkillDefinition类型
2. **registerBundledSkill**: 注册函数
3. **filesExtraction**: files extraction pattern
4. **closureMemoize**: Closure-local memoization
5. **prependBaseDir**: prependBaseDir pattern

### 状态文件示例

```json
{
  "skillName": "healthcheck",
  "filesExtracted": true,
  "extractDir": "/tmp/healthcheck-skill"
}
```

## 关键模式

### Files Extraction on First Invocation

```
files: Record<string, string> → extract on first invocation → Read/Grep on demand
// 首次调用时提取文件
// 模型可Read/Grep这些文件
// 与disk-based skills相同contract
```

### Closure-Local Memoization

```
let extractionPromise: Promise | undefined → ??= → concurrent callers await same
// Closure-local memoization
// Memoize promise而非result
// 并发调用者等待同一个extraction
```

### prependBaseDir Prefix

```
prependBaseDir(blocks, extractedDir) → "Base directory for this skill: <dir>"
// Prompt前缀base directory
// 模型知道文件位置
// 可按需Read/Grep
```

### Relative Paths Pattern

```
Keys: relative paths (forward slashes, no `..`) → safe extraction
// 相对路径（forward slashes）
// 不允许`..`
// 安全提取
```

## 借用价值

- ⭐⭐⭐⭐⭐ BundledSkillDefinition comprehensive type
- ⭐⭐⭐⭐⭐ Files extraction on first invocation
- ⭐⭐⭐⭐⭐ Closure-local promise memoization
- ⭐⭐⭐⭐⭐ prependBaseDir pattern
- ⭐⭐⭐⭐ registerBundledSkill registry pattern

## 来源

- Claude Code: `skills/bundledSkills.ts`
- 分析报告: P46-4