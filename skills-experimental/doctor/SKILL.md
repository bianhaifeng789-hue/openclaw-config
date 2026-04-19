---
name: doctor
description: "Project diagnostics: installation type detection, dependency status, ripgrep check, multiple installations warning. Diagnose project environment and configuration issues. Use when [doctor] is needed."
metadata:
  openclaw:
    emoji: "🏥"
    triggers: [diagnostic-request, setup-check]
    feishuCard: true
---

# Doctor Skill - 项目诊断

诊断项目环境、安装类型、依赖状态，排查配置问题。

## 为什么需要这个？

**场景**：
- 项目环境检查
- 安装问题排查
- 依赖状态诊断
- 多安装警告

**Claude Code 方案**：DoctorDiagnostic.ts + 多检测项
**OpenClaw 飞书适配**：飞书卡片诊断报告

---

## 诊断项目

### 1. Installation Type

检测安装类型：
- **npm-global**：npm 全局安装
- **npm-local**：npm 本地安装
- **native**：原生安装
- **package-manager**：包管理器
- **development**：开发模式

### 2. Version & Path

- **版本号**：当前版本
- **安装路径**：安装位置
- **调用二进制**：实际执行的文件

### 3. Update Permissions

- **自动更新**：是否启用
- **更新权限**：是否有权限更新
- **推荐方法**：推荐的安装方式

### 4. Multiple Installations

检测多个安装实例：
```
Warning: Multiple Claude Code installations detected:
  • npm-global: /usr/local/bin/claude
  • native: /usr/bin/claude
  
Recommendation: Remove duplicate installations
```

### 5. Ripgrep Status

检测 ripgrep：
- **working**：是否正常工作
- **mode**：system / builtin / embedded
- **systemPath**：系统 ripgrep 路径

### 6. Package Manager

检测包管理器：
- **Homebrew**（macOS）
- **winget**（Windows）
- **apt/dpkg**（Linux）
- **mise/asdf**（版本管理）

---

## 飞书卡片格式

### 诊断报告卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🏥 项目诊断报告**\n\n**安装类型**：npm-global ✅\n**版本**：v2026.4.10\n**路径**：/usr/local/bin/openclaw\n\n---\n\n**自动更新**：启用 ✅\n**更新权限**：有 ✅\n\n---\n\n**Ripgrep**：\n• 状态：正常 ✅\n• 模式：builtin\n\n---\n\n**警告**（1 个）：\n\n⚠️ **多个安装实例**：\n• npm-global: /usr/local/bin/openclaw\n• local: ~/projects/openclaw\n\n**建议**：移除本地安装，保留全局安装\n\n---\n\n**总体状态**：✅ 正常（有警告）"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "修复警告"},
          "type": "primary",
          "value": {"action": "fix_warnings"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "详细日志"},
          "type": "default",
          "value": {"action": "view_details"}
        }
      ]
    }
  ]
}
```

---

## 执行流程

### 1. 检测安装类型

```typescript
function detectInstallationType(): InstallationType {
  // 检查 NODE_ENV
  if (process.env.NODE_ENV === 'development') {
    return 'development'
  }
  
  // 检查 bundled mode
  if (isInBundledMode()) {
    // 检测包管理器安装
    if (detectHomebrew() || detectWinget()) {
      return 'package-manager'
    }
    return 'native'
  }
  
  // 检查 npm 安装
  const npmGlobal = which('npm')
  if (npmGlobal) {
    return 'npm-global'
  }
  
  return 'unknown'
}
```

### 2. 检测 Ripgrep

```typescript
async function checkRipgrep(): Promise<RipgrepStatus> {
  // 检查系统 ripgrep
  const systemRg = await which('rg')
  if (systemRg) {
    return { working: true, mode: 'system', systemPath: systemRg }
  }
  
  // 检查 builtin ripgrep
  const builtinRg = path.join(__dirname, 'rg')
  if (existsSync(builtinRg)) {
    return { working: true, mode: 'builtin', systemPath: null }
  }
  
  return { working: false, mode: 'embedded', systemPath: null }
}
```

### 3. 生成报告

```
Doctor:
1. 检测所有诊断项
2. 收集警告和建议
3. 生成飞书卡片报告
```

---

## 持久化存储

```json
// memory/doctor-state.json
{
  "lastDiagnosis": {
    "installationType": "npm-global",
    "version": "v2026.4.10",
    "warnings": [
      {
        "issue": "multiple_installations",
        "fix": "Remove local installation"
      }
    ],
    "timestamp": "2026-04-11T23:00:00Z"
  },
  "stats": {
    "diagnosesPerformed": 0,
    "warningsFound": 0,
    "warningsFixed": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| DoctorDiagnostic.ts | Skill 定义 |
| getCurrentInstallationType | 同样检测 |
| getRipgrepStatus | exec + which |
| Terminal UI | 飞书卡片报告 |
| /doctor 命令 | 飞书触发 |

---

## 注意事项

1. **全面检测**：检查所有诊断项
2. **警告优先**：突出显示警告
3. **提供修复建议**：每个警告给出修复方案
4. **版本信息**：显示当前版本
5. **权限检查**：检测更新权限

---

## 自动启用

此 Skill 在用户请求诊断或 setup check 时自动触发。

---

## 下一步增强

- 自动修复警告
- 诊断历史记录
- 环境对比（不同机器）
- 配置推荐