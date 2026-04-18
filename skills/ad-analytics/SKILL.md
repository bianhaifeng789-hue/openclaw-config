---
name: ad-analytics-skill
description: |
  广告数据分析技能 - 专为美国市场广告平台设计
  
  功能：
  - ROI（投资回报率）计算
  - 转化率分析
  - CTR（点击率）追踪
  - 成本分析（CPC/CPM/CPA）
  - A/B 测试效果对比
  - 自动生成分析报告
  
  Use when:
  - 用户询问广告效果数据
  - 需要分析广告投放 ROI
  - 需要对比不同广告方案效果
  - 需要生成广告分析报告
  
  Keywords:
  - 广告分析, ROI, 转化率, CTR, CPC, CPM
  - ad performance, campaign analysis
  - 广告效果, 投放效果

metadata:
  openclaw:
    emoji: "📊"
    source: custom
    triggers: [ad-analytics, roi-calculator, conversion-analysis]
    priority: P1
---

# 广告数据分析技能

专为美国市场广告平台设计的分析工具。

## 实际使用

### ROI 计算

```bash
# CLI 调用
node impl/bin/roi-calculator.js basic --cost=1000 --revenue=3500

# 输出
{
  "roi": "250.00%",
  "assessment": "✅✅ 优秀"
}

# 更多命令
node impl/bin/roi-calculator.js metrics --impressions 50000 --clicks 2500 --conversions 150 --cost 1200
node impl/bin/roi-calculator.js report --data '{"impressions":50000,"clicks":2500,"cost":1200,"revenue":4500}'
```

### Module 导出

```javascript
const { calculateBasicROI, generateReport } = require('./impl/bin/roi-calculator.js');

const roi = calculateBasicROI(1000, 3500);
console.log(roi); // { roi: '250.00%', assessment: '✅✅ 优秀' }

const report = generateReport({ impressions: 50000, clicks: 2500, cost: 1200 });
```

---

## 核心功能

### 1. ROI 计算

```
ROI = (收入 - 成本) / 成本 × 100%

示例：
- 广告成本: $1,000
- 产生收入: $3,500
- ROI = (3500 - 1000) / 1000 × 100% = 250%
```

### 2. 转化率分析

```
转化率 = 转化数 / 点击数 × 100%

关键指标：
- CTR (点击率) = 点击数 / 展示数
- CVR (转化率) = 转化数 / 点击数
- CPA (单次转化成本) = 总成本 / 转化数
```

### 3. 成本指标

| 指标 | 计算公式 | 说明 |
|------|----------|------|
| **CPC** | 成本 / 点击数 | 单次点击成本 |
| **CPM** | 成本 / (展示数/1000) | 千次展示成本 |
| **CPA** | 成本 / 转化数 | 单次转化成本 |

### 4. A/B 测试对比

```
对比维度：
- 点击率差异
- 转化率差异
- 成本效率
- 统计显著性检验
```

## 使用示例

**用户：帮我分析这组广告数据**

```
输入数据：
- 展示数: 50,000
- 点击数: 2,500
- 转化数: 150
- 成本: $1,200
- 收入: $4,500

输出分析：
📊 广告效果分析报告

【核心指标】
- CTR: 5.0% ✅ (行业平均 2-3%)
- CVR: 6.0% ✅ (行业平均 3-5%)
- CPC: $0.48
- CPA: $8.00
- ROI: 275% ✅✅ (优秀)

【建议】
- 点击率高于行业平均，继续优化
- 转化率良好，可扩大投放
- ROI 优秀，建议增加预算 20-30%
```

## 分析模板

### 日报模板

```
## 广告日报 - {日期}

### 投放概况
- 总展示: {impressions}
- 总点击: {clicks}
- 总转化: {conversions}
- 总成本: ${cost}

### 效果指标
- CTR: {ctr}%
- CVR: {cvr}%
- CPA: ${cpa}

### 异常预警
- ⚠️ {warnings}

### 明日建议
- {recommendations}
```

### 周报模板

```
## 广告周报 - {week}

### 本周概况
- 总成本: ${total_cost}
- 总收入: ${total_revenue}
- ROI: {roi}%

### 趋势分析
- CTR 趋势: {ctr_trend}
- CVR 趋势: {cvr_trend}

### Top 表现广告
1. {ad_1}
2. {ad_2}
3. {ad_3}

### 下周计划
- {next_week_plan}
```

## 行业基准（美国市场）

| 指标 | 行业平均 | 优秀水平 |
|------|----------|----------|
| CTR | 2-3% | > 5% |
| CVR | 3-5% | > 8% |
| CPA | $10-20 | < $5 |
| ROI | 100-150% | > 200% |

---

快速帮你计算和分析广告数据，提供专业建议。