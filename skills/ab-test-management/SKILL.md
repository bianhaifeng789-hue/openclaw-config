---
name: ab-test-management
description: |
  A/B测试管理技能
  
  功能：
  - 创建A/B测试
  - 分析测试结果
  - 自动停止测试
  - 生成测试报告
  - 素材版本管理
  
  Use when:
  - 创建广告素材A/B测试
  - 分析测试效果
  - 选择最优版本
  - 管理素材版本
  
  Keywords:
  - A/B测试, 素材测试, 效果对比, 版本管理
---

# A/B测试管理

## 创建A/B测试

### 广告素材测试
```json
{
  "testName": "Banner Color Test",
  "variants": [
    {"id": "A", "name": "Blue Banner", "url": "banner_blue.png"},
    {"id": "B", "name": "Red Banner", "url": "banner_red.png"}
  ],
  "budgetPerVariant": 500,
  "duration": 7,
  "successMetric": "CTR"
}
```

### 文案测试
```json
{
  "testName": "Call to Action Test",
  "variants": [
    {"id": "A", "text": "Download Now"},
    {"id": "B", "text": "Play Now"}
  ],
  "budgetPerVariant": 500,
  "duration": 7,
  "successMetric": "CVR"
}
```

## 分析测试结果

### 统计显著性检查
```
使用 t-test 或 chi-square test
p-value < 0.05 → 有显著差异
p-value > 0.05 → 无显著差异
```

### 效果对比
```
版本A: CTR = 5%, 样本 = 10000
版本B: CTR = 7%, 样本 = 10000
提升 = 40%
p-value = 0.01
结论: 版本B显著优于版本A
```

## 自动停止规则

- 显著差异已确定（p < 0.05）
- 一方明显优于另一方（提升 > 30%）
- 测试时间达到上限
- 预算耗尽

## 素材版本管理

### 素材库结构
```
素材库/
  Banner/
    v1.0/
      banner_blue.png
      banner_red.png
    v2.0/
      banner_new.png
  Icon/
    v1.0/
      icon_1.png
      icon_2.png
```

### 版本记录
```json
{
  "materialId": "banner_001",
  "versions": [
    {"version": "v1.0", "ctr": 5%, "created": "2026-04-01"},
    {"version": "v2.0", "ctr": 7%, "created": "2026-04-10"}
  ],
  "bestVersion": "v2.0"
}
```