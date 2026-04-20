---
name: monetization-workflow
description: 变现工作流总控技能。整合广告变现、聚合配置、付费墙、收益监控、增长裂变的完整变现链路。支持从竞品变现拆解到收益优化的全流程。适用于产品变现设计、竞品商业化对标、收益提升方案。
---

# 变现工作流 - 产品变现全流程整合

## 触发场景
当用户提到以下关键词时，使用本技能：
- 变现工作流 / 商业化工作流
- 变现设计 / 收益方案
- 广告变现 / IAP / 订阅
- 竞品怎么赚钱 / 商业化拆解
- 收益优化 / eCPM 提升
- 变现对标 / 聚合配置

---

## 工作流阶段

### Phase 1: 竞品变现拆解
**目标**: 拆解竞品如何赚钱，输出可借鉴点

**输出文件**: `INSIGHTS.md` (变现洞察)

**相关 skills**:
- `monetization-teardown` - 商业化总拆解
- `ad-mediation-teardown` - 广告栈拆解
- `paywall-analysis` - 付费墙拆解
- `apk-reverse-analysis` - APK 技术拆解

**操作流程**:
```bash
# 1. APK 拆解（如有 APK）
apk-reverse-analysis → SDK 清单 + 广告位

# 2. 商业化总拆解
monetization-teardown → 变现模式 + 收益路径

# 3. 广告栈拆解
ad-mediation-teardown → Waterfall/Bidding + SDK 组合

# 4. 付费墙拆解
paywall-analysis → 订阅页 + 价格策略

# 5. 记录洞察
edit INSIGHTS.md # 添加变现洞察
```

---

### Phase 2: 变现方案设计
**目标**: 设计适合自己产品的变现组合

**输出文件**: `DECISIONS.md` (变现决策)

**相关 skills**:
- `ad-monetization-optimization` - 广告变现优化策略
- `mediation-platforms` - 平台账号配置
- `paywall-analysis` - 订阅设计参考

**设计维度**:
| 变现类型 | 适用场景 | 收益预期 |
|----------|----------|----------|
| 激励视频 | 游戏/工具 | $15-$40 eCPM |
| 插屏广告 | 自然停顿点 | $10-$30 eCPM |
| Banner | 底部固定 | $0.5-$2 eCPM |
| 订阅/IAP | 高频工具/内容 | ARPU +30-50% |
| 混合模式 | 游戏+内容 | 最优收益组合 |

**操作流程**:
```bash
# 1. 选择变现组合
# - 纯广告？纯订阅？混合？

# 2. 配置广告平台
mediation-platforms → AdMob/Meta/Unity/AppLovin 注册

# 3. 设计 Waterfall/Bidding
ad-monetization-optimization → 聚合配置

# 4. 设计付费墙（如有订阅）
paywall-analysis → 订阅页策略

# 5. 记录决策
edit DECISIONS.md # 标记变现方案 ⭐
```

---

### Phase 3: 数据监控配置
**目标**: 建立收益监控和预警机制

**输出文件**: Dashboard + 预警配置

**相关 skills**:
- `revenue-dashboard` - Dashboard 配置
- `ad-analytics` - 数据分析

**核心指标**:
| 指标 | 健康值 | 预警阈值 |
|------|--------|----------|
| ARPU | $0.05-$0.15 | < $0.03 预警 |
| eCPM | 插屏$10-30 | ↓20% 预警 |
| Fill Rate | >95% | <80% 预警 |
| Show Rate | >80% | <60% 预警 |

**操作流程**:
```bash
# 1. 配置 Dashboard
revenue-dashboard → Firebase/GA/自建Dashboard

# 2. 设置预警规则
# - 收益下降 >20% → 预警
# - Fill Rate <80% → 预警
# - 账号异常 → 紧急通知

# 3. 接入 API
# - AdMob API
# - Meta Graph API
# - Unity/AppLovin API

# 4. 导出报告
# - 日报告
# - 周报告
```

---

### Phase 4: 收益优化迭代
**目标**: 根据数据优化变现策略

**相关 skills**:
- `ad-monetization-optimization` - 调优策略
- `ad-analytics` - 数据分析

**优化维度**:
- **Waterfall 调整**: 高 eCPM 网络优先
- **Floor 调整**: 测试不同 Floor 值
- **频控优化**: 展示时机与频次
- **广告位新增**: 增加展示机会
- **订阅页优化**: 试用/价格/权益

**操作流程**:
```bash
# 1. 分析当前数据
ad-analytics → 收益报告 + 异常点

# 2. 诊断问题
# - eCPM 下降？→ 检查 Waterfall
# - Fill Rate 低？→ 添加备用网络
# - Show Rate 低？→ 优化广告位/频控

# 3. 生成优化方案
ad-monetization-optimization → Waterfall/Floor 建议

# 4. 实施并监控
# - 7天测试周期
# - 对比前后数据
```

---

### Phase 5: 增长与变现联动
**目标**: 变现与增长协同，避免变现伤害留存

**相关 skills**:
- `growth-teardown` - 增长拆解
- `paywall-analysis` - 变现体验优化

**关键平衡**:
| 变现强度 | 留存影响 | 建议 |
|----------|----------|------|
| 低频广告 | 留存稳定 | 新用户期 |
| 中频广告 | 留存略降 | 成熟用户 |
| 高频广告 | 留存明显下降 | 需分层 |
| 强制付费 | 流失风险高 | 需试用 |

**操作流程**:
```bash
# 1. 分析增长机制
growth-teardown → 留存/激活路径

# 2. 设计变现分层
# - 新用户：低频广告/免费试用
# - 成熟用户：正常变现
# - 高价值用户：订阅优先

# 3. 监控留存与变现平衡
# - 变现 ↑ 留存 ↓ → 调整频控
# - 变现 ↓ 留存 ↑ → 增加变现位
```

---

## 快速路径

### 路径 A: 竞品变现对标（最快）
```
monetization-teardown → DECISIONS.md → 配置上线
```
适用：竞品变现模式清晰，直接借鉴

### 路径 B: APK 技术拆解 → 变现
```
apk-reverse-analysis → ad-mediation-teardown → monetization-teardown → 配置
```
适用：有 APK，需要技术拆解 SDK 和广告栈

### 跹径 C: 全流程变现设计（新项目）
```
Phase 1 拆解 → Phase 2 设计 → Phase 3 监控 → Phase 4 优化 → Phase 5 联动
```
适用：新产品立项变现设计

### 路径 D: 收益优化（已有变现）
```
ad-analytics → ad-monetization-optimization → 调整 → 监控
```
适用：已有变现，需要优化提升

---

## 变现类型决策树

```
产品类型？
│
├─ 游戏 → 激励视频 + 插屏 + (可选订阅)
│
├─ 工具高频 → 激励视频 + 插屏 + 订阅(去广告)
│
├─ 工具低频 → Banner + 插屏 + (可选订阅)
│
├─ 内容/阅读 → 激励视频 + 订阅(解锁内容)
│
└─ 社交/通讯 → 订阅 + IAP(虚拟物品)
```

---

## 文件流转规则

| 输出内容 | 写入文件 | 说明 |
|----------|----------|------|
| 竞品变现洞察 | `INSIGHTS.md` | 长期积累 |
| 变现方案决策 | `DECISIONS.md` | 标记 ⭐ 最终方案 |
| Waterfall 配置 | `项目/mediation-config.json` | 聚合配置 |
| Dashboard 配置 | `项目/dashboard-config.json` | 监控配置 |
| 变现优化记录 | `EXPERIMENTS.md` | A/B 测试结果 |

---

## 联动技能关系图

```
monetization-workflow (总控)
│
├─ Phase 1 拆解层
│   ├─ monetization-teardown (商业化总拆解)
│   ├─ ad-mediation-teardown (广告栈拆解)
│   ├─ paywall-analysis (付费墙拆解)
│   └─ apk-reverse-analysis (APK 技术拆解)
│
├─ Phase 2 设计层
│   ├─ ad-monetization-optimization (变现策略)
│   ├─ mediation-platforms (平台配置)
│   └─ paywall-analysis (订阅设计)
│
├─ Phase 3 监控层
│   ├─ revenue-dashboard (Dashboard)
│   └─ ad-analytics (数据分析)
│
├─ Phase 4 优化层
│   ├─ ad-monetization-optimization (调优)
│   └─ ad-analytics (诊断)
│
└─ Phase 5 联动层
    ├─ growth-teardown (增长协同)
    └─ paywall-analysis (体验平衡)
```

---

## 示例用法

```
用户: "帮我拆解竞品 XXX 的变现模式"
Claw: monetization-teardown → ad-mediation-teardown → paywall-analysis → INSIGHTS.md

用户: "新产品怎么设计变现？"
Claw: monetization-workflow → Phase 1-5 全流程

用户: "eCPM 下降了 20%，怎么办？"
Claw: ad-analytics → ad-monetization-optimization → 调整 Waterfall/Floor

用户: "想配置广告 Dashboard"
Claw: revenue-dashboard → 配置 Firebase/GA + 预警规则

用户: "变现会不会伤害留存？"
Claw: growth-teardown → 设计分层变现策略
```

---

## 记忆维护

每次变现工作流完成后：
1. 更新 `INSIGHTS.md` - 竞品变现洞察
2. 更新 `DECISIONS.md` - 变现方案决策
3. 更新 `EXPERIMENTS.md` - 如有 A/B 测试
4. 更新 `memory/YYYY-MM-DD.md` - 记录今天完成

---

## 与 PM 工作流联动

变现工作流输出可直接进入 PRD：
- `INSIGHTS.md` → PRD 商业化章节输入
- `DECISIONS.md` → PRD 收益目标与方案
- Dashboard 配置 → PRD 埋点与数据监控

**联动路径**:
```
monetization-workflow → pm-workflow → PRD.md
```

---

_整合人：Claw_
_整合时间：2026-04-21 02:39 Asia/Shanghai_