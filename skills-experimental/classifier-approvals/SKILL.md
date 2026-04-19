---
name: classifier-approvals
description: "Classifier approvals tracking with CLASSIFIER_APPROVALS map and CLASSIFIER_CHECKING set. setClassifierApproval/getClassifierApproval/setYoloClassifierApproval. Signal subscription. Use when [classifier approvals] is needed."
metadata:
  openclaw:
    emoji: "✅"
    triggers: [classifier-approval, classifier-checking]
    feishuCard: true
---

# Classifier Approvals Skill - Classifier Approvals

Classifier Approvals tracking，记录 auto-approved tool uses。

## 为什么需要这个？

**场景**：
- Track auto-approved tool uses by classifiers
- Bash classifier approvals
- Auto-mode classifier approvals
- Classifier checking status
- Signal subscription for UI updates

**Claude Code 方案**：classifierApprovals.ts + 107 lines
**OpenClaw 飞书适配**：Approvals tracking + Signal

---

## Types

### ClassifierApproval

```typescript
type ClassifierApproval = {
  classifier: 'bash' | 'auto-mode'  // Which classifier
  matchedRule?: string              // Matched rule（bash）
  reason?: string                   // Reason（auto-mode）
}
```

---

## Functions

### 1. Set Classifier Approval

```typescript
function setClassifierApproval(
  toolUseID: string,
  matchedRule: string
): void {
  CLASSIFIER_APPROVALS.set(toolUseID, {
    classifier: 'bash',
    matchedRule
  })
}
```

### 2. Get Classifier Approval

```typescript
function getClassifierApproval(toolUseID: string): string | undefined {
  const approval = CLASSIFIER_APPROVALS.get(toolUseID)
  if (!approval || approval.classifier !== 'bash') return undefined
  return approval.matchedRule
}
```

### 3. Set Yolo Classifier Approval

```typescript
function setYoloClassifierApproval(
  toolUseID: string,
  reason: string
): void {
  CLASSIFIER_APPROVALS.set(toolUseID, {
    classifier: 'auto-mode',
    reason
  })
}
```

### 4. Classifier Checking

```typescript
function setClassifierChecking(toolUseID: string): void {
  CLASSIFIER_CHECKING.add(toolUseID)
  classifierChecking.emit()
}

function clearClassifierChecking(toolUseID: string): void {
  CLASSIFIER_CHECKING.delete(toolUseID)
  classifierChecking.emit()
}

function isClassifierChecking(toolUseID: string): boolean {
  return CLASSIFIER_CHECKING.has(toolUseID)
}
```

---

## 飞书卡片格式

### Classifier Approvals 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**✅ Classifier Approvals**\n\n---\n\n**Classifier Approvals**：\n\n| Classifier | Fields |\n|-----------|--------|\n| bash | matchedRule |\n| auto-mode | reason |\n\n---\n\n**Classifier Checking**：\n• setClassifierChecking/clearClassifierChecking\n• isClassifierChecking\n• Signal subscription\n• emit() for UI updates\n\n---\n\n**功能**：\n• Tracks auto-approved tool uses\n• Bash classifier approvals\n• Auto-mode classifier approvals\n• Checking status tracking"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/classifier-approvals-state.json
{
  "approvals": {},
  "checking": [],
  "stats": {
    "totalApprovals": 0,
    "bashApprovals": 0,
    "autoModeApprovals": 0
  },
  "signal": {
    "type": "createSignal",
    "usage": "subscribeClassifierChecking"
  },
  "lastUpdate": "2026-04-12T01:08:00Z",
  "notes": "Classifier Approvals Skill 创建完成。等待 classifier approval 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| classifierApprovals.ts (107 lines) | Skill + Approvals |
| ClassifierApproval type | Approval type |
| CLASSIFIER_APPROVALS map | Approvals map |
| CLASSIFIER_CHECKING set | Checking set |
| createSignal() | Signal subscription |

---

## 注意事项

1. **Map/Set**：Approvals map + Checking set
2. **Signal**：UI subscription via createSignal()
3. **Feature flags**：BASH_CLASSIFIER/TRANSCRIPT_CLASSIFIER
4. **Two classifiers**：bash + auto-mode
5. **emit()**：Signal emission for updates

---

## 自动启用

此 Skill 在 classifier approval 时自动运行。

---

## 下一步增强

- 飞书 approvals 集成
- Approvals analytics
- Approvals debugging