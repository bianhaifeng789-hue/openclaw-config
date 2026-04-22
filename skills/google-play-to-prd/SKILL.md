---
name: google-play-to-prd
description: 端到端竞品分析流水线。飞书发 Google Play 链接 → ADB 自动安装到 Pixel → 围绕 PRD 目标做静态/动态逆向 → 生成开发导向 PRD → 同步飞书云文档。
---

# Google Play → 逆向驱动 PRD → 飞书文档

## 当前已固化默认工作流（2026-04-21）

以下流程已作为当前默认版本保存，适用于你刚确认通过的“开发可落地版”文档标准。

### 默认交付结构
最终交付必须固定为：
- **一到十四章：正式 PRD 正文**
- **十五章：逆向分析**，且必须固定包含 5 个子模块
  - 15.1 目标信息
  - 15.2 权限与通知分析
  - 15.3 核心功能静态与动态分析
  - 15.4 商业化分析
  - 15.5 代码复现
- **十六章：相关文档**

### 正文质量标准
一到十四章不能因为补逆向章节而被压缩成“摘要版”。默认要求：
- 必须保留完整的产品背景、用户价值、范围、成功指标、功能规格、页面规格、技术约束、埋点、实验、上线、规划内容
- **功能详细说明必须足够让研发直接理解并开始拆任务**
- **流程图必须比普通 PRD 更细**，至少覆盖：
  - 主业务流程
  - 权限分支流程
  - 扫描执行流程
  - 恢复执行流程
  - 广告插入流程
  - 关键异常 / 兜底流程
- 页面级规格必须包含：页面目标、入口、出口、关键组件、关键状态、说明文案/权限说明、逆向证据
- 功能规格必须包含：目标、前置条件、主流程、异常流程、业务规则、状态定义、埋点、验收标准、逆向证据

### 代码复现标准
十五章中的代码复现不是“讲框架”，而是默认要写到接近研发可直接开发的粒度，至少包含：
- 关键数据结构
- 关键函数签名
- 核心 Android API 用法
- 接近 Kotlin 的伪代码
- 状态流转与 ViewModel / Repository 关系
- 推荐工程目录结构

### 当前模板决策
针对文件恢复类产品，当前默认结论为：
- 恢复能力定位为：**可访问残留文件发现 + MediaStore 重新写回**
- 不表述为底层 deleted block 恢复
- MVP 优先做照片恢复
- 垃圾桶补扫是首期关键能力
- 广告策略采用**节点化精控 + Remote Config 开关**
- 广告失败不能影响主链路
- 正文写“结论、规则、开发落地信息”，逆向章节写“证据和复现”

### 飞书输出策略
- 不覆盖旧文档，默认新建新文档
- 若飞书格式承载影响结构稳定，降级策略为：
  1. 先生成本地完整版 Markdown
  2. 再同步飞书
- 当前已确认可作为模板参考的版本：
  - **PRD v5 - File Recovery 开发可落地版**
  - URL: `https://feishu.cn/docx/G3LWdx6FKoUB8vxd91ocOfCenPD`

## 核心原则

这不是“先逆向一堆内容，再把结果塞进 PRD”。

这是 **以 PRD 为目标组织逆向**：
- 先明确 PRD 需要哪些开发级事实
- 再围绕这些章节定向逆向
- 最后把逆向结论直接写入 PRD 正文，并保留证据引用

**目标**：让逆向结果直接指导开发，而不是停留在研究报告。

---

## 触发场景
当用户在飞书发送以下内容时自动触发：
- Google Play 链接（`https://play.google.com/store/apps/details?id=...`）
- 包名（如 `com.example.app`）
- “帮我分析这个 App 并生成 PRD”
- “下载这个竞品，逆向后出开发文档”

---

## 工具链

| 工具 | 路径 | 用途 |
|------|------|------|
| play-to-prd.sh | `scripts/play-to-prd.sh` | 总入口脚本 |
| google-play-installer.js | `impl/bin/google-play-installer.js` | ADB 自动安装 + APK 拉取 |
| jadx | `~/Tools/jadx/bin/jadx`（shim: `scripts/jadx`） | 反编译 |
| apktool | `~/Tools/apktool.jar` | 资源解包 |
| adb | `~/android-sdk/platform-tools/adb` | 设备控制 |

**设备**: Pixel 8 (ID: `42170DLJH001W3`)

---

## 完整流程

### Phase 1: 解析输入 & 采集 Play 页面信息

```bash
# 1. 从链接提取包名
# https://play.google.com/store/apps/details?id=com.example.app → com.example.app

# 2. 抓取 Google Play 页面（应用名、描述、评分、下载量、权限、更新日志）
web_fetch "https://play.google.com/store/apps/details?id=<包名>&hl=zh"

# 3. 包名格式校验
scripts/play-to-prd.sh check-app <包名>
```

**这一阶段要形成的 PRD 输入**：
- 产品定位
- 市场包装方式
- 商店文案中的核心价值主张
- 公开权限声明
- 更新节奏和版本演进线索

### Phase 2: ADB 自动安装 & APK 拉取

```bash
# 1. 打开 Google Play 详情页并自动安装
scripts/play-to-prd.sh install-play <包名> 42170DLJH001W3

# 2. 验证安装成功
scripts/play-to-prd.sh device-check <包名> 42170DLJH001W3

# 3. 拉取 APK 到本地 artifacts 目录
scripts/play-to-prd.sh pull-apk <包名> <包名> 42170DLJH001W3
# → 输出到 artifacts/<包名>/base.apk (+ split APKs)
```

**异常处理**:
- 安装超时 → 重试一次，仍失败则提示用户手动安装
- 设备未连接 → 提示检查 USB 连接
- 已安装 → 跳过安装，直接 pull

### Phase 3: 围绕 PRD 章节做静态逆向

```bash
export JAVA_HOME=~/Tools/zulu17.54.21-ca-jdk17.0.13-macosx_aarch64/zulu-17.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

# 1. JADX 反编译（Java 源码）
scripts/jadx -d artifacts/<包名>/jadx-base artifacts/<包名>/base.apk

# 2. Apktool 解包（资源 + Manifest）
java -jar ~/Tools/apktool.jar d artifacts/<包名>/base.apk -o artifacts/<包名>/apktool-out
```

#### 静态逆向不按“泛分析”组织，而按 PRD 章节组织：

| PRD 目标章节 | 逆向要提取的事实 | 主要证据来源 |
|---|---|---|
| 核心功能规格 | 页面结构、跳转流程、状态机、业务规则、异常流程 | Activity/Fragment/Router/ViewModel |
| 页面级规格 | 页面入口/出口、组件结构、文案、空态/异常态 | Layout/XML/Compose/资源文件 |
| API / 数据契约 | 接口路径、请求参数、返回结构、错误码、鉴权方式 | Retrofit/OkHttp/序列化模型 |
| 商业化策略 | 广告 SDK、点位、触发条件、频控、预加载逻辑 | Manifest、SDK 初始化、广告调用代码 |
| 权限与合规 | Manifest 权限、动态权限请求、权限拒绝后的降级路径 | AndroidManifest.xml、权限请求代码 |
| 技术方案与约束 | 技术栈、架构模式、模块边界、第三方依赖 | Gradle、源码结构、SDK 引入 |
| 可复现实现建议 | 哪些逻辑可直接复现，哪些只能借鉴思路 | 关键代码路径、算法和业务规则 |

### Phase 4: 围绕开发落地做动态分析

```bash
# 1. 启动 App
adb -s 42170DLJH001W3 shell monkey -p <包名> -c android.intent.category.LAUNCHER 1

# 2. 网络抓包（观察 API 调用）
# 使用 mitmproxy 或 Charles 代理

# 3. 日志抓取
adb -s 42170DLJH001W3 logcat -v time | grep <包名>

# 4. 关键路径验证
# - 首页进入链路
# - 核心功能成功/失败路径
# - 广告触发时机
# - 权限申请与拒绝后的降级
```

**动态分析重点不是“体验一下”，而是验证开发关键事实**：
- 哪些页面和状态是真正存在的
- 哪些 API 是真实调用的
- 广告和推送在什么时机触发
- 权限被拒绝时是否有 fallback
- 页面和代码推测是否一致

### Phase 5: 逆向结果按 PRD 输入文件输出

先创建目录骨架，避免实际执行时靠手工补目录：

```bash
scripts/play-to-prd.sh ensure-reverse-dirs <包名>
```

将逆向结果写成 **PRD 可直接消费** 的结构，而不是只有一份大而全报告：

```text
artifacts/<包名>/
├── reverse-for-prd/
│   ├── product-positioning.md         # Play 页面 + 市场定位输入
│   ├── feature-spec-input.md          # 功能规格输入
│   ├── page-spec-input.md             # 页面级规格输入
│   ├── api-contracts.md               # API / 数据契约
│   ├── monetization-impl.md           # 广告与变现实现
│   ├── permissions-compliance.md      # 权限与合规
│   ├── technical-architecture.md      # 技术架构与约束
│   ├── code-reuse-notes.md            # 可复现实现建议
│   └── reverse-evidence-index.md      # 证据索引（类名/路径/截图/抓包）
├── REVERSE_ANALYSIS.md                # 完整逆向报告（研究版）
├── sdk-list.md
├── api-endpoints.md
└── permissions-audit.md
```

#### 各文件职责

**feature-spec-input.md**
- 功能目标
- 页面/流程入口
- 主流程与异常流程
- 关键业务规则
- 状态切换
- 可直接写入 PRD 的功能规格段落

**api-contracts.md**
- 接口名称/路径
- 请求参数
- 返回结构
- 鉴权与错误码
- 重试/降级逻辑
- 对应页面/功能模块

**monetization-impl.md**
- 广告 SDK 栈
- 点位布局
- 展示触发规则
- 频控规则
- 预加载规则
- 审核/买量模式差异

**code-reuse-notes.md**
- 可复现的产品逻辑
- 不建议直接照搬的实现
- 需要重新设计的技术方案
- 对开发的具体建议

### Phase 6: 生成开发导向 PRD

基于逆向输入 + 大厂 PRD 模板生成文档：

```bash
# 使用高级模板初始化 PRD
scripts/play-to-prd.sh init-prd <项目名>
# → plans/prd/<项目名>.md
```

#### PRD 章节与逆向输入映射

| PRD 章节 | 主要输入 |
|---|---|
| One Page Summary | product-positioning.md + reverse 结论摘要 |
| 背景 / 对标矩阵 | Play 页面信息 + reverse-evidence-index.md |
| 核心功能规格 | feature-spec-input.md |
| 页面级规格 | page-spec-input.md |
| 技术方案与约束 | technical-architecture.md |
| API / 数据契约 | api-contracts.md |
| 商业化策略 | monetization-impl.md |
| 权限 / 合规 | permissions-compliance.md |
| 开发复现建议 | code-reuse-notes.md |

### Phase 7: 逆向证据融合进 PRD 正文

PRD 里不能只说“根据逆向分析”，而要显式引用证据：

```markdown
## 核心功能规格 - 首页扫描
- 竞品实现参考：`HomeScanFragment.kt` + `ScanViewModel.kt`
- 动态验证：首次进入首页时会先触发权限检查，再进入扫描准备态
- 开发建议：我方可保留两段式扫描引导，但弱化首次弹窗打扰
```

要求：
- 区分“事实”“推断”“建议”
- 每条关键开发建议尽量能回溯到逆向证据
- 不确定项要标注“待动态验证”

### Phase 8: 飞书云文档同步

```bash
# 使用 feishu_doc 工具创建文档
feishu_doc action=create title="[App名称] PRD" folder_token=<目标文件夹>

# 写入 PRD 内容
feishu_doc action=write doc_token=<新文档token> content=<PRD内容>

# 可选：单独输出研究版逆向报告
feishu_doc action=create title="[App名称] 逆向分析报告"
feishu_doc action=write doc_token=<token> content=<逆向报告内容>
```

推荐：
- **PRD 是主文档**，给产品/研发/设计评审
- **逆向报告是辅文档**，给技术/研究补证据

---

## 输出原则

- 不要停在下载 APK，必须形成开发可消费输入
- 不要只给逆向研究结论，必须映射到 PRD 章节
- 不要只说“竞品这样做”，要说“我方如何落地 / 不该如何落地”
- 不要把完整逆向报告直接塞进 PRD，PRD 要写结论和规则，证据单独引用
- 必须区分：**事实 / 推断 / 建议**

---

## 快速命令参考

```bash
# 端到端 smoke test（检查工具链就绪状态）
scripts/play-to-prd.sh smoke <包名> <包名>

# 检查逆向产物是否已存在
scripts/play-to-prd.sh reverse-status <包名>

# 初始化 reverse-for-prd 输入目录
scripts/play-to-prd.sh ensure-reverse-dirs <包名>

# 检查所需 skills 是否就绪
scripts/play-to-prd.sh prd-skills
```

---

## 异常处理

| 异常 | 处理 |
|------|------|
| 设备未连接 | `adb devices` 检查，提示用户重连 |
| 安装失败 | 重试一次；仍失败则提示手动安装后继续 |
| APK 加固/混淆 | 标注混淆程度，优先产出页面/权限/API/SDK 级结论 |
| JADX 失败 | 改用 Apktool smali 级分析 |
| 动态分析不完整 | 标记“待动态验证”，不要伪造结论 |
| 飞书文档创建失败 | 检查权限，降级为本地 Markdown 输出 |

---

## 输出清单

每次执行完成后，用户应收到：
1. ✅ 飞书云文档：PRD（正文已融合逆向结论）
2. ✅ 飞书云文档（可选）：逆向分析报告（独立研究版）
3. ✅ 本地 artifacts：APK + 反编译源码 + PRD 输入化逆向产物

---

## 联动 Skills

- `apk-reverse-analysis` — 深度静态分析细节
- `adb-automation` — 设备操作细节
- `prd-generator` — PRD 模板和生成规则
- `monetization-workflow` — 广告变现深度分析
- `competitive-analysis` — 多竞品对比时使用

---

_更新时间：2026-04-21 15:55 Asia/Shanghai_
