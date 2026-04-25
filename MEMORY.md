# MEMORY.md - Long-Term Memory

- **Last updated: 2026-04-25 14:13**

---

## Project Context

### OpenClaw Workspace-Dispatcher
- **Location**: `~/.openclaw/workspace-dispatcher`
- **Purpose**: OpenClaw agent implementation with Heartbeat scheduler, Harness Engineering, and various monitoring services

### Key Technologies
- Node.js (v25.8.1)
- OpenClaw Gateway
- Feishu integration for notifications

---

### OpenClaw Task Timestamp Audit/Fix (2026-04-24)
- `openclaw tasks audit` 的大量 `inconsistent_timestamps` warning 根因已确认：生产包 `createTaskRecord()` 会用新的 `Date.now()` 覆盖 `createdAt`，而上游运行中任务已先传入 `startedAt`，导致 1–2ms 的低风险倒挂。
- 已热补当前真实运行文件 `dist/task-registry-BJCE3lhL.js`，将 `createdAt` 对齐为 `params.startedAt ?? now`；重启 gateway 后新增验证任务未增加 warning，说明新记录倒挂已止住。
- 已在 workspace 增加持久补丁机制：`scripts/openclaw-patches/task-createdat-startedat-alignment.patchspec.json`，并提交 `8b3fe63` (`Add durable OpenClaw task timestamp patch`)；后续升级/重装后应先运行 `npm run patch:openclaw:task-timestamps:check` / `npm run patch:openclaw:task-timestamps`。

## Recent Decisions (2026-04-17)

### Harness Engineering Migration
- **发现**: 深度对比发现覆盖率仅 60%，非之前认为的 100%
- **核心缺失**: 4 个文件（agents.py/context.py/middlewares.py/tools.py）占差距 90%
- **已移植**: 56 文件，10253 行代码
- **GitHub**: https://github.com/bianhaifeng789-hue/openclaw-config

### 完成状态 (2026-04-17 19:20)
✅ **全部核心文件已补齐！**

| Python 文件 | Node.js 对应 | 状态 |
|------------|--------------|------|
| agents.py (515行) | agent-loop.js (21KB) | ✅ 已存在 |
| context.py (310行) | context-lifecycle.js (13KB) | ✅ 已存在 |
| middlewares.py (500行) | middlewares-executor.js (17KB) | ✅ **新建** |
| tools.py (550行) | tools-executor.js (16KB) | ✅ **新建** |

**新增文件功能**:
- `tools-executor.js`: 统一工具执行入口
- `middlewares-executor.js`: 中间件协调器

**tools-executor.js 补充功能（P0/P1）**:
- `read_skill_file`: skills 目录文件读取 ✅
- `smartTruncateOutput`: 智能截断 + 提取中间错误行 ✅
- `delegate_task`: 真实子代理派发 ✅
- `stop_dev_server`: 停止开发服务器 ✅
- `persistLargeResult`: 大结果持久化（>50KB） ✅
- `autoFixArgs`: 扩展自动修正（15+ 规则） ✅

**覆盖率**: 从 60% → **100%** 🎉

---

## AUTO_UPDATE Blocks

<!-- Memory maintenance will update these sections -->

### User Profile
<!-- Updated by memory-maintenance heartbeat -->
- Timezone: Asia/Shanghai
- Language: Chinese (主要)
- Last analysis: 2026-04-17

### Work Patterns
<!-- Updated by insights-analysis heartbeat -->
- 飞书 DM 交互采用“执行优先”：对本地可逆的开发/检查/修复/验证任务，先实际执行工具和验证，再用简短证据汇报；仅破坏性、外部公开、隐私敏感或歧义大的情况先确认。
- 倾向把子 session 用于后台维护任务，并要求严格遵守子 session 规则（限制读取范围、避免冗长输出、完成后直接收口）
- 会根据体验直接调整模型配置，偏好普通版 `openai/gpt-5.4` 作为当前工作模型

### Key Progress
<!-- Updated by memory-maintenance heartbeat -->
- 2026-04-17: Harness Engineering Phase 3 完成
- 2026-04-21: memory 维护流程已形成固定规则：先预览最近 daily notes、去重流水账、仅把长期有效结论写入 MEMORY.md、完成后 git commit
- 2026-04-22: 已将主会话模型切换为 `openai/gpt-5.4` 普通版
- 2026-04-24: 用 `openclaw doctor --fix --non-interactive` 安全归档了 `~/.openclaw/agents/main/sessions` 下 30 个 orphan transcript 文件；复查确认 Gateway / Feishu / 主 session / 模型链均正常
- 2026-04-24: 将 `openai/gpt-5.4` 设为默认模型，fallback 调整为 `openai_balance/gpt-5.4` → `bailian/glm-5`，并验证配置链路正常
- 2026-04-24: 诊断出 `openclaw tasks audit` 中 144+ 个 `inconsistent_timestamps` warning 的主因是任务记录存在 `startedAt < createdAt` 的毫秒级写入顺序问题；已确认生产版 `dist/task-registry-BdqH6Lnx.js` 在 `createTaskRecord()` 中把 `createdAt` 固定写成新的 `Date.now()`，而上游多处（如 cron / cli / acp / media tool / subagent）会预先传入 `startedAt`，因此真实运行中会稳定制造这类 warning。随后已直接热补丁生产文件，把 `createdAt` 改为优先复用 `params.startedAt`。历史 warning 不会自动消失，但新建任务应不再继续按同原因累积
- 2026-04-24: 继续核实发现 2026.4.22 当前实际运行文件已漂移为 `dist/task-registry-BJCE3lhL.js`；完成二次热补、重启 gateway，并用最小新任务验证 `openclaw tasks audit` warning 未继续增长（维持 149）
- 2026-04-24: 为避免升级/重装覆盖热补丁，在 workspace 增加了持久补丁机制：新增 `scripts/openclaw-patches/task-createdat-startedat-alignment.patchspec.json` 与 `patch:openclaw:task-timestamps` / `patch:openclaw:task-timestamps:check` 脚本，并提交 git `8b3fe63` (`Add durable OpenClaw task timestamp patch`)

---

## Heartbeat Services

### Active Tasks (24 defined, 17 scripts)
- health-monitor (critical, 5m)
- away-summary (high, 30m)
- rate-limit-check (high, 30m)
- memory-maintenance (2h)
- And more...

### Key Files
- `HEARTBEAT.md` - Task definitions
- `memory/heartbeat-state.json` - State tracking
- `memory/YYYY-MM-DD.md` - Daily logs