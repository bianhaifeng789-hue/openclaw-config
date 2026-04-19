---
name: profile-selector
description: 自动选择 Profile（terminal/app-builder/swe-bench/reasoning），根据任务关键词匹配最优配置。适用多场景任务分发，提高效率30%。
---

# Profile Selector - 自动 Profile 选择

## 概述

根据任务关键词自动选择合适的 Profile 配置。

来源：Harness Engineering - profiles/ 目录

## 可用 Profiles

### terminal（默认）
- **用途**: CLI 任务、TB2 benchmark
- **预算**: 1800s (30 min)
- **阈值**: 8.0
- **中间件**: loop-detection, time-budget, pre-exit, task-tracking, error-guidance, skeleton-detection
- **关键词**: install, configure, compile, run, deploy, setup, script, cli

### app-builder
- **用途**: Web 应用构建
- **预算**: 3600s (60 min)
- **阈值**: 7.0
- **中间件**: loop-detection, time-budget, pre-exit, error-guidance
- **关键词**: build a, create a web, design a, ui, frontend, dashboard, timer, game
- **特性**: Planner + Builder + Evaluator + Contract + Playwright

### swe-bench
- **用途**: GitHub issue 修复
- **预算**: 1800s (30 min)
- **阈值**: 9.0（测试必须通过）
- **中间件**: loop-detection, time-budget, pre-exit, task-tracking, skeleton-detection
- **关键词**: fix, bug, issue, github, error, crash, fails, test fails
- **特性**: minimal focused changes，最多3个文件

### reasoning
- **用途**: 知识问答、逻辑推理
- **预算**: 600s (10 min)
- **阈值**: 9.0
- **中间件**: time-budget（最小）
- **关键词**: explain, why, how does, what is, calculate, analyze, compare, evaluate

## 检测规则

优先级匹配（高优先级优先）：
1. app-builder (priority 1)
2. swe-bench (priority 2)
3. reasoning (priority 3)
4. terminal (priority 4 - fallback)

## 用法

```bash
# 检测任务类型
node ~/.openclaw/workspace/impl/bin/profile-selector.js detect "Build a Pomodoro timer"

# 列出所有 Profiles
node profile-selector.js list

# 查看状态
node profile-selector.js status
```

## 输出

```json
{
  "profile": "app-builder",
  "confidence": "HIGH",
  "matchedKeyword": "build a",
  "taskBudget": 3600,
  "passThreshold": 7.0,
  "maxRounds": 3
}
```

---

创建时间：2026-04-17
来源：Harness Engineering profiles/
状态：已实现