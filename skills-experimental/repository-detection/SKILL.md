# Repository Detection Skill

**优先级**: P29
**来源**: Claude Code `detectRepository.ts`
**适用场景**: Git仓库解析、GitHub链接生成

---

## 概述

Repository Detection解析Git remote URL，返回 `{ host, owner, name }`。支持多种URL格式：HTTPS、SSH、git://、ssh://。可用于生成GitHub/GHE链接。

---

## 核心功能

### 1. Git Remote解析

```typescript
type ParsedRepository = {
  host: string      // github.com 或 GHE hostname
  owner: string     // 用户/组织名
  name: string      // 仓库名
}

export async function detectCurrentRepositoryWithHost(): Promise<ParsedRepository | null>
export function parseGitRemote(input: string): ParsedRepository | null
```

### 2. URL格式支持

```typescript
// SSH格式: git@host:owner/repo.git
const sshMatch = trimmed.match(/^git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/)

// URL格式: https://host/owner/repo.git
const urlMatch = trimmed.match(
  /^(https?|ssh|git):\/\/(?:[^@]+@)?([^/:]+(?::\d+)?)\/([^/]+)\/([^/]+?)(?:\.git)?$/
)
```

---

## 实现要点

### 1. 缓存机制

```typescript
const repositoryWithHostCache = new Map<string, ParsedRepository | null>()

export function clearRepositoryCaches(): void {
  repositoryWithHostCache.clear()
}

// cwd → ParsedRepository映射
export function getCachedRepository(): string | null {
  const parsed = repositoryWithHostCache.get(getCwd())
  if (!parsed || parsed.host !== 'github.com') return null
  return `${parsed.owner}/${parsed.name}`
}
```

### 2. 主机验证

```typescript
function looksLikeRealHostname(hostname: string): boolean {
  // 验证hostname是否像真实主机名
  // 过滤掉无效的匹配
  return hostname.length > 0 && /^[a-zA-Z0-9.-]+$/.test(hostname)
}
```

### 3. GitHub专用

```typescript
// 只返回github.com结果（过滤GHE）
export function parseGitHubRepository(input: string): string | null {
  const parsed = parseGitRemote(input)
  if (parsed && parsed.host === 'github.com') {
    return `${parsed.owner}/${parsed.name}`
  }
  // 支持纯 "owner/repo" 格式
  if (!input.includes('://') && !input.includes('@') && input.includes('/')) {
    return input.trim()
  }
  return null
}
```

---

## OpenClaw应用

### 1. 飞书消息生成

```typescript
// 检测当前仓库并生成GitHub链接
const repo = await detectCurrentRepository()
if (repo) {
  const url = `https://github.com/${repo}`
  // 在飞书卡片中显示链接
}
```

### 2. 提交链接

```typescript
// 生成commit链接
const repo = getCachedRepository()
const commitUrl = `https://github.com/${repo}/commit/${sha}`
```

### 3. Issue链接

```typescript
// 生成issue链接
const issueUrl = `https://github.com/${repo}/issues/${number}`
```

---

## 状态文件

```json
{
  "skill": "repository-detection",
  "priority": "P29",
  "source": "detectRepository.ts",
  "enabled": true,
  "cacheSize": 0,
  "supportedFormats": ["https", "ssh", "git://", "ssh://"],
  "lastDetected": null,
  "createdAt": "2026-04-12T13:00:00Z"
}
```

---

## 参考

- Claude Code: `detectRepository.ts`
- Git Remote URL格式规范