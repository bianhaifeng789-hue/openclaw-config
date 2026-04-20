# OpenClaw Self-Heal Setup

目标：当你人不在部署 OpenClaw 的 Mac 旁边时，机器仍能定时做一次保守自愈，减少“卡死后无人能出手”的风险。

## 组成

- `scripts/openclaw-self-heal.sh`
  - 保守守护入口
  - 调用 `scripts/openclaw-auto-recover.sh --restart-if-down --fix-stale-lock --notify --feishu-summary`
  - 会把输出落到 `state/guard/`

- `config/ai.openclaw.self-heal.plist`
  - macOS launchd 示例
  - 当前默认每 900 秒（15 分钟）执行一次
  - 加载时立即执行一次

## 保守原则

这个 self-heal 只做两类低风险动作：
- 真正判定 Gateway down 时，尝试一次 restart
- 真正判定 stale lock 时，尝试一次 `openclaw doctor --fix`

不会做：
- 多轮 restart
- 连续 config patch
- 长日志深挖
- heartbeat 风格的长排障

## 手动运行

```bash
/Users/mac/.openclaw/workspace/scripts/openclaw-self-heal.sh
```

## 安装到 launchd

先确保日志目录存在：

```bash
mkdir -p /Users/mac/.openclaw/workspace/state/guard
```

复制 plist：

```bash
cp /Users/mac/.openclaw/workspace/config/ai.openclaw.self-heal.plist ~/Library/LaunchAgents/
```

加载并立即启动：

```bash
launchctl unload ~/Library/LaunchAgents/ai.openclaw.self-heal.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/ai.openclaw.self-heal.plist
launchctl start ai.openclaw.self-heal
```

查看状态：

```bash
launchctl list | grep ai.openclaw.self-heal
```

查看日志：

```bash
tail -n 80 /Users/mac/.openclaw/workspace/state/guard/launchd-self-heal.out.log
tail -n 80 /Users/mac/.openclaw/workspace/state/guard/launchd-self-heal.err.log
```

## 卸载

```bash
launchctl unload ~/Library/LaunchAgents/ai.openclaw.self-heal.plist
rm -f ~/Library/LaunchAgents/ai.openclaw.self-heal.plist
```

## 推荐用法

- 让 `openclaw-stability-guard.sh` 继续给人/看板看短摘要
- 让 `openclaw-self-heal.sh` 在后台低频保守执行
- 二者分工：
  - stability guard: 看状态
  - self-heal: 尝试一次最低风险恢复
