---
name: account-registration
description: |
  账号注册自动化技能
  
  涵盖平台：
  - Google AdMob账号注册
  - Facebook开发者账号注册
  - Unity Ads账号注册
  - ironSource账号注册
  - AppLovin账号注册
  - Google Play开发者账号注册
  - TikTok Ads账号注册
  
  功能：
  - 自动填写注册表单
  - 验证邮箱
  - 完成账号设置
  - 生成账号信息记录
  
  Use when:
  - 用户需要注册变现平台账号
  - 需要批量注册多个账号
  - 需要查看平台注册流程
  
  Keywords:
  - 账号注册, AdMob, Facebook, Unity, ironSource, AppLovin, Google Play, TikTok
---

# 账号注册自动化

## 平台注册流程

### 1. Google AdMob
1. 访问 https://admob.google.com
2. 登录 Google 账号
3. 填写付款信息
4. 完成税务信息
5. 创建应用

### 2. Facebook 开发者账号
1. 访问 https://developers.facebook.com
2. 使用 Facebook 账号登录
3. 注册为开发者
4. 创建应用
5. 添加 Audience Network

### 3. Unity Ads
1. 访问 https://unity.com/products/unity-ads
2. 创建 Unity 账号
3. 填写公司信息
4. 创建项目
5. 配置广告位

### 4. ironSource
1. 访问 https://ironsource.com
2. 创建账号
3. 填写公司信息
4. 创建应用
5. 配置中介

### 5. AppLovin
1. 访问 https://applovin.com
2. 创建账号
3. 填写付款信息
4. 创建应用
5. 配置 SDK

### 6. Google Play 开发者账号
1. 访问 https://play.google.com/console
2. 支付 $25 注册费
3. 填写开发者信息
4. 创建应用

### 7. TikTok Ads
1. 访问 https://ads.tiktok.com
2. 创建账号
3. 填写公司信息
4. 创建广告账户

## 注册资料模板

```json
{
  "companyName": "",
  "companyAddress": "",
  "companyPhone": "",
  "companyEmail": "",
  "website": "",
  "country": "US",
  "taxId": "",
  "bankAccount": {
    "bankName": "",
    "accountNumber": "",
    "routingNumber": ""
  },
  "contactPerson": {
    "name": "",
    "email": "",
    "phone": ""
  }
}
```

## 注意事项

- 使用不同的邮箱注册每个账号
- 使用不同的 IP 地址
- 避免相同设备登录多个账号
- 记录所有账号信息到 accounts.json