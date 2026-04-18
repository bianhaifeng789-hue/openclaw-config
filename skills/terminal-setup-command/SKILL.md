# Terminal Setup Command Skill

终端设置命令 - 键绑定和CSI u协议支持。

## 功能概述

从Claude Code的terminalSetup/index.ts提取的终端配置模式，用于OpenClaw的终端适配。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'terminal-setup',
  description: env.terminal === 'Apple_Terminal'
    ? 'Enable Option+Enter key binding for newlines and visual bell'
    : 'Install Shift+Enter key binding for newlines',
  isHidden: env.terminal !== null && env.terminal in NATIVE_CSIU_TERMINALS,
  load: () => import('./terminalSetup.js')
}
```

### NATIVE_CSIU_TERMINALS

```typescript
const NATIVE_CSIU_TERMINALS: Record<string, string> = {
  ghostty: 'Ghostty',
  kitty: 'Kitty',
  'iTerm.app': 'iTerm2',
  WezTerm: 'WezTerm',
}
// 这些终端原生支持CSI u / Kitty keyboard protocol
```

### 动态description

基于env.terminal动态生成：
- Apple_Terminal: Option+Enter + visual bell
- 其他: Shift+Enter key binding

### 动态isHidden

```typescript
isHidden: env.terminal !== null && env.terminal in NATIVE_CSIU_TERMINALS
// CSI u终端不显示此命令
// 已经原生支持，无需设置
```

## 实现建议

### OpenClaw适配

1. **场景**: 终端环境适配
2. **动态description**: 基于环境定制
3. **条件显示**: CSI u终端隐藏
4. **load**: 按需加载实现

### 状态文件示例

```json
{
  "terminal": "iTerm.app",
  "nativeCsiu": true,
  "isHidden": true,
  "description": "Install Shift+Enter key binding"
}
```

## 关键模式

### Environment-based Configuration

基于env.terminal动态配置：
- Description定制
- isHidden控制
- Native CSI u检测

### Native Support Detection

```typescript
env.terminal in NATIVE_CSIU_TERMINALS
// 检测是否原生支持
// 避免重复配置
```

## 借用价值

- ⭐⭐⭐ Environment-based动态配置
- ⭐⭐⭐ Native support detection
- ⭐⭐⭐ Conditional visibility

## 来源

- Claude Code: `commands/terminalSetup/index.ts`
- 分析报告: P34-8