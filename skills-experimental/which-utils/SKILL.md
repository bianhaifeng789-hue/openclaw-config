# Which Utils Skill

**优先级**: P31
**来源**: Claude Code `which.ts`
**适用场景**: cross-platform which命令

---

## 概述

Which Utils查找命令可执行文件路径。Bun环境使用Bun.which（fast，无process spawn），Node环境使用which/where.exe命令。

---

## 核心功能

### 1. Bun原生

```typescript
const bunWhich = typeof Bun !== 'undefined' && typeof Bun.which === 'function'
  ? Bun.which
  : null

export const which: (command: string) => Promise<string | null> = bunWhich
  ? async command => bunWhich(command)
  : whichNodeAsync
```

### 2. Node Fallback

```typescript
async function whichNodeAsync(command: string): Promise<string | null> {
  if (process.platform === 'win32') {
    // Windows: where.exe
    const result = await execa(`where.exe ${command}`, { shell: true })
    return result.stdout.trim().split(/\r?\n/)[0] || null
  }
  
  // POSIX: which
  const result = await execa(`which ${command}`, { shell: true })
  return result.stdout.trim() || null
}
```

### 3. 同步版本

```typescript
export const whichSync: (command: string) => string | null =
  bunWhich ?? whichNodeSync
```

---

## OpenClaw应用

### 1. 命令查找

```typescript
// 查找git
const gitPath = await which('git')
// /usr/bin/git (macOS/Linux)
// C:\Program Files\Git\cmd\git.exe (Windows)

// 查找python
const pythonPath = await which('python3')
```

---

## 状态文件

```json
{
  "skill": "which-utils",
  "priority": "P31",
  "source": "which.ts",
  "enabled": true,
  "bunNative": true,
  "platforms": ["posix", "windows"],
  "createdAt": "2026-04-12T13:50:00Z"
}
```

---

## 参考

- Claude Code: `which.ts`