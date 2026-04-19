# Statusline Setup Skill

状态栏设置命令模式 - 通过Agent Tool创建subagent进行配置。

## 功能概述

从Claude Code的statusline.tsx提取的命令模式，用于OpenClaw的状态显示配置。

## 核心机制

### Command结构

```typescript
{
  type: 'prompt',
  description: "Set up Claude Code's status line UI",
  contentLength: 0,  // Dynamic content
  aliases: [],
  name: 'statusline',
  progressMessage: 'setting up statusLine',
  allowedTools: [AGENT_TOOL_NAME, 'Read(~/**)', 'Edit(~/.claude/settings.json)'],
  source: 'builtin',
  disableNonInteractive: true,
  async getPromptForCommand(args): Promise<ContentBlockParam[]> { ... }
}
```

### 关键字段

| 字段 | 说明 |
|------|------|
| type | 'prompt' - 动态prompt生成 |
| contentLength | 0 - 内容动态生成 |
| progressMessage | 进度显示消息 |
| allowedTools | 工具白名单（Agent + Read + Edit） |
| disableNonInteractive | 非交互模式禁用 |
| source | 'builtin' - 内置命令 |

### Prompt生成

```typescript
async getPromptForCommand(args) {
  const prompt = args.trim() || 'Configure my statusLine from my shell PS1 configuration'
  return [{
    type: 'text',
    text: `Create an ${AGENT_TOOL_NAME} with subagent_type "statusline-setup" and the prompt "${prompt}"`
  }]
}
```

### Agent Tool调用

命令不直接执行，而是通过Agent Tool创建subagent：
- `subagent_type: "statusline-setup"`
- Prompt由用户参数或默认值决定
- 工具限制通过allowedTools定义

## 实现建议

### OpenClaw适配

1. **命令结构**: 使用类似的Command接口
2. **动态prompt**: getPromptForCommand方法
3. **工具限制**: allowedTools白名单
4. **进度消息**: progressMessage字段

### 状态文件示例

```json
{
  "commandType": "prompt",
  "name": "statusline",
  "allowedTools": ["Agent", "Read", "Edit"],
  "disableNonInteractive": true,
  "progressMessage": "setting up statusLine"
}
```

## 关键模式

### Delegation Pattern

命令本身不执行，而是委托给Agent Tool：
- 减少命令逻辑复杂度
- 利用Agent Tool的subagent机制
- 工具限制自动继承

### Dynamic Content

`contentLength: 0`表示内容动态生成：
- 不预计算长度
- 支持用户参数定制
- 默认prompt fallback

## 借用价值

- ⭐⭐⭐ 命令委托模式减少代码
- ⭐⭐⭐ 工具白名单限制安全
- ⭐⭐⭐ 进度消息提升用户体验

## 来源

- Claude Code: `commands/statusline.tsx`
- 分析报告: P34-1