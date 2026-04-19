# MCP Tool Skill

MCP协议工具 - Passthrough permission + Dynamic override + Progress tracking。

## 功能概述

从Claude Code的MCPTool提取的MCP模式，用于OpenClaw的MCP集成。

## 核心机制

### Passthrough Permission

```typescript
async checkPermissions(): Promise<PermissionResult> {
  return {
    behavior: 'passthrough',
    message: 'MCPTool requires permission.'
  }
}
// 不决定permission
// 由mcpClient.ts override
```

### Dynamic Override

```typescript
// Overridden in mcpClient.ts
name: 'mcp',
async description() { return DESCRIPTION },
async call() { return { data: '' } }
// Base tool是placeholder
// 实际实现动态注入
```

### Passthrough Schema

```typescript
inputSchema: lazySchema(() => z.object({}).passthrough())
// 允许任意输入
// MCP tools定义自己的schema
```

### Progress Message

```typescript
renderToolUseProgressMessage,
// MCP支持进度显示
// 长时间操作实时反馈
```

### Truncated Detection

```typescript
isResultTruncated(output: Output): boolean {
  return isOutputLineTruncated(output)
}
// 识别截断输出
// 支持分页
```

## 实现建议

### OpenClaw适配

1. **passthrough**: Permission passthrough
2. **dynamic**: 动态override
3. **passthroughSchema**: 任意输入
4. **progress**: 进度显示

### 状态文件示例

```json
{
  "mcpTool": "filesystem_read",
  "permission": "passthrough",
  "progress": { "phase": "reading", "percentage": 30 },
  "truncated": false
}
```

## 关键模式

### Placeholder Base Tool

```
Base MCPTool → placeholder → mcpClient override
// 分离定义与实现
// 动态注入真实行为
```

### Passthrough Permission

```
checkPermissions → passthrough → mcpClient decides
// MCP tools有自己的permission逻辑
// 不在base tool决定
```

### Passthrough Schema

```
z.object({}).passthrough()
// 允许任意字段
// MCP tools self-define
```

## 借用价值

- ⭐⭐⭐⭐⭐ Passthrough permission pattern
- ⭐⭐⭐⭐⭐ Dynamic override pattern
- ⭐⭐⭐⭐ Passthrough schema
- ⭐⭐⭐⭐ Progress tracking
- ⭐⭐⭐⭐ Truncated detection

## 来源

- Claude Code: `tools/MCPTool/MCPTool.ts`
- 分析报告: P38-12