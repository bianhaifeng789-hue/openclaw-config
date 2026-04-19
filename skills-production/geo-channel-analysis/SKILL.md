---
name: geo-channel-analysis
description: |
  分国家分渠道投放分析技能。

  功能：
  - 分析不同 GEO、不同渠道、不同平台的投放效果差异
  - 给出预算倾斜、国家分层、渠道优先级建议
  - 适合海外安卓应用买量的区域拆分分析

  Use when:
  - 需要看不同国家表现差异
  - 需要比较不同渠道质量
  - 需要做 GEO 预算分配
  - 需要优化国家分层投放

  Keywords:
  - geo analysis, channel analysis, country analysis
  - GEO分析, 渠道分析, 国家分析, 预算分配

metadata:
  openclaw:
    emoji: "🌍"
    source: custom
    triggers: [geo-analysis, channel-analysis, country-performance]
    priority: P1
---

# 分国家分渠道投放分析

用于识别“哪些国家值得放量、哪些渠道应该降权、哪些组合最适合继续测试”。

## 核心分析维度

### 1. GEO 维度
- Spend
- Installs / Conversions
- CPI / CPA
- D1 / D7 ROAS
- Retention
- ARPU / LTV

### 2. 渠道维度
- Meta
- TikTok
- Google Ads / UAC
- Unity Ads
- ironSource
- 其他联盟流量

### 3. GEO × 渠道交叉维度
重点看：
- 同一个国家在不同渠道的差异
- 同一个渠道在不同国家的差异
- 哪些 GEO × 渠道组合具备复制价值

## 分层建议

### Tier 1（优先放量）
满足：
- CPI / CPA 优秀
- D1 / D7 ROAS 稳定
- 留存不差
- 量级可放大

### Tier 2（保守测试）
满足：
- 成本尚可
- 回收一般
- 数据量不足或波动较大

### Tier 3（降权或暂停）
满足：
- 成本高
- 留存差
- ROAS 持续落后
- 与其他 GEO 相比无明显战略价值

## 常见判断模板
- **低 CPI + 低留存**：看起来便宜，但用户质量一般，不能盲目放量
- **高 CPI + 高 ROAS**：成本高但值得买，适合做高价值 GEO
- **低 CPI + 高 ROAS**：优先扩量
- **高量低质**：适合降权或改受众

## 推荐输出格式

```markdown
# GEO & Channel Analysis

## Top GEOs
- US: ROAS 高，适合继续放量
- JP: CPI 高，但用户质量最好
- BR: CPI 低，但留存偏弱

## Top Channels
- TikTok 在 US CTR 更高
- Google 在 JP 转化更稳
- Meta 在 Tier-3 GEO 成本偏高

## Actions
1. 提升 US TikTok 预算
2. JP 保持稳量，不激进放量
3. 降低 BR 低质渠道预算
```

## 配合使用
- `campaign-diagnosis`
- `auto-bid-budget-rules`
- `retention-analysis`
- `iaa-ltv-calculator`
- `ads-report-generator`
