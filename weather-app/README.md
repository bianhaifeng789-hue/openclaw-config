# 天气预报网站

一个简洁美观的天气预报网站，支持实时天气查询和未来3天预报。

## 功能特性

- ✅ 实时天气查询
- ✅ 未来3天预报
- ✅ 响应式设计
- ✅ 美观的UI界面
- ✅ 支持中文城市搜索

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript
- **天气API**: wttr.in (免费，无需API Key)

## 使用方法

1. 打开 `index.html`
2. 输入城市名称（如：北京、上海、广州）
3. 点击"查询"按钮

## 示例

- 北京天气查询
- 上海天气查询
- 国际城市：Tokyo, New York, London

## API说明

使用 wttr.in 免费 API：
- 网址: https://wttr.in
- 格式: JSON
- 无需API Key
- 支持全球城市

## 本地运行

直接打开 `index.html` 即可使用，无需服务器。

或者使用本地服务器：
```bash
cd weather-app
python -m http.server 8000
# 或
npx serve
```

访问: http://localhost:8000

---

_开发时间: 2026-04-15_