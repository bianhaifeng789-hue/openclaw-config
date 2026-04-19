---
name: creative-performance-analysis
description: |
  投放创意表现分析技能。

  功能：
  - 分析图片/视频/文案/CTA 等创意维度表现
  - 对比不同素材版本的 CTR、CVR、CPI、ROAS
  - 检测创意疲劳、低效素材、可放量素材
  - 输出淘汰、保留、加测建议

  Use when:
  - 需要分析广告素材表现
  - 需要做创意 A/B 测试复盘
  - 需要判断素材是否疲劳
  - 需要给设计/投放提供优化建议

  Keywords:
  - creative analysis, ad creative, fatigue
  - 素材分析, 创意分析, 创意疲劳, A/B测试

metadata:
  openclaw:
    emoji: "🎨"
    source: custom
    triggers: [creative-analysis, ad-creative, creative-fatigue]
    priority: P0
---

# 投放创意表现分析

用于分析不同广告素材在投放中的真实表现，并给出继续投放、继续测试或停止投放建议。

## 分析维度

### 1. 基础表现
- **Impressions**：展示量
- **Clicks**：点击量
- **CTR**：点击率
- **Installs / Conversions**：转化量
- **CVR**：转化率
- **CPI / CPA**：获客成本
- **ROAS**：广告回收
- **Retention D1/D7**：留存质量

### 2. 创意维度拆解
- **素材类型**：图片 / 视频 / 轮播 / UGC / 纯字幕 / 口播
- **开头 Hook**：前 3 秒吸引力
- **文案角度**：痛点型 / 利益型 / 社证型 / 折扣型
- **CTA**：Install Now / Learn More / Play Free 等
- **视觉风格**：强刺激 / 极简 / 对比 / 截图 / 实录
- **受众匹配**：不同 GEO / 不同渠道 / 不同人群下表现差异

### 3. 创意疲劳检测
满足以下任一情况，可判定存在疲劳风险：
- CTR 连续下降 ≥ 20%
- CPI 连续上升 ≥ 20%
- 同频次下 ROAS 连续下降
- 展示高但新增转化明显衰减
- 同类新素材上线后旧素材显著掉量

### 4. 输出动作建议

#### 保留并放量
适用于：
- CTR 高于组均值
- CPI / CPA 低于组均值
- ROAS 或留存质量不差

#### 保留继续测
适用于：
- CTR 高但 CVR 一般
- CPI 一般但留存更好
- 数据量还不够

#### 暂停/淘汰
适用于：
- CTR 明显低于组均值
- CPI / CPA 明显偏高
- ROAS 连续落后
- 疲劳明显且无修复价值

## 推荐输出格式

```markdown
# Creative Performance Report

## Winner Creatives
- Creative A: CTR 2.8%, CPI $1.12, ROAS 138%
- Creative C: CTR 2.5%, CPI $1.20, D7 留存更优

## Underperforming Creatives
- Creative B: CTR 1.1%, CPI $2.05, 疲劳明显
- Creative D: 点击尚可，但 CVR 偏低

## Key Findings
- 视频类素材优于静态图
- 前3秒强 Hook 明显提升 CTR
- “结果展示型” 文案优于“功能说明型”

## Next Actions
1. 放量 A / C
2. 基于 A 衍生 3 个新版本
3. 暂停 B / D
```

## 常见结论模板
- **高 CTR + 低 CVR**：素材吸引点强，但落地页/受众匹配需检查
- **低 CTR + 高 CVR**：素材点击弱，但吸引到的人更精准，可尝试改 Hook
- **高 CTR + 高 CPI**：点击多但转化差，优先查商店页/注册链路
- **低 CTR + 低量**：素材本身不成立，建议快速淘汰

## 配合使用
可结合以下能力一起使用：
- `campaign-diagnosis`
- `auto-bid-budget-rules`
- `retention-analysis`
- `funnel-analysis`
- `content-generator-skill`

## 适用场景
- TikTok / Meta / Google UAC / Unity Ads / ironSource
- 海外安卓应用买量
- 素材周复盘 / 日常加测 / 爆款复制
