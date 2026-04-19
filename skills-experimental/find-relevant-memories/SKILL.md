---
name: find-relevant-memories
description: |
  Scan memory directory and find files relevant to the current query.
  
  Use when:
  - Starting a new conversation and need to recall relevant context
  - User asks about something that might be in memory files
  - Before answering questions about prior work, decisions, or preferences
  - When memory_search returns low confidence results
  
  NOT for:
  - MEMORY.md (already loaded in system prompt)
  - Simple Q&A that doesn't need memory context
  - When memory directory is empty
  
  Keywords:
  - "recall", "remember", "what did we", "previous", "last time", "相关记忆", "回忆"
metadata:
  openclaw:
    emoji: "🔍"
    source: claude-code-memdir
    triggers: [session-start, explicit-request]
    priority: P0
---

# Find Relevant Memories

扫描记忆目录，找出与当前查询语义相关的记忆文件，注入到上下文中。

## 核心逻辑（来自 Claude Code memdir）

Claude Code 的实现：
1. 扫描 `~/.claude/projects/<path>/memory/` 目录下所有 `.md` 文件
2. 读取每个文件的 frontmatter（前30行），提取 `description` 和 `type`
3. 格式化为 manifest 列表
4. 用 Sonnet 做侧边查询（sideQuery），选出最相关的最多5个文件
5. 将选中的文件内容注入到对话上下文

## OpenClaw 适配实现

### 步骤 1：扫描记忆目录

```
memory_dir = ~/.openclaw/workspace/memory/
```

扫描所有 `.md` 文件（排除 MEMORY.md），读取 frontmatter：

```
for each .md file in memory_dir:
  read first 30 lines
  extract frontmatter: description, type
  record: filename, mtime, description, type
sort by mtime descending, cap at 200 files
```

### 步骤 2：格式化 manifest

```
- [type] filename (ISO timestamp): description
- 2026-04-13.md (2026-04-13T10:00:00Z): Daily notes for April 13
- heartbeat-state.json (2026-04-13T09:00:00Z): Heartbeat task state
```

### 步骤 3：语义选择

用当前查询 + manifest，判断哪些文件相关：

**选择标准**：
- 最多选5个
- 只选"明确有用"的，不确定就不选
- 如果最近用过某工具，不选该工具的参考文档（但选包含警告/已知问题的）

### 步骤 4：读取并注入

用 `read` 工具读取选中的文件，将内容作为上下文。

## 执行流程

```
1. 列出 memory/ 目录文件
2. 读取每个文件的前30行（frontmatter）
3. 构建 manifest 字符串
4. 根据当前查询判断相关性（自行判断，无需额外 API 调用）
5. 用 read 工具读取相关文件
6. 将内容注入到回复上下文
```

## 记忆新鲜度

参考 Claude Code 的 memoryAge 逻辑：
- 0天 = "today"
- 1天 = "yesterday"  
- 2天+ = "X days ago"

**超过1天的记忆**需要加提示：
> 这条记忆已有 X 天。记忆是时间点快照，不是实时状态——关于代码行为或文件位置的描述可能已过时，请在断言前验证。

## 记忆文件格式（推荐）

在记忆文件头部加 frontmatter 以便被检索：

```markdown
---
description: "2026-04-13 工作日志：完成了 extract-memories skill 创建"
type: daily-note
---
```

类型（type）：
- `daily-note` — 日常笔记
- `project` — 项目相关
- `decision` — 重要决策
- `reference` — 参考资料
- `preference` — 用户偏好
