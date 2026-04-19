# HEALTH-MONITOR-LITE.md

轻量只读健康汇总入口。

## 命令

基础模式：
```bash
node /Users/mac/.openclaw/workspace/impl/bin/health-monitor-lite.js
```

带 doctor 汇总：
```bash
node /Users/mac/.openclaw/workspace/impl/bin/health-monitor-lite.js --doctor
```

## 汇总内容

- gateway status
- session pressure 摘要
- heartbeat state 摘要
- doctor 摘要（仅 `--doctor` 时）

## 设计边界

- 只读
- 不自动修复
- 不 restart gateway
- 不接管 heartbeat
- 不自动 compact session

## overall 含义

- `ok`: 当前未见明显异常
- `watch`: 有 session pressure 热点，值得关注
- `needs_attention`: gateway/rpc 明显异常
