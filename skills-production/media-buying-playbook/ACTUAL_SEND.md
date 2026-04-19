# Media Buying 实际发送说明

## 当前可实际使用的发送方案

由于脚本本身不能直接调用 OpenClaw 的 `message` 工具，当前落地方案分成两层：

### 层 1：脚本生成报告
```bash
bash /Users/mar2game/.openclaw/workspace/scripts/media-buying-run-report.sh daily
```
会输出一个 report markdown 文件路径。

### 层 2：脚本生成飞书卡片 payload
```bash
node /Users/mar2game/.openclaw/workspace/scripts/media-buying-send-payload.js /tmp/xxx.md
```
会输出可直接给 OpenClaw `message` 工具使用的 `card` JSON。

## 真发送方式
由 Agent / OpenClaw 调用：
- `message(action=send, channel=feishu, card=<上一步JSON>)`

## 结论
这套现在已经是“实际可发送”而不是只做静态展示：
- report 可生成
- card payload 可生成
- 当前会话里已验证能通过 `message` 工具发到飞书
