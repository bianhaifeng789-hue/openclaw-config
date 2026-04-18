---
name: mediation-platforms-skill
description: |
  广告变现平台注册技能
  
  涵盖平台：
  - Google AdMob
  - Meta Audience Network
  - AppLovin
  - Unity Ads
  - ironSource
  - Chartboost
  
  Use when:
  - 注册广告变现平台
  - 配置广告中介
  - 查看平台注册要求
  
  Keywords:
  - AdMob, Meta AN, AppLovin, Unity, ironSource
  -变现平台, mediation, ad network

metadata:
  openclaw:
    emoji: "💰"
    source: custom
    triggers: [mediation-platforms, ad-network-registration]
    priority: P1
---

# 广告变现平台注册指南

美国市场主流广告变现平台注册流程。

## Google AdMob

### 注册步骤

```
1. 访问 https://admob.google.com
2. 使用Google账户登录
3. 填写开发者信息：
   - 公司名称
   - 地址（美国地址格式）
   - 税务信息
4. 验证邮箱
5. 添加APP信息：
   - APP名称
   - 平台（iOS/Android）
   - Store链接
6. 等待审核（1-3天）
```

### 注册要求

| 项目 | 要求 |
|------|------|
| **账户** | Google账户 |
| **年龄** | 18岁以上 |
| **APP** | 至少1个已上线APP |
| **税务** | 美国税务信息（W-9/W-8BEN） |

### 常见问题

```
Q: 审核需要多久？
A: 通常1-3个工作日

Q: 为什么被拒绝？
A: APP质量不达标、内容违规、无流量

Q: 填充率低怎么办？
A: 配置中介，接入多个广告网络
```

---

## Meta Audience Network

### 注册步骤

```
1. 访问 https://developers.facebook.com/products/audience-network
2. 创建Facebook开发者账户
3. 创建应用（App ID）
4. 填写业务信息：
   - Business name
   - Website
   - Contact email
5. 添加APP详情
6. 提交审核
```

### 注册要求

| 项目 | 要求 |
|------|------|
| **账户** | Facebook账户 |
| **Business Manager** | 需创建Business Manager |
| **APP** | 5000+日活用户（推荐） |
| **内容** | 符合Facebook内容政策 |

---

## AppLovin

### 注册步骤

```
1. 访问 https://www.applovin.com
2. 点击 "Sign Up"
3. 填写开发者信息：
   - Name
   - Email
   - Company
4. 添加APP信息：
   - APP名称
   - Bundle ID
   - Store链接
5. 等待审核（即时激活）
```

### 注册要求

| 项目 | 要求 |
|------|------|
| **APP** | iOS/Android游戏优先 |
| **流量** | 无最低流量要求 |
| **审核** | 通常即时激活 |

---

## Unity Ads

### 注册步骤

```
1. 访问 https://unity.com/products/unity-ads
2. 创建Unity ID
3. 填写开发者信息
4. 添加APP：
   - Game name
   - Platform
   - Store link
5. 获取Game ID
```

### 注册要求

| 项目 | 要求 |
|------|------|
| **账户** | Unity ID |
| **类型** | 游戏优先 |
| **流量** | 无最低要求 |

---

## ironSource

### 注册步骤

```
1. 访问 https://www.ironsrc.com
2. 注册开发者账户
3. 填写公司信息
4. 添加APP详情
5. 集成SDK
6. 等待审核
```

---

## Chartboost

### 注册步骤

```
1. 计问 https://www.chartboost.com
2. 注册开发者账户
3. 填写开发者信息
4. 添加APP
5. 集成SDK
```

---

## 中介配置

### AdMob中介

```
支持网络：
- Meta AN
- AppLovin
- Unity Ads
- ironSource
- Chartboost

配置步骤：
1. AdMob后台 → Mediation
2. 创建Mediation Group
3. 添加广告单元
4. 添加自定义事件（Custom Events）
5. 设置eCPM Floor
```

### Waterfall顺序建议

```
优先级排序：
1. Meta AN（高eCPM）
2. AppLovin（游戏）
3. Unity Ads（视频）
4. AdMob（兜底）
```

---

## 注册审核时间

| 平台 | 审核时间 | 激活方式 |
|------|----------|----------|
| **AdMob** | 1-3天 | 邮件通知 |
| **Meta AN** | 3-7天 | 后台状态 |
| **AppLovin** | 即时 | 自动激活 |
| **Unity** | 即时 | 自动激活 |
| **ironSource** | 1-2天 | 邮件通知 |

---

快速帮你完成各广告变现平台注册和中介配置。