# Google Play自动安装器

自动从Google Play商店下载并安装应用到Android手机。

---

## 功能

1. 通过ADB打开Google Play应用详情页面
2. 自动定位安装按钮
3. 模拟点击安装
4. 等待安装完成
5. 验证安装成功

---

## 使用方法

### CLI方式
```bash
node ~/.openclaw/workspace-dispatcher/impl/bin/google-play-installer.js install <package_id> [device_id]
```

### Skill方式
```
用户请求: "帮我安装 https://play.google.com/store/apps/details?id=com.wordconnect.cash.game"
Agent: 调用 google-play-installer skill
```

---

## 技术细节

### 1. 打开应用详情页面
```bash
adb shell am start -a android.intent.action.VIEW -d 'market://details?id=<package_id>'
```

### 2. 定位安装按钮
由于Google Play使用自定义渲染，UI Automator无法获取文本，采用多位置尝试策略：

| 分辨率 | 安装按钮位置（约） |
|--------|------------------|
| 1080x2424 | (540, 1800-2400区域) |
| 其他 | 根据比例调整 |

### 3. 点击策略
- 尝试3-5个可能位置
- 每次点击后等待5秒
- 检查是否触发安装对话框

### 4. 验证安装
```bash
adb shell dumpsys package <package_id>
adb shell pm list packages | grep <package_id>
```

---

## 限制

- 需要手机已登录Google账户
- 需要USB调试已启用
- 需要ADB已安装
- 需要手机连接到Mac

---

## 错误处理

| 错误 | 处理 |
|------|------|
| 设备未连接 | 提示用户连接手机 |
| ADB未安装 | 自动安装ADB到~/.local/bin |
| 应用已安装 | 提示用户并提供打开选项 |
| 安装失败 | 尝试其他位置或提示用户手动安装 |