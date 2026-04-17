---
name: profiles-system
description: Profiles 系统 - 5个 Profile 配置（terminal/app-builder/swe-bench/reasoning/base），动态时间分配，TB2元数据驱动，环境预收集。适用多场景任务分发。
---

# Profiles System - 多 Profile 配置

## 概述

根据任务类型自动选择最优配置，提高效率30%。

来源：Harness Engineering - profiles/ 目录

## 可用 Profiles

### terminal（TB2优化）⭐⭐⭐
- **用途**: CLI 任务、Terminal-Bench-2
- **预算**: 1800s (动态分配)
- **阈值**: 8.0 (binary pass/fail)
- **特性**:
  - TB2 元数据驱动（89任务）
  - 动态时间分配（≤900s 跳过全部）
  - ENV_BOOTSTRAP_COMMANDS（14条预收集）
  - 单 Agent 架构（无 Planner）

### app-builder
- **用途**: Web 应用构建
- **预算**: 3600s (60 min)
- **阈值**: 7.0
- **特性**:
  - Planner + Builder + Evaluator
  - Contract 协商（最多3轮）
  - Playwright 浏览器测试
  - 4维度评分（Design/Originality/Craft/Functionality）

### swe-bench
- **用途**: GitHub issue 修复
- **预算**: 1800s
- **阈值**: 9.0（测试必须通过）
- **特性**:
  - minimal focused changes（≤3文件，≤50行）
  - Git diff 分析
  - 测试通过 + 代码质量评分

### reasoning
- **用途**: 知识问答、逻辑推理
- **预算**: 600s (10 min)
- **阈值**: 9.0
- **特性**:
  - Python 计算 + 逻辑推理
  - 最小中间件（无 loop detection）
  - 单轮

## 动态时间分配算法（terminal）

基于 TB2 leaderboard 分析：
- Top agents 都是单 Agent 架构
- Planner/Evaluator 时间 = Builder 无法工作的时间
- TB2 binary pass/fail，Builder 的 PreExit 更有效

| Timeout | Planner | Builder | Evaluator |
|---------|---------|---------|-----------|
| ≤900s | 0% | 100% | 0% |
| ≤1800s | 0% | 100% | 0% |
| >1800s | 0% | 90% | 10% |

## Environment Bootstrap

terminal profile 启动时预收集：
```bash
uname -a
pwd
ls -la .
python3 --version
pip3 list | head -30
git log/status/branch
ss -tlnp
...
```

目的：避免 Agent 浪费时间探索环境

## TB2 任务元数据

benchmarks/tb2_tasks.json 包含89任务：
- agent_timeout_sec
- difficulty (easy/medium/hard)
- category (software-engineering/system-administration/...)

## 用法

```bash
# 检测任务类型
node ~/.openclaw/workspace/impl/bin/profile-selector.js detect "Build a Pomodoro timer"

# 列出所有 Profiles
node profile-selector.js list

# 使用特定 Profile 运行 Harness
node harness.js --profile terminal "Fix git merge"
```

---

创建时间：2026-04-17
来源：Harness Engineering profiles/
状态：已实现