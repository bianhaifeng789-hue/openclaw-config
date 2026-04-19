---
name: ads-report-generator
description: |
  广告投放报告生成技能。

  功能：
  - 生成日报、周报、阶段复盘报告
  - 汇总 Spend、CTR、CVR、CPI、ROAS、留存等核心指标
  - 输出异常波动、问题定位、下阶段动作建议

  Use when:
  - 需要生成广告日报/周报
  - 需要投放复盘
  - 需要管理层摘要
  - 需要标准化输出投放数据结论

  Keywords:
  - ads report, daily report, weekly report
  - 广告日报, 广告周报, 投放复盘, 报告生成

metadata:
  openclaw:
    emoji: "🧾"
    source: custom
    triggers: [ads-report, daily-report, weekly-report]
    priority: P1
---

# 广告投放报告生成

用于快速生成适合投放同学、运营负责人、管理层阅读的广告报告。

## 报告类型
- **日报**：关注昨日表现、异常波动、今日动作
- **周报**：关注趋势、结构变化、下周策略
- **专项复盘**：关注某渠道、某 GEO、某素材组

## 核心指标
- Spend
- Impressions
- Clicks
- CTR
- CVR
- Installs / Conversions
- CPI / CPA
- D1 / D7 ROAS
- Retention
- Revenue / LTV

## 报告结构模板

### 1. Summary
- 昨日/本周整体表现
- 是否达标
- 最重要变化点 1~3 条

### 2. Highlights
- 表现最好的 GEO / 渠道 / 素材
- 可继续放量的对象

### 3. Risks
- 异常上涨的 CPI
- 异常下降的 CTR / CVR / ROAS
- 疲劳素材 / 异常渠道 / 回传风险

### 4. Recommended Actions
- 哪些广告组加预算
- 哪些广告组暂停
- 哪些素材继续测试
- 哪些国家降权

## 日报模板

```markdown
# Ads Daily Report

## Summary
- Total Spend: $2,350
- Total Installs: 1,240
- CPI: $1.89
- D1 ROAS: 32%

## Highlights
- US TikTok 素材 A 表现最佳
- JP Google 回收最稳定

## Risks
- BR Meta CPI 上升 22%
- 素材 B CTR 下滑明显

## Actions for Today
1. 上调 US TikTok +15%
2. 暂停 BR Meta 低效广告组
3. 新增 3 个创意测试版本
```

## 周报模板

```markdown
# Ads Weekly Report

## Weekly Overview
- Spend 环比 +12%
- Installs 环比 +18%
- CPI 改善 6%
- D7 ROAS 持平

## Key Trends
- TikTok 持续拉量
- Google 更稳定但放量慢
- 某些 GEO 便宜但低留存

## Next Week Plan
1. 放量高质量 GEO
2. 收缩低质渠道
3. 强化创意测试
```

## 配合使用
- `creative-performance-analysis`
- `campaign-diagnosis`
- `geo-channel-analysis`
- `mmp-attribution-check`
- `budget-management`
