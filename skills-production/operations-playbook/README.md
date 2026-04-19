# 运营岗位总索引

用于汇总当前与账号注册、预算管理、平台配置、公司注册相关的 Skills 和 Scripts。

---

## 1. 运营岗位能力结构

### 核心能力
- `account-registration` - 平台账号注册自动化
- `account-isolation` - 多账号防关联
- `budget-management` - 预算分配与监控
- `company-registration` - 公司注册流程管理
- `tax-compliance` - 税务合规与表格

### 平台能力
- `us-iaa-platforms-guide` - 美国 IAA 平台指南
- `mediation-platforms` - 中介平台配置

---

## 2. 运营岗位飞书卡片脚本（7个）

### 账号管理卡片（3个）
- `scripts/account-registration-checklist-feishu-card.js` ✅
  - 检查账号注册进度
  - 显示各平台状态
  - 给出注册建议

- `scripts/account-isolation-check-feishu-card.js` ✅
  - 账号隔离检查
  - IP/设备/资料冲突检测
  - 健康评分

- `scripts/platform-status-feishu-card.js` ✅
  - 变现平台状态
  - 广告平台状态
  - 应用商店状态

### 预算管理卡片
- `scripts/budget-monitor-feishu-card.js` ✅
  - 日预算/月预算监控
  - 平台消耗详情
  - 超支预警

### 公司注册卡片
- `scripts/company-registration-progress-feishu-card.js` ✅
  - 注册步骤进度
  - 文档准备状态
  - 下一步建议

### 税务合规卡片
- `scripts/tax-compliance-status-feishu-card.js` ✅
  - 税务表格状态
  - GDPR/COPPA合规
  - 下一步建议

### 平台开通SOP卡片
- `scripts/platform-onboarding-checklist-feishu-card.js` ✅
  - 平台开通进度
  - SOP步骤检查
  - 开通顺序建议

---

## 3. 样例数据（9个）

### accounts-status.json
账号注册状态数据

### accounts-isolation.json
账号隔离检查数据（IP/设备/资料）

### budget-data.json
预算消耗数据

### platforms-status.json
平台配置状态数据

### company-status.json
公司注册进度数据

### tax-status.json
税务合规状态数据

### onboarding-status.json
平台开通SOP进度数据

### retention-data.json
留存分析数据（复用）

### roi-data.json
ROI分析数据（复用）

---

## 4. 使用方式

```bash
# 账号注册清单
node scripts/account-registration-checklist-feishu-card.js examples/operations/accounts-status.json

# 账号隔离检查
node scripts/account-isolation-check-feishu-card.js examples/operations/accounts-isolation.json

# 预算监控
node scripts/budget-monitor-feishu-card.js examples/operations/budget-data.json

# 平台状态
node scripts/platform-status-feishu-card.js examples/operations/platforms-status.json

# 公司注册进度
node scripts/company-registration-progress-feishu-card.js examples/operations/company-status.json

# 税务合规状态
node scripts/tax-compliance-status-feishu-card.js examples/operations/tax-status.json

# 平台开通SOP清单
node scripts/platform-onboarding-checklist-feishu-card.js examples/operations/onboarding-status.json
```

---

## 5. 运营工作流

### 新项目启动
1. 公司注册 → 公司注册进度卡片
2. 税务合规 → 税务合规状态卡片
3. 账号注册 → 账号注册清单卡片
4. 平台开通 → 平台开通SOP清单卡片
5. 账号隔离 → 账号隔离检查卡片
6. 平台配置 → 平台状态卡片

### 日常运营
1. 预算监控 → 预算监控卡片（每日）
2. 平台状态检查 → 平台状态卡片（每周）
3. 账号健康检查 → 账号隔离检查卡片（每周）
4. 税务合规更新 → 税务合规状态卡片（按需）

---

## 6. 适用范围
- 海外安卓 APP 运营
- IAA / 混合变现项目
- 小团队运营管理
- 多账号防关联

---

创建时间：2026-04-18