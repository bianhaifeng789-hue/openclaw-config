---
name: ad-monetization-skill
description: |
  广告变现优化技能
  
  功能：
  - eCPM计算与优化
  - 填充率分析
  - 收益最大化策略
  - Waterfall配置
  - A/B测试
  
  Use when:
  - 分析广告收益
  - 优化eCPM
  - 配置中介策略
  
  Keywords:
  - eCPM, 填充率, 收益优化
  - monetization, waterfall

metadata:
  openclaw:
    emoji: "📈"
    source: custom
    triggers: [ad-monetization, ecpm-optimization]
    priority: P1
---

# 广告变现优化指南

APP广告收益最大化策略。

## 核心指标

### eCPM

```
eCPM = (总收益 / 展示数) × 1000

示例：
- 展示数: 10,000
- 总收益: $50
- eCPM = (50 / 10000) × 1000 = $5.00

行业基准（美国）：
- 游戏：$5-20
- 工具：$2-8
- 内容：$3-10
```

### 填充率

```
填充率 = 实际展示 / 请求次数 × 100%

理想值：
✅ >95% 优秀
⚠️ 80-95% 正常
❌ <80% 需优化
```

### 收益公式

```
日收益 = DAU × 人均展示数 × eCPM / 1000

示例：
- DAU: 10,000
- 人均展示: 10次
- eCPM: $5
- 日收益 = 10000 × 10 × 5 / 1000 = $500
```

---

## 优化策略

### 1. 提升eCPM

```
方法：
✅ 配置中介（多广告源）
✅ 设置eCPM Floor
✅ 优先高价值地区
✅ 优化广告位位置
✅ 使用激励视频（高eCPM）
```

### 2. 提升填充率

```
方法：
✅ 接入多个广告网络
✅ 配置Waterfall兜底
✅ 减少请求超时
✅ 预加载广告
✅ 使用自动刷新
```

### 3. 提升展示数

```
方法：
✅ 增加广告位数量
✅ 合理广告位置设计
✅ 用户激励（奖励视频）
✅ 自然场景触发
❌ 避免过度打扰
```

---

## Waterfall配置

### 排序原则

```
按eCPM从高到低排序：

1. Meta AN（$8-15）→ 高价值优先
2. AppLovin（$5-10）→ 游戏变现好
3. Unity Ads（$4-8）→ 视频广告
4. AdMob（$3-6）→ 稳定兜底
5. 自家SDK → 最后兜底
```

### eCPM Floor设置

```
策略：
- Tier 1地区：$5-10 Floor
- Tier 2地区：$2-5 Floor
- 其他地区：不设Floor

注意：
⚠️ Floor太高会降低填充率
⚠️ 需定期调整（每周）
```

---

## 广告位类型对比

| 类型 | eCPM | 用户体验 | 适用场景 |
|------|------|----------|----------|
| **激励视频** | $10-30 | ⭐⭐⭐ | 游戏奖励、解锁功能 |
| **插屏广告** | $5-15 | ⭐⭐ | 过渡场景、关卡结束 |
| **Banner** | $0.5-3 | ⭐ | 底部固定、内容页 |
| **原生广告** | $3-10 | ⭐⭐⭐⭐ | 内容流、推荐位 |

---

## A/B测试

### 测试维度

```
可测试项：
- 广告位位置
- 广告类型
- Waterfall顺序
- eCPM Floor值
- 展示频率
- 用户激励设计
```

### 测试流程

```
1. 创建A/B分组
2. 配置不同参数
3. 运行测试（7-14天）
4. 对比结果：
   - 收益差异
   - 留存差异
   - 用户满意度
5. 选择最优方案
```

---

## 收益分析模板

### 日报

```
## 广告收益日报

【总览】
- 展示数: {impressions}
- 收益: ${revenue}
- eCPM: ${ecpm}

【按平台】
- AdMob: ${admob_revenue} ({admob_ecpm})
- Meta AN: ${meta_revenue} ({meta_ecpm})
- AppLovin: ${applovin_revenue}

【异常】
- {warnings}

【建议】
- {recommendations}
```

### 周报

```
## 广告收益周报

【总收益】
- 本周: ${week_revenue}
- 上周: ${last_week_revenue}
- 变化: {change}%

【趋势】
- eCPM趋势: {ecpm_trend}
- 填充率趋势: {fillrate_trend}

【优化建议】
1. {recommendation_1}
2. {recommendation_2}
```

---

快速帮你分析收益数据，提供优化策略建议。