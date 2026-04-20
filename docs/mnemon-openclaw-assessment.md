# Mnemon for OpenClaw - Integration Assessment

_Last updated: 2026-04-20_

## Verdict

Mnemon 值得继续关注，且从架构上看 **比纯文档型 memory skill 更像真正可用的长期记忆引擎**。

但对于当前 workspace，建议：

- **现在先不立即接入生产主环境**
- **先保留当前轻量结构化方案**
- 如果要接，优先做一次低风险试装 / 沙盒验证

一句话结论：
**值得试，但不建议在还没做隔离验证前直接全量启用。**

## Why it matters

Mnemon 不是单纯的记忆目录规范，而是完整的 memory engine：

- 独立 `mnemon` binary
- 持久化存储
- `remember / recall / link` 协议
- OpenClaw 集成脚手架
- hook + plugin + guide 三层接入

这意味着它提供的是“运行时记忆能力”，不是只教你怎么整理文件夹。

## What OpenClaw integration actually changes

根据仓库内容，`mnemon setup --target openclaw --yes` 会修改或新增：

### 1. OpenClaw config dir
默认写入 `~/.openclaw/`：

- `~/.openclaw/skills/mnemon/SKILL.md`
- `~/.openclaw/hooks/mnemon-prime/`
- `~/.openclaw/extensions/mnemon/`
- `~/.openclaw/openclaw.json`（注册 plugin entry）

### 2. Mnemon prompt dir
写入：

- `~/.mnemon/prompt/guide.md`
- `~/.mnemon/prompt/skill.md`

### 3. Runtime behavior change
它会通过两层机制影响 agent：

- **bootstrap hook**：在 session 启动时注入 mnemon guide
- **plugin / before_prompt_build**：在每次 prompt 构建前提醒 recall / remember / compact

换句话说，这不是“装了个命令行工具”这么简单，而是会改变 agent 的行为提示链路。

## Benefits

### 1. 真正具备持久化 memory runtime
相比文件式方案，Mnemon 有：

- recall
- remember
- link
- dedup
- decay / gc
- graph relationships

这套能力是严肃的，不是概念描述。

### 2. OpenClaw 已有一等支持
Mnemon 仓库里明确包含：

- OpenClaw skill asset
- OpenClaw hook asset
- OpenClaw plugin asset
- setup logic

说明它不是“理论支持 OpenClaw”，而是已经做了专门适配。

### 3. 和未来多 agent / 多 session 共享记忆比较契合
它的 store 机制、共享数据目录、独立 binary 设计，适合后续：

- 主会话 + 子会话
- 不同 agent 共享长期记忆
- 不同项目分 store 隔离

## Risks / Costs

### 1. 会改 `~/.openclaw` 真实配置
这是最大风险点。

Mnemon setup 不只是装技能文件，还会：
- 写 hooks
- 写 plugin
- 改 `openclaw.json`

如果当前环境已经有一套较复杂的 hooks / plugins / heartbeat / context 机制，直接接入可能会带来：
- 提示污染
- 行为叠加
- 排查复杂度上升

### 2. 会改变 prompt 构建时的默认提示
plugin 的逻辑是在 `before_prompt_build` 里不断 prepend：
- load mnemon skill
- recall needed?
- remember needed?
- compact hints

好处是 memory 会被积极调用；
坏处是如果调度不好，可能导致：
- 提示噪音增加
- 每轮都被提醒 memory
- 与现有 heartbeat / memory-maintenance 思路重叠

### 3. 新增一套外部状态
它会引入：
- `~/.mnemon/`
- memory store
- prompt guide
- compact flag

这会让你的系统从“文件记忆 + workspace 文档”升级成“文件记忆 + 外部 memory engine 并存”。

如果治理不好，会出现双轨：
- MEMORY.md 记一份
- typed/ 记一份
- mnemon store 里再记一份

## Fit for current workspace

当前 workspace 的特点：

- 已有 MEMORY / daily notes / heartbeat-state
- 已有大量本地 runbook 与维护脚本
- 当前诉求更偏“可维护的长期积累”，而不是“立刻引入另一层复杂运行时”

因此更适合的策略是：

### 当前阶段
先用已落地的轻量结构化记忆：
- `MEMORY.md`
- `memory/YYYY-MM-DD.md`
- `memory/typed/*`
- `memory/bank/procedures/*`

### 下一阶段
如果出现以下信号，再接 Mnemon 会更合理：
- 频繁跨 session 丢上下文
- 需要 recall 历史决策而不是靠 grep / 文档
- 需要 agent 主动 remember / recall
- 需要多个 agent 共享同一长期记忆池

## Recommended rollout plan

### Phase 0 - current
保留当前已落地方案，先观察 typed memory 是否足够。

### Phase 1 - isolated trial
如果要试：
- 先确认 `mnemon` binary 安装方式
- 备份 `~/.openclaw/openclaw.json`
- 在低风险环境运行 `mnemon setup --target openclaw --yes`
- 重启 gateway
- 观察 prompt 变化与行为噪音

### Phase 2 - limited adoption
如果试装效果好：
- 先只开 `remind`
- `nudge` 视情况保留
- `compact` 建议后开

原因：
- remind 成本最低
- nudge 会更频繁打断思路
- compact 牵涉上下文压缩前行为，最容易和现有体系相互影响

## Final recommendation

当前建议：

1. **已经完成的轻量结构化记忆方案继续用**
2. **Mnemon 暂列为下一阶段增强项**
3. **如果要接，不要直接无备份落主环境，先做一次隔离试装**

最终判断：
- 技术方向：值得
- 当前时机：可试验，不建议立即全量依赖
- 优先级：中高，但低于把现有结构先跑顺
