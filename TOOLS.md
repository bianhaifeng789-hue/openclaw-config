# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## 逆向工程工具

### Java JDK
- **路径**: `~/Tools/zulu17.54.21-ca-jdk17.0.13-macosx_aarch64/zulu-17.jdk/Contents/Home`
- **版本**: OpenJDK 17.0.13 LTS
- **环境变量**: `JAVA_HOME=~/Tools/zulu17.54.21-ca-jdk17.0.13-macosx_aarch64/zulu-17.jdk/Contents/Home`

### ADB (Android Debug Bridge)
- **路径**: `~/android-sdk/platform-tools/adb`
- **版本**: v1.0.41
- **设备**: Pixel 42170DLJH001W3

### Jadx (APK反编译)
- **路径**: `~/Tools/jadx/bin/jadx`
- **用途**: 反编译APK为Java源码
- **GUI**: `~/Tools/jadx/bin/jadx-gui`
- **工作区 shim**: `scripts/jadx` / `scripts/jadx-gui`（自动补 `JAVA_HOME`，便于脚本和工作流稳定调用）

### Apktool (APK解包)
- **路径**: `~/Tools/apktool.jar`
- **用途**: 解包APK资源、smali代码
- **命令**: `java -jar ~/Tools/apktool.jar d <apk> -o <output>`

### Frida (动态分析)
- **路径**: `~/Downloads/frida-server.xz`（待解压安装）
- **用途**: 动态Hook、运行时分析

## 使用示例

### 反编译APK
```bash
# 设置Java环境
export JAVA_HOME=~/Tools/zulu17.54.21-ca-jdk17.0.13-macosx_aarch64/zulu-17.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:~/Tools/jadx/bin:~/android-sdk/platform-tools:$PATH

# 或优先使用工作区 shim（自动补 JAVA_HOME）
export PATH=/Users/mac/.openclaw/workspace/scripts:$PATH

# 使用Jadx反编译
jadx -d ~/Desktop/app_source/ ~/Desktop/app.apk

# 使用Apktool解包
java -jar ~/Tools/apktool.jar d ~/Desktop/app.apk -o ~/Desktop/app_decoded/
```

### ADB操作
```bash
# 连接设备
~/android-sdk/platform-tools/adb devices

# 拉取APK
~/android-sdk/platform-tools/adb pull <apk_path> ~/Desktop/
```

---

## 为什么分开配置

Skills是共享的，你的工具路径是你的。这样配置后，Skills可以引用这些路径，而你不需要修改Skills本身。

更新时间: 2026-04-17 22:22 Asia/Shanghai
