---
name: meta-audience-network-onboarding
description: |
  Meta Audience Network 开通SOP
  
  功能：
  - 开通入口
  - 注册要求
  - 审核流程（严格）
  - 常见被拒原因
  - 开通 checklist
  
  Use when:
  - 开通Meta AN账号
  - Facebook变现平台
  
  Keywords:
  - Meta AN开通, Audience Network注册, Facebook变现, FAN
---

# Meta Audience Network 开通SOP

## 开通入口
```
官网：https://developers.facebook.com/products/audience-network
开发者门户：https://developers.facebook.com
```

## 注册要求（严格）
```
✅ Facebook开发者账号
✅ 公司信息验证
✅ 应用信息（至少1个）
✅ Business Manager账号
✅ 银行账户信息
✅ 税务信息
```

## 开通流程
```
Step 1: 注册FB开发者账号
- 访问 https://developers.facebook.com
- 使用FB账号登录
- 注册开发者账号
- 完成开发者验证

Step 2: 创建应用
- 创建Facebook App
- 启用 Audience Network

Step 3: 创建广告位
- 进入 Monetization Manager
- 创建广告位：
  * Interstitial
  * Rewarded Video
  * Banner
  * Native
- 记录 Placement ID

Step 4: 配置收款
- Business Manager → Financial Settings
- 填写银行账户信息
- 填写税务信息

Step 5: 应用审核
- 提交应用审核
- 等待审核结果（7-14天）
```

## 常见被拒原因
```
❌ FB账号不真实
❌ 应用内容违规
❌ 应用质量不足
❌ 开发者验证失败
❌ Business Manager未验证

解决：
✅ 使用真实FB账号
✅ 完成Business Manager验证
✅ 确保应用质量足够
✅ 等待审核通过再展示广告
```

## SDK集成
```
Android:
implementation 'com.facebook.android:audience-network-sdk:+'

iOS:
pod 'FBAudienceNetwork'
```

## 收款周期
```
收款门槛：$100
收款周期：每月21日
首次收款：审核通过后30天
```

## 注意事项（重要）
```
⚠️ Meta审核严格，封号风险高
⚠️ 需要真实FB账号绑定
⚠️ 新号需要积累展示量
⚠️ 不要诱导点击，政策敏感
```