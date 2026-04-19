---
name: tiktok-ads-api
description: |
  TikTok Ads API技能
  
  功能：
  - 创建广告账户
  - 创建广告系列
  - 创建广告组
  - 创建广告素材
  - 查询广告数据
  - 管理预算
  
  Use when:
  - 创建TikTok广告
  - 查询TikTok广告效果
  - 管理TikTok广告预算
  
  Keywords:
  - TikTok Ads, TikTok广告, ByteDance Ads, 广告投放
---

# TikTok Ads API

## API接入准备

### 1. 创建开发者账号
- 访问 https://ads.tiktok.com
- 创建广告账户
- 申请开发者权限

### 2. 获取访问令牌
```bash
curl -X POST "https://business-api.tiktok.com/open_api/v1.3/oauth2/authorize/" \
  -d "app_id={app_id}" \
  -d "secret={secret}"
```

## 核心API

### 创建广告系列
```bash
curl -X POST "https://business-api.tiktok.com/open_api/v1.3/campaign/create/" \
  -d "advertiser_id={advertiser_id}" \
  -d "campaign_name=My Campaign" \
  -d "objective_type=APP_INSTALL"
```

### 查询广告数据
```bash
curl -X POST "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/" \
  -d "advertiser_id={advertiser_id}" \
  -d "dimensions=['campaign_id']" \
  -d "metrics=['impressions','clicks','spend','install']" \
  -d "date_range={'start':'2026-04-01','end':'2026-04-17'}"
```

## 数据字段说明

| 字段 | 说明 |
|------|------|
| impressions | 展示次数 |
| clicks | 点击次数 |
| spend | 消耗金额 |
| install | 安装次数 |
| conversion | 转化次数 |

## 最佳实践

- 使用短视频素材
- 测试多个素材版本
- 定向年轻用户群体
- 监控API调用限额