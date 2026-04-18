# Read MCP Resource Tool Skill

MCP资源读取工具 - Blob intercept + Base64 decode + Disk persist + Mime extension。

## 功能概述

从Claude Code的ReadMcpResourceTool提取的MCP资源读取模式，用于OpenClaw的MCP资源内容获取。

## 核心机制

### Blob Intercept

```typescript
const contents = await Promise.all(
  result.contents.map(async (c, i) => {
    if ('text' in c) return { uri: c.uri, mimeType: c.mimeType, text: c.text }
    if (!('blob' in c) || typeof c.blob !== 'string') return { uri: c.uri, mimeType: c.mimeType }
    // blob → decode + persist
  })
)
// Intercept blob fields
// 不直接return base64 string
```

### Base64 Decode + Disk Persist

```typescript
const persistId = `mcp-resource-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`
const persisted = await persistBinaryContent(
  Buffer.from(c.blob, 'base64'),
  c.mimeType,
  persistId
)
// base64 → Buffer → disk
// 不污染context
```

### Mime-Derived Extension

```typescript
// persistBinaryContent uses mimeType to derive extension
// image/png → .png
// application/pdf → .pdf
// mime决定扩展名
```

### Blob Saved Message

```typescript
return {
  uri: c.uri,
  mimeType: c.mimeType,
  blobSavedTo: persisted.filepath,
  text: getBinaryBlobSavedMessage(
    persisted.filepath,
    c.mimeType,
    persisted.size,
    `[Resource from ${serverName} at ${c.uri}] `
  )
}
// blobSavedTo + text message
// Model知道文件位置
```

### Error on Persist Fail

```typescript
if ('error' in persisted) {
  return {
    uri: c.uri,
    mimeType: c.mimeType,
    text: `Binary content could not be saved to disk: ${persisted.error}`
  }
}
// persist失败 → text error
// 不throw
```

### Capability Check

```typescript
if (!client.capabilities?.resources) {
  throw new Error(`Server "${serverName}" does not support resources`)
}
// resources capability检查
// 不调用不支持resources的server
```

## 实现建议

### OpenClaw适配

1. **blobIntercept**: Blob intercept
2. **diskPersist**: Disk persist
3. **mimeExtension**: Mime extension
4. **capabilityCheck**: Capability check

### 状态文件示例

```json
{
  "uri": "file:///path/to/image.png",
  "mimeType": "image/png",
  "blobSavedTo": "/tmp/mcp-resource-xxx.png",
  "size": 12345
}
```

## 关键模式

### Blob Intercept Pattern

```
blob in content → Buffer.from(base64) → persistBinaryContent → return filepath
// 不污染context with base64 string
// 文件存储
```

### Mime Extension

```
mimeType → derive extension → save with correct suffix
// 自动正确扩展名
```

### Error Text Not Throw

```
persist fail → text error message
// 不throw exception
// Model能看到error
```

### Capability Gate

```
client.capabilities?.resources → check before call
// 不调用不支持resources的server
```

## 借用价值

- ⭐⭐⭐⭐⭐ Blob intercept + persist pattern
- ⭐⭐⭐⭐⭐ Mime-derived extension
- ⭐⭐⭐⭐ Error as text not throw
- ⭐⭐⭐⭐ Capability check gate

## 来源

- Claude Code: `tools/ReadMcpResourceTool/ReadMcpResourceTool.ts` (5KB+)
- 分析报告: P38-34