---
name: mmp-attribution-check
description: |
  归因与回传检查技能。

  功能：
  - 检查 AppsFlyer / Adjust / Singular 等 MMP 配置与归因链路
  - 分析 SKAN / Android attribution 相关异常
  - 检查回传延迟、事件丢失、数据偏差问题

  Use when:
  - 需要排查归因异常
  - 需要检查回传是否正常
  - 需要判断平台数据和MMP数据为何不一致
  - 需要分析 SKAN 或 Android 回传问题

  Keywords:
  - attribution, MMP, postback, SKAN
  - 归因, 回传, AppsFlyer, Adjust, SKAN

metadata:
  openclaw:
    emoji: "🧭"
    source: custom
    triggers: [mmp-check, attribution-check, postback-check]
    priority: P1
---

# 归因与回传检查

用于排查“为什么平台看到的数据和内部/MMP数据不一致”。

## 支持场景
- AppsFlyer 配置核查
- Adjust 配置核查
- Singular 配置核查
- SKAN 回传分析
- Android attribution / postback 链路排查

## 重点检查项

### 1. 事件映射
- install / first_open / register / purchase 是否映射正确
- 是否存在事件名不一致
- 是否漏传关键优化事件

### 2. 回传状态
- postback 是否开启
- 是否有延迟
- 是否有被拒绝/丢失记录
- 是否只回传了部分事件

### 3. 平台与 MMP 对账
- 平台 install 数 vs MMP install 数
- 平台 event 数 vs MMP event 数
- 时间窗口是否一致
- 归因口径是否一致

### 4. SKAN / iOS 特殊问题
- conversion value 配置
- coarse / fine value 映射
- postback 窗口延迟
- 数据回传不完整

### 5. Android 特殊问题
- Referrer 是否完整
- SDK 初始化是否正确
- deep link / deferred deep link 是否异常

## 常见问题模板
- **平台转化高，MMP转化低**：可能有回传丢失或归因窗口不一致
- **MMP有事件，平台优化不到**：事件未映射为优化事件或 postback 配置错误
- **数据延迟大**：需检查回传窗口、时区和批处理机制
- **SKAN 数据偏小**：需检查 CV 映射和 postback 窗口认知

## 推荐输出格式

```markdown
# MMP Attribution Check

## Findings
- AppsFlyer purchase event 映射正常
- TikTok purchase postback 未完整回传
- MMP 与平台 install 差异 18%

## Likely Causes
1. postback 事件映射不完整
2. attribution window 口径不一致
3. 部分事件存在延迟

## Actions
1. 核对 purchase event mapping
2. 检查 postback 开关与 partner 配置
3. 对齐 dashboard 时间窗口
```

## 配合使用
- `campaign-diagnosis`
- `ads-report-generator`
- `funnel-analysis`
- `retention-analysis`
