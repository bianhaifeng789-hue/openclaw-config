---
name: Mnemon OpenClaw 试装结果
type: project
created: 2026-04-20
updated: 2026-04-20
---

2026-04-20 已完成 Mnemon 在主 OpenClaw 环境的首次低风险试装，并切换到保守配置运行。

Result:
- `mnemon` binary 已安装到 `~/.local/bin/mnemon`
- 主配置接入位置为 `~/.openclaw/`
- `~/.mnemon/` 已初始化默认 store
- gateway 重启后，prompt 注入生效
- 当前保守配置：`remind=true`、`nudge=false`、`compact=false`

Observed behavior:
- 每轮会出现 recall / remember 轻提示
- 额外的 remember sub-agent 催促已关闭
- 当前更适合作为低噪音观察态，而非强干预态

How to apply:
- 后续先观察 1-2 天真实收益，再决定是否调整 guide / nudge / compact
- 如需回滚，可使用 `mnemon setup --eject --target openclaw --global --yes`
