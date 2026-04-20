# claude-code-hooks-mastery 到 OpenClaw 的迁移分析

下载时间：2026-04-21 02:03 Asia/Shanghai

---

## 项目概览

**来源**：https://github.com/disler/claude-code-hooks-mastery

**项目结构**：
```
.claude/
├── hooks/              # 13个 hook 脚本（Python + UV）
├── commands/           # 15个自定义命令
├── agents/             # Agent 定义（Builder/Validator）
├── output-styles/      # 8种输出格式化样式
├── status_lines/       # 9个版本的状态栏脚本
├── settings.json       # Claude Code 配置
└── data/               # Session 数据存储
```

---

## OpenClaw Hook 系统对比

### OpenClaw 支持的 Hook 事件

根据 OpenClaw 文档和现有配置，支持的 events：
- `PreToolUse` ✅
- `PostToolUse` ✅
- `PostModelUse` ✅（OpenClaw 特有）
- `Stop` ✅
- `Notification` ✅

### Claude Code Hooks Mastery 的 Hook 事件

- `PreToolUse` ✅
- `PostToolUse` ✅
- `PostToolUseFailure` ✅（OpenClaw 未明确支持）
- `Stop` ✅
- `Notification` ✅
- `UserPromptSubmit` ❌（OpenClaw 未支持）
- `PreCompact` ❌（OpenClaw 未支持）
- `SessionStart` ❌（OpenClaw 未支持）
- `SessionEnd` ❌（OpenClaw 未支持）
- `PermissionRequest` ❌（OpenClaw 未支持）
- `SubagentStart` ❌（OpenClaw 未支持）
- `SubagentStop` ❌（OpenClaw 未支持）
- `Setup` ❌（OpenClaw 未支持）

**兼容性总结**：
- ✅ **5个直接兼容**：PreToolUse、PostToolUse、Stop、Notification
- ❌ **8个需要适配或缺失**：UserPromptSubmit、PreCompact、SessionStart、SessionEnd、PermissionRequest、SubagentStart、SubagentStop、Setup

---

## 可以迁移的功能

### 1. Status Lines（高价值，可直接迁移）

**功能**：Powerline 风格状态栏，显示：
- 模型名称
- Git 分支
- 当前路径
- 上下文使用率 (%)

**迁移方式**：
- OpenClaw 支持 `statusLine` 配置（在 openclaw.json）
- 修改 status_line_v9.py，使其适配 OpenClaw 的 JSON 输入格式
- 配置：`agents.defaults.statusLine.command`

**价值**：
- 实时监控上下文使用率（防止爆 context）
- Git 分支提醒（避免在错误分支工作）
- 路径提醒（知道当前工作目录）

---

### 2. Output Styles（高价值，可作为 skills）

**8种样式**：
- `bullet-points.md` - 简洁要点
- `genui.md` - UI生成
- `html-structured.md` - HTML结构化输出
- `markdown-focused.md` - Markdown专注
- `table-based.md` - 表格组织
- `tts-summary.md` - TTS摘要
- `ultra-concise.md` - 超简洁
- `yaml-structured.md` - YAML配置

**迁移方式**：
- 转换为 OpenClaw skills
- 每个样式对应一个 skill
- SKILL.md 定义输出格式要求

**价值**：
- 统一输出格式，提高可读性
- 针对不同场景选择最佳样式
- HTML structured 特别适合 Feishu（支持富文本）

---

### 3. TTS 语音通知（高价值）

**stop.py 的 TTS 功能**：
- 任务完成时播放语音提醒
- 多 provider 优先级：ElevenLabs > OpenAI > pyttsx3
- 防止重叠播放（锁机制）

**迁移方式**：
- 从 stop.py 提取 TTS 逻辑
- 创建独立的 `tts-notify.py` hook
- 集成到 OpenClaw 的 Notification hook

**价值**：
- 任务完成时自动提醒（不用盯着屏幕）
- 支持 ElevenLabs（高质量语音）
- 支持 OpenClaw 内置 TTS（可能更快）

---

### 4. Session 数据管理（中价值）

**user_prompt_submit.py 的功能**：
- Session ID 管理
- Prompt 日志记录
- Agent name 自动生成（基于 prompt）

**迁移方式**：
- OpenClaw 已有 session 管理，但可以增强：
  - Prompt 日志记录
  - Agent name 生成（OpenClaw 支持）
  - Session 数据持久化

**价值**：
- 跨 session 追踪
- Prompt 历史（调试/审计）
- Agent name（个性化）

---

### 5. Git Status 注入（中价值）

**session_start.py 的功能**：
- 获取当前分支
- 未提交修改计数
- GitHub issues 获取（通过 gh CLI）

**迁移方式**：
- 提取为独立的 `git-context-injector.js` hook
- 在 PostModelUse 或 PreToolUse 时注入 git status

**价值**：
- 防止在错误分支工作
- 知道当前修改状态
- Issues 提醒（待处理任务）

---

### 6. Validators（中价值）

**validators 目录**：
- 代码质量检查
- 安全审计

**迁移方式**：
- 转换为 OpenClaw skills
- 在 PostToolUse 时调用 validators

**价值**：
- 自动代码质量检查
- 安全审计（强化 block-secrets.py）

---

### 7. Commands（低价值，需要适配）

**15个命令**：
- `/plan` - 规划命令
- `/cook` - 研究命令
- `/git_status` - Git 状态
- `/question` - 提问助手
- `/prime` - 启动助手

**迁移方式**：
- OpenClaw 使用 skills 而非 slash commands
- 需要将 commands 转换为 skills
- 或保持 commands 目录供参考

**价值**：
- 快速访问常用功能
- 但 OpenClaw 的 skills 更强大

---

### 8. Agents（低价值，已有类似功能）

**Agent 定义**：
- `meta-agent.md` - Meta agent
- `hello-world-agent.md` - 示例
- `team/` - Builder/Validator 模式

**迁移方式**：
- OpenClaw 已有 subagent 系统
- Team 模式可以借鉴（Builder/Validator）

**价值**：
- Team-based validation 很有价值
- 但需要适配 OpenClaw 的 subagent API

---

## 不能直接迁移的功能

### 1. UserPromptSubmit（OpenClaw 未支持）

**原因**：OpenClaw 的 hook 系统没有在 user prompt submit 时触发的事件

**影响**：
- 无法实现 prompt validation
- 无法实现 context injection（基于 prompt）

**替代方案**：
- 在 `PreToolUse` 或 `PostModelUse` 时实现类似功能
- 或等待 OpenClaw 支持 UserPromptSubmit event

---

### 2. PreCompact（OpenClaw 未支持）

**原因**：OpenClaw 有 compaction，但没有 PreCompact hook

**影响**：
- 无法在 compaction 前备份数据
- 无法自定义 compaction 触发条件

**替代方案**：
- OpenClaw 的 compaction 是自动的
- 可以在 Stop hook 中检查是否即将 compaction

---

### 3. SessionStart/SessionEnd（OpenClaw 未支持）

**原因**：OpenClaw 的 session lifecycle 与 Claude Code 不同

**影响**：
- 无法在 session start 时注入 context
- 无法在 session end 时清理数据

**替代方案**：
- OpenClaw 有 PostModelUse(firstExchange=true) 可以替代 SessionStart
- SessionEnd 可以用 Stop hook 替代

---

### 4. PermissionRequest（OpenClaw 未支持）

**原因**：OpenClaw 的权限系统不同

**影响**：
- 无法审计权限请求
- 无法自动允许某些权限

**替代方案**：
- OpenClaw 的权限系统已经比较完善
- 可以在 PreToolUse 时检查权限

---

## 迁移优先级

### P0（立即迁移）

1. **Status Lines**
   - 修改 status_line_v9.py → status_line_openclaw.py
   - 配置 agents.defaults.statusLine
   - 测试并激活

2. **TTS 语音通知**
   - 提取 stop.py 的 TTS 逻辑
   - 创建 tts-notify.py hook
   - 集成到 Notification hook

### P1（本周迁移）

3. **Git Status 注入**
   - 创建 git-context-injector.js
   - 集成到 PostModelUse 或 PreToolUse

4. **Output Styles（3个）**
   - html-structured → skill（Feishu 适用）
   - ultra-concise → skill（简洁模式）
   - bullet-points → skill（要点模式）

### P2（下月迁移）

5. **Session 数据管理**
   - 增强 OpenClaw 的 session 管理
   - Prompt 日志记录
   - Agent name 生成

6. **Validators**
   - 转换为 OpenClaw skills
   - 集成到 PostToolUse

### P3（可选）

7. **Commands 转换**
   - 转换为 skills（需要时）

8. **Team-Based Validation**
   - 实现 Builder/Validator 模式（需要深入研究）

---

## 具体迁移步骤

### Status Lines 迁移

1. **修改 status_line_v9.py**
   - 保持 Powerline 风格
   - 适配 OpenClaw 的 JSON 输入格式
   - 测试：`python3 status_line_openclaw.py '{"model":{"display_name":"GLM-5"},"workspace":{"current_dir":"/path"},"context_window":{"used_percentage":30}}'`

2. **配置 OpenClaw**
   ```json
   {
     "agents": {
       "defaults": {
         "statusLine": {
           "type": "command",
           "command": "python3 ~/.openclaw/hooks/status_line_openclaw.py",
           "padding": 0
         }
       }
     }
   }
   ```

3. **测试并激活**
   - Restart gateway
   - 观察状态栏显示

---

### TTS 语音通知迁移

1. **提取 TTS 逻辑**
   - 从 stop.py 提取 TTS 相关代码
   - 创建独立的 tts_notify.py

2. **集成到 Notification hook**
   ```json
   {
     "hooks": [
       {
         "event": "Notification",
         "command": "python3 ~/.openclaw/hooks/tts_notify.py",
         "description": "TTS notification on task completion"
       }
     ]
   }
   ```

3. **配置 providers**
   - 优先级：ElevenLabs > OpenAI > OpenClaw内置
   - 锁机制防止重叠

---

### Git Status 注入迁移

1. **创建 git-context-injector.js**
   ```javascript
   // Get git status
   const branch = execSync('git rev-parse --abbrev-ref HEAD');
   const changes = execSync('git status --porcelain');

   // Inject to context
   return {
     prependContext: `[git] Branch: ${branch}, Uncommitted: ${changes.length} files`
   };
   ```

2. **集成到 PostModelUse**
   ```json
   {
     "hooks": [
       {
         "event": "PostModelUse",
         "matcher": {"firstExchange": true},
         "command": "node ~/.openclaw/hooks/git-context-injector.js"
       }
     ]
   }
   ```

---

## 预期效果

### Status Lines
- 实时监控上下文（防止爆 context）
- Git 分支提醒（避免错误分支）
- 路径提醒（知道工作目录）

### TTS 语音通知
- 任务完成时语音提醒
- 不用盯着屏幕等待
- 高质量语音（ElevenLabs）

### Git Status 注入
- 每次 session start 知道当前状态
- 未提交修改提醒
- Issues 提醒（待处理）

### Output Styles
- 统一输出格式
- Feishu 适用 HTML structured
- 简洁模式适用快速对话

---

## 风险与限制

### 1. UV 依赖
- Claude Code Hooks Mastery 使用 UV 单文件脚本
- OpenClaw 可以直接用 Python/Node.js
- 不需要 UV，但需要确保 Python 依赖已安装

### 2. Hook 事件缺失
- 8个 hook 事件 OpenClaw 未支持
- 部分功能无法实现（UserPromptSubmit、PreCompact）
- 需要等待 OpenClaw 扩展 hook 系统

### 3. 配置格式差异
- Claude Code 使用 settings.json
- OpenClaw 使用 openclaw.json + hooks-config.json
- 需要适配配置格式

---

## 总结

**可迁移功能**：8个（Status Lines、TTS、Git Status、Output Styles、Session Data、Validators、Commands、Agents）

**直接兼容**：5个 hooks（PreToolUse、PostToolUse、Stop、Notification、PostModelUse）

**高价值迁移**：Status Lines（P0）、TTS（P0）、Git Status（P1）、Output Styles（P1）

**预期效果**：实时状态监控、语音提醒、Git提醒、统一输出格式

**下一步**：P0 功能迁移（Status Lines + TTS）

---

_分析人：Claw_
_分析时间：2026-04-21 02:03 Asia/Shanghai_