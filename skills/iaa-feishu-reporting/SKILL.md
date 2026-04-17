---
name: iaa-feishu-reporting
description: |
  IAA 日报飞书输出能力。
  支持把固定 CSV 模板一键转换成：
  - 中文运营结论
  - 飞书卡片 JSON
  - 飞书发送载荷

  Use when:
  - 需要把 IAA 日报直接发到飞书
  - 需要从 CSV 一键生成运营日报
---

# IAA 飞书日报输出

## 可用脚本

### 1. CSV → 中文日报
```bash
node impl/bin/iaa-csv-to-text-report.js templates/iaa-daily-report-template.csv
```

### 2. CSV → 飞书卡片 JSON
```bash
node impl/bin/iaa-csv-to-feishu-card.js templates/iaa-daily-report-template.csv
```

### 3. CSV → 统一机器人入口
```bash
node impl/bin/iaa-report-robot.js --mode=both --file=templates/iaa-daily-report-template.csv
```

### 4. CSV → 飞书发送载荷
```bash
node impl/bin/iaa-report-to-feishu-payload.js --file=templates/iaa-daily-report-template.csv --format=card
```

## 推荐流程

1. 运营填好 CSV
2. 运行机器人入口或飞书载荷脚本
3. 直接发送到飞书会话
