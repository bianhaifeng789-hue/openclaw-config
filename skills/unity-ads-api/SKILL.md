---
name: unity-ads-api
description: |
  Unity Ads API技能
  
  功能：
  - 查询广告收益
  - 查询广告位数据
  - 管理项目配置
  - 生成收益报告
  
  Use when:
  - 查询Unity Ads收益数据
  - 管理Unity Ads项目
  - 生成Unity Ads报告
  
  Keywords:
  - Unity Ads, Unity Ads API, 广告收益
---

# Unity Ads API

## API接入准备

### 1. 创建Unity账号
- 访问 https://dashboard.unity3d.com
- 创建项目
- 获取 Game ID

### 2. 获取API密钥
- 在Dashboard中生成API Key

## 核心API

### 查询收益数据
```bash
curl -X GET "https://stats.unityads.unity3d.com/api/v1/organizations/{org_id}/reports" \
  -d "start=2026-04-01" \
  -d "end=2026-04-17" \
  -d "metrics=views,revenue,ecpm"
```

### 查询项目列表
```bash
curl -X GET "https://dashboard.unity3d.com/api/v1/organizations/{org_id}/projects"
```

## 数据字段说明

| 字段 | 说明 |
|------|------|
| views | 展示次数 |
| revenue | 收益 |
| ecpm | 千次展示收益 |
| starts | 广告开始次数 |
| completes | 广告完成次数 |

## 最佳实践

- 使用 rewarded ads 提高收益
- 优化广告位位置
- 监控完成率
- 配置中介优化