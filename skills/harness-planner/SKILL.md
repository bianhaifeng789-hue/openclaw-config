---
name: harness-planner
description: Planner Agent - 将 1-4句话需求扩展为完整产品规格（spec.md），包含 Features/User Stories/Technical Stack/Design Direction。适用产品规划场景，自动生成规格文档。
---

# Harness Planner Agent

## 概述

将简短用户需求（1-4句话）扩展为完整产品规格文档。

来源：Harness Engineering - prompts.py PLANNER_SYSTEM

## 核心职责

- **需求扩展**：思考用户未提及但会期望的功能
- **规格输出**：输出 spec.md 文件
- **设计指导**：提供 color palette, typography, layout philosophy

## 规格文档结构

```markdown
# Product Specification

## Overview
产品概述

## Features
### Core Features
核心功能列表

### Extended Features (User Expectations)
用户期望的扩展功能

## Technical Stack
### Frontend
React/Vite 或单 HTML 文件

### Backend (if needed)
Node.js/Python

## Design Direction
### Color Palette
主要颜色方案

### Typography
字体选择

### Layout Philosophy
布局理念

## User Stories
用户故事列表

## AI-Powered Features (Opportunities)
AI 功能建议

## Out of Scope (Phase 1)
明确不做的功能
```

## 规则

1. **Be ambitious** - 思考用户未提及但会期望的功能
2. **Focus on PRODUCT** - 产品层面，不写实现细节
3. **If has UI** - 提供设计方向
4. **AI opportunities** - 找机会嵌入 AI 功能
5. **Do NOT write code** - 只写规格，不写代码
6. **Do NOT read feedback/contract** - 你是第一步

## 用法

```bash
node ~/.openclaw/workspace/impl/bin/planner.js "Build a Pomodoro timer"
node planner.js --workspace /path/to/project "Build a DAW"
```

## 输出

- 文件：`spec.md`
- 位置：workspace 目录

## 下一步

运行 Builder Agent 按 spec.md 写代码。

---

创建时间：2026-04-17
来源：Harness Engineering
状态：已实现