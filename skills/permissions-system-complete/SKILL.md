---
name: permissions-system-complete
description: "| Use when [permissions system complete] is needed."
  Complete permissions system (25 files).
  
  Files:
  - PermissionMode.ts - Permission modes
  - PermissionResult.ts - Result types
  - PermissionRule.ts - Rule types
  - PermissionUpdate.ts - Update types
  - permissions.ts - Main permissions
  - permissionsLoader.ts - Loader
  - permissionSetup.ts - Setup
  - permissionExplainer.ts - Explainer
  - permissionRuleParser.ts - Parser
  - pathValidation.ts - Path validation
  - filesystem.ts - Filesystem permissions
  - bashClassifier.ts - Bash classification
  - yoloClassifier.ts - Yolo classification
  - classifierDecision.ts - Classifier decision
  - classifierShared.ts - Shared classifier
  - dangerousPatterns.ts - Dangerous patterns
  - denialTracking.ts - Denial tracking
  - autoModeState.ts - Auto mode state
  - bypassPermissionsKillswitch.ts - Killswitch
  - getNextPermissionMode.ts - Mode cycle
  - shadowedRuleDetection.ts - Shadow detection
  - shellRuleMatching.ts - Shell matching
  
  Dangerous patterns:
  - CROSS_PLATFORM_CODE_EXEC (python, node, ruby, etc.)
  - Package runners (npx, bunx, npm run)
  - Shells (bash, sh)
  
  Keywords:
  - System reference - permissions complete
metadata:
  openclaw:
    emoji: "🔒"
    source: claude-code-permissions
    triggers: [permissions-reference]
    priority: P1
---

# Permissions System Complete

完整权限系统（25文件）。

---

来源: Claude Code utils/permissions/ (25 files)