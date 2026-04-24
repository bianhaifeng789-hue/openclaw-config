# MEMORY.md - Long-Term Memory

- **Last updated: 2026-04-24 11:00**

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