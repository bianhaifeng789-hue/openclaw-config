# Claude Code vs OpenClaw 完整差异分析

## 已实现 ✅

### 核心 Skills (已创建)
| 功能 | Claude 文件 | OpenClaw 状态 | 位置 |
|------|------------|---------------|------|
| 自动审批分类 | yoloClassifier.ts (1495行) | ✅ SKILL.md | ~/.openclaw/skills/auto-classify |
| Plan Mode | EnterPlanModeTool/ExitPlanModeTool | ✅ SKILL.md | ~/.openclaw/skills/plan-mode |
| Vim 模式 | vim/ (7文件) | ✅ SKILL.md | ~/.openclaw/skills/vim |
| Thinkback | commands/thinkback/ | ✅ SKILL.md | ~/.openclaw/skills/thinkback |
| TodoWrite | TodoWriteTool/ | ✅ SKILL.md | ~/.openclaw/skills/todo |
| LSP Tool | LSPTool/ (92KB) | ✅ SKILL.md | ~/.openclaw/skills/lsp |
| Advisor | advisor.ts | ✅ SKILL.md | ~/.openclaw/skills/advisor |
| Buddy UI | CompanionSprite.tsx (46KB) | ✅ SKILL.md | ~/.openclaw/skills/buddy |
| AskUser | AskUserQuestionTool/ | ✅ SKILL.md | ~/.openclaw/skills/ask-user |
| Ultraplan | ultraplan.tsx (67KB) | ✅ SKILL.md | ~/.openclaw/skills/ultraplan |

### 配置
| 功能 | 状态 | 配置 |
|------|------|------|
| 记忆系统 | ✅ 自动启用 | MEMORY.md + memory/*.md |
| 上下文压缩 | ✅ 自动启用 | reserveTokensFloor: 20000 |
| Sandbox | ✅ 已配置 | mode: non-main |
| 自动审批规则 | ✅ 已配置 | tools.exec.autoApprove |

---

## 缺失功能 ❌

### 1️⃣ 工具层缺失 (Tools)

| Claude Tool | 大小 | 说明 | OpenClaw 替代 |
|-------------|------|------|--------------|
| **BashTool** | 632KB | 完整 Bash 执行引擎 | exec 工具（简化版） |
| **PowerShellTool** | 480KB | PowerShell 支持 | ❌ 无 |
| **AgentTool** | 572KB | Agent 编排引擎 | sessions_spawn（不同实现） |
| **MCPTool** | 76KB | MCP 协议调用 | ❌ ACP 模式不支持 |
| **SkillTool** | 76KB | Skill 调用系统 | ⚠️ 简化版 |
| **TaskCreateTool** | 12KB | 任务创建 | ❌ 无工具形式 |
| **TaskGetTool** | 12KB | 任务查询 | ❌ 无工具形式 |
| **TaskListTool** | 12KB | 任务列表 | ❌ 无工具形式 |
| **TaskOutputTool** | 72KB | 任务输出 | ❌ 无工具形式 |
| **TaskStopTool** | 16KB | 任务停止 | ❌ 无工具形式 |
| **TaskUpdateTool** | 20KB | 任务更新 | ❌ 无工具形式 |
| **TeamCreateTool** | 24KB | 团队创建 | ❌ 无 |
| **TeamDeleteTool** | 20KB | 团队删除 | ❌ 无 |
| **BriefTool** | 40KB | 简报生成 | ❌ 无 |
| **ConfigTool** | 40KB | 配置工具 | ⚠️ openclaw config |
| **REPLTool** | 8KB | REPL 执行 | ❌ 无 |
| **ScheduleCronTool** | 32KB | Cron 调度 | ⚠️ openclaw cron |
| **SendMessageTool** | 44KB | 消息发送 | message 工具 |
| **WebSearchTool** | 32KB | 网络搜索 | ❌ 无内置 |
| **ToolSearchTool** | 28KB | 工具搜索 | ❌ 无 |
| **NotebookEditTool** | 40KB | Notebook 编辑 | ❌ 无 |
| **EnterWorktreeTool** | 20KB | 进入 Worktree | ❌ 无 |
| **ExitWorktreeTool** | 24KB | 退出 Worktree | ❌ 无 |
| **RemoteTriggerTool** | 16KB | 远程触发 | ❌ 无 |
| **ReadMcpResourceTool** | 20KB | MCP 资源读取 | ❌ 无 |
| **ListMcpResourcesTool** | 16KB | MCP 资源列表 | ❌ 无 |
| **SleepTool** | 4KB | 延迟工具 | ❌ 无 |
| **SyntheticOutputTool** | 8KB | 模拟输出 | ❌ 无 |

---

### 2️⃣ 命令层缺失 (Commands)

| Claude Command | 说明 | OpenClaw 替代 |
|----------------|------|--------------|
| `/btw` | 提示注入 | ❌ 无 |
| `/bughunter` | Bug 猎手模式 | ❌ 无 |
| `/chrome` | Chrome 集成 | ⚠️ browser 工具 |
| `/compact` | 手动压缩 | ⚠️ 自动压缩 |
| `/cost` | 成本追踪 | ❌ 无内置 |
| `/effort` | 工作量评估 | ❌ 无 |
| `/fast` | 快速模式 | ❌ 无 |
| `/good-claude` | 评价反馈 | ❌ 无 |
| `/ide` | IDE 集成 | ❌ 无 |
| `/mobile` | 移动端 | ⚠️ node-connect |
| `/passes` | Passes 管理 | ❌ 无 |
| `/review` | 代码审查 | ❌ 无 |
| `/rewind` | 回退对话 | ❌ 无 |
| `/share` | 分享会话 | ❌ 无 |
| `/stickers` | 贴纸 | ❌ 无 |
| `/teleport` | 远程传输 | ❌ 无 |
| `/theme` | 主题切换 | ❌ 无 |
| `/voice` | 语音模式 | ⚠️ 需配置 whisper |
| `/ant-trace` | 追踪分析 | ❌ 无 |
| `/autofix-pr` | PR 自动修复 | ❌ 无 |
| `/ctx_viz` | 上下文可视化 | ❌ 无 |
| `/heapdump` | 内存堆转储 | ❌ 无 |
| `/issue` | Issue 操作 | ❌ 无 |
| `/passes` | Passes 管理 | ❌ 无 |
| `/perf-issue` | 性能问题 | ❌ 无 |
| `/release-notes` | 发布说明 | ❌ 无 |

---

### 3️⃣ Bundled Skills 缺失

| Claude Skill | 大小 | 说明 | OpenClaw 状态 |
|--------------|------|------|--------------|
| **batch** | 7KB | 批处理模式 | ❌ 无 |
| **claudeApi** | 6KB | API 调用 | ❌ 无 |
| **claudeApiContent** | 4KB | API 内容 | ❌ 无 |
| **claudeInChrome** | 2KB | Chrome 集成 | ❌ 无 |
| **debug** | 4KB | 调试模式 | ❌ 无 |
| **keybindings** | 10KB | 键绑定管理 | ⚠️ 部分 |
| **loop** | 4KB | 循环模式 | ❌ 无 |
| **loremIpsum** | 4KB | 测试文本 | ❌ 无 |
| **remember** | 4KB | 记忆辅助 | ⚠️ memory 工具 |
| **scheduleRemoteAgents** | 19KB | 远程 Agent 调度 | ❌ 无 |
| **simplify** | 4KB | 简化输出 | ❌ 无 |
| **skillify** | 9KB | Skill 创建 | ⚠️ skill-creator |
| **stuck** | 4KB | 卡住检测 | ❌ 无 |
| **updateConfig** | 17KB | 配置更新 | ⚠️ openclaw config |
| **verify** | 1KB | 验证模式 | ❌ 无 |

---

### 4️⃣ 服务层缺失 (Services)

| Claude Service | 大小 | 说明 | OpenClaw 状态 |
|----------------|------|------|--------------|
| **voice.ts** | 17KB | 语音服务 | ⚠️ 需配置 |
| **voiceStreamSTT.ts** | 21KB | 流式 STT | ❌ 无 |
| **autoDream/** | - | 自动梦境 | ❌ 无 |
| **extractMemories/** | - | 记忆提取 | ❌ 无 |
| **SessionMemory/** | - | 会话记忆 | ⚠️ memory-core |
| **tips/** | - | 提示服务 | ❌ 无 |
| **analytics/** | 11KB | 分析追踪 | ❌ 无 |
| **claudeAiLimits.ts** | 17KB | AI 限制 | ❌ 无 |
| **mockRateLimits.ts** | 30KB | 模拟限制 | ❌ 无 |
| **vcr.ts** | 12KB | VCR 录制 | ❌ 无 |
| **settingsSync/** | - | 设置同步 | ❌ 无 |
| **teamMemorySync/** | - | 团队记忆同步 | ❌ 无 |
| **remoteManagedSettings/** | - | 远程设置 | ❌ 无 |
| **MagicDocs/** | - | 魔法文档 | ❌ 无 |
| **PromptSuggestion/** | - | 提示建议 | ❌ 无 |
| **plugins/** | - | 插件服务 | ⚠️ 不同实现 |

---

### 5️⃣ UI/组件层缺失

| Claude Component | 大小 | 说明 | OpenClaw 状态 |
|------------------|------|------|--------------|
| **CompanionSprite.tsx** | 46KB | 伴侣精灵动画 | ❌ 无 UI |
| **AutoUpdater.tsx** | 31KB | 自动更新 UI | ❌ 无 |
| **BridgeDialog.tsx** | 34KB | Bridge 对话框 | ❌ 无 |
| **ContextVisualization.tsx** | 76KB | 上下文可视化 | ❌ 无 |
| **CoordinatorAgentStatus.tsx** | 36KB | Agent 状态 | ❌ 无 |
| **EffortCallout.tsx** | 25KB | 工作量提示 | ❌ 无 |
| **FullscreenLayout.tsx** | 85KB | 全屏布局 | ❌ 无 |
| **GlobalSearchDialog.tsx** | 44KB | 全局搜索 | ❌ 无 |
| **HistorySearchDialog.tsx** | 20KB | 历史搜索 | ❌ 无 |
| **LogSelector.tsx** | 200KB | 日志选择器 | ❌ 无 |
| **Message.tsx** | 79KB | 消息组件 | ❌ 无 |
| **Messages.tsx** | 147KB | 消息列表 | ❌ 无 |
| **ModelPicker.tsx** | 54KB | 模型选择器 | ❌ 无 |
| **Onboarding.tsx** | 31KB | 引导流程 | ❌ 无 |
| **PromptInput/** | - | 提示输入 | ❌ 无 |
| **QuickOpenDialog.tsx** | 28KB | 快速打开 | ❌ 无 |
| **ResumeTask.tsx** | 38KB | 任务恢复 | ❌ 无 |
| **ScrollKeybindingHandler.tsx** | 149KB | 键绑定处理 | ❌ 无 |
| **Spinner.tsx** | 88KB | 加载动画 | ❌ 无 |
| **Stats.tsx** | 152KB | 统计显示 | ❌ 无 |
| **StatusLine.tsx** | 49KB | 状态栏 | ❌ 无 |
| **TextInput.tsx** | 21KB | 文本输入 | ❌ 无 |
| **ThemePicker.tsx** | 36KB | 主题选择 | ❌ 无 |
| **ThinkingToggle.tsx** | 21KB | 思考切换 | ❌ 无 |
| **TokenWarning.tsx** | 21KB | Token 警告 | ❌ 无 |
| **VirtualMessageList.tsx** | 148KB | 虚拟消息列表 | ❌ 无 |

---

### 6️⃣ Ink TUI 引擎缺失

| Claude Ink 文件 | 大小 | 说明 | OpenClaw 状态 |
|-----------------|------|------|--------------|
| **ink.tsx** | 252KB | 核心 TUI 引擎 | ❌ 无自建引擎 |
| **render-node-to-output.ts** | 64KB | 渲染引擎 | ❌ 无 |
| **selection.ts** | 34KB | 选择功能 | ❌ 无 |
| **screen.ts** | 49KB | 屏幕管理 | ❌ 无 |
| **styles.ts** | 21KB | 样式系统 | ❌ 无 |
| **parse-keypress.ts** | 23KB | 键盘解析 | ❌ 无 |
| **reconciler.ts** | 14KB | React reconciler | ❌ 无 |
| **Ansi.tsx** | 33KB | ANSI 渲染 | ❌ 无 |
| **components/** | 20文件 | UI 组件 | ❌ 无 |

---

### 7️⃣ Bridge 远程连接缺失

| Claude Bridge 文件 | 大小 | 说明 | OpenClaw 状态 |
|--------------------|------|------|--------------|
| **bridgeMain.ts** | 115KB | Bridge 主逻辑 | ❌ 无 |
| **replBridge.ts** | 100KB | REPL Bridge | ❌ 无 |
| **remoteBridgeCore.ts** | 39KB | 远程 Bridge | ❌ 无 |
| **initReplBridge.ts** | 24KB | Bridge 初始化 | ❌ 无 |
| **bridgeApi.ts** | 18KB | Bridge API | ❌ 无 |
| **bridgeMessaging.ts** | 16KB | Bridge 消息 | ❌ 无 |
| **bridgeUI.ts** | 17KB | Bridge UI | ❌ 无 |

---

### 8️⃣ 权限系统差异

| Claude 权限功能 | 说明 | OpenClaw 状态 |
|-----------------|------|--------------|
| **yoloClassifier** | AI 自动分类审批 | ⚠️ 配置规则 |
| **classifierApprovals** | 分类审批追踪 | ❌ 无 |
| **permissionsLoader** | 权限加载器 | ⚠️ 不同实现 |
| **permissionExplainer** | 权限解释 | ❌ 无 |
| **swarmPermissionPoller** | Swarm 权限轮询 | ❌ 无 |

---

### 9️⃣ Hooks 系统缺失

| Claude Hook | 大小 | 说明 | OpenClaw 状态 |
|-------------|------|------|--------------|
| **useReplBridge.tsx** | 115KB | REPL Bridge hook | ❌ 无 |
| **useTypeahead.tsx** | 212KB | Typeahead hook | ❌ 无 |
| **useVoiceIntegration.tsx** | 99KB | 语音集成 hook | ❌ 无 |
| **useGlobalKeybindings.tsx** | 31KB | 全局键绑定 | ❌ 无 |
| **useCanUseTool.tsx** | 40KB | 工具使用判断 | ❌ 无 |
| **useArrowKeyHistory.tsx** | 34KB | 箭头键历史 | ❌ 无 |
| **useInboxPoller.ts** | 34KB | 收件箱轮询 | ❌ 无 |
| **useLspPluginRecommendation.tsx** | 21KB | LSP 推荐 | ❌ 无 |
| **useIDEIntegration.tsx** | 10KB | IDE 集成 | ❌ 无 |
| **useRemoteSession.ts** | 23KB | 远程会话 | ❌ 无 |
| **useVirtualScroll.ts** | 35KB | 虚拟滚动 | ❌ 无 |
| **useVoice.ts** | 45KB | 语音 hook | ❌ 无 |

---

### 🔟 其他核心差异

| 功能 | Claude | OpenClaw |
|------|--------|----------|
| **main.tsx** | 785KB 主入口 | 简化架构 |
| **QueryEngine.ts** | 46KB 查询引擎 | ❌ 无 |
| **query.ts** | 67KB 查询逻辑 | ❌ 无 |
| **interactiveHelpers.tsx** | 56KB 交互辅助 | ❌ 无 |
| **cost-tracker.ts** | 10KB 成本追踪 | ❌ 无 |
| **coordinator/** | Agent 协调器 | ❌ 无 |
| **native-ts/** | Native 模块 | ❌ 无 |

---

## 总结

### 已覆盖 (Skills 层面)
- ✅ 10 个核心 Skills 已创建
- ✅ 记忆系统已启用
- ✅ 上下文压缩已启用
- ✅ Sandbox 已配置
- ✅ 自动审批规则已配置

### 工具层缺失
- ❌ 25+ 个 Tools 未实现
- ❌ PowerShell 支持
- ❌ Team/Task 工具系列
- ❌ MCP 工具系列

### 命令层缺失
- ❌ 30+ 个 Commands 未实现
- ❌ Voice 模式
- ❌ IDE 集成
- ❌ Bridge 远程

### UI/组件层缺失
- ❌ 50+ 个 UI 组件
- ❌ Ink TUI 引擎
- ❌ 全部 React 组件

### 服务层缺失
- ❌ 15+ 个 Services
- ❌ Voice 流式 STT
- ❌ 自动梦境
- ❌ 设置同步

### 架构差异
- Claude: 1332 TypeScript 文件
- OpenClaw: 2412 编译 JS 文件（不同架构）
- Claude: 自建 Ink TUI 引擎
- OpenClaw: 依赖外部库

---

_分析完成：2026-04-11_