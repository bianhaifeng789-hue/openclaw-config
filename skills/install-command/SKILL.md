# Install Command Skill

安装命令 - React组件 + 多状态渲染。

## 功能概述

从Claude Code的install.tsx提取的安装模式，用于OpenClaw的版本管理。

## 核心机制

### InstallState类型

```typescript
type InstallState = 
  | { type: 'checking' }
  | { type: 'cleaning-npm' }
  | { type: 'installing', version: string }
  | { type: 'setting-up' }
  | { type: 'set-up', messages: string[] }
  | { type: 'success', version: string, setupMessages?: string[] }
  | { type: 'error', message: string, warnings?: string[] }
```

### React组件

```typescript
function Install({ onDone, force, target }: InstallProps) {
  const [state, setState] = useState<InstallState>({ type: 'checking' })
  
  useEffect(() => {
    async function run() {
      try {
        // 检查 → 清理 → 安装 → 设置
      } catch (e) {
        setState({ type: 'error', message: errorMessage(e) })
      }
    }
    void run()
  }, [])
}
```

### SetupNotes组件

```typescript
function SetupNotes({ messages }) {
  if (messages.length === 0) return null
  return (
    <Box flexDirection="column">
      <Text color="warning">Setup notes:</Text>
      {messages.map(msg => <Text dimColor>• {msg}</Text>)}
    </Box>
  )
}
```

### Installation Path

```typescript
function getInstallationPath(): string {
  const isWindows = env.platform === 'win32'
  const homeDir = homedir()
  if (isWindows) {
    return join(homeDir, '.local', 'bin', 'claude.exe').replace(/\//g, '\\')
  }
  return '~/.local/bin/claude'
}
// Windows和Unix不同路径处理
```

### 清理流程

```typescript
cleanupNpmInstallations()  // 清理旧npm安装
cleanupShellAliases()       // 清理shell aliases
```

## 实现建议

### OpenClaw适配

1. **state machine**: 多状态渲染
2. **React组件**: Ink渲染终端UI
3. **cleanup**: 清理旧安装
4. **platform**: 跨平台路径处理

### 状态文件示例

```json
{
  "state": "success",
  "version": "1.0.34",
  "setupMessages": ["Added to PATH", "Shell alias configured"],
  "installationPath": "~/.local/bin/claude"
}
```

## 关键模式

### State Machine Pattern

```typescript
type InstallState = { type: 'checking' } | { type: 'installing' } | ...
// TypeScript discriminated union
// 每个状态有特定字段
```

### Cleanup Before Install

```
cleaning-npm → installing
// 先清理旧安装
// 避免冲突
```

### React Compiler

```typescript
const $ = _c(5)
// React compiler runtime
// 优化渲染性能
```

## 借用价值

- ⭐⭐⭐⭐ State machine pattern
- ⭐⭐⭐⭐ React terminal UI
- ⭐⭐⭐⭐ Cleanup流程
- ⭐⭐⭐ Platform path handling

## 来源

- Claude Code: `commands/install.tsx`
- 分析报告: P35-7