---
name: iaa-feishu-reporting
description: |
  IAA日报中文结论与飞书卡片生成

  功能：
  - 把分析结果转成中文运营结论
  - 生成飞书日报卡片 JSON
  - 适合每日直接发给运营团队

  Use when:
  - 需要日报文字结论
  - 需要飞书卡片
  - 需要把分析结果直接发出去

  Keywords:
  - 飞书日报, 中文结论, 卡片生成, 运营结论
---

# IAA 飞书日报输出

## 脚本

- `impl/bin/iaa-daily-report-to-text.js`
- `impl/bin/iaa-daily-report-feishu-card.js`

## 作用

### 文字版
直接输出适合运营看的中文结论。

### 卡片版
直接生成飞书卡片 JSON，可通过 `message` / 飞书卡片工具发送。
