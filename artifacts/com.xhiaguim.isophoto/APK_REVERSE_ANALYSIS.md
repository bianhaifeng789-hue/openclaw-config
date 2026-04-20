# APK / 竞品逆向分析 - com.xhiaguim.isophoto

## 1. 基础信息
- 包名：`com.xhiaguim.isophoto`
- 来源：已安装于连接设备 Pixel `42170DLJH001W3`，通过 `adb pull` 获取 APK
- APK 文件：
  - `artifacts/com.xhiaguim.isophoto/base.apk`
  - `artifacts/com.xhiaguim.isophoto/split_config.xxhdpi.apk`
- VersionCode：`10000104`
- VersionName：`1.0.1.4`
- compileSdk / targetSdk / minSdk：35 / 35 / 26
- Application：`calcrim.aggruen.quobury.Sustwealt`
- 启动页：`calcrim.aggruen.quobury.unwresi.hypnamwor.InlysicaActivity`
- 关键前台服务：`com.recovery.filephoto.notify.service.NotificationService`
- 推送服务：`com.recovery.filephoto.notify.service.MyFirebaseMessagingService`

## 2. 应用结构
从 Manifest 与反编译结果看，这是一个**明显做过类名混淆**的原生 Android 工具类 App，不是简单 WebView 壳。

### Manifest 关键点
- Launcher Activity：`InlysicaActivity`
- 页面 Activity 很多，但命名被混淆，说明其主体逻辑仍在原生层
- 存在独立前台服务 `NotificationService`
- 存在 FCM 推送服务 `MyFirebaseMessagingService`
- 具备较强的广告、归因、通知、角标、厂商市场兼容配置

### 权限侧重点
- 存储侧：
  - `READ_MEDIA_IMAGES`
  - `READ_EXTERNAL_STORAGE`
  - `WRITE_EXTERNAL_STORAGE`
  - `MANAGE_EXTERNAL_STORAGE`
  - `requestLegacyExternalStorage=true`
- 通知侧：
  - `POST_NOTIFICATIONS`
  - `ACCESS_NOTIFICATION_POLICY`
  - 前台服务相关权限
- 广告/归因侧：
  - `AD_ID`
  - `ACCESS_ADSERVICES_*`
  - `BIND_GET_INSTALL_REFERRER_SERVICE`

### 结构结论
这不是一个“轻量单功能恢复器”，而是一个**恢复 + 清理 + 通知召回 + 广告变现**的完整流量工具框架。

## 3. 技术栈识别
### 主体技术栈
- 原生 Android 应用
- AndroidX 组件齐全
- 存在 WorkManager
- 存在 Room
- 存在 Firebase Messaging

### 额外技术特征
- 开启 `usesCleartextTraffic=true`
- 存在 `networkSecurityConfig`
- 使用前台服务常驻能力
- 类名大量混淆，说明开发方有一定商业化成品打包流程

## 4. 第三方 SDK 清单（已实锤）
### 广告 / 聚合 / 变现
- **TradPlus**（广告聚合核心，证据非常强）
- **Google Mobile Ads / AdMob**
- **Pangle / Bytedance PAG / OpenAdsDK**
- **MBridge / Mintegral**
- **IronSource**
- **Vungle**
- **Facebook Audience Network**
- **InMobi**
- **Bigo Ads**
- **Yandex Ads**
- **Unity Ads**（通过聚合平台侧迹象）
- **AdColony / StartApp**（聚合适配痕迹）

### 归因 / 分析 / 增长
- **Firebase**
- **Firebase Cloud Messaging**
- **Adjust**
- **AppMetrica**
- **Install Referrer**

### 结论
这不是一个“克制型工具产品”，而是一个**广告聚合极重、增长基础设施完整**的变现型工具 App。TradPlus 是这里非常值得注意的主轴，说明它大概率在做多广告源聚合优化，而不是只接单一 AdMob。

## 5. 功能模块清单
结合 strings、权限与组件，可确认核心功能包括：

### 恢复模块
- 图片恢复
- 视频恢复
- 音频恢复
- 文件/文档恢复
- 恢复结果管理

### 清理模块
- Junk Cleaner / 垃圾清理
- Similar Photos / 相似图清理
- Screenshot Remover / 截图清理
- 存储空间查看

### 通知与召回模块
- 检测“可恢复文件”后发通知
- 提示“最后机会恢复”类通知
- 恢复成功后回流通知
- FCM 推送到达后可触发应用内逻辑

### 文案侧判断
从 `strings.xml` 可以直接看到大量高刺激文案，例如：
- `Last Chance! Recover Files Now`
- `90% Recovery Success!`
- `Time Running Out!`
- `Recover Deleted Photos → Tap Here`
- `Files Recovered! Tap to View`

这些文案明显不是偏工具理性的表达，而是**强情绪驱动 + 紧迫感驱动**。

## 6. 资源与配置线索
### Firebase 项目痕迹
- `project_id => recovery-photo-55d6e`
- `google_storage_bucket => recovery-photo-55d6e.firebasestorage.app`

### 权限与说明文案
前台服务特殊用途权限说明里写得很直接：
- 检测可恢复文件时通知用户
- 跟踪和展示成功恢复数量

### 配置倾向
- 使用通知、前台服务、存储全权限、广告聚合、归因统计共同组成一条完整的“扫描 → 提示 → 点击 → 恢复 → 广告 → 再召回”路径。

## 7. 网络与接口线索
本轮未做动态抓包，但静态证据已经足够说明其网络栈重点不在内容服务，而在：
- 广告网络请求
- 归因 / 安装来源
- FCM 推送
- Firebase / 分析能力

目前尚未看到它具备什么真正独特的“深度文件恢复算法服务端能力”证据。

## 8. 深挖结论：恢复逻辑真实度判断
这轮深挖后，我对“它到底是不是在做真正恢复”这个问题的判断更明确了。

### 已拿到的关键证据
核心文件：
- `calcrim/aggruen/quobury/bilampar/statha/jjIIl.java`
  - 源文件名映射：`Tenabmpath.kt`

这个类做了几件非常关键的事：

#### 1. 直接查询 `MediaStore.Images.Media`
代码里明确通过：
- `MediaStore.Images.Media.getContentUri(...)`
- `ContentResolver.query(...)`

去读取媒体库数据，并取这些字段：
- `_id`
- `_display_name`
- `_data`
- `_size`
- `mime_type`
- `date_added`

这说明它的核心“文件发现”能力至少有一大部分，是在**扫描系统媒体库索引**，而不是做底层块级恢复。

#### 2. 直接依赖 `_data` 文件路径
同一个类会把 `_data` 列读出来并转成路径，再做展示分类。
这类实现更像：
- 找出当前还在媒体库里的文件
- 做“恢复候选”展示
- 或围绕现有媒体条目做管理/删除/整理

而不是从磁盘残留区做真正恢复。

#### 3. 明确支持 `MediaStore.createDeleteRequest(...)`
这个类里还有：
- `delete(uri, ...)`
- `MediaStore.createDeleteRequest(...)`

这说明它不仅在扫描媒体库，还在对**系统媒体条目做删除/整理操作**。这和“相似图清理、截图清理、垃圾清理”模块是强一致的。

#### 4. 缩略图路径能力存在
`LjjjJ/iJlIL.java` 里明确在使用：
- `MediaStore.Images.Thumbnails.EXTERNAL_CONTENT_URI`
- `MediaStore.Video.Thumbnails.EXTERNAL_CONTENT_URI`

这意味着它至少掌握了**媒体缩略图**层的读取和展示能力。这进一步支持一个判断：
它的“恢复展示”很可能混合了：
- 仍存在于媒体库的原文件
- 缩略图
- 缓存图
- 可重新索引到的旧媒体项

而不是严格意义上的“已删除底层数据恢复”。

### 当前判断
基于静态代码证据，这个 App 更像是在做：

**媒体库扫描 + 路径索引聚合 + 缩略图/缓存命中 + 恢复叙事包装**

而不是：
- 文件系统底层扫描
- 已覆盖数据块恢复
- 专业取证级恢复

### 证据边界
这不是说它完全没有“找回”能力，而是说：
- 其主能力更像**发现仍可见或可重新索引的媒体**
- 而不是大家直觉里理解的“真正把删掉的东西从底层救回来”

这是一个非常关键的产品判断，因为它解释了为什么这类产品：
- 能快速扫出很多“recoverable”结果
- 但用户最后常常觉得“找回来的不是我以为的那些东西”

## 9. 深挖结论：广告触发与通知召回
### 通知侧实锤
- Manifest 声明了 `NotificationService`
- `NotificationService` 是前台服务，并带特殊用途 FGS 说明
- `MyFirebaseMessagingService` 接收 `com.google.firebase.MESSAGING_EVENT`

### 文案与用途实锤
`strings.xml` 中明确存在：
- `Allow notifications for important recovery alerts`
- `Get important recovery notifications`
- `Last Chance! Recover Files Now`
- `Recover Deleted Photos → Tap Here`
- `Files Recovered! Tap to View`

这说明通知并不是单纯“系统必要通知”，而是**业务转化通知**。

### 广告侧实锤
Manifest 里直接注册了多组广告 Activity / Provider：
- TradPlus interstitial activity
- MBridge reward activity
- Pangle / OpenAdsDK activity
- Google Ads activity
- Facebook Audience Network activity
- Vungle / InMobi / Bigo / Yandex 等

而且还有：
- `com.google.android.gms.ads.flag.OPTIMIZE_AD_LOADING=true`
- `AD_MANAGER_APP=true`

这说明广告不是“有接一点”，而是**产品在结构上围绕广告加载和填充优化做了重投入**。

## 10. 商业化分析
### 已确认的商业化结构
- 大量广告 SDK 与聚合 SDK 并存
- 有完整的广告 Activity / Provider / Service
- 文案和通知明显服务于高打开率和高转化率

### 商业化推断
高概率商业化链路是：
1. 用户因“误删焦虑”下载
2. 打开后授权存储和通知
3. 扫描后给出大量“可恢复结果”
4. 在关键页面承接插屏/激励/开屏/原生广告
5. 通过通知和 FCM 持续召回
6. 通过清理功能增加后续会话数和广告展示机会

### 产品侧判断
这个产品本质上不是“恢复技术产品”，而是：
**以恢复为主入口、以清理为次留存、以广告聚合为核心商业化引擎的工具流量产品。**

## 11. 数据与增长线索
### 已确认
- FCM 推送服务存在
- NotificationService 前台常驻能力存在
- Adjust / AppMetrica / Install Referrer 具备
- 厂商市场与 badge 权限较全

### 结论
其增长体系明显包括：
- 渠道归因
- 推送召回
- 广告聚合优化
- 可能的远程配置 / 事件统计

这说明开发方非常重视：
- 买量后的 ROI 回收
- 再打开率
- 广告 eCPM 优化

## 12. 风险与限制
- Jadx 反编译有 89 个错误，但不影响第一轮结构判断
- 类名高度混淆，精确功能流仍需二轮跟代码路径
- 本轮尚未动态抓包、运行时 Hook、广告触发时机验证
- 尚未从运行现场验证“恢复结果”究竟有多少是真删除恢复，多少只是已有媒体聚合

## 11. 结论摘要
1. 这是一款**原生 Android 的恢复/清理类工具 App**，不是纯 WebView 壳。
2. 它申请了**非常强的存储权限**，包括 `MANAGE_EXTERNAL_STORAGE`，说明其目标是尽可能扫全设备文件。
3. 它具备**恢复 + 清理 + 通知召回**三位一体结构，而不仅仅是恢复入口。
4. 它的商业化非常重，且明显采用 **TradPlus 为核心的多广告平台聚合**。
5. 它同时具备 **FCM + NotificationService + Adjust + AppMetrica + Install Referrer**，增长基础设施完整。
6. 从 strings 和通知逻辑看，它大量使用**“最后机会 / 立即恢复 / 高成功率”**这类高刺激文案推动转化。
7. 对产品经理最重要的启发不是“它会恢复文件”，而是：
   - 如何把用户误删焦虑包装成极强下载动机
   - 如何把恢复需求嫁接到清理和留存路径
   - 如何用广告聚合把工具型流量价值最大化
   - 以及，为什么这类产品容易在口碑和信任上出问题
