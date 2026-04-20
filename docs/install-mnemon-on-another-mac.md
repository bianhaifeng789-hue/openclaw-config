# Install Mnemon on Another Mac (OpenClaw)

_Last updated: 2026-04-20_

目标：在另一台 Mac 上，以和当前机器一致的**保守观察态**接入 Mnemon 到 OpenClaw。

## Target state

安装完成后，另一台 Mac 应达到：
- `mnemon` binary 已安装
- `mnemon setup --target openclaw --global --yes` 已执行
- OpenClaw 主配置已启用 Mnemon
- Mnemon 配置为：
  - `remind=true`
  - `nudge=false`
  - `compact=false`

## Recommended approach

不要直接复制整套 `~/.openclaw/` 或 `~/.mnemon/`。
建议在目标机器上**重新安装并重新 setup**，这样路径、hook、extension 和本机环境保持一致。

## Steps

### 1. Clone repository

```bash
git clone git@github.com:bianhaifeng789-hue/openclaw-config.git
cd openclaw-config
```

如果你想拿到本次 Mnemon 文档分支：

```bash
git fetch origin mnemon-config-note
git checkout mnemon-config-note
```

### 2. Install mnemon

优先使用 Homebrew：

```bash
brew install mnemon-dev/tap/mnemon
```

验证：

```bash
mnemon --version
```

### 3. Set up OpenClaw global integration

```bash
mnemon setup --target openclaw --global --yes
```

注意：
- 必须带 `--global`
- 否则 Mnemon 可能会装到 repo 本地 `.openclaw/`，而不是正在运行的 `~/.openclaw/`

### 4. Adjust to conservative config

将 `~/.openclaw/openclaw.json` 中的 Mnemon 配置调整为：

```json
{
  "plugins": {
    "entries": {
      "mnemon": {
        "enabled": true,
        "config": {
          "remind": true,
          "nudge": false,
          "compact": false
        }
      }
    }
  }
}
```

### 5. Restart gateway

```bash
openclaw gateway restart
```

### 6. Verify

```bash
mnemon status
openclaw status
```

若对话中出现：
- `[mnemon] load mnemon skill`
- `[mnemon] Evaluate: recall needed? After responding, evaluate: remember needed?`

则说明接入已生效。

## Notes

### About memory sharing
当前建议两台机器各自维护自己的 Mnemon 本地数据目录：
- `~/.mnemon/data/default/mnemon.db`

不建议两台机器直接共享同一个 SQLite 数据库，因为当前环境下已经观察到轻微锁毛刺。

### Current caveat
当前 Mnemon 已验证可用，但存在偶发 SQLite `database is locked` / `SQLITE_BUSY` 告警。
所以另一台机器也建议先用保守配置观察，不要急于开启 `nudge` 或 `compact`。

## Related docs

- `docs/mnemon-openclaw-config.md`
- `docs/mnemon-trial-result.md`
- `docs/mnemon-validation-notes.md`
