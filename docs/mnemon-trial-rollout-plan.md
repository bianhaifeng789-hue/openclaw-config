# Mnemon Trial Rollout Plan

_Last updated: 2026-04-20_

目标：
在 **不直接污染主环境**、**可快速回滚** 的前提下，完成一次 Mnemon 对 OpenClaw 的低风险试装验证。

---

## 0. Trial goal

本次试装不是为了立刻全面启用 Mnemon，而是验证以下问题：

1. `mnemon setup --target openclaw --yes` 实际会改哪些文件
2. 接入后是否会明显增加 prompt 噪音
3. recall / remember 提示是否有实际收益
4. 与当前 workspace 的 memory / heartbeat / context 体系是否冲突
5. 回滚是否足够干净、可控

通过后，才考虑有限启用；否则恢复原状。

---

## 1. Pre-flight checklist

在试装前，先确认以下条件：

- [ ] 当前 `~/.openclaw/` 可读写
- [ ] 当前 `openclaw` 命令可正常执行
- [ ] 当前 gateway 状态正常，便于试装后重启验证
- [ ] 当前已知 hooks / plugins 有基本认知（避免误以为原本就是 Mnemon 写入）
- [ ] 当前 workspace 改动已提交（避免把试装与其他未提交改动混在一起）

建议先做：

```bash
openclaw status
```

以及查看：

- `~/.openclaw/openclaw.json`
- `~/.openclaw/hooks/`
- `~/.openclaw/extensions/`
- `~/.openclaw/skills/`

---

## 2. Backup scope

试装前必须备份以下位置：

### Required backups

- `~/.openclaw/openclaw.json`
- `~/.openclaw/hooks/`
- `~/.openclaw/extensions/`
- `~/.openclaw/skills/`

### Mnemon-related state

- `~/.mnemon/`（如果已存在）

### Recommended snapshot naming

建议使用带时间戳的目录，例如：

```bash
~/.openclaw-backups/mnemon-trial-YYYYMMDD-HHMMSS/
```

备份建议结构：

```text
~/.openclaw-backups/mnemon-trial-YYYYMMDD-HHMMSS/
├── openclaw.json
├── hooks/
├── extensions/
├── skills/
└── mnemon/
```

---

## 3. Install sequence

### Step 1 - install binary

优先使用项目推荐方式之一：

```bash
brew install mnemon-dev/tap/mnemon
```

安装后检查：

```bash
mnemon --version
mnemon status
```

若 `mnemon status` 初始为空库或最小状态，属于正常。

### Step 2 - run setup

执行：

```bash
mnemon setup --target openclaw --yes
```

预期写入：

- `~/.openclaw/skills/mnemon/`
- `~/.openclaw/hooks/mnemon-prime/`
- `~/.openclaw/extensions/mnemon/`
- `~/.mnemon/prompt/guide.md`
- `~/.mnemon/prompt/skill.md`
- `~/.openclaw/openclaw.json` 中新增 plugin entry

### Step 3 - restart gateway

```bash
openclaw gateway restart
```

---

## 4. Validation checklist

试装后重点验证以下几类现象。

### A. File-level verification

检查这些路径是否存在：

- `~/.openclaw/skills/mnemon/SKILL.md`
- `~/.openclaw/hooks/mnemon-prime/HOOK.md`
- `~/.openclaw/hooks/mnemon-prime/handler.js`
- `~/.openclaw/extensions/mnemon/`
- `~/.mnemon/prompt/guide.md`

检查 `~/.openclaw/openclaw.json`：
- 是否新增 `plugins.entries.mnemon`
- 默认 hooks 配置是否符合预期

### B. Runtime verification

观察新 session / 新轮对话时：

- 是否出现 mnemon guide 注入痕迹
- 是否每轮都出现 recall / remember 提醒
- 提示是否过长或干扰主任务
- 是否有明显重复提示

### C. Behavior verification

重点观察：

- 是否只是“提醒很多”，但实际收益不高
- 是否能自然促发更合理的 recall / remember 行为
- 是否和当前 typed memory / MEMORY.md 工作流形成冲突
- 是否影响主任务回答流畅度

### D. Safety verification

确认：
- 没有异常报错或 gateway 启动失败
- 没有覆盖现有自定义 hooks / plugin
- 没有导致主会话明显变重

---

## 5. Suggested initial config posture

如果 setup 完成后要进行第一轮试用，建议采用**保守配置**：

### Recommended
- `remind = true`
- `nudge = false` 或按需开启
- `compact = false`

理由：
- `remind` 是最低风险能力
- `nudge` 可能增加每轮提示打断感
- `compact` 最容易与现有 context / memory 机制叠加冲突

因此首轮建议只验证：
- bootstrap guide 注入
- 每轮 recall/remember 提醒是否有帮助

---

## 6. Rollback plan

如果试装后出现以下任一情况，应立即回滚：

- gateway 启动异常
- prompt 噪音明显过大
- 主任务回答质量下降
- 与现有 hooks/plugins 冲突
- memory 行为过于激进且不易约束

### Preferred rollback

如果 Mnemon 自带 eject 行为正常：

```bash
mnemon setup --eject --target openclaw --yes
```

然后：

```bash
openclaw gateway restart
```

### Hard rollback

如果 eject 不干净，使用备份手动恢复：

恢复这些路径：
- `~/.openclaw/openclaw.json`
- `~/.openclaw/hooks/`
- `~/.openclaw/extensions/`
- `~/.openclaw/skills/`
- `~/.mnemon/`（如需彻底恢复试装前状态）

然后重启 gateway。

---

## 7. Decision criteria after trial

### Keep trial / continue rollout if:
- prompt 增量可接受
- recall/remember 有明显正收益
- 没有破坏当前主工作流
- 配置可控、回滚简单

### Abort if:
- 主要效果只是增加提示噪音
- 与 typed memory / MEMORY 工作流重复严重
- 对当前环境收益不明显
- 维护成本高于带来的实际帮助

---

## 8. Recommended execution order

建议真正试装时按这个顺序：

1. 备份 `~/.openclaw` 与 `~/.mnemon`
2. 安装 `mnemon` binary
3. 运行 `mnemon setup --target openclaw --yes`
4. 重启 gateway
5. 观察 1-2 个新会话 / 新轮次
6. 只评估 `remind` 路径
7. 如有必要再考虑 `nudge`
8. `compact` 最后再评估

---

## 9. Current recommendation

当前建议不是“马上长期启用 Mnemon”，而是：

- 把它当作一个 **可控试验项**
- 先验证是否值得进入下一阶段
- 在试验前后都保留清晰的本地文件式记忆体系作为稳定底座

也就是说：
**Mnemon 是增强层，不是当前基础记忆体系的替代品。**
