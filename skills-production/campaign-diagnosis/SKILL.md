---
name: campaign-diagnosis
description: |
  广告投放诊断技能。

  功能：
  - 对 Campaign / Ad Set / Ad 三级结构做诊断
  - 判断问题出在流量、创意、受众、出价、商店页还是回收
  - 分析 CTR、CVR、CPI、CPA、ROAS、留存之间的关系
  - 输出明确的排查路径和优化建议

  Use when:
  - 投放花钱不出量
  - 出量但不回本
  - CTR/CVR/CPA 异常
  - 需要快速定位投放问题

  Keywords:
  - campaign diagnosis, ads diagnosis, media buying
  - 投放诊断, 广告诊断, 花钱不出量, 不回本

metadata:
  openclaw:
    emoji: "📊"
    source: custom
    triggers: [campaign-diagnosis, ads-diagnosis, media-buying]
    priority: P0
---

# 广告投放诊断

用于快速定位广告投放问题，避免只看单一指标误判。

## 三级诊断框架

### 1. Campaign 层
关注：
- 总消耗
- 总转化量
- 整体 CPI / CPA / ROAS
- 不同 GEO / 渠道 / 目标事件的差异

判断：
- 是否预算分配错误
- 是否优化目标设置错误
- 是否存在明显弱 GEO / 弱渠道拖累整体表现

### 2. Ad Set / Ad Group 层
关注：
- 受众包
- 出价策略
- placement
- 国家/地区
- 年龄 / 性别 / 兴趣标签

判断：
- 是否受众过宽或过窄
- 是否出价过低拿不到量
- 是否 placement 质量差
- 是否学习阶段未稳定

### 3. Ad / Creative 层
关注：
- CTR
- Hook 表现
- CVR
- 创意疲劳
- 不同文案/视频/图片版本差异

判断：
- 是否创意本身不行
- 是否素材吸引错人
- 是否旧素材疲劳

## 核心诊断逻辑

### 情况 1：花钱少、拿量难
优先检查：
- 出价太低
- 受众太窄
- 优化事件太深
- 账户学习受限
- 创意点击率差

### 情况 2：花钱快、但转化少
优先检查：
- CTR 低：创意问题
- CTR 高但 CVR 低：商店页/受众不匹配
- CVR 正常但 CPI 高：流量成本高/出价策略不合理

### 情况 3：有转化、但不回本
优先检查：
- D1/D3 回收差
- 留存差
- 用户质量差
- 事件回传不准确
- 广告组虽便宜但低价值用户过多

### 情况 4：突然波动
优先检查：
- 新素材替换
- 预算大幅调整
- 竞价环境变化
- 节假日/周末季节性变化
- 归因/回传异常

## 指标联动判断

| 指标组合 | 可能问题 | 建议 |
|---|---|---|
| CTR 低 + CPM 正常 | 创意弱 | 换素材/换 Hook |
| CTR 高 + CVR 低 | 受众或落地页问题 | 调整人群/商店页 |
| CTR 正常 + CPI 高 | 流量贵或出价策略问题 | 调出价/GEO |
| CPI 低 + ROAS 低 | 便宜但质量差 | 关注留存和付费 |
| ROAS 好但量起不来 | 预算保守或学习受限 | 小步放量 |

## 建议输出格式

```markdown
# Campaign Diagnosis

## Problem Summary
- 主要问题：CTR 正常，但 CVR 偏低，导致 CPI 偏高

## Root Cause Hypothesis
1. 创意吸引力够，但吸引到的用户不够精准
2. 商店页首屏卖点与广告素材不一致
3. 某两个 GEO 拉低整体转化率

## Recommended Actions
1. 暂停低 CVR GEO
2. 保留 CTR 高素材，替换落地页卖点
3. 新建 2 组更窄受众测试
```

## 配合使用
- `creative-performance-analysis`
- `auto-bid-budget-rules`
- `funnel-analysis`
- `retention-analysis`
- `budget-management`

## 适用平台
- Meta Ads
- TikTok Ads
- Google Ads / UAC
- Unity Ads
- ironSource
