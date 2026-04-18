---
name: auto-bid-budget-rules
description: |
  出价与预算规则技能。

  功能：
  - 根据 CPI、CPA、ROAS、留存等指标生成停量/放量建议
  - 给出预算提升、预算下调、保守测试、强制暂停规则
  - 适合做半自动投放规则和人工审核规则模板

  Use when:
  - 需要预算管理规则
  - 需要停量/放量判断
  - 需要按 KPI 做投放动作建议
  - 需要搭建基础自动化买量规则

  Keywords:
  - bid rules, budget rules, scale, pause
  - 预算规则, 出价规则, 停量, 放量, 自动优化

metadata:
  openclaw:
    emoji: "⚙️"
    source: custom
    triggers: [budget-rules, bid-rules, auto-scale]
    priority: P0
---

# 出价与预算规则

用于建立“什么时候加预算、什么时候减预算、什么时候停掉”的统一规则。

## 规则目标
- 控制亏损
- 放大高质量流量
- 减少人工盯盘成本
- 让投放动作更一致

## 关键指标
- Spend
- Installs / Conversions
- CPI / CPA
- CTR / CVR
- D1 / D3 / D7 Retention
- D1 / D3 / D7 ROAS
- Payback Window（回收周期）

## 基础规则模板

### 1. 强制暂停规则
满足任意条件即可暂停：
- 消耗 > 目标 CPA 的 3 倍，仍无转化
- CTR 明显低于组均值 30%+
- CPI 高于目标值 30%+ 且无改善
- D1 ROAS 明显低于底线

### 2. 保守观察规则
适用于数据不足但不能立刻砍：
- 展示不足
- 点击不足
- 转化样本不足
- 新素材上线未满 24h

动作：
- 保持预算不变
- 不轻易改动出价
- 延长观察窗口

### 3. 小步放量规则
满足以下条件可加预算 10%~20%：
- 转化量达到最小样本
- CPI / CPA 低于目标
- D1 / D3 回收正常
- CTR / CVR 稳定

### 4. 强势放量规则
满足以下条件可加预算 20%~30%：
- ROAS 持续领先组均值
- 留存质量优于组均值
- 素材无疲劳迹象
- 过去 2~3 个观察窗口稳定

### 5. 降预算规则
满足以下情况应降预算：
- CPI 上升但尚未失控
- CTR 开始下滑
- CVR 连续下降
- ROAS 低于目标但仍有修复空间

## 推荐阈值模板

```markdown
- Pause:
  - Spend > 3x target CPA and conversions = 0
  - CPI > target CPI * 1.3
  - D1 ROAS < minimum threshold

- Scale +10%:
  - conversions >= 10
  - CPI <= target CPI
  - D1 ROAS >= target threshold

- Scale +20%:
  - conversions >= 20
  - ROAS > target by 15%
  - retention above baseline
```

## 注意事项
- 不同平台放量幅度不同，避免一次调太猛
- 学习阶段尽量减少频繁改预算
- 低量阶段不要只看 ROAS，要结合样本量
- 安卓海外买量要同时看 CPI 与留存，不然容易买到低质用户

## 推荐输出格式

```markdown
# Bid & Budget Rule Suggestions

## Pause
- Ad Set B: spend $45, conversions 0, pause now

## Observe
- Ad Set C: CTR good, but data still limited, keep 24h

## Scale
- Ad Set A: CPI below target, D1 ROAS stable, increase budget +15%

## Reduce
- Ad Set D: CPI rising, CVR falling, reduce budget -20%
```

## 配合使用
- `campaign-diagnosis`
- `creative-performance-analysis`
- `budget-management`
- `retention-analysis`
- `iaa-ltv-calculator`

## 适用场景
- 日常盯盘
- 每日自动化建议
- 买量 SOP
- 投放团队规则沉淀
