# Mnemon Trial Result

_Last updated: 2026-04-20_

## Outcome

Mnemon 已在主 OpenClaw 环境完成首次试装，并成功进入低噪音观察态。

## What was done

- 通过 GitHub release 下载 arm64 版本二进制，安装到 `~/.local/bin/mnemon`
- 初始化 `~/.mnemon/` 数据目录
- 首次误装到 workspace 本地 `.openclaw/`，随后已 eject 回收
- 再次以 `--global` 正确接入 `~/.openclaw/`
- 重启 gateway，确认 prompt 注入生效
- 将配置从默认的 `remind=true, nudge=true, compact=false` 调整为：
  - `remind=true`
  - `nudge=false`
  - `compact=false`

## Current behavior

当前表现：
- 会注入 mnemon skill 加载提示
- 会保留 recall / remember 的轻提示
- 不再额外注入 remember sub-agent nudge

这符合首轮试验目标：
- 尽量低噪音
- 先观察 recall / remember 的真实收益
- 暂不引入 compact 行为

## Notes

### Why local install happened first
`mnemon setup --target openclaw --yes` 默认优先落到 project-local `.openclaw/`。
因此第一次接入并未进入真正运行的主 gateway 配置。

### Correct global install
真正生效的是：

```bash
mnemon setup --target openclaw --global --yes
```

### Rollback
如需回滚：

```bash
mnemon setup --eject --target openclaw --global --yes
openclaw gateway restart
```

## Recommendation

先观察 1-2 天：
- 是否明显帮助跨会话记忆
- 提示是否仍嫌吵
- 是否有必要后续调 guide 或重新考虑 nudge / compact
