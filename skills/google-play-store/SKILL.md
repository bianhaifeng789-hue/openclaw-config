---
name: google-play-store-skill
description: |
  Google Play商店上架技能
  
  功能：
  - APP上架流程
  - 审核要求
  - Store页面优化
  - 常见拒绝原因
  
  Use when:
  - 上架APP到Google Play
  - 查看审核要求
  - 优化Store页面
  
  Keywords:
  - Google Play, 上架, 审核
  - Store listing, ASO

metadata:
  openclaw:
    emoji: "📱"
    source: custom
    triggers: [google-play-store, app-upload]
    priority: P1
---

# Google Play商店上架指南

APP上架Google Play Store完整流程。

## 上架流程

### 1. 创建开发者账户

```
步骤：
1. 访问 https://play.google.com/console
2. 使用Google账户登录
3. 支付注册费：$25（一次性）
4. 填写开发者信息：
   - 开发者名称
   - 联系邮箱
   - 网站（可选）
   - 地址
5. 验证邮箱
6. 等待审核（1-2天）
```

### 2. 创建应用

```
步骤：
1. Console → "Create app"
2. 填写基本信息：
   - App name（30字符内）
   - Default language
   - App category
   - 是否免费/付费
3. 声明内容分级
4. 确认开发者信息
```

### 3. 配置Store页面

```
必填项：
□ App name
□ Short description（80字符）
□ Full description（4000字符）
□ App icon（512x512 PNG）
□ Screenshots（2-8张）
□ Feature graphic（1024x500）

选填项：
□ Video
□ Phone screenshots
□ Tablet screenshots
□ Promotional images
```

### 4. 上传APK/AAB

```
步骤：
1. Build → Generate Signed Bundle/APK
2. 选择Android App Bundle（推荐）
3. 配置签名密钥
4. 上传到Console
5. 选择发布轨道：
   - Internal testing（内测）
   - Closed testing（封测）
   - Open testing（公测）
   - Production（正式发布）
```

### 5. 内容分级

```
问卷内容：
- 暴力程度
- 性内容
- 药物使用
- 语言内容
- 用户交互
- 位置共享
- 个人信息收集

分级结果：
- IARC分级（国际）
- PEGI（欧洲）
- ESRB（美国）
```

### 6. 提交审核

```
审核时间：
- 新应用：1-3天
- 更新：1-2天
- 紧急更新：几小时

审核状态：
⏳ Pending review
✅ Approved
❌ Rejected
⚠️ Needs attention
```

---

## Store页面优化

### 图标设计

```
要求：
- 尺寸：512x512 PNG
- 无透明背景
- 无文字过多
- 简洁识别度高

建议：
✅ 简洁图形
✅ 统一风格
✅ 无复杂细节
❌ 避免照片
❌ 避免文字堆砌
```

### 截图设计

```
要求：
- 至少2张
- JPEG或PNG
- 每张16MB以内

建议：
✅ 展示核心功能
✅ 包含界面UI
✅ 高清真实截图
❌ 避免虚假内容
```

### 描述优化

```
短描述（80字符）：
- 核心卖点
- 一句话概括

长描述（4000字符）：
- 功能介绍
- 特色亮点
- 用户评价
- 更新日志

关键词建议：
{核心功能} {目标用户} {场景}
示例：
"The ultimate ad analytics tool for US marketers. Track ROI in real-time."
```

---

## 常见拒绝原因

| 原因 | 说明 | 解决方案 |
|------|------|----------|
| **政策违规** | 内容不符合政策 | 修改内容重新提交 |
| **元数据问题** | 描述/截图不准确 | 更正信息 |
| **功能问题** | APP无法正常使用 | 修复Bug |
| **权限问题** | 权限使用不当 | 说明权限用途 |
| **侵权** | 使用他人内容 | 替换内容 |

### 政策违规类型

```
❌ 禁止内容：
- 仇恨言论
- 暴力内容
- 成人内容
- 非法活动
- 侵权内容
- 欺诈行为

❌ 技术问题：
- 崩溃闪退
- 无法登录
- 功能失效
- 恶意代码
```

---

## 发布轨道

| 轨道 | 用途 | 用户数 |
|------|------|--------|
| **Internal** | 内部测试 | <100 |
| **Closed** | 封测（Beta） | 需邀请 |
| **Open** | 公测（Beta） | 任何人可加入 |
| **Production** | 正式发布 | 所有用户 |

---

## 快速上架清单

```
□ 开发者账户已创建
□ 应用已创建
□ Store页面已配置
□ APK/AAB已上传
□ 内容分级已完成
□ 签名密钥已配置
□ Privacy Policy已添加
□ 所有必填项已完成
□ 提交审核
```

---

快速帮你完成Google Play上架，提供审核要求和优化建议。