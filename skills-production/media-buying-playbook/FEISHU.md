# Media Buying Feishu 输出说明

## 新增脚本
- `scripts/media-buying-feishu-card.js`
  - 将 markdown 报告转换为飞书卡片 JSON

- `scripts/test-media-buying-feishu-card.sh`
  - 先生成日报，再转换为飞书卡片 JSON

## 使用方式

### 1. 先生成报告文件
```bash
node /Users/mar2game/.openclaw/workspace/scripts/ads-report-cli.js /Users/mar2game/.openclaw/workspace/examples/media-buying/report-data.json daily > report.md
```

### 2. 转成飞书卡片 JSON
```bash
node /Users/mar2game/.openclaw/workspace/scripts/media-buying-feishu-card.js report.md
```

### 3. 一步测试
```bash
bash /Users/mar2game/.openclaw/workspace/scripts/test-media-buying-feishu-card.sh
```

## 适用场景
- 广告日报卡片
- 广告周报卡片
- 给运营团队发送结构化汇报
