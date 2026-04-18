---
name: feishu-no-repeat
description: "飞书交互强制防止重复消息 Use when [feishu no repeat] is needed."
priority: critical
---

# 飞书交互防重复（强制执行）

## ⚠️ 核心规则（违反立即改正）

### 规则1: 一张卡片原则

**定义**: 每次任务完成，最多发送1条消息。

**强制执行**:
- 发送飞书卡片 → **立即 NO_REPLY**
- 发送文字消息 → **不再补充**

### 规则2: MESSAGE_PRESEND_HOOK

**发送前必须检查**:
```bash
node ~/.openclaw/workspace-dispatcher/impl/bin/duplicate-checker.js check <type> <content> <taskId>
```

**如果 blocked=true → 不发送，回复 NO_REPLY**

### 规则3: AUTO_NO_REPLY

**自动触发**:
- 发送飞书卡片 → 立即 NO_REPLY（不发文字）
- 任务完成 → 发结果卡片 → NO_REPLY

### 规则4: 进度报告禁止手动

**进度报告由心跳自动发送**:
- 每5分钟 → heartbeat自动发送进度卡片
- 我不手动发进度

---

## 检查清单（每次发送前强制执行）

### 发送飞书卡片前：

1. **我刚才发过卡片了吗？**
   - 如果是 → **不发送，回复 NO_REPLY**

2. **这是手动进度报告吗？**
   - 如果是 → **不发送，让heartbeat自动发**

3. **运行 duplicate-checker.js check**
   - 如果 blocked=true → **不发送，回复 NO_REPLY**

### 发送文字消息前：

1. **我刚才发过卡片了吗？**
   - 如果是 → **不发送，回复 NO_REPLY**

2. **这是补充说明吗？**
   - 如果是 → **不发送，回复 NO_REPLY**

---

## 强制流程

### 任务完成流程：

```
任务完成 → 检查 duplicate-checker.js → 发送1张结果卡片 → NO_REPLY
```

### 用户问问题流程：

```
用户问问题 → 回1条文字 → 不补充、不发卡片
```

### 进度报告流程：

```
心跳触发 → heartbeat检查 → 发进度卡片 → NO_REPLY（我不手动发）
```

---

## 违规惩罚

用户指出违规 → 立即改正 → 回复 NO_REPLY

---

## 立即生效

从此刻起，严格执行以上规则。

**写入时间**: 2026-04-15 12:41
**强制生效**: 立即