# Settings Sync Service Skill

跨环境设置同步 - OAuth认证的增量上传和CCR下载。

## 功能概述

从Claude Code的settingsSync.ts提取的设置同步模式，用于OpenClaw的CCR环境支持。

## 模式差异

| 模式 | 操作 | 时机 |
|------|------|------|
| Interactive CLI | Upload本地→Remote | preAction后台 |
| CCR | Download Remote→Local | 启动时 |

## 核心机制

### OAuth认证检查

```typescript
isUsingOAuth():
  getAPIProvider() === 'firstParty'
  && isFirstPartyAnthropicBaseUrl()
  && tokens?.accessToken
  && tokens.scopes.includes('user:inference')
```

只检查`user:inference`（CCR的file-descriptor token只有此scope）。

### Sync Keys

```typescript
SYNC_KEYS = {
  USER_SETTINGS: 'user_settings',
  USER_MEMORY: 'user_memory',
  projectSettings: (projectId) => `project_settings:${projectId}`,
  projectMemory: (projectId) => `project_memory:${projectId}`,
}
```

### 增量上传

```typescript
changedEntries = pickBy(localEntries, (value, key) => 
  remoteEntries[key] !== value
)
// 只上传差异
```

### 文件限制

```typescript
MAX_FILE_SIZE_BYTES = 500 * 1024  // 500KB per file
// 超过→跳过
```

### Download Dedup

```typescript
let downloadPromise: Promise<boolean> | null = null

downloadUserSettings():
  if (downloadPromise) return downloadPromise
  downloadPromise = doDownloadUserSettings()
  return downloadPromise
// 启动时单次fetch，多处join
```

### Cache Invalidation

```typescript
if (settingsWritten) resetSettingsCache()
if (memoryWritten) clearMemoryFileCaches()
// 写入后失效相关cache
```

### Internal Write Mark

```typescript
markInternalWrite(filePath)
// 防止spurious change detection
// 应用在settings文件写入前
```

## 实现建议

### OpenClaw适配

1. **认证**: 检查OAuth token
2. **上传**: 增量检查只同步差异
3. **下载**: 启动时单次fetch
4. **文件**: MEMORY.md + settings

### 状态文件示例

```json
{
  "lastUploadAt": 1703275200,
  "lastDownloadAt": 1703275000,
  "uploadedEntries": ["user_settings", "user_memory"],
  "downloadedEntries": ["project_settings:abc123"],
  "entryCount": 4
}
```

## 关键模式

### Fail-Open

```typescript
catch {
  // 记录错误但不阻塞启动
  logForDiagnosticsNoPII('error', 'settings_sync_unexpected_error')
}
```

CCR可以没有同步的settings继续运行。

### Retry Pattern

```typescript
fetchUserSettings(maxRetries = 3):
  for (attempt 1 to maxRetries+1) {
    result = await fetchUserSettingsOnce()
    if (result.success || result.skipRetry) return result
    await sleep(getRetryDelay(attempt))
  }
```

### Size Validation

```typescript
tryReadFileForSync(filePath):
  stats.size > MAX_FILE_SIZE_BYTES → null
  content empty/whitespace → null
```

## 借用价值

- ⭐⭐⭐⭐ Fail-open不阻塞CCR
- ⭐⭐⭐⭐ Download dedup节省请求
- ⭐⭐⭐⭐ 增量上传节省带宽
- ⭐⭐⭐ Internal write mark防误报

## 来源

- Claude Code: `services/settingsSync/index.ts`
- 分析报告: P33-8