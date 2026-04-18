---
name: applovlin-max-onboarding
description: |
  AppLovin MAX 开通SOP
  
  功能：
  - 开通入口
  - 注册要求
  - 审核流程
  - KYC资料
  - 开通 checklist
  - MAX中介配置
  - 开通后第一步
  
  Use when:
  - 开通AppLovin账号
  - 配置MAX中介
  - 解决AppLovin审核问题
  
  Keywords:
  - AppLovin开通, AppLovin MAX, MAX中介, AppLovin注册
---

# AppLovin MAX 开通SOP

## 开通入口
```
官网：https://www.applovin.com
MAX入口：https://dash.applovin.com
开发者门户：https://developers.applovin.com
```

## 注册要求

### 必备条件
```
✅ 公司名称
✅ 联系邮箱
✅ 联系地址
✅ 银行账户信息
✅ 应用信息（至少1个）
```

### 公司资料准备
```json
{
  "companyName": "Your Company LLC",
  "companyAddress": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "US"
  },
  "contactEmail": "info@company.com",
  "website": "https://yourcompany.com"
}
```

---

## 开通流程

### Step 1: 注册账号
```
1. 访问 https://www.applovin.com
2. 点击 "Sign Up"
3. 填写公司信息
4. 填写邮箱
5. 提交注册
```

### Step 2: 验证邮箱
```
1. 收到验证邮件
2. 点击验证链接
3. 登录账号
```

### Step 3: 创建应用
```
1. 进入 MAX Dashboard
2. 点击 "Add App"
3. 选择平台：Android / iOS
4. 填写应用名称
5. 填写商店链接（可选）
6. 点击 "Create"
```

### Step 4: 创建广告位
```
1. 进入应用详情
2. 点击 "Create Ad Unit"
3. 选择广告类型：
   - Banner
   - Interstitial
   - Rewarded Video
   - MREC（中等矩形）
4. 填写广告位名称
5. 点击 "Create"
6. 记录广告单元ID
```

### Step 5: 配置收款信息
```
1. 进入 "Account" → "Payment Settings"
2. 填写银行账户信息
3. 填写税务信息
4. 提交验证
```

---

## 审核流程

### AppLovin审核特点
```
✅ 无人工审核（自动审核）
✅ 注册后立即可用
✅ 应用提交后即可展示广告
✅ 需要一定展示量才能进入竞价池
```

---

## 开通 Checklist

```
✅ 公司信息已准备
✅ 账号已注册
✅ 邮箱已验证
✅ 应用已创建
✅ 广告位已创建
✅ SDK已集成
✅ 测试广告已验证
✅ 收款信息已配置
✅ 税务信息已填写
```

---

## MAX中介配置

### 为什么选择MAX
```
✅ 一站式中介平台
✅ Bidding完整（所有网络都支持竞价）
✅ 无需手动瀑布流配置
✅ 自动优化收益
✅ 实时竞价，透明度高
```

### MAX支持的网络
```
- AdMob
- Meta Audience Network
- Unity Ads
- ironSource
- Chartboost
- InMobi
- Vungle
- Mintegral
- Pangle
- Digital Turbine
- TikTok
```

### 配置MAX中介

#### Step 1: 添加广告网络
```
1. 进入 MAX → Mediation
2. 点击 "Manage Ad Networks"
3. 添加广告网络：
   - 输入网络名称
   - 输入网络账号信息
   - 输入广告单元映射
4. 保存配置
```

#### Step 2: 创建中介组
```
1. 点击 "Create Mediation Group"
2. 选择广告类型
3. 选择国家/地区
4. 添加广告网络
5. 设置竞价权重（或自动）
6. 保存
```

#### Step 3: 测试中介
```
1. 使用测试模式验证
2. 检查各网络是否正常响应
3. 检查竞价是否正常
4. 发布中介组
```

---

## 开通后第一步配置

### 1. 验证SDK集成
```
- 确认SDK版本最新
- 确认广告单元ID正确
- 测试广告展示
```

### 2. 配置中介网络
```
- 至少添加3个网络：AdMob + Meta AN + Unity
- 配置竞价优先
- 设置测试模式
```

### 3. 设置eCPM Floor（可选）
```
- 进入广告单元设置
- 设置eCPM Floor（建议$5-8）
- 测试收益变化
```

### 4. 开启自动优化
```
- MAX自动优化默认开启
- 无需手动瀑布流配置
- 观察收益变化
```

---

## SDK集成要点

### Android集成
```
1. 添加依赖：
   implementation 'com.applovin:applovin-sdk:+'
   
2. 初始化SDK：
   AppLovinSdk.initializeSdk(context)
   
3. 创建广告对象：
   AppLovinInterstitialAd interstitialAd = AppLovinSdk.getInstance(context).getAdService().createInterstitialAd(adUnitId)
   
4. 加载广告：
   interstitialAd.loadAd()
   
5. 展示广告：
   if (interstitialAd.isReady()) {
     interstitialAd.show()
   }
```

### iOS集成
```
1. 添加依赖：
   pod 'AppLovinSDK'
   
2. 初始化SDK：
   ALSdk.sharedSdk().initializeSdk()
   
3. 创建广告对象：
   let interstitialAd = ALSdk.sharedSdk().adService.createInterstitialAd(adUnitId)
   
4. 加载广告：
   interstitialAd.loadAd()
   
5. 展示广告：
   if (interstitialAd.isReady) {
     interstitialAd.show()
   }
```

---

## 收款周期
```
- 收款门槛：$20
- 收款周期：每月15日支付上月收益
- 首次收款：审核通过后30天
```

---

## 注意事项

### MAX使用要点
```
✅ MAX SDK必须使用（不能用其他中介SDK）
✅ 所有广告网络必须在MAX中配置
✅ 竞价优先，瀑布流自动优化
✅ eCPM Floor可以手动设置
✅ 新号需要积累展示量（建议5000+）
```

### 防封号要点
```
❌ 不要诱导点击
❌ 不要自己点击
❌ 不要虚假流量
❌ 不要展示过多广告

✅ 合理频控
✅ 真实流量
✅ 遵守政策
```