# Auto Mode Dialog Skill

Auto Mode Dialog - 三选项模式 + Analytics logEvent + Settings updateForSource + 法律审核文案。

## 功能概述

从Claude Code的AutoModeOptInDialog提取的自动模式对话框模式，用于OpenClaw的权限模式切换。

## 核心机制

### 三选项模式

```typescript
const onChange = (value) => {
  switch (value) {
    case "accept": {
      logEvent("tengu_auto_mode_opt_in_dialog_accept", {})
      updateSettingsForSource("userSettings", { skipAutoPermissionPrompt: true })
      onAccept()
      break
    }
    case "accept-default": {
      logEvent("tengu_auto_mode_opt_in_dialog_accept_default", {})
      updateSettingsForSource("userSettings", {
        skipAutoPermissionPrompt: true,
        permissions: { defaultMode: "auto" }
      })
      onAccept()
      break
    }
    case "decline": {
      logEvent("tengu_auto_mode_opt_in_dialog_decline", {})
      onDecline()
    }
  }
}
// accept: skip prompt only
// accept-default: skip prompt + set default mode
// decline: reject
```

### Analytics logEvent

```typescript
logEvent("tengu_auto_mode_opt_in_dialog_accept", {})
logEvent("tengu_auto_mode_opt_in_dialog_accept_default", {})
logEvent("tengu_auto_mode_opt_in_dialog_decline", {})
// 每个选项记录analytics
// Track user behavior
```

### Settings updateForSource

```typescript
updateSettingsForSource("userSettings", { skipAutoPermissionPrompt: true })
updateSettingsForSource("userSettings", {
  skipAutoPermissionPrompt: true,
  permissions: { defaultMode: "auto" }
})
// Update settings for specific source
// userSettings: user-level settings
// Multiple settings in one call
```

### 法律审核文案

```typescript
// NOTE: This copy is legally reviewed — do not modify without Legal team approval.
export const AUTO_MODE_DESCRIPTION = "Auto mode lets Claude handle permission prompts automatically — Claude checks each tool call for risky actions and prompt injection before executing. Actions Claude identifies as safe are executed, while actions Claude identifies as risky are blocked and Claude may try a different approach. Ideal for long-running tasks. Sessions are slightly more expensive. Claude can make mistakes that allow harmful commands to run, it's recommended to only use in isolated environments. Shift+Tab to change mode."
// Legal team reviewed copy
// Warning about risks
// Shift+Tab hint
```

### declineExits Flag

```typescript
type Props = {
  onAccept(): void
  onDecline(): void
  declineExits?: boolean  // Startup gate: decline exits the process
}
// declineExits: startup gate behavior
// Relabel decline button accordingly
```

## 实现建议

### OpenClaw适配

1. **threeOption**: 三选项模式
2. **logEvent**: Analytics记录
3. **updateForSource**: Settings更新
4. **legalCopy**: 法律审核文案

### 状态文件示例

```json
{
  "options": ["accept", "accept-default", "decline"],
  "analytics": true,
  "legalReviewed": true
}
```

## 关键模式

### Accept vs Accept-Default

```
accept → skipAutoPermissionPrompt, accept-default → skipAutoPermissionPrompt + defaultMode: "auto"
// accept只跳过提示
// accept-default还设置默认模式
```

### Analytics Per Option

```
logEvent per option → track user behavior → analytics pipeline
// 每选项独立event
// 追踪用户偏好
```

### Legal Copy Marker

```
// NOTE: This copy is legally reviewed — do not modify without Legal team approval.
// 法律审核标记
// 不可随意修改
```

### Decline Exits Flag

```
declineExits → relabel decline button (e.g., "Exit")
// startup gate行为
// 按钮文案适配
```

## 借用价值

- ⭐⭐⭐⭐⭐ 三选项模式 (accept/accept-default/decline)
- ⭐⭐⭐⭐⭐ Analytics logEvent per option
- ⭐⭐⭐⭐⭐ Settings updateForSource pattern
- ⭐⭐⭐⭐⭐ 法律审核文案标记
- ⭐⭐⭐⭐ declineExits flag pattern

## 来源

- Claude Code: `components/AutoModeOptInDialog.tsx`
- 分析报告: P41-2