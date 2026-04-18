---
name: ide-detection
description: "IDE detection system. DetectedIDEInfo + IdeType (cursor/windsurf/vscode/pycharm/intellij/webstorm/phpstorm/rubymine/clion/goland/rider/datagrip/appcode/dataspell/aqua/gateway/fleet/androidstudio) + supportedIdeConfigs + detectIde + parseLockfile + WebSocket/SSE. Use when [ide detection] is needed."
metadata:
  openclaw:
    emoji: "💻"
    triggers: [ide-detect, lockfile-parse]
    feishuCard: true
---

# IDE Detection Skill - IDE Detection

IDE Detection IDE 检测系统。

## 为什么需要这个？

**场景**：
- Detect running IDE（20 types）
- Parse IDE lockfile（workspaceFolders/port/pid）
- WebSocket + SSE transport
- IDE integration

**Claude Code 方案**：ide.ts + 1495+ lines
**OpenClaw 飞书适配**：IDE detection + Lockfile parsing

---

## Types

### IdeType

```typescript
type IdeType =
  | 'cursor'
  | 'windsurf'
  | 'vscode'
  | 'pycharm'
  | 'intellij'
  | 'webstorm'
  | 'phpstorm'
  | 'rubymine'
  | 'clion'
  | 'goland'
  | 'rider'
  | 'datagrip'
  | 'appcode'
  | 'dataspell'
  | 'aqua'
  | 'gateway'
  | 'fleet'
  | 'androidstudio'
```

### DetectedIDEInfo

```typescript
type DetectedIDEInfo = {
  name: string
  port: number
  workspaceFolders: string[]
  url: string
  isValid: boolean
  authToken?: string
  ideRunningInWindows?: boolean
}
```

### IdeConfig

```typescript
type IdeConfig = {
  ideKind: 'vscode' | 'jetbrains'
  displayName: string
  processKeywordsMac: string[]
  processKeywordsWindows: string[]
  processKeywordsLinux: string[]
}
```

---

## IDE Configs

### supportedIdeConfigs

```typescript
const supportedIdeConfigs: Record<IdeType, IdeConfig> = {
  cursor: {
    ideKind: 'vscode',
    displayName: 'Cursor',
    processKeywordsMac: ['Cursor Helper', 'Cursor.app'],
    processKeywordsWindows: ['cursor.exe'],
    processKeywordsLinux: ['cursor'],
  },
  windsurf: {
    ideKind: 'vscode',
    displayName: 'Windsurf',
    processKeywordsMac: ['Windsurf Helper', 'Windsurf.app'],
    processKeywordsWindows: ['windsurf.exe'],
    processKeywordsLinux: ['windsurf'],
  },
  vscode: {
    ideKind: 'vscode',
    displayName: 'VS Code',
    processKeywordsMac: ['Visual Studio Code', 'Code Helper'],
    processKeywordsWindows: ['code.exe'],
    processKeywordsLinux: ['code'],
  },
  // ... 17 more IDE configs
}
```

---

## Functions

### 1. Detect IDE

```typescript
async function detectIde(): Promise<DetectedIDEInfo | null> {
  const ancestorPids = await getAncestorPidsAsync(process.ppid, 10)
  const ancestorCommands = await getAncestorCommandsAsync(process.ppid, 10)
  
  // Check ancestor processes for IDE keywords
  for (const ideType of Object.keys(supportedIdeConfigs)) {
    const config = supportedIdeConfigs[ideType]!
    const keywords = getPlatformKeywords(config)
    
    for (const cmd of ancestorCommands) {
      if (keywords.some(k => cmd.includes(k))) {
        // Found IDE in process tree
        return await connectToIde(ideType, ancestorPids)
      }
    }
  }
  
  return null
}
```

### 2. Parse Lockfile

```typescript
type LockfileJsonContent = {
  workspaceFolders?: string[]
  pid?: number
  ideName?: string
  transport?: 'ws' | 'sse'
  runningInWindows?: boolean
  authToken?: string
}

async function parseLockfile(ideName: string): Promise<IdeLockfileInfo | null> {
  const lockfilePaths = getLockfilePaths(ideName)
  
  for (const path of lockfilePaths) {
    try {
      const content = await readFile(path, 'utf-8')
      const json = jsonParse(content) as LockfileJsonContent
      
      return {
        workspaceFolders: json.workspaceFolders ?? [],
        port: extractPort(path),
        pid: json.pid,
        ideName: json.ideName,
        useWebSocket: json.transport === 'ws',
        runningInWindows: json.runningInWindows ?? false,
        authToken: json.authToken,
      }
    } catch {
      continue
    }
  }
  
  return null
}
```

---

## 飞书卡片格式

### IDE Detection 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**💻 IDE Detection**\n\n---\n\n**IDE Types (20)**：\n• cursor / windsurf / vscode\n• pycharm / intellij / webstorm\n• phpstorm / rubymine / clion\n• goland / rider / datagrip\n• appcode / dataspell / aqua\n• gateway / fleet / androidstudio\n\n---\n\n**Functions**：\n• detectIde() - Detect running IDE\n• parseLockfile() - Parse lockfile\n\n---\n\n**Transport**：WebSocket / SSE\n\n---\n\n**Lockfile**：workspaceFolders + port + pid + authToken"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/ide-detection-state.json
{
  "detectedIde": null,
  "stats": {
    "detections": 0,
    "lockfilesParsed": 0
  },
  "lastUpdate": "2026-04-12T11:14:00Z",
  "notes": "IDE Detection Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| ide.ts (1495+ lines) | Skill + IDE |
| 20 IDE types | Types |
| detectIde() | Detection |
| parseLockfile() | Lockfile |

---

## 注意事项

1. **Process keywords**：Platform-specific（Mac/Windows/Linux）
2. **Transport**：WebSocket + SSE support
3. **Lockfile**：Multiple paths per IDE
4. **AuthToken**：Optional authentication
5. **Ancestor PIDs**：Check process tree

---

## 自动启用

此 Skill 在 IDE detection 时自动运行。

---

## 下一步增强

- 飞书 IDE 集成
- IDE analytics
- IDE debugging