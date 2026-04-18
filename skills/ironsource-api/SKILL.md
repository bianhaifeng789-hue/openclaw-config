---
name: ironsource-api
description: |
  ironSource API技能
  
  功能：
  - 查询广告收益
  - 查询广告位数据
  - 管理中介配置
  - 生成收益报告
  
  Use when:
  - 查询ironSource收益数据
  - 管理ironSource中介
  - 生成ironSource报告
  
  Keywords:
  - ironSource, ironSource API, 广告收益, 中介配置
---

# ironSource API

## API接入准备

### 1. 创建账号
- 访问 https://ironsource.com
- 创建应用
- 获取 App Key

### 2. 获取API密钥
- 在Dashboard中生成API Key

## 核心API

### 查询收益数据
```bash
curl -X GET "https://api.ironsource.com/advertisers/reporting" \
  -d "startDate=2026-04-01" \
  -d "endDate=2026-04-17" \
  -d "metrics=revenue,impressions,clicks"
```

### 查询应用列表
```bash
curl -X GET "https://api.ironsource.com/publisher/apps"
```

## 数据字段说明

| 字段 | 说明 |
|------|------|
| revenue | 收益 |
| impressions | 展示次数 |
| clicks | 点击次数 |
| completions | 广告完成次数 |
| eCPM | 千次展示收益 |

## 中介配置

### 配置中介网络
```
1. 在ironSource后台配置中介
2. 添加其他广告网络（AdMob, Meta AN等）
3. 设置优先级
4. 启用自动中介优化
```

## 最佳实践

- 使用 LevelPlay中介提高收益
- 优化广告瀑布流
- 监控广告位性能
- 定期同步数据