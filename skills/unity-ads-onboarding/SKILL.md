---
name: unity-ads-onboarding
description: |
  Unity Ads 开通SOP
  
  功能：
  - 开通入口
  - 注册要求
  - 审核流程
  - 开通 checklist
  
  Use when:
  - 开通Unity Ads账号
  - 游戏变现平台
  
  Keywords:
  - Unity Ads开通, Unity Ads注册, Unity变现
---

# Unity Ads 开通SOP

## 开通入口
```
官网：https://unity.com/products/unity-ads
开发者门户：https://dashboard.unity3d.com
```

## 注册要求
```
✅ Unity账号（可免费注册）
✅ 公司名称
✅ 应用信息（至少1个）
✅ 银行账户信息
```

## 开通流程
```
Step 1: 注册Unity账号
- 访问 https://id.unity.com
- 注册免费账号
- 验证邮箱

Step 2: 创建组织
- 进入 Unity Dashboard
- 创建组织（Organization）
- 填写组织信息

Step 3: 创建项目
- 创建新项目
- 启用 Unity Ads 服务

Step 4: 配置广告位
- 进入 Ads Dashboard
- 创建广告位：
  * Interstitial
  * Rewarded Video
  * Banner
- 记录 Game ID 和 Placement ID

Step 5: 配置收款
- Organization → Financial Settings
- 填写银行账户信息
```

## SDK集成
```
Unity Package:
导入 Unity Ads Package

Android:
implementation 'com.unity3d.ads:unity-ads:+'

iOS:
pod 'UnityAds'
```

## 收款周期
```
收款门槛：$100
收款周期：每月15日
首次收款：30天
```