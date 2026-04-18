---
name: facebook-ads-api
description: |
  Facebook Ads API技能
  
  功能：
  - 创建广告账户
  - 创建广告系列
  - 创建广告组
  - 创建广告素材
  - 查询广告数据
  - 管理预算
  - A/B测试
  
  Use when:
  - 创建Facebook广告
  - 查询FB广告效果
  - 管理FB广告预算
  - 进行A/B测试
  
  Keywords:
  - Facebook Ads, FB广告, Meta Ads, 广告投放, 广告数据
---

# Facebook Ads API

## API接入准备

### 1. 创建开发者账号
- 访问 https://developers.facebook.com
- 创建应用
- 获取 App ID 和 App Secret

### 2. 获取访问令牌
```bash
curl -X POST "https://graph.facebook.com/v18.0/oauth/access_token" \
  -d "client_id={app_id}" \
  -d "client_secret={app_secret}" \
  -d "grant_type=client_credentials"
```

### 3. 申请 Ads API 权限
- 提交应用审核
- 申请 ads_management 权限

## 核心API

### 创建广告账户
```bash
curl -X POST "https://graph.facebook.com/v18.0/{business_id}/adaccounts" \
  -d "name=My Ad Account" \
  -d "currency=USD" \
  -d "timezone_id=America/Los_Angeles"
```

### 创建广告系列
```bash
curl -X POST "https://graph.facebook.com/v18.0/{ad_account_id}/campaigns" \
  -d "name=My Campaign" \
  -d "objective=OUTCOME_TRAFFIC" \
  -d "status=PAUSED" \
  -d "special_ad_categories=[]"
```

### 查询广告数据
```bash
curl -X GET "https://graph.facebook.com/v18.0/{ad_account_id}/insights" \
  -d "fields=impressions,clicks,spend,ctr,cpm,cpc" \
  -d "date_preset=last_7d"
```

## 数据字段说明

| 字段 | 说明 |
|------|------|
| impressions | 展示次数 |
| clicks | 点击次数 |
| spend | 消耗金额 |
| ctr | 点击率 |
| cpm | 千次展示成本 |
| cpc | 单次点击成本 |

## 最佳实践

- 使用批量API提高效率
- 设置错误重试机制
- 监控API调用限额
- 定期同步数据