---
name: google-ads-api
description: |
  Google Ads API技能
  
  功能：
  - 创建广告账户
  - 创建广告系列
  - 创建广告组
  - 创建广告素材
  - 查询广告数据
  - 管理预算
  - 关键词管理
  
  Use when:
  - 创建Google广告
  - 查询Google广告效果
  - 管理Google广告预算
  - 管理关键词
  
  Keywords:
  - Google Ads, UAC, App Campaigns, 广告投放, 关键词
---

# Google Ads API

## API接入准备

### 1. 创建开发者项目
- 访问 https://console.cloud.google.com
- 创建项目
- 启用 Google Ads API

### 2. 获取凭证
- 创建 OAuth 2.0 凭证
- 获取 Client ID 和 Client Secret

### 3. 申请开发者令牌
- 访问 https://ads.google.com/aw/developer
- 申请开发者令牌

## 核心API

### 创建 App Campaign
```bash
curl -X POST "https://googleads.googleapis.com/v15/customers/{customer_id}/campaigns:mutate" \
  -d "operations[0].create.name=My App Campaign" \
  -d "operations[0].create.advertisingChannelType=APP_PROMOTION" \
  -d "operations[0].create.appCampaignSetting.appId=com.example.app" \
  -d "operations[0].create.appCampaignSetting.biddingStrategyGoalType=OPTIMIZE_INSTALLS_TARGET_INSTALL_COST"
```

### 查询广告数据
```bash
curl -X POST "https://googleads.googleapis.com/v15/customers/{customer_id}/googleAds:search" \
  -d "query=SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros FROM campaign WHERE date DURING LAST_7_DAYS"
```

## App Campaign类型

| 类型 | 说明 |
|------|------|
| INSTALLS | 应用安装 |
| APP_PROMOTION | 应用推广 |
| IN_APP_PURCHASES | 应用内购买 |

## 数据字段说明

| 字段 | 说明 |
|------|------|
| impressions | 展示次数 |
| clicks | 点击次数 |
| cost_micros | 消耗金额（微单位） |
| conversions | 转化次数 |
| conversion_value | 转化价值 |

## 最佳实践

- 使用 UAC (Universal App Campaigns)
- 自动化素材测试
- 监控转化数据
- 优化目标CPI