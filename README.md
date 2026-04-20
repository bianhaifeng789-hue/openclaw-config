# OpenClaw Infra Baseline

这是一个**轻量 OpenClaw 基础设施基线仓库**，用于在新机器上快速复用稳定、可诊断、可收口的基础设施层。

## 快速入口（Mnemon + Karpathy branch）

如果你正在使用 `mnemon-config-note` 分支，并想在另一台 Mac 上快速接入 Mnemon：

```bash
git fetch origin mnemon-config-note
git checkout mnemon-config-note
bash scripts/install-mnemon-openclaw.sh
```

这个分支当前额外包含：
- `scripts/install-mnemon-openclaw.sh` - Mnemon 一键安装脚本
- `docs/install-mnemon-on-another-mac.md` - 另一台 Mac 安装说明
- `skills/karpathy-coding-guidelines/SKILL.md` - 轻量行为约束 skill

安装成功后，Mnemon 默认采用保守配置：
- `remind=true`
- `nudge=false`
- `compact=false`


## 这个仓库包含什么

- 轻量 heartbeat 基线
- runbook / baseline / capability / context 文档
- `session-pressure`（只读 session 压力检查）
- `health-monitor-lite`（只读健康汇总）
- health / heartbeat guardrail 脚本

## 这个仓库不包含什么

以下内容应保持本地私有，或按机器自行准备，不作为基础设施仓库的一部分：

- `skills/`
- `memory/*.md`
- `USER.md`
- `TOOLS.md`
- `IDENTITY.md`
- `_imports/`
- `artifacts/`
- `harness-projects/`
- 机器相关 secrets / provider keys / token / 本地状态

## 新机器建议阅读顺序

1. `OPENCLAW-BASELINE.md`
2. `CAPABILITIES-openclaw-main.md`
3. `INFRASTRUCTURE-INDEX.md`
4. `RUNBOOK-openclaw-health.md`
5. `RUNBOOK-session-context.md`
6. `HEARTBEAT.md`

## 最小接入步骤

1. clone 本仓库到你的 OpenClaw workspace
2. 按本机实际情况补齐本地私有文件与配置
3. 检查并确认 gateway / provider / channel 配置属于本机
4. 运行基础检查：
   - `openclaw status`
   - `openclaw doctor --non-interactive`
5. 按需使用：
   - `node impl/bin/session-pressure.js`
   - `node impl/bin/health-monitor-lite.js`

## 迁移原则

- 只复用**基础设施层**，不要把另一台机器的个人记忆、技能库、实验残留整体搬过来
- 优先复用：稳定性、可观测性、runbook、轻量 heartbeat
- 不要默认复用：自动修复、重型 heartbeat、个人私有上下文、敏感配置

## 本地私有内容边界

以下内容应继续留在每台机器本地维护：

- `~/.openclaw/openclaw.json`
- `~/.openclaw/config.json`
- provider keys / gateway tokens / 渠道凭证
- 用户身份相关文件
- daily memory / 长期 memory

## 当前仓库定位

把它当成：

> **可复用的 OpenClaw 轻量基础设施底座**

而不是某一台机器全部状态的镜像。
