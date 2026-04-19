# SESSION-PRESSURE.md

轻量只读 session 压力检查入口。

## 用途

用于快速查看主 agent session store 里各 session 的上下文占用比例，识别：
- 接近告警阈值的 session
- 可能需要后续人工 compact / closeout 的 session
- compaction 次数偏多的 session

## 命令

```bash
node /Users/mac/.openclaw/workspace/impl/bin/session-pressure.js
```

## 设计边界

- 只读
- 不自动 compact
- 不自动修改 session
- 不接入 heartbeat
- 不做自动修复

## 输出

输出 JSON：
- `thresholds`
- `sessions`
- `hot`

其中 `hot` 表示达到 warn/alert/critical 的 session。
