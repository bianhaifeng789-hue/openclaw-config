# Recovery Photo-Recover Files 竞品拆解与最终 PRD

- 目标链接: https://play.google.com/store/apps/details?id=com.xhiaguim.isophoto&hl=en-us&gl=us
- 包名: `com.xhiaguim.isophoto`
- 分析日期: 2026-04-20
- 分析人: Claw
- 证据等级: **已拿到真机安装包并完成静态逆向**

---

## 1. 执行摘要

这款产品不是一个单纯“帮你找回误删文件”的恢复工具，而是一个典型的**高情绪触发型工具流量产品**：

- 用“误删焦虑”作为下载入口
- 用“恢复照片 / 视频 / 音频 / 文件”做首屏主叙事
- 用“垃圾清理 / 相似图 / 截图清理 / 存储空间”延长生命周期
- 用**TradPlus 驱动的多广告聚合**实现变现
- 用**通知服务 + FCM + 归因/分析 SDK**做持续召回和流量回收

一句话判断：
**它本质上是“恢复故事包装下的广告聚合型清理工具”，而不是强恢复技术壁垒产品。**

---

## 2. 本次工作流完成情况

### 已完成
- Google Play 页面抓取 ✅
- 通过已登录 Google Play 的真机安装目标 App ✅
- 从真机 `adb pull` 拉取 APK ✅
- 用 JADX 完成静态反编译 ✅
- Manifest / 权限 / 组件 / SDK / 文案 / 增长链路分析 ✅
- 输出竞品分析 + PRD ✅

### 真实 APK 产物
- `artifacts/com.xhiaguim.isophoto/base.apk`
- `artifacts/com.xhiaguim.isophoto/split_config.xxhdpi.apk`
- `artifacts/com.xhiaguim.isophoto/jadx-base/`
- `artifacts/com.xhiaguim.isophoto/APK_REVERSE_ANALYSIS.md`

---

## 3. 逆向后的事实结论

## 3.1 基础信息
- 包名: `com.xhiaguim.isophoto`
- VersionName: `1.0.1.4`
- VersionCode: `10000104`
- minSdk / targetSdk: 26 / 35
- Application: `calcrim.aggruen.quobury.Sustwealt`
- Launcher Activity: `calcrim.aggruen.quobury.unwresi.hypnamwor.InlysicaActivity`

## 3.2 权限画像
这个 App 的权限诉求非常激进，核心包括：
- `MANAGE_EXTERNAL_STORAGE`
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`
- `READ_MEDIA_IMAGES`
- `POST_NOTIFICATIONS`
- `FOREGROUND_SERVICE`
- `ACCESS_NOTIFICATION_POLICY`
- `AD_ID`
- `BIND_GET_INSTALL_REFERRER_SERVICE`

这意味着它的真实产品策略并不是“轻恢复”，而是：
**尽可能扫全存储、拿通知通路、做持续召回和广告转化。**

## 3.3 功能模块（实锤）
从 `strings.xml` 与组件可直接确认：

### 恢复
- Recover Photos
- Recover Videos
- Recover Audios
- Recover Files
- Recovered Files

### 清理
- Junk Cleaner
- Similar Photos
- Screenshot Remover
- Device Storage

### 召回 / 通知
- 有独立 `NotificationService`
- 有 `MyFirebaseMessagingService`
- 大量恢复提醒、紧迫感推送文案

## 3.4 广告与增长基础设施（实锤）
### 广告聚合 / 广告平台
- TradPlus
- Google Mobile Ads / AdMob
- Pangle / Bytedance PAG
- MBridge / Mintegral
- IronSource
- Vungle
- Facebook Audience Network
- InMobi
- Bigo Ads
- Yandex Ads
- Unity Ads 适配痕迹

### 归因 / 统计 / 召回
- Firebase
- Firebase Cloud Messaging
- Adjust
- AppMetrica
- Install Referrer

### 结论
这是一个**变现导向非常明确**的产品，广告不是附属品，而是产品骨架的一部分。

---

## 4. 竞品拆解

## 4.1 核心定位
**一句话定位**

一个以“误删文件恢复”为主入口，以“清理整理”为副场景，以“广告聚合变现 + 通知召回”为底层商业逻辑的 Android 工具 App。

## 4.2 它在卖什么
用户表面上下载的是：
- 恢复照片
- 恢复视频
- 恢复文件

但它真正卖的是：
- 对“误删后悔”的心理安慰
- 对“还能救回来”的希望
- 对“不懂技术也能一键恢复”的低门槛承诺

## 4.3 真正的产品结构
这类产品通常不是单一恢复功能，而是一个三层漏斗：

### 第一层：高情绪获客
- 丢照片了
- 丢视频了
- 丢文件了

### 第二层：高反馈扫描
- 扫描出大量“可恢复内容”
- 强调“%d recoverable”
- 用强文案推用户继续点击

### 第三层：流量变现与留存
- 广告聚合
- 清理工具延长使用周期
- 推送和前台服务提升复访率

---

## 5. 关键产品观察

## 5.1 文案策略极强情绪化
逆向里能直接看到这些典型文案：
- `Last Chance! Recover Files Now`
- `90% Recovery Success!`
- `Recover Deleted Photos → Tap Here`
- `Time Running Out!`
- `Files Recovered! Tap to View`

这说明它不是偏理性工具风格，而是明显在打：
- 紧迫感
- 损失厌恶
- 立即行动
- 结果诱导

## 5.2 通知不是附加功能，而是核心增长通道
Manifest 和代码都表明：
- 有前台服务 `NotificationService`
- 有 FCM 服务 `MyFirebaseMessagingService`
- 字符串里有大量恢复提醒和通知引导

这代表它不是“装完用一次就完”，而是在努力变成一个**持续打扰型、高召回型工具**。

## 5.3 清理功能是留存延长器
恢复需求天然低频，但：
- Junk Cleaner
- Similar Photos
- Screenshot remover
- Device Storage

这些功能是高频需求，可以让产品从“一次性救急”变成“持续回来清手机”，也就意味着更多广告展示。

## 5.4 权限与价值承诺之间存在天然张力
它要：
- 全盘存储访问
- 通知权限
- 前台服务

但用户真正以为自己买到的是“恢复能力”。

这中间的风险是：
**如果恢复价值感不足，用户会迅速把它理解成一个高权限、高打扰、强广告的工具壳。**

---

## 6. 对我们做产品的启发

## 6.1 可以借鉴的

### 1. 切入口非常对
“误删焦虑”是超级强下载场景，远强于“媒体管理”或“空间清理”。

### 2. 低频恢复接高频整理
把恢复和清理打通，是非常成熟的生命周期设计。

### 3. 首页不复杂
这类用户最怕复杂，首屏只要明确：
- 找回照片
- 找回视频
- 找回音频
- 找回文件

### 4. 扫描结果反馈感很关键
即便真实能力一般，用户也会被“发现大量可恢复项”的反馈先留住。

## 6.2 不建议模仿的

### 1. 过度夸大恢复能力
像 `90% Recovery Success` 这种说法很危险，短期转化有用，长期信任有伤害。

### 2. 通知骚扰式召回
这会快速摧毁口碑。

### 3. 广告结构过重
广告 SDK 过多意味着产品心智会变成“广告壳”。

### 4. 结果来源解释不足
如果扫描结果里混了大量已有文件、缓存、缩略图，而不解释来源，会极大伤害真实价值感。

---

## 7. 面向我方的 PRD

# PRD: 可信型删除恢复助手

## 7.1 产品定位
一个强调**结果可解释、权限透明、低打扰、恢复后整理闭环**的 Android 恢复助手。

区别于竞品：
- 不用夸张成功率文案拉转化
- 不靠高骚扰通知做留存
- 不把广告放在用户最焦虑的关键路径上
- 明确告诉用户哪些是缓存、哪些是已有文件、哪些是真可恢复项

## 7.2 目标用户
### P0
- 误删照片/视频后急于找回的普通 Android 用户

### P1
- 手机相册过乱，需要恢复 + 整理一体化的人群

## 7.3 核心价值主张
1. **透明恢复**，先解释能找回什么
2. **结果分层**，按来源清晰标注
3. **恢复后整理**，一键去重/归档
4. **低打扰体验**，不在高焦虑节点强插广告

## 7.4 MVP 功能范围
### Must Have
- 照片恢复
- 视频恢复
- 文件恢复
- 结果来源标注
- 预览与批量恢复
- 已恢复文件管理
- 相似图 / 截图整理

### Nice to Have
- 音频恢复
- 恢复优先级推荐
- 备份提醒

## 7.5 页面流程
### 首页
- 找回照片
- 找回视频
- 找回文件
- 整理空间

### 权限说明页
- 为什么需要存储权限
- 能恢复什么 / 不能恢复什么
- 明确告知不会夸大结果

### 扫描中页
- 实时扫描进度
- 已发现数量
- 来源说明

### 结果页
按来源 Tab 展示：
- 高价值候选
- 已有文件
- 缓存文件
- 缩略图
- 其他文件

### 恢复完成页
- 保存位置
- 去重推荐
- 相似项整理
- 备份提示

## 7.6 商业化策略
### 建议方案
- 免费版提供基础扫描和少量恢复
- 看广告解锁额外恢复额度
- Pro 去广告 + 批量恢复 + 高级整理

### 原则
- 不在扫描前硬插广告
- 不在结果预览每一步都插广告
- 通知权限不绑核心功能

## 7.7 核心指标
- 扫描启动率
- 扫描完成率
- 恢复保存率
- 恢复后满意度
- 7日留存（来自整理模块）
- 负向评价率
- 广告触发后退出率

## 7.8 埋点建议
- 首页入口点击
- 权限授权结果
- 扫描开始/完成
- 各来源结果数量
- 预览点击
- 恢复点击
- 恢复成功
- 去重/清理动作
- 广告触发后流失
- 通知开启/关闭

---

## 8. 最终判断

从真机安装包逆向后的最终判断比之前更明确：

### 这不是
- 真正以恢复技术为核心壁垒的专业产品
- 偏工具主义和克制体验的恢复助手

### 这更像
- 用恢复焦虑获客
- 用扫描反馈留人
- 用清理场景延长生命周期
- 用广告聚合和通知召回做收入最大化

所以如果我们借鉴它，真正该学的是：
- 需求切入口
- 生命周期设计
- 功能组合方式

而不该学的是：
- 夸张承诺
- 高打扰通知
- 过重广告骨架

---

## 9. 产物路径
- 最终 PRD：`outputs/isophoto/recovery-photo-prd.md`
- APK 逆向报告：`artifacts/com.xhiaguim.isophoto/APK_REVERSE_ANALYSIS.md`
- 反编译目录：`artifacts/com.xhiaguim.isophoto/jadx-base/`
