---
name: harness-score-analyzer
description: Score Analyzer - 分数趋势分析，判断 IMPROVING/STAGNANT/DECLINING，推荐 REFINE/PIVOT 策略。适用多轮迭代场景，指导下一步行动。
---

# Harness Score Analyzer

## 概述

分析 QA 分数趋势，推荐迭代策略。

来源：Harness Engineering - harness.py score_history 分析

## 核心功能

- **趋势判断**：IMPROVING/STAGNANT/DECLINING
- **策略推荐**：REFINE/PIVOT
- **统计计算**：平均值、最高分、最低分
- **分数预测**：简单线性回归

## 趋势类型

### IMPROVING
- delta > 0.5
- 策略：REFINE（继续改进）

### DECLINING
- delta < -0.5
- 策略：PIVOT（推翻重来）

### STAGNANT
- delta ≈ 0
- 策略：REFINE 或 MONITOR

## 策略建议

### REFINE
继续改进当前实现：
- 分数上升
- 修复 QA 问题
- 添加细节

### PIVOT
尝试不同方式：
- 分数下降
- 考虑重写
- 改变架构

## 用法

### 分析分数
```bash
node ~/.openclaw/workspace/impl/bin/score-analyzer.js analyze 7.5 8.0 7.8
```

### 推荐策略
```bash
node score-analyzer.js recommend 7.5 8.0 7.8
```

### 查看历史
```bash
node score-analyzer.js status
```

### 保存分数
```bash
node score-analyzer.js save 8.0 3
```

## 输出示例

### analyze
```json
{
  "trend": "IMPROVING",
  "recommendation": "REFINE",
  "delta": 0.5,
  "stats": {
    "count": 3,
    "average": 7.77,
    "max": 8.0,
    "min": 7.5,
    "latest": 7.8
  },
  "prediction": 8.2,
  "confidence": "HIGH"
}
```

### recommend
```json
{
  "strategy": "REFINE",
  "reason": "Scores are improving\nDelta: +0.50",
  "nextAction": "Continue refining current approach"
}
```

## 状态文件

位置：`state/score-history.json`

```json
{
  "scores": [7.5, 8.0, 7.8],
  "rounds": [1, 2, 3],
  "timestamps": [1234567890, 1234567891, 1234567892]
}
```

---

创建时间：2026-04-17
来源：Harness Engineering
状态：已实现