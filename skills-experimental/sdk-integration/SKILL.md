---
name: sdk-integration-skill
description: |
  SDK集成指南技能
  
  功能：
  - SDK集成步骤
  - 常见问题排查
  - 代码示例
  - 测试验证
  
  Use when:
  - 指导SDK集成
  - 排查集成问题
  - 提供代码示例
  
  Keywords:
  - SDK集成, SDK安装, 广告SDK
  - integration guide

metadata:
  openclaw:
    emoji: "🔧"
    source: custom
    triggers: [sdk-integration, sdk-install]
    priority: P1
---

# SDK集成指南

广告SDK集成步骤与常见问题。

## AdMob SDK集成

### iOS集成

```
1. 安装SDK
pod 'Google-Mobile-Ads-SDK'

2. Info.plist配置
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-xxxx~yyyy</string>

3. 初始化代码
import GoogleMobileAds

GADMobileAds.sharedInstance().start { status in
    // SDK初始化完成
}

4. 创建广告位
let banner = GADBannerView(adUnitID: "ca-app-pub-xxxx/zzzz")
banner.rootViewController = self
banner.load(GADRequest())
```

### Android集成

```
1. build.gradle
implementation 'com.google.android.gms:play-services-ads:21.5.0'

2. AndroidManifest.xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-xxxx~yyyy"/>

3. 初始化
MobileAds.initialize(this) {
    // 初始化完成
}

4. 创建广告位
AdView adView = new AdView(this);
adView.setAdUnitId("ca-app-pub-xxxx/zzzz");
adView.loadAd(new AdRequest.Builder().build());
```

---

## Meta AN SDK集成

### iOS

```
1. 安装
pod 'FBAudienceNetwork'

2. 初始化
FBAdSettings.addTestDevice("YOUR_DEVICE_ID")

3. 创建广告位
FBAdView *adView = [[FBAdView alloc]
    initWithPlacementID:@"YOUR_PLACEMENT_ID"
    adSize:kFBAdSize320x50
    rootViewController:self];
[adView loadAd];
```

### Android

```
1. build.gradle
implementation 'com.facebook.android:audience-network-sdk:6.11.0'

2. 初始化
AudienceNetworkAds.initialize(this);

3. 创建广告位
AdView adView = new AdView(this, "YOUR_PLACEMENT_ID", AdSize.BANNER_320_50);
adView.loadAd();
```

---

## AppLovin SDK集成

### iOS

```
1. 安装
pod 'AppLovinSDK'

2. 初始化
#import <AppLovinSDK/AppLovinSDK.h>

[ALSdk.sharedSdk initializeSdkWithCompletionHandler:^(ALSdkConfiguration *configuration) {
    // 初始化完成
}];

3. 创建广告位
MAAdView *adView = [[MAAdView alloc] initWithAdUnitIdentifier:@"YOUR_AD_UNIT"];
[adView loadAd];
```

### Android

```
1. build.gradle
implementation 'com.applovin:applovin-sdk:11.5.0'

2. 初始化
SdkConfiguration config = new SdkConfiguration("YOUR_SDK_KEY");
AppLovinSdk.getInstance(context).initializeSdk(config);

3. 创建广告位
AdView adView = new AdView(activity);
adView.setAdUnitId("YOUR_AD_UNIT");
adView.loadAd();
```

---

## 常见问题排查

### 广告不显示

```
排查步骤：
1. ✅ SDK是否初始化？
2. ✅ Ad Unit ID是否正确？
3. ✅ 是否在测试模式？
4. ✅ 设备是否添加为测试设备？
5. ✅ 网络是否正常？
6. ✅ 广告位是否正确添加到View？
```

### 点击率异常

```
问题诊断：
❌ CTR >20% → 可能误触设计
❌ CTR <1% → 广告位置不佳

解决方案：
- 调整广告位置（避免误触）
- 使用合适尺寸
- 优化展示时机
```

### 内存泄漏

```
检查项：
✅ 正确释放广告对象
✅ 移除监听器
✅ 避免循环引用

iOS示例：
- (void)dealloc {
    [self.adView removeFromSuperview];
    self.adView.delegate = nil;
}
```

---

## 测试验证

### 测试模式

```
AdMob:
GADRequest *request = [GADRequest request];
request.testDevices = @[ @"YOUR_DEVICE_ID" ];

Meta AN:
[FBAdSettings addTestDevice:@"YOUR_DEVICE_ID"];

AppLovin:
adView.setAdUnitIdentifier("YOUR_TEST_AD_UNIT");
```

### 测试广告位

```
每个平台都提供测试广告位ID：

AdMob:
- Banner: ca-app-pub-3940256099942544/2934735716
- Interstitial: ca-app-pub-3940256099942544/4411468910

Meta AN:
- Banner: IMG_16_9_APP_INSTALL#YOUR_PLACEMENT_ID

AppLovin:
- 使用测试SDK Key
```

---

## 集成清单

```
□ SDK已安装
□ 配置文件已添加
□ SDK已初始化
□ 广告位ID已配置
□ 测试设备已添加
□ 广告位已添加到UI
□ 加载广告代码正确
□ 监听器已设置
□ 测试广告显示正常
□ 测试模式已关闭（上线前）
```

---

快速帮你完成SDK集成，提供代码示例和问题排查。