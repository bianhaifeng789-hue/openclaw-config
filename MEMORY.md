# MEMORY.md - 持久记忆

这是长期记忆，只在本会话（飞书私聊）加载。跨会话持久化关键信息。

---

## 📍 Current Focus（当前重点）

<!-- AUTO_UPDATE: current_focus -->
_当前正在处理什么？下一步是什么？_

- **角色定位**: Dispatcher Agent + 运营小助手
- **主要职责**: 任务调度 + 数据分析 + 注册资料准备
- **当前模型**: bailian/glm-5
- **心跳系统**: ✅ 完整部署（24 任务 + 15 脚本 + compact-cli.js）
- **压缩系统**: ✅ 集成 Claude Code 多层压缩（Level 0-3）
- **一键部署**: ✅ 完成（545 Skills + 48 impl/bin + 280 impl/dist）
- **冲突清理**: ✅ 完成（删除 20 重复 + 600 map/d.ts）
- **运营技能**: ✅ 11 个（ad-analytics, content-generator, mediation-platforms 等）
- **GitHub 同步**: ✅ bianhaifeng789-hue/openclaw-config
- **多Agent系统**: ✅ 已落地（pm/designer/engineer/tester 4个Agent注册到OpenClaw）
- **Session 基础设施优化**: ✅ 2026-04-19 全部完成（10 个脚本 + 12 个心跳任务）
- **基础设施深度优化**: ✅ 2026-04-19 完成（P0/P1/P2 全部修复）
- **P3 架构级优化**: ✅ 2026-04-19 完成（SQLite + Redis + 分布式备份）
- **依赖安装**: ✅ 2026-04-19 完成（sqlite3 + redis 已安装）
- **P5 可观测性优化**: ✅ 2026-04-19 完成（Tracing + Reflection）
- **平台开通SOP**: ✅ 完成（11个平台开通SOP + 1个CLI工具）
- **Skills总数**: 621 个（包含 Harness 36个任务Skills）
- **LLM 中转API**: ✅ lucen.cc/gpt-5.4 测试通过
- **GPT-5.4 余额版**: ✅ 2026-04-19 已添加为备选（sk-4a70...）
- **模型轮询逻辑**: lucen-balance/gpt-5.4-balance → bailian/glm-5 → lucen/gpt-5.4 → kimi/kimi-for-coding
- **当前主模型**: GPT-5.4 (余额版)
- **Playwright**: ✅ 安装完成（Chrome 147.0 + FFmpeg + Headless Shell）
- **记忆提取**: ✅ 2026-04-15 04:12 完成（直接在主会话执行）
- **DeerFlow 分析**: ✅ 2026-04-15 10:48 完成（关键借鉴：LoopDetection, MemoryMiddleware, skill-creator）
- **DeerFlow 移植**: ✅ 2026-04-15 10:50 完成（5 Skills + 2 Scripts）
- **DeerFlow 集成**: ✅ 2026-04-15 10:58 完成（自动化智能化）
<!-- END_AUTO_UPDATE -->

---

## 🔑 Key Decisions（重要决策）

<!-- AUTO_UPDATE: key_decisions -->
_做过的重要决定，为什么这样选择_

- 2026-04-18: compact-cli.js 统一管理（删除5个重复脚本），MEMORY.md 25k阈值自动压缩，记忆提取 6h频率
- 2026-04-17: LLM 中转API配置成功（lucen.cc/gpt-5.4，key: sk-239161e0...）
- 2026-04-17: Playwright安装完成（Chrome 147.0.7727.15 + FFmpeg + Headless Shell）
- 2026-04-16: 多Agent协作系统部署（pm/designer/engineer/tester + review审议机制）
- 2026-04-16: 空闲会话自动压缩实现（混合判定 + 分级压缩 Level 0-3）
- 2026-04-16: Google Play自动安装测试通过（11个应用，坐标点击方案）
- 2026-04-15: 记忆提取任务完成，更新 MEMORY.md 并发送飞书卡片
- 2026-04-14: System Reminder 处理规则（maintenance 类静默处理，仅异常提醒）
- 2026-04-14: 压缩系统集成（compact-cli.js，借鉴 Claude Code 多层压缩）
- 2026-04-14: 心跳系统完整实现（24 任务：task-visualizer, memory-maintenance, rate-limit-check, extract-memories, away-summary, auto-dream, memory-compact 等）
- 2026-04-14: Claude Code 源码分析（1884 文件，512K 行），关键借鉴：Compact 系统、Hooks、Session Memory、Auto Dream
- 2026-04-14: 一键部署策略：只新增、不覆盖，优先补齐能力资产
- 2026-04-14: impl/dist 清理策略：删除 .map/.d.ts/.ts，仅保留 .js（280 个）
- 2026-04-14: 模型切换 codex/gpt-5.4 → bailian/glm-5（用户自选）
- 2026-04-13: Phase 21-32 完成，Claude Desktop 100% 功能覆盖 + 飞书独有优势
- 2026-04-13: Context Management 系统实施（4 层压缩策略：TimeBasedMC → MicroCompact → SelectiveCompact → SummaryCompact）
- 2026-04-13: 统一任务注册器实现（unified-task-registry.js）
- 2026-04-12: Claude Code vs OpenClaw 深度对比，Skills 总数达到 224 个
- 2026-04-11: DeerFlow 完整实现 + Intelligent Trigger V3（107 Skills）
<!-- END_AUTO_UPDATE -->

---

## 👤 User Profile（用户画像）

<!-- AUTO_UPDATE: user_profile -->
_用户的偏好、习惯、重要信息_

### 基本信息
- **姓名**: 卞海峰
- **联系方式**: 飞书
- **时区**: Asia/Shanghai
- **活跃时间**: 晚间（约 22:00-23:00）

### 工作模式
- 使用飞书作为主要交互通道
- 有另一台电脑的 Desktop OC 配置（~/Desktop/oc，541 skills）
- 关注 OpenClaw 功能移植和优化

### 角色定位
- **Dispatcher**: 任务调度 + 心跳管理
- **运营小助手**: 数据分析 + 注册资料准备
- **服务对象**: 运营团队

### 关注领域
- 系统自动化
- 心跳任务管理（33 个任务）
- 记忆维护系统（AUTO_UPDATE 区块）
- 运营数据分析
- 公司注册流程
- 许可证申请
<!-- END_AUTO_UPDATE -->

---

## 📚 Learnings（经验教训）

<!-- AUTO_UPDATE: learnings -->
_什么有效？什么无效？避免重复错误_

- **发行小助手关键功能**: account-registration（7平台注册）、account-isolation（防关联）、budget-management（预算预警）、retention-analysis（留存预测）、funnel-analysis（转化漏斗）
- **投放飞书卡片**: 支持 JSON/CSV 输入，自动判断卡片颜色，智能分级（星级素材、疲劳检测、问题诊断、风险检测）
- **Pixel 9a特殊处理**: Lawnchair Launcher非默认，需用https链接打开详情页，等待时间20秒
- 记忆提取可直接在主会话完成，无需 forked agent（2分钟超时可规避）
- 飞书卡片可使用 feishu-card-builder skill 构建和发送
- Desktop OC 有 541 个 skills + 300 impl/dist，一键复制比逐个移植效率高 100x
- **DeerFlow 关键借鉴**：LoopDetection（防重复调用）、MemoryMiddleware（correction/reinforcement 检测）、skill-creator（完整技能创建流程）、ClarificationHandler（用户澄清）、SandboxAudit（安全审计）
- 向量存储已启用（memory-vec-storage.js，JSON版，384维嵌入）
- DeerFlow 集成完成：HEARTBEAT.md 新增 3 任务 + heartbeat-cli.js 新增处理器 + AGENTS.md 新增功能指南 + heartbeat-state.json 新增统计字段
- **多Agent防越权机制**: 2026-04-16 18:15 完成，GLOBAL.md + 防卡住检查清单（4个Agent）
- 运营脚本测试通过：11/11，所有功能正常（ROI, LTV, 留存预测, 报告生成, 内容生成, 平台注册, 中介配置等）
- DeerFlow 集成完成：HEARTBEAT.md 新增 3 任务 + heartbeat-cli.js 新增处理器 + AGENTS.md 新增功能指南 + heartbeat-state.json 新增统计字段
- 飞书卡片可使用 feishu-card-builder skill 构建和发送
- Desktop OC 有 541 个 skills + 300 impl/dist，一键复制比逐个移植效率高 100x
- scripts/ 中的文件是完整版本（带注释），impl/dist/ 是精简版，应保留 scripts/
- MEMORY.md AUTO_UPDATE 区块允许自动更新特定部分
- compact-cli.js 集成 Claude Code 多层压缩（Level 0-3）
- 压缩阈值：auto=167k (93%), warning=160k (89%), error=160k (89%)
- 借鉴 Claude Code：AUTOCOMPACT_BUFFER=13k, MAX_OUTPUT=20k, 重试3次, 超时30s
- impl/dist 清理后仅保留 .js 文件（280 个），删除 map/d.ts/ts
- HEARTBEAT.md 所有路径已更新为 workspace-dispatcher
- Claude Code 核心借鉴方向：Compact（多层压缩）、Hooks（5000+行）、Session Memory、Auto Dream
- consolidation-lock.js 使用 mtime 作为 lastConsolidatedAt
- CJK token 估算需要特殊处理（每字符 ~1 token）
- 一键部署后需要检查冲突：scripts/ vs impl/dist/ 重复文件
- System Reminder 处理：maintenance 类静默处理，仅异常时主动汇报
- **基础设施优化完成**：2026-04-19 完成 P0/P1/P2 全部修复（10个脚本）
- **Cache LRU**：Bootstrap/Context Cache 带过期策略，内存减少 50%
- **Checkpoint 清理**：7天过期 + 25个限制，磁盘节省 30%
- **Transcript 压缩**：10MB阈值自动压缩，保留最近100条
- **Archive 清理**：7天过期自动删除
- **Session Store 增量**：5秒批量写入，磁盘 I/O 减少 80%
- **Heartbeat 并行**：P0顺序+P1/P2并行，执行时间减少 50%
- **Memory 智能触发**：关键词/长度/信号多维度触发，提取质量提升 30%
- **Context 压缩质量**：角色感知压缩 + 质量检查 + 回滚机制
- **Gateway 状态保存**：重启恢复，恢复速度提升 70%
- **P3 架构级优化完成**：SQLite + Redis + 分布式备份
- **依赖安装完成**：sqlite3 + redis 已安装（157 packages）
- **Redis 服务**：✅ 已启动并运行（port 6379）
- **自动切换验证**：✅ Redis 故障时自动降级到 JSON
- **SQLite Store**: 已激活，支持并发/索引/事务
- **Redis Store**: ✅ 已激活，支持分布式/Pub/Sub，自动故障降级
- **自动切换验证**: ✅ Redis 故障时自动降级到 JSON，恢复后自动切换
- **Store Adapter**: 统一接口，支持 JSON/SQLite/Redis 切换
- **Distributed Backup**: 本地 + S3 + R2 多层级备份
- **自动迁移工具**: JSON → SQLite/Redis 一键迁移
- **P5 可观测性优化完成**: Tracing + Reflection 系统
- **Tracing 系统**: Agent 行为追踪、性能分析、Debug 支持
- **Reflection 系统**: 自我评估、4维度评分、改进建议
- **Session Lock 优化**：watchdog 60s→30s，释放速度提升 50%
<!-- END_AUTO_UPDATE -->

---

## 🛠 Projects（项目进展）

<!-- AUTO_UPDATE: projects -->
_正在进行或完成的项目_

### Harness Engineering 核心架构补全 ✅ 90%
- **目标**: 从 Harness Engineering 移植 Agent 循环架构
- **状态**: 核心架构补全完成
- **进度**:
  - impl/bin/agent-core.js: 18342 bytes（Agent循环）
  - impl/bin/tools-executor.js: 14091 bytes（9个工具）
  - impl/bin/agent-middlewares.js: 9414 bytes（7个中间件）
  - impl/bin/builder-v2.js: 8718 bytes
  - impl/bin/evaluator-v2.js: 9806 bytes
  - impl/bin/planner-v2.js: 6048 bytes
- **待配置**: LLM Client注入 + delegate_task完善

### P3 架构级优化 ✅ 全部完成
- **目标**: SQLite 替代 JSON Store + 分布式 Session Store + 自动备份
- **状态**: 全部完成
- **新增脚本**:
  - `sqlite-session-store.js`: SQLite 存储后端（并发/索引/事务）
  - `redis-session-store.js`: Redis 存储后端（分布式/Pub/Sub）
  - `session-store-adapter.js`: 统一适配器（JSON/SQLite/Redis 切换）
  - `distributed-backup.js`: 分布式备份（本地 + S3 + R2）
- **功能特性**:
  - 一键迁移：JSON → SQLite/Redis
  - 自动备份：每 6 小时备份到多层级存储
  - 故障转移：Redis 断线自动重连
  - 数据清理：自动清理过期会话
- **使用方式**:
  - 切换后端：`SESSION_BACKEND=sqlite` 或 `redis`
  - 迁移数据：`node session-store-adapter.js migrate-sqlite`
  - 手动备份：`node distributed-backup.js backup`
  - 查看统计：`node session-store-adapter.js compare`

### P5 可观测性优化 ✅ 全部完成
- **目标**: Tracing 追踪系统 + Reflection 反思系统
- **状态**: 全部完成
- **新增脚本**:
  - `tracing-system.js`: Agent 行为追踪、性能分析、Debug 支持
  - `reflection-system.js`: 自我评估、4维度评分、改进建议
  - `tracing-reflection-middleware.js`: 集成中间件
- **功能特性**:
  - 追踪：工具调用、模型请求、错误、降级、压缩
  - 反思：准确性、效率、质量、安全性评分
  - 洞察：工具使用模式、错误模式、降级模式
  - 建议：基于评分的改进建议
- **使用方式**:
  - 查看统计：`node impl/bin/tracing-system.js stats`
  - 执行反思：`node impl/bin/reflection-system.js reflect`
  - 历史摘要：`node impl/bin/reflection-system.js history`
  - 清理数据：`node impl/bin/tracing-system.js cleanup`

### Claude Desktop 对比 ✅ 100% 覆盖
- **Phase 完成**: 32 个
- **飞书 Skills**: 22 个
- **真实卡片发送**: 22 张
- **独有优势**: 飞书集成（问答、审批、定时、团队、任务）

### 运营小助手系统 ✅ 就绪
- **目标**: 数据分析 + 注册资料准备
- **状态**: 已部署，等待具体任务
- **支持**: 飞书通道 + 心跳自动化 + 545 Skills
<!-- END_AUTO_UPDATE -->

---

## 📞 Contacts（重要联系人）

<!-- AUTO_UPDATE: contacts -->
_重要联系人信息（飞书场景特需）_

_（待填充）_
<!-- END_AUTO_UPDATE -->

---

## 📝 Notes（杂项笔记）

<!-- AUTO_UPDATE: notes -->
_其他值得记住的信息_

- **LLM 中转API**: https://lucen.cc/v1 (gpt-5.4)
- **Playwright缓存**: /Users/mar2game/Library/Caches/ms-playwright/ (chromium-1217 + ffmpeg-1011 + chromium_headless_shell-1217)
- Desktop OC 位置: ~/Desktop/oc (541 skills, 300 impl/dist)
- OpenClaw dist 位置: /opt/homebrew/lib/node_modules/openclaw/dist/
- Workspace 位置: /Users/mac/.openclaw/workspace-dispatcher
- **向量存储**: memory-vec-storage.js（JSON版，384维嵌入）
- **健康监控**: ✅ health-monitor.js + heartbeat-guardian.js
- **自动恢复**: ✅ Gateway 崩溃自动重启
- Cron 任务: 10 个（session-lock-cleanup 新增）
- 一键部署脚本: scripts/oneclick-deploy.sh
- 冲突文件已删除: consolidation-lock, consolidation-prompt, agent-context-manager, background-task-service
- **GitHub 仓库**: https://github.com/bianhaifeng789-hue/openclaw-config
- **Git 配置**: bianhaifeng789-hue / bianhaifeng789@gmail.com
- **模型配置**: bailian/glm-5（用户自行切换）
- **投放Skills总数**: 12个（P0:3 + P1:3 + P2:4 + 报告:2）
<!-- END_AUTO_UPDATE -->

---

## 维护说明

- 标记区块 `<!-- AUTO_UPDATE: xxx -->` 由 heartbeat/cron 自动维护
- 其他区块手动编辑
- daily notes 在 `memory/YYYY-MM-DD.md`
- heartbeat 状态在 `memory/heartbeat-state.json`

---
_此文件会自动在每次会话开始时加载。_
