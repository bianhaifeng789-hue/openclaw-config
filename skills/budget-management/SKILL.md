---
name: budget-management
description: |
  预算管理技能
  
  功能：
  - 预算分配优化
  - 预算消耗监控
  - 预算预警
  - 预算调整建议
  - ROI优化
  
  Use when:
  - 分配广告预算
  - 监控预算消耗
  - 预算超支预警
  - 优化预算分配
  
  Keywords:
  - 预算管理, 预算分配, 预算预警, ROI优化, 成本控制
---

# 预算管理

## 预算分配策略

### 按ROI分配
- 高ROI平台增加预算
- 低ROI平台减少预算
- 动态调整

### 按渠道分配
- Google Ads: 40%
- Facebook Ads: 30%
- TikTok Ads: 20%
- 其他: 10%

### 按时间段分配
- 高峰时段增加预算
- 低峰时段减少预算

## 预算监控

### 监控指标
- 日消耗率
- 月消耗率
- ROI趋势
- 转化趋势

### 预警规则
- 日消耗 > 80% 日预算 → 警告
- 日消耗 > 100% 日预算 → 紧急停止
- ROI < 目标ROI → 警告
- 转化率下降 > 20% → 警告

## 预算调整建议

### 自动调整
```json
{
  "adjustments": [
    {
      "platform": "Google Ads",
      "action": "increase",
      "amount": 1000,
      "reason": "ROI高于目标20%"
    },
    {
      "platform": "Facebook Ads",
      "action": "decrease",
      "amount": 500,
      "reason": "ROI低于目标10%"
    }
  ]
}
```

### 手动调整
- 每周分析ROI
- 调整预算分配
- 测试新渠道

## 预算报告

###日报格式
```
日期: 2026-04-17
总预算: $5000
已消耗: $3500 (70%)
剩余: $1500 (30%)

Google Ads:
- 消耗: $2000
- ROI: 150%
- 转化: 500

Facebook Ads:
- 消耗: $1500
- ROI: 120%
- 转化: 300

建议: Google Ads ROI高，增加预算$1000
```