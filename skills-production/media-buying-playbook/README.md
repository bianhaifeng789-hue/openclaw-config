# 投放 & 运营岗位总索引

用于汇总当前与海外安卓 APP 投放测试、买量分析、变现优化、运营管理相关的 Skills 和 Scripts，方便后续快速查找和调用。

---

## 1. 当前能力结构

### P0：核心实战能力
- `creative-performance-analysis`
  - 素材表现分析
  - 创意疲劳检测
  - 放量/停量建议

- `campaign-diagnosis`
  - Campaign / Ad Set / Ad 三级诊断
  - 定位流量、创意、受众、落地页、回收问题

- `auto-bid-budget-rules`
  - 停量 / 放量 / 降预算规则
  - 按 CPI / CPA / ROAS / 留存给动作建议

### P1：分析与复盘能力
- `geo-channel-analysis`
  - 分国家 / 分渠道效果分析
  - GEO 预算分配建议

- `mmp-attribution-check`
  - AppsFlyer / Adjust / Singular 归因检查
  - SKAN / Android attribution 回传排查

- `ads-report-generator`
  - 广告日报 / 周报 / 复盘报告生成

### P2：增强能力
- `creative-testing-playbook`
  - 创意测试 SOP
  - 样本量、淘汰规则、晋级规则

- `audience-segmentation-analysis`
  - 人群分层分析
  - Broad / Interest / Lookalike / Remarketing 对比

- `fraud-risk-check`
  - 异常流量 / 作弊风险检查
  - 可疑渠道和低质量流量识别

- `cross-platform-budget-allocation`
  - 多平台预算分配建议
  - TikTok / Meta / Google / Unity / ironSource 横向比较

---

---

## 投放岗位飞书卡片脚本

### P0/P1 报告卡片（15个）
- ads-report-feishu-card.js ✅
- creative-analyzer-feishu-card.js ✅
- campaign-diagnoser-feishu-card.js ✅
- auto-bid-budget-feishu-card.js ✅
- geo-channel-feishu-card.js ✅
- mmp-attribution-feishu-card.js ✅
- creative-testing-feishu-card.js ✅
- audience-segmentation-feishu-card.js ✅
- fraud-risk-feishu-card.js ✅
- cross-platform-budget-feishu-card.js ✅
- funnel-analysis-feishu-card.js ✅
- ltv-analysis-feishu-card.js ✅
- roi-analysis-feishu-card.js ✅
- retention-analysis-feishu-card.js ✅
- video-creative-feishu-card.js ✅

### 样例数据（14个）
examples/media-buying/*.json ✅

---

## 运营岗位飞书卡片脚本

### 运营管理卡片（4个）
- account-registration-checklist-feishu-card.js ✅
- budget-monitor-feishu-card.js ✅
- platform-status-feishu-card.js ✅
- company-registration-progress-feishu-card.js ✅

### 样例数据（6个）
examples/operations/*.json ✅

---

## 2. 已有配套能力

### 平台与注册
- `account-registration`
- `account-isolation`
- `facebook-ads-api`
- `google-ads-api`
- `tiktok-ads-api`
- `admob-api`
- `unity-ads-api`
- `ironsource-api`

### 变现与平台资料
- `us-iaa-platforms-guide`
- `admob-onboarding`
- `applovlin-max-onboarding`
- `ironsource-levelplay-onboarding`
- `unity-ads-onboarding`
- `meta-audience-network-onboarding`
- `chartboost-onboarding`
- `inmobi-onboarding`
- `vungle-onboarding`
- `fyber-onboarding`
- `mintegral-onboarding`
- `pangle-onboarding`
- `ad-optimization-playbook`

### 数据分析基础
- `retention-analysis`
- `funnel-analysis`
- `ab-test-management`
- `budget-management`
- `tax-compliance`
- `company-registration`

---

## 3. 已有脚本入口

### 当前已落地脚本

#### Markdown 版本
- `scripts/creative-analyzer.js` - 创意表现分析报告
- `scripts/campaign-diagnoser.js` - 投放结构诊断报告
- `scripts/ads-report-cli.js` - 日报 / 周报生成

#### 飞书卡片版本 ✅ 新增

**P0/P1 报告卡片**
- `scripts/ads-report-feishu-card.js` - 投放日报/周报飞书卡片
- `scripts/creative-analyzer-feishu-card.js` - 创意表现分析飞书卡片
- `scripts/campaign-diagnoser-feishu-card.js` - Campaign 诊断飞书卡片
- `scripts/auto-bid-budget-feishu-card.js` - 出价预算规则飞书卡片 ✅ 新增
- `scripts/geo-channel-feishu-card.js` - GEO × 渠道分析飞书卡片 ✅ 新增
- `scripts/mmp-attribution-feishu-card.js` - MMP 归因检查飞书卡片 ✅ 新增

**P2 分析卡片**
- `scripts/creative-testing-feishu-card.js` - 创意测试 SOP 结果
- `scripts/audience-segmentation-feishu-card.js` - 受众分层分析
- `scripts/fraud-risk-feishu-card.js` - 流量异常风险检查
- `scripts/cross-platform-budget-feishu-card.js` - 多平台预算分配

### 使用方式

#### Markdown 输出
```bash
node scripts/creative-analyzer.js data.json
node scripts/campaign-diagnoser.js data.json
node scripts/ads-report-cli.js data.json daily
node scripts/ads-report-cli.js data.json weekly
```

#### 飞书卡片输出 ✅ 新增
```bash
# 投放日报卡片
node scripts/ads-report-feishu-card.js data.json --mode=daily
node scripts/ads-report-feishu-card.js data.json --mode=weekly

# 创意表现卡片
node scripts/creative-analyzer-feishu-card.js creative-data.json

# Campaign 诊断卡片
node scripts/campaign-diagnoser-feishu-card.js campaign-data.json
```

#### 飞书直接发送
通过 OpenClaw message tool 发送卡片 JSON

---

## 4. 推荐工作流

### 日常盯盘
1. 用 `campaign-diagnosis` 看整体结构问题
2. 用 `creative-performance-analysis` 看素材表现
3. 用 `auto-bid-budget-rules` 决定停量/放量
4. 用 `ads-report-generator` 输出日报

### 周复盘
1. 用 `geo-channel-analysis` 看国家和渠道结构
2. 用 `mmp-attribution-check` 排查归因偏差
3. 用 `cross-platform-budget-allocation` 调整平台预算
4. 用 `ads-report-generator` 生成周报

### 创意迭代
1. 用 `creative-testing-playbook` 设计测试节奏
2. 用 `creative-performance-analysis` 筛选胜出素材
3. 用 `audience-segmentation-analysis` 看不同人群适配

### 风险排查
1. 用 `fraud-risk-check` 查异常流量
2. 用 `mmp-attribution-check` 查回传和归因链路
3. 用 `campaign-diagnosis` 看是否只是结构问题而非作弊

---

## 5. 当前状态判断

### 已完成
- 投放岗位技能框架：已较完整
- P0 / P1 / P2 技能：已补齐
- 核心可执行脚本：已具备第一批

### 下一步建议
优先顺序：
1. 给脚本补样例数据与测试文件
2. 给 P2 能力补可执行脚本
3. 视需要补飞书卡片/自动报表集成

---

## 6. 适用范围
- 海外安卓 APP 买量
- IAA / 混合变现
- 小团队测试投放
- 运营 / 投放 / 数据分析协作

---

## 7. 快速结论

这套能力现在已经不是“只有概念”，而是：
- 有技能说明
- 有分析框架
- 有执行入口
- 有后续扩展路线

适合先跑测试投放，也能支撑一个小型买量团队日常工作。
