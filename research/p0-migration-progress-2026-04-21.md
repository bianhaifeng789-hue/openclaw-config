# P0 功能迁移进度：Status Lines + TTS

迁移时间：2026-04-21 02:08 Asia/Shanghai

---

## 已完成

### 1. TTS 语音通知（已完成 ✅）

**功能**：任务完成时语音提醒

**实现**：
- 创建 `tts_notify.py` hook
- 多 provider 优先级：macOS 'say' > ElevenLabs > OpenAI > pyttsx3
- 添加到 Stop event（每次对话结束时触发）

**配置**：
```json
{
  "event": "Stop",
  "command": "python3 ~/.openclaw/hooks/tts_notify.py",
  "timeout": 10000,
  "description": "TTS notification on task completion"
}
```

**测试**：
- Gateway 已重启
- 下次对话结束时应该听到语音提醒

**限制**：
- macOS 'say' 命令最可靠（其他 provider 需 API key）
- 完成 messages 是随机选择（后续可集成 LLM 生成）

---

## 待实现

### 2. Status Lines（待实现 ⏸️）

**功能**：Powerline 风格状态栏，显示：
- 模型名称
- Git 分支
- 当前路径
- 上下文使用率 (%)

**问题**：
- OpenClaw 不支持 `agents.defaults.statusLine` 配置（schema 中不存在）
- Claude Code 的 statusLine 是原生支持，OpenClaw 需要不同的实现方式

**可能的实现方式**：

#### 方案 A：PostModelUse 注入状态信息
```javascript
// 在 PostModelUse 时注入 prependContext
{
  event: "PostModelUse",
  command: "node ~/.openclaw/hooks/status-injector.js",
  // 输出：[status] GLM-5 | main | ~/project | 42%
}
```

**优点**：
- 可以实现（OpenClaw 支持 PostModelUse）
- 显示在每轮对话开头

**缺点**：
- 不是"状态栏"，是文本注入
- 可能占用 context 空间

#### 方案 B：创建 OpenClaw Plugin
```javascript
// 创建 status-line plugin，扩展 OpenClaw UI
~/.openclaw/extensions/status-line/index.js
```

**优点**：
- 可以实现真正的状态栏（如果 OpenClaw UI 支持）
- 不占用 context

**缺点**：
- 需要研究 OpenClaw UI API
- 实现复杂度较高

#### 方案 C：等待 OpenClaw 支持
- 提 issue/request 到 OpenClaw 团队
- 等待 statusLine 配置项加入

**优点**：
- 最原生、最稳定

**缺点**：
- 时间不确定

---

## 下一步建议

### 立即可做
1. **测试 TTS**：下次对话结束时观察是否听到语音
2. **实现方案 A**：创建 status-injector.js，在 PostModelUse 时注入状态

### 短期可做
1. **研究 OpenClaw Plugin API**：是否支持 UI 扩展
2. **优化 TTS**：集成 LLM 生成的完成消息

### 长期可做
1. **提交 OpenClaw feature request**：请求 statusLine 支持
2. **实现更多 hooks**：Git Status 注入（P1）

---

## 文件位置

| 文件 | 路径 |
|---|---|
| tts_notify.py | ~/.openclaw/hooks/tts_notify.py |
| status_line_openclaw.py | ~/.openclaw/hooks/status_line_openclaw.py |
| hooks-config.json | ~/.openclaw/workspace/hooks-config.json |

---

## Git 提交

- `2104e10` - Add TTS notification hook

---

## 总结

**P0 迁移进度**：
- ✅ TTS 语音通知（已激活）
- ⏸️ Status Lines（待实现方案选择）

**下一步**：
- 测试 TTS（观察下次对话结束）
- 决定 Status Line 实现方案（A/B/C）

---

_迁移人：Claw_  
_迁移时间：2026-04-21 02:08 Asia/Shanghai_