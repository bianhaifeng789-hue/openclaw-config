# Voice Hold-to-Talk Skill

Voice Hold-to-Talk - Auto-repeat reset + Language normalization + Native/SoX recording + Voice_stream STT。

## 功能概述

从Claude Code的useVoice hook提取的语音输入模式，用于OpenClaw的语音系统。

## 核心机制

### Auto-Repeat Reset Timer

```typescript
// Auto-repeat key events reset an internal timer
// When no keypress arrives within RELEASE_TIMEOUT_MS, recording stops automatically
const RELEASE_TIMEOUT_MS = 500
// Auto-repeat处理
// 超时自动停止
```

### Language Name to BCP-47

```typescript
const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  english: 'en',
  spanish: 'es',
  español: 'es',  // Native name
  日本語: 'ja',   // CJK
  한국어: 'ko',
  हिन्दी: 'hi',
  ελληνικά: 'el',
  // Both English and native names
  // Must be SUBSET of server-side allowlist
}
// Maps language names (English + native) to BCP-47
// Server reject → WebSocket close 1008
```

### Subset of Server Allowlist

```typescript
const SUPPORTED_LANGUAGE_CODES = new Set([
  'en', 'es', 'fr', 'ja', 'de', 'pt', 'it', ...
])
// Subset of GrowthBook speech_to_text_voice_stream_config
// Sending unsupported code → connection close
```

### Native/SoX Recording

```typescript
// Uses native audio module (macOS) or SoX for recording
// Anthropic voice_stream endpoint for STT
// Platform-specific recording
// WebSocket STT
```

### Hold-to-Talk Pattern

```typescript
// Hold keybinding to record
// Release to stop and submit
// Key repeat → reset timer
// No keypress → stop after timeout
// 按住录音
// 松开提交
```

### System Locale Language

```typescript
const language = getSystemLocaleLanguage()
// Fallback to DEFAULT_STT_LANGUAGE if unsupported
// System locale → language code
// Unsupported → default
```

## 实现建议

### OpenClaw适配

1. **autoRepeatReset**: Auto-repeat reset timer
2. **languageNorm**: Language normalization
3. **nativeSoX**: Native/SoX recording
4. **websocketSTT**: WebSocket STT

### 状态文件示例

```json
{
  "releaseTimeoutMs": 500,
  "supportedLanguages": ["en", "es", "ja", "zh"],
  "nativeNameSupport": true
}
```

## 关键模式

### Auto-Repeat Key Handling

```
keydown → reset timer → no keypress → stop after timeout
// 处理键盘auto-repeat
// 超时自动停止录音
```

### Language Name Normalization

```
English + Native names → BCP-47 code
// 支持本地语言名
// 日本語→ja, 한국어→ko
```

### Server Allowlist Subset

```
CLI codes ⊆ server allowlist
// 发送不在allowlist的code → connection close
// 安全fallback
```

### Hold-to-Talk UX

```
Hold → record, Release → stop+submit
// 自然交互
// 类似Push-to-Talk
```

## 借用价值

- ⭐⭐⭐⭐⭐ Auto-repeat reset timer
- ⭐⭐⭐⭐⭐ Language normalization (English + Native)
- ⭐⭐⭐⭐⭐ Server allowlist subset principle
- ⭐⭐⭐⭐ Hold-to-Talk UX pattern
- ⭐⭐⭐⭐ Native/SoX platform selection

## 来源

- Claude Code: `hooks/useVoice.ts`
- 分析报告: P39-8