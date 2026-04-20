# Mnemon + Karpathy Quick Index

_Last updated: 2026-04-20_

## What this is

这组文档和脚本主要解决三件事：

1. 把 Mnemon 以**保守配置**接入 OpenClaw 主环境
2. 给另一台 Mac 提供可复现的安装方式
3. 把 `karpathy-coding-guidelines` 做成本地工程化适配

## Current Mnemon config

当前推荐配置：

```json
{
  "remind": true,
  "nudge": false,
  "compact": false
}
```

含义：
- 保留 recall / remember 轻提醒
- 关闭额外 nudge，降低 prompt 噪音
- 不启用 compact 行为

## Start here

优先看这几个：

- `docs/mnemon-openclaw-config.md`
- `docs/mnemon-trial-result.md`
- `docs/mnemon-validation-notes.md`
- `docs/install-mnemon-on-another-mac.md`
- `docs/karpathy-coding-guidelines-local-adaptation.md`

## Install on another Mac

直接运行：

```bash
bash scripts/install-mnemon-openclaw.sh
```

前提：
- 已安装 Homebrew
- 已安装 OpenClaw
- 当前用户可写 `~/.openclaw/`

## Full whitelist

如果要看这轮所有相关文件清单：

- `docs/mnemon-karpathy-memory-file-whitelist.md`
