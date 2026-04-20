# MEMORY.md - Long-Term Memory

_Last updated: 2026-04-21 02:49_

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
- Pending analysis

### Key Progress
<!-- Updated by memory-maintenance heartbeat -->
- 2026-04-21: hooks 使用说明文档完成
- 2026-04-21: template-picker skill 完成
- 2026-04-21: 模板分类索引完成
- 2026-04-21: 逆向工程工作流 skill 整合完成
- 2026-04-21: 变现工作流 skill 整合完成
- 2026-04-21: PM 工作流 skill 整合完成
- 2026-04-21: Claude Code Mastery hooks 激活确认
- 2026-04-17: Harness Engineering Phase 3 完成

---

## Template Workflow

**新增 skill (2026-04-21)**:
- `template-picker` - 项目模板推荐器
- `templates-index.md` - 401+ 模板分类索引

**用途**:
- 根据项目类型快速推荐模板
- 支持组合推荐（AI SaaS / API / Mobile / Infra）

---

## PM Workflow Skills

**整合 skills (2026-04-21)**:
- `pm-workflow` - PM 工作流总控
- `prd-generator` - PRD 生成
- `requirement-analysis` - 需求分析
- `gap-analysis` - 差距分析
- `competitive-analysis` - 竞品分析
- `prototype-designer` - 原型设计

---

## Monetization Workflow Skills

**整合 skills (2026-04-21)**:
- `monetization-workflow` - 变现工作流总控
- `monetization-teardown` - 商业化拆解
- `ad-mediation-teardown` - 广告栈拆解
- `paywall-analysis` - 付费墙分析
- `ad-monetization-optimization` - 变现优化
- `mediation-platforms` - 平台配置
- `revenue-dashboard` - 收益 Dashboard
- `ad-analytics` - 广告数据分析
- `growth-teardown` - 增长拆解

**联动**: monetization-workflow ↔ pm-workflow ↔ reverse-engineering-workflow

---

## Reverse Engineering Workflow Skills

**整合 skills (2026-04-21)**:
- `reverse-engineering-workflow` - 逆向工程总控
- `apk-reverse-analysis` - APK 反编译
- `adb-automation` - ADB 设备调试
- `crack-7z-hash` - 7z 密码破解
- `password-recovery` - 密码恢复/磁盘取证
- `db-wal-recovery` - SQLite WAL 恢复
- `feal-linear-cryptanalysis` - FEAL 密码分析
- `vulnerable-secret` - 二进制漏洞分析

---

**整合 skills (2026-04-21)**:
- `pm-workflow` - PM 工作流总控
- `prd-generator` - PRD 生成
- `requirement-analysis` - 需求分析
- `gap-analysis` - 差距分析
- `competitive-analysis` - 竞品分析
- `prototype-designer` - 原型设计

**文件流转**:
- INSIGHTS.md → 用户/市场洞察
- DECISIONS.md → 产品决策
- EXPERIMENTS.md → 实验记录
- PRD.md → 项目 PRD

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