---
name: pm-workflow
description: PM 工作流总控技能。整合 PRD 生成、需求分析、竞品分析、差距分析、原型设计等产品经理日常工作流。支持从想法到可评审 PRD 的全流程。
---

# PM 工作流 - 产品经理日常工作流整合

## 触发场景
当用户提到以下关键词时，使用本技能：
- PM 工作流 / 产品经理工作流
- 产品设计流程 / 产品迭代
- 需求梳理 / 需求落地
- 产品规划 / 版本规划
- 立项 / 新功能设计

---

## 工作流阶段

### Phase 1: 洞察与输入收集
**目标**: 收集市场信号、用户反馈、竞品动态

**输出文件**: `INSIGHTS.md`

**相关 skills**:
- `competitive-analysis` - 竞品分析
- `ad-analytics` / `ad-monetization-optimization` - 商业化洞察
- `aso-optimization` - ASO 分析

**操作**:
```bash
# 检查现有洞察库
read INSIGHTS.md

# 如需竞品分析
competitive-analysis → 竞品报告

# 更新洞察库
edit INSIGHTS.md # 添加新洞察
```

---

### Phase 2: 需求分析
**目标**: 明确用户需求、场景、优先级

**输出文件**: `DECISIONS.md` (决策草案)

**相关 skills**:
- `requirement-analysis` - 需求拆解与分析
- `gap-analysis` - 差距分析（当前 vs 目标）

**操作**:
```bash
# 需求分析
requirement-analysis → 需求清单 + 优先级

# 差距分析
gap-analysis → 功能差距矩阵

# 记录决策草案
edit DECISIONS.md # 添加候选方案
```

---

### Phase 3: PRD 生成
**目标**: 产出可评审、可开发、可测试的 PRD

**输出文件**: 项目目录下的 `PRD.md` 或 `docs/PRD.md`

**相关 skills**:
- `prd-generator` - 主 PRD 生成
- `google-play-to-prd` - 从 Play 数据生成 PRD
- `product-description-writer` - 产品描述文案

**操作**:
```bash
# 直接生成 PRD
prd-generator → PRD.md

# 或从竞品研究生成
google-play-to-prd → PRD.md

# 检查 PRD 质量
# - 覆盖验收标准？
# - 覆盖埋点设计？
# - 覆盖异常流程？
```

---

### Phase 4: 原型与验证
**目标**: 可视化验证、用户测试准备

**相关 skills**:
- `prototype-designer` - 原型设计指导
- `frontend-design` - UI 设计参考

**操作**:
```bash
# 原型设计
prototype-designer → 原型规格

# 输出到设计工具
# Figma / Sketch 规格文档
```

---

### Phase 5: 实验与迭代
**目标**: 验证假设、数据驱动迭代

**输出文件**: `EXPERIMENTS.md`

**相关 skills**:
- `product-data-analysis` - 漏斗/留存/A\/B 测试分析
- `growth-teardown` - 增长拆解
- `paywall-analysis` - 变现分析

**操作**:
```bash
# 设计实验
edit EXPERIMENTS.md # 记录实验假设、指标、结果

# 数据分析
product-data-analysis → 漏斗/留存/A\/B 结果解读

# 分析结果
growth-teardown → 增长机会点

# 迭代决策
edit DECISIONS.md # 记录最终决策
```

---

## 快速路径

### 路径 A: 从想法到 PRD（最快）
```
用户输入想法 → prd-generator → PRD.md
```
适用：想法清晰、范围明确、无需竞品调研

### 路径 B: 从竞品链接到 PRD（主流程）
```
飞书发 Google Play 链接 → google-play-to-prd（ADB 安装 → 逆向分析）→ competitive-analysis → gap-analysis → prd-generator → PRD.md → 飞书云文档
```
适用：竞品对标、逆向拆解、功能差距分析、对标落地

### 路径 C: 全流程（立项）
```
INSIGHTS.md → google-play-to-prd（多竞品逆向）→ competitive-analysis → requirement-analysis → DECISIONS.md → gap-analysis → prd-generator → prototype-designer → EXPERIMENTS.md
```
适用：新产品立项、完整产品迭代周期

---

## 文件流转规则

| 输出内容 | 写入文件 | 说明 |
|----------|----------|------|
| 用户/市场洞察 | `INSIGHTS.md` | 长期积累 |
| 决策草案 | `DECISIONS.md` | 带选项和理由 |
| 最终决策 | `DECISIONS.md` | 标记 ⭐ 最终方案 |
| PRD 文档 | `项目/PRD.md` | 项目目录 |
| 产品描述/ASO文案 | `项目/aso/` 或 PRD 附录 | 商店描述、更新日志 |
| 实验记录 | `EXPERIMENTS.md` | 增长验证库 |

---

## PM 工作流 Hook 建议

如需对 PM 输出文件做结构校验，可在 `hooks-config.json` 中添加 PreToolUse hook，指向自定义校验脚本。

---

## 与其他工作流的联动

- **研发工作流**: PRD → 开发 → 测试
- **数据分析**: `product-data-analysis` → 迭代决策
- **增长工作流**: `EXPERIMENTS.md` → `growth-teardown`
- **商业化工作流**: `ad-monetization-optimization` → PRD 商业化章节

---

## 示例用法

```
用户: "我有个想法，想做一款记账 App"
Claw: 使用 pm-workflow → Phase 1 收集洞察 → Phase 2 需求分析 → Phase 3 prd-generator

用户: "帮我对标竞品 XXX，生成 PRD"
Claw: competitive-analysis → gap-analysis → prd-generator

用户: "本周产品迭代，帮我梳理需求"
Claw: INSIGHTS.md + requirement-analysis → DECISIONS.md
```

---

## 记忆维护

每次 PM 工作流完成后：
1. 更新 `INSIGHTS.md` - 新洞察
2. 更新 `DECISIONS.md` - 新决策
3. 更新 `EXPERIMENTS.md` - 如有实验设计
4. 更新 `memory/YYYY-MM-DD.md` - 记录今天完成的工作

---

_整合人：Claw_
_整合时间：2026-04-21 02:35 Asia/Shanghai_