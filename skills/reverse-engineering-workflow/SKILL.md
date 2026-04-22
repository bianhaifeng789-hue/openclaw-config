---
name: reverse-engineering-workflow
description: 逆向工程工作流总控技能。整合 APK 逆向、设备调试、密码破解、数据恢复、二进制分析、密码学分析的完整逆向链路。支持从竞品技术拆解到安全分析的全流程。适用于竞品技术栈研究、安全测试、数据取证、密码恢复场景。
---

# 逆向工程工作流 - 技术逆向全流程整合

## 触发场景
当用户提到以下关键词时，使用本技能：
- 逆向工程 / 逆向工作流
- APK 分析 / 反编译
- 竞品技术栈 / SDK 拆解
- 密码破解 / 数据恢复
- 安全分析 / 漏洞检测
- 磁盘取证 / 数据取证
- 密码学分析

---

## 工作流阶段

### Phase 1: APK 逆向分析（移动应用）
**目标**: 拆解 APK，识别技术栈、SDK、商业化方案

**输出文件**: 项目分析报告 + SDK 清单

**相关 skills**:
- `apk-reverse-analysis` - APK 反编译与分析
- `adb-automation` - ADB 设备调试与数据拉取

**操作流程**:
```bash
# 1. APK 反编译
# 使用 JADX / Apktool
jadx -d ~/Desktop/app_source ~/Desktop/app.apk
apktool d ~/Desktop/app.apk -o ~/Desktop/app_decoded/

# 2. 分析 Manifest
# - Activity/Service/Receiver/Provider
# - 权限声明
# - SDK 配置

# 3. SDK 检索
# - 广告 SDK: AdMob/Meta/Unity/AppLovin/IronSource
# - 支付 SDK: Google Play/IAP/Stripe
# - 埋点 SDK: Firebase/Analytics
# - 社交 SDK: Facebook/Google/微信

# 4. 设备调试（可选）
adb-automation → 拉取运行数据/截图/日志

# 5. 输出分析报告
# - 技术栈识别
# - SDK 清单
# - 商业化路径
# - 借鉴点
```

**分析维度**:
| 维度 | 输出 |
|------|------|
| 基础信息 | 包名/版本/签名 |
| 技术栈 | 原生/Flutter/RN/Unity/WebView |
| SDK 清单 | 广告/支付/埋点/社交 |
| 功能模块 | Activity/Service 结构 |
| 商业化 | 广告位/订阅/IAP |
| 增长线索 | 埋点/裂变/分享 |

---

### Phase 2: 设备调试与数据采集
**目标**: 从设备拉取运行数据、APK、日志

**相关 skills**:
- `adb-automation` - ADB 自动化

**操作流程**:
```bash
# 1. 设备连接
adb devices
adb tcpip 5555  # 无线连接

# 2. APK 拉取
adb shell pm path <包名>
adb pull <APK路径> ~/Desktop/

# 3. 截图录屏
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png ~/Desktop/

# 4. 日志抓取
adb logcat -v time | grep <包名> > app_log.txt

# 5. 性能监控
adb shell dumpsys meminfo <包名>
adb shell top -n 1 | grep <包名>

# 6. 自动化测试
adb shell monkey -p <包名> -v 1000
```

---

### Phase 3: 密码破解与加密分析
**目标**: 破解密码保护的文件/压缩包/数据库

**相关 skills**:
- `crack-7z-hash` - 7z 压缩包密码破解
- `password-recovery` - 密码恢复/磁盘取证
- `feal-linear-cryptanalysis` - FEAL 密码分析

**常见场景**:

#### 3.1 压缩包密码破解
```bash
# 7z 密码破解
crack-7z-hash →
1. 提取 hash: 7z2john.pl archive.7z > hash.txt
2. 破解: hashcat -m 11600 hash.txt wordlist.txt
3. 验证: 7z t -p"password" archive.7z
```

#### 3.2 磁盘/镜像密码恢复
```bash
# 磁盘镜像取证
password-recovery →
1. 识别镜像类型: file image.img
2. 使用取证工具: extundelete --list image.img
3. 搜索密码片段: strings -n 8 image.img | grep -i "password"
4. 验证恢复的密码
```

#### 3.3 密码学分析
```bash
# FEAL 密码分析（CTF/学术场景）
feal-linear-cryptanalysis →
1. 分析 cipher 结构
2. 找线性近似
3. 收集统计数据
4. 恢复密钥
```

---

### Phase 4: 数据恢复与取证
**目标**: 从损坏/加密的数据库/文件中恢复数据

**相关 skills**:
- `db-wal-recovery` - SQLite WAL 文件恢复
- `password-recovery` - 磁盘取证

**操作流程**:

#### 4.1 SQLite WAL 恢复
```bash
# WAL 文件恢复
db-wal-recovery →
1. 检查 WAL 文件头: xxd wal_file | head -50
2. 搜索加密密钥: 检查环境变量/相邻文件
3. 尝试解密: SQLCipher/XOR/AES
4. 恢复数据: sqlite3 .recover
5. 验证数据完整性
```

#### 4.2 磁盘取证
```bash
# 磁盘镜像分析
password-recovery →
1. 识别镜像格式
2. 使用取证工具: debugfs/ntfsundelete/testdisk
3. 提取字符串: strings image.img
4. 组合片段
5. 验证恢复结果
```

---

### Phase 5: 二进制分析与漏洞检测
**目标**: 分析可执行文件，提取隐藏信息，检测漏洞

**相关 skills**:
- `vulnerable-secret` - 二进制漏洞分析

**操作流程**:
```bash
# 二进制分析
vulnerable-secret →
1. 工具检查: which objdump readelf strings gdb
2. 文件识别: file <executable>
3. 字符串提取: strings <executable> | grep -iE "flag|secret|password"
4. 反汇编分析: objdump -d <executable>
5. 动态分析（如有 gdb）:
   - 设置断点
   - 检查内存
   - 提取运行时数据
6. 漏洞利用（如需）:
   - 识别漏洞类型
   - 构造输入
   - 测试验证
```

---

## 快速路径

### 路径 A: APK 竞品拆解（最常用）
```
apk-reverse-analysis → SDK 清单 + 技术栈 + 商业化路径
```
适用：竞品技术栈研究、商业化对标

### 路径 B: APK + 设备调试
```
adb-automation → APK 拉取 → apk-reverse-analysis → 运行数据
```
适用：需要运行时数据补充静态分析

### 路径 C: 密码破解流程
```
crack-7z-hash → hashcat/john → 验证密码
```
适用：密码保护的压缩包/文件

### 路径 D: 数据取证流程
```
password-recovery → db-wal-recovery → 数据恢复
```
适用：损坏/加密的数据库/磁盘镜像

### 路径 E: 二进制分析流程
```
vulnerable-secret → strings/objdump/gdb → 隐藏信息提取
```
适用：可执行文件分析、漏洞检测、CTF

### 路径 F: 全流程逆向（复杂场景）
```
Phase 1 APK → Phase 2 设备 → Phase 3 密码 → Phase 4 数据 → Phase 5 二进制
```
适用：复杂逆向任务，需要多种技术组合

---

## 工具矩阵

| 工具 | 用途 | 安装 |
|------|------|------|
| **JADX** | APK 反编译 | `~/Tools/jadx/bin/jadx` |
| **Apktool** | APK 解包 | `java -jar ~/Tools/apktool.jar` |
| **ADB** | 设备调试 | `~/android-sdk/platform-tools/adb` |
| **hashcat** | GPU 密码破解 | `brew install hashcat` |
| **john** | CPU 密码破解 | `brew install john` |
| **strings** | 字符串提取 | 内置 |
| **objdump** | 反汇编 | 内置 |
| **gdb** | 动态调试 | `brew install gdb` |
| **sqlite3** | 数据库分析 | 内置 |
| **extundelete** | 文件恢复 | `brew install extundelete` |

---

## 分析类型决策树

```
分析目标？
│
├─ APK/移动应用 → apk-reverse-analysis
│   ├─ 需要运行数据？ → adb-automation
│   └─ 商业化对标？ → monetization-workflow
│
├─ 压缩包/加密文件 → crack-7z-hash
│   ├─ 7z → hashcat/john
│   └─ ZIP → john/fcrackzip
│
├─ 数据库/磁盘镜像 → db-wal-recovery + password-recovery
│   ├─ SQLite WAL → db-wal-recovery
│   ├─ 磁盘镜像 → password-recovery
│   └─ 加密数据库 → 搜索密钥 + 解密
│
├─ 可执行文件 → vulnerable-secret
│   ├─ 静态分析 → strings/objdump
│   ├─ 动态分析 → gdb/ltrace
│   └─ 漏洞利用 → 构造输入
│
└─ 密码学挑战 → feal-linear-cryptanalysis
    └─ 线性密码分析
```

---

## 文件流转规则

| 输出内容 | 写入文件 | 说明 |
|----------|----------|------|
| APK 分析报告 | `项目/analysis-report.md` | SDK + 技术栈 |
| SDK 清单 | `项目/sdk-list.json` | SDK 分类清单 |
| 密码恢复结果 | `项目/recovered-passwords.txt` | 破解成功记录 |
| 数据恢复结果 | `项目/recovered-data/` | 恢复的数据文件 |
| 二进制分析报告 | `项目/binary-analysis.md` | 漏洞/隐藏信息 |

---

## 联动技能关系图

```
reverse-engineering-workflow (总控)
│
├─ Phase 1 APK层
│   ├─ apk-reverse-analysis (APK 反编译)
│   └─ adb-automation (设备调试)
│
├─ Phase 2 设备层
│   └─ adb-automation (数据采集)
│
├─ Phase 3 密码层
│   ├─ crack-7z-hash (压缩包破解)
│   ├─ password-recovery (磁盘取证)
│   └─ feal-linear-cryptanalysis (密码分析)
│
├─ Phase 4 数据层
│   ├─ db-wal-recovery (WAL 恢复)
│   └─ password-recovery (磁盘取证)
│
└─ Phase 5 二进制层
    └─ vulnerable-secret (漏洞分析)
```

---

## 与其他工作流联动

### 与 PM 工作流联动
```
apk-reverse-analysis → competitive-analysis → gap-analysis → prd-generator → PRD.md
```
APK 拆解的 SDK 清单 + 技术栈 + 商业化路径 → 竞品分析 → 差距分析 → PRD 生成

### 与变现工作流联动
```
apk-reverse-analysis → monetization-teardown → ad-mediation-teardown
```
APK 拆解的 SDK 清单 → 变现分析输入

### 完整端到端链路（Google Play → PRD）
```
google-play-to-prd:
  Step 1: Play 页面信息采集
  Step 2: APK 下载（adb / apkeep / 手动）
  Step 3: 反编译（jadx + apktool）
  Step 4: 结构化分析（apk-reverse-analysis）
  Step 5: 输出 prd-input.md
  Step 6: prd-generator 生成完整 PRD
```
这条链路可以一口气跑完，也可以在任何一步停下来让用户确认方向。

---

## 安全与合规警告

**⚠️ 重要提示**:

1. **仅用于授权场景**:
   - 自己产品的测试/分析
   - 已授权的竞品研究
   - CTF/学术挑战
   - 安全测试（有授权）

2. **禁止用于**:
   - 未授权的侵入
   - 盗取敏感数据
   - 破解他人账户
   - 违反法律的场景

3. **工具使用边界**:
   - ADB 仅用于自己设备或授权设备
   - 密码破解仅用于自己文件或授权测试
   - 二进制分析遵守软件许可条款

---

## 示例用法

```
用户: "帮我拆解竞品 XXX 的 APK"
Claw: apk-reverse-analysis → SDK 清单 + 技术栈 + 商业化路径

用户: "这个 7z 文件密码忘了，能破解吗？"
Claw: crack-7z-hash → hashcat 字典攻击 → 验证密码

用户: "SQLite WAL 文件损坏，能恢复数据吗？"
Claw: db-wal-recovery → 检查加密 → 尝试恢复 → 验证

用户: "这个二进制文件有隐藏信息吗？"
Claw: vulnerable-secret → strings/objdump → 提取隐藏信息

用户: "从设备拉取竞品 APK 和运行日志"
Claw: adb-automation → APK 拉取 + logcat → apk-reverse-analysis
```

---

## 记忆维护

每次逆向工作流完成后：
1. 更新 `TOOLS.md` - 新工具/新发现
2. 更新 `memory/YYYY-MM-DD.md` - 记录分析结果
3. 保存分析报告到项目目录

---

_整合人：Claw_
_整合时间：2026-04-21 02:42 Asia/Shanghai_