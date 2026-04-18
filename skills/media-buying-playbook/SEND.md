# Media Buying 飞书发送说明

## 新增脚本
- `scripts/media-buying-feishu-send.js`
  - 把 markdown 报告转成可发送的飞书卡片结构

- `scripts/media-buying-report-and-card.sh`
  - 一步生成报告并产出飞书卡片 JSON

## 使用方式

### 一步生成日报卡片
```bash
bash /Users/mar2game/.openclaw/workspace/scripts/media-buying-report-and-card.sh daily
```

### 一步生成周报卡片
```bash
bash /Users/mar2game/.openclaw/workspace/scripts/media-buying-report-and-card.sh weekly
```

### 指定数据文件
```bash
bash /Users/mar2game/.openclaw/workspace/scripts/media-buying-report-and-card.sh daily /path/to/data.json
```

## 当前状态
当前脚本已完成：
- 报告生成
- 卡片结构生成
- 一步串联

后续如果接 OpenClaw message 工具，可直接把 card JSON 发往飞书。
