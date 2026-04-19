---
name: harness-browser-test
description: Browser Test - Playwright 自动化测试，启动 dev server + headless Chromium，执行操作（click/fill/wait/evaluate），截图保存。适用 Web 应用测试场景。
---

# Harness Browser Test

## 概述

Playwright 自动化浏览器测试，验证 Web 应用功能。

来源：Harness Engineering - tools.py browser_test()

## 核心功能

- **Dev Server 启动**：启动 npm run dev 等命令
- **Headless Chromium**：无界面浏览器测试
- **操作执行**：click/fill/wait/evaluate/scroll
- **截图保存**：保存 _screenshot.png
- **Console 错误检测**：捕获浏览器错误

## 操作类型

### click
```json
{ "type": "click", "selector": "#start-btn" }
```

### fill
```json
{ "type": "fill", "selector": "#search", "value": "test" }
```

### wait
```json
{ "type": "wait", "delay": 1000 }
```

### evaluate
```json
{ "type": "evaluate", "value": "document.querySelectorAll('.item').length" }
```

### scroll
```json
{ "type": "scroll", "value": 500 }
```

## 用法

### 基本测试
```bash
node ~/.openclaw/workspace/impl/bin/browser-test.js --url http://localhost:5173
```

### 启动 dev server
```bash
node browser-test.js --url http://localhost:5173 --start "npm run dev" --port 5173
```

### 执行操作
```bash
# 创建 actions.json
echo '[{"type":"click","selector":"#btn"}]' > actions.json

node browser-test.js --url http://localhost:5173 --actions actions.json
```

## 完整参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| --url | 测试 URL | 必需 |
| --start | 启动命令 | null |
| --port | 端口 | 5173 |
| --wait | 启动等待时间 | 8s |
| --actions | 操作 JSON | [] |
| --no-screenshot | 不截图 | false |

## 安装

```bash
npm install playwright
npx playwright install chromium
```

## 输出

- 截图：`_screenshot.png`
- Console 错误：报告
- 测试结果：成功/失败

## 返回值

```json
{
  "report": "测试报告文本",
  "success": true,
  "consoleErrors": ["错误列表"],
  "screenshotPath": "_screenshot.png"
}
```

---

创建时间：2026-04-17
来源：Harness Engineering
状态：已实现