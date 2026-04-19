---
name: voice-mode
description: "Voice input and output integration. Use sag for TTS (voice replies), OpenAI Whisper for STT (speech recognition). Supports voice commands and voice responses. Use when [voice mode] is needed."
metadata:
  openclaw:
    emoji: "🎤"
    triggers: [voice-request, manual]
    requires:
      bins: [sag]
      env: [ELEVENLABS_API_KEY]
---

# Voice Mode Skill - 语音交互模式

整合 OpenClaw 现有语音能力，提供完整的语音输入/输出体验。

## 已有语音能力

OpenClaw 已有：
- **TTS（语音回复）**：`sag` (ElevenLabs), `sherpa-onnx-tts` (本地)
- **STT（语音识别）**：`openai-whisper-api`

**本 Skill 整合这些能力，提供统一接口。**

---

## 使用场景

### 语音回复（Voice Reply）

用户说："用语音回复"、"语音告诉我"、"读给我听"

```
用户：语音告诉我今天天气怎么样

Agent:
→ 用 sag 生成语音文件
→ 发送语音消息（飞书音频）
→ 同时发送文字版本（可选）
```

### 语音输入（Voice Input）

飞书移动端已有语音输入支持。Agent 收到语音消息后：

```
用户：（发送语音消息）

Agent:
→ 飞书自动转文字（已由飞书处理）
→ 解析文字内容
→ 正常回复
```

### 语音命令（Voice Commands）

特定语音命令触发特殊行为：

```
用户语音："开启语音模式"
→ Agent 进入语音回复优先模式

用户语音："关闭语音模式"
→ Agent 恢复文字回复模式
```

---

## 飞书语音集成

### 飞书原生能力

飞书移动端：
- 支持语音输入（录音转文字）
- 支持语音消息（发送音频）

**Agent 可以：**
- 接收语音消息（飞书自动转文字）
- 发送语音回复（通过 tts tool 或 sag）

### 使用 tts tool

```typescript
// OpenClaw 已有 tts tool
tts({
  text: "这是语音回复内容",
  channel: "feishu"  // 自动适配飞书格式
})
```

### 使用 sag Skill

```bash
# ElevenLabs TTS（高质量）
sag -v Clawd -o /tmp/voice-reply.mp3 "语音内容"
# 然后通过飞书发送音频文件
```

---

## Voice Mode 状态

```typescript
interface VoiceModeState {
  enabled: boolean           // 是否启用语音模式
  preferVoiceReply: boolean  // 优先语音回复
  defaultVoice: string       // 默认语音 ID
  language: string           // 语音语言
}
```

---

## 飞书卡片格式

### 语音模式启用卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🎤 语音模式已启用**\n\n我会用语音回复你的消息。\n\n**设置**：\n• 默认语音：Clawd\n• 语言：中文\n\n**提示**：\n说\"关闭语音模式\"可以退出"
      }
    }
  ]
}
```

### 语音回复说明卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔊 语音回复**\n\n正在生成语音..."
      }
    },
    {
      "tag": "audio",
      "src": "/tmp/voice-reply.mp3"
    }
  ]
}
```

---

## 执行流程

### 1. 检测语音请求

**关键词**：
- "语音回复"、"读给我听"
- "用语音告诉我"
- "开启语音模式"

**飞书语音消息**：
- 消息包含音频附件
- 飞书自动转文字

### 2. 生成语音回复

```
Agent:
1. 检测语音请求关键词
2. 准备文字内容
3. 使用 tts tool 或 sag 生成语音
4. 发送语音消息（飞书音频）
5. 同时发送文字摘要（可选）
```

### 3. 处理语音输入

```
Agent:
1. 收到飞书语音消息
2. 飞书已转文字（无需额外 STT）
3. 解析文字内容
4. 正常处理请求
5. 如果 Voice Mode 启用，用语音回复
```

---

## 持久化存储

```json
// memory/voice-mode-state.json
{
  "enabled": false,
  "preferVoiceReply": false,
  "defaultVoice": "Clawd",
  "language": "zh",
  "lastVoiceReply": null,
  "stats": {
    "voiceReplies": 0,
    "voiceInputs": 0
  }
}
```

---

## Voice Profiles

### 推荐语音

| 语音 | 说明 | 适用场景 |
|------|------|----------|
| `Clawd` | OpenClaw 默认 | 通用回复 |
| `Nova` | 温暖，略英式 | 故事讲述 |
| `Adam` | 低沉，沉稳 | 技术解释 |
| `Rachel` | 女声，清晰 | 日常对话 |

### 语言支持

- 中文 (zh)
- 英文 (en)
- 日文 (ja)
- 其他 ElevenLabs 支持的语言

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| hold-to-talk (按键说话) | 飞书移动端已有 |
| voice_stream STT (Deepgram) | 飞书内置 STT |
| 15+ 语言支持 | ElevenLabs 多语言 |
| 实时语音输入 | 异步语音消息 |
| 本地音频播放 | 飞书音频播放 |

---

## 使用示例

### 示例 1：语音回复请求

```
用户：语音告诉我今天做了什么

Agent:
→ 生成语音内容："今天我实现了六个功能..."

🎤 语音回复正在生成...

[发送音频消息]

同时发送文字摘要：
"今天完成：Compaction、Insights、Prompt Suggestion、TodoWrite、Background Tasks UI、Team Memory Sync"
```

### 示例 2：开启语音模式

```
用户：开启语音模式

Agent:
→ 发送飞书卡片：

🎤 语音模式已启用
我会用语音回复你的消息。

设置：
• 默认语音：Clawd
• 语言：中文

提示：说"关闭语音模式"可以退出

→ 更新 voice-mode-state.json: enabled = true
```

### 示例 3：故事讲述

```
用户：用 Nova 的声音讲一个故事

Agent:
→ 使用 sag skill
→ 选择 Nova voice
→ 生成故事语音
→ 发送音频消息

[音频] "从前有一个小机器人..."
```

---

## 配置

```yaml
voiceMode:
  enabled: false           # 默认关闭
  defaultVoice: Clawd      # 默认语音
  language: zh             # 默认语言
  preferVoiceReply: false  # 不优先语音回复
  sendTextWithVoice: true  # 语音+文字同时发送
  maxVoiceLength: 60       # 语音最大长度（秒）
```

---

## 注意事项

1. **飞书音频限制**：注意文件大小和时长限制
2. **成本控制**：ElevenLabs API 有成本，避免滥用
3. **用户选择**：用户可以选择开启/关闭
4. **隐私**：语音内容也是私密的，同样保护
5. **备用方案**：如果 TTS 失败，提供文字版本

---

## 自动启用

此 Skill 在用户请求语音回复时自动激活，或通过"开启语音模式"命令启用。

---

## 下一步增强

- 实时语音对话（需要 WebSocket）
- 多人语音群聊（飞书支持）
- 语音转文字历史记录
- 语音摘要功能（长内容自动缩略）