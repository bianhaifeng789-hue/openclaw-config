# Init Verifiers Command Skill

验证器创建命令 - 5阶段交互 + 浏览器自动化检测。

## 功能概述

从Claude Code的init-verifiers.ts提取的验证器创建，用于OpenClaw的自动化验证。

## 核心机制

### 5阶段结构

```
Phase 1: Auto-Detection - 检测项目类型和结构
Phase 2: Verification Tool Setup - Playwright/MCP安装
Phase 3: Interactive Q&A - 验证器配置确认
Phase 4: Generate Verifier Skill - 创建SKILL.md
Phase 5: Confirm Creation - 告知用户
```

### Auto-Detection

```
扫描package.json, Cargo.toml, pyproject.toml等
检测Web app, CLI tool, API service
识别Playwright, Cypress等测试工具
```

### Verification Types

```typescript
// verifier-playwright: Web UI测试
// verifier-cli: CLI/终端测试（Tmux + asciinema）
// verifier-api: HTTP API测试
// 多项目区：verifier-<project>-<type>
```

### Browser Automation Setup

```
Playwright (推荐) - Full browser automation
Chrome DevTools MCP - DevTools Protocol
Claude Chrome Extension - Browser extension
None - HTTP checks only
```

### Authentication配置

```
No authentication - 公开访问
Yes, login required - 需要登录
Some pages require auth - 混合
// Form-based / API token / OAuth/SSO
```

## 实现建议

### OpenClaw适配

1. **detection**: 项目类型检测
2. **toolSetup**: Playwright/MCP配置
3. **auth**: 认证流程配置
4. **skill**: SKILL.md生成

### 状态文件示例

```json
{
  "verifiers": [
    { "name": "verifier-frontend-playwright", "type": "playwright", "auth": true }
  ]
}
```

## 关键模式

### Multi-Verifier Support

```
单项目：verifier-<type>
多项目：verifier-<project>-<type>
// 名称必须包含"verifier"
// Verify agent通过名称发现
```

### Self-Update Feature

```
If verification fails because skill outdated
→ AskUserQuestion → Edit this SKILL.md
// 验证器自动更新自己的指令
```

## 借用价值

- ⭐⭐⭐⭐⭐ 5阶段交互设计
- ⭐⭐⭐⭐⭐ Auto-detection
- ⭐⭐⭐⭐⭐ Browser automation setup
- ⭐⭐⭐⭐ Authentication configuration
- ⭐⭐⭐⭐ Self-update pattern

## 来源

- Claude Code: `commands/init-verifiers.ts`
- 分析报告: P37-5