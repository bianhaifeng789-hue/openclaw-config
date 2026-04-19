---
name: admob-api
description: |
  AdMob API技能
  
  功能：
  - 查询广告收益
  - 查询广告位数据
  - 管理中介配置
  - 生成收益报告
  
  Use when:
  - 查询AdMob收益数据
  - 管理AdMob中介
  - 生成AdMob报告
  
  Keywords:
  - AdMob, AdMob API, 广告收益, 中介配置
---

# AdMob API

## API接入准备

### 1. 创建开发者项目
- 访问 https://console.cloud.google.com
- 启用 AdMob API

### 2. 获取凭证
- 创建 OAuth 2.0 凭证
- 获取访问令牌

## 核心API

### 查询收益数据
```bash
curl -X GET "https://admob.googleapis.com/v1/accounts/{account_id}/networkReport:generate" \
  -d "reportSpec.dimensions=['APP','AD_UNIT','DATE']" \
  -d "reportSpec.metrics=['ESTIMATED_EARNINGS','IMPRESSIONS','CLICKS','CTR']"
```

### 查询应用列表
```bash
curl -X GET "https://admob.googleapis.com/v1/accounts/{account_id}/apps"
```

### 查询广告位列表
```bash
curl -X GET "https://admob.googleapis.com/v1/accounts/{account_id}/adUnits"
```

## 数据字段说明

| 字段 | 说明 |
|------|------|
| ESTIMATED_EARNINGS | 预估收益 |
| IMPRESSIONS | 展示次数 |
| CLICKS | 点击次数 |
| CTR | 点击率 |
| eCPM | 千次展示收益 |

## 中介配置

### 添加中介网络
```
1. 在AdMob后台配置中介
2. 添加其他广告网络（Meta AN, Unity等）
3. 设置eCPM地板价
4. 配置自动中介优化
```

## 最佳实践

- 使用中介优化提高收益
- 设置eCPM地板价
- 监控广告位性能
- 定期同步数据