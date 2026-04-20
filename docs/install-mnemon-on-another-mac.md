# Install Mnemon on Another Mac (OpenClaw)

_Last updated: 2026-04-21_

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

如果你已经在这个仓库分支上，优先直接使用：

```bash
bash scripts/install-mnemon-openclaw.sh
```

这个脚本现在支持两条安装路径：
- **有 Homebrew**: 走 `brew install mnemon-dev/tap/mnemon`
- **没有 Homebrew**: 自动回退到 GitHub release 安装，并放到 `~/.local/bin/mnemon`

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

### 2. One-command install

```bash
bash scripts/install-mnemon-openclaw.sh
```

### 3. What the script does

脚本会：
1. 检查 `mnemon` 是否已安装
2. 若未安装：
   - 优先用 Homebrew
   - 若无 Homebrew，则从 GitHub release 下载对应 macOS 二进制
3. 执行：
   ```bash
   mnemon setup --target openclaw --global --yes
   ```
4. 把 OpenClaw Mnemon 配置设置为保守模式：
   - `remind=true`
   - `nudge=false`
   - `compact=false`
5. 重启 gateway
6. 执行基本验证：
   - `mnemon status`
   - `openclaw status`

### 4. PATH note for fallback install

如果走的是 GitHub release fallback 路径，脚本会把 `mnemon` 安装到：

```bash
~/.local/bin/mnemon
```

并自动尝试把下面这一行写入 shell 配置：

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### 5. Verify

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
