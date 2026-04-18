---
name: memory-scan
description: |
  Scan memory directory and build a manifest of all memory files with their metadata.
  Used as a primitive by find-relevant-memories and extract-memories.
  
  Use when:
  - Need to list all available memory files
  - Building context for memory selection
  - Checking what memories exist before extraction
metadata:
  openclaw:
    emoji: "📂"
    source: claude-code-memdir
    triggers: [internal]
    priority: P1
---

# Memory Scan

扫描记忆目录，构建记忆文件清单。

## 实现（来自 Claude Code memoryScan.ts）

```
memory_dir = ~/.openclaw/workspace/memory/

1. readdir(memory_dir, recursive=true)
2. filter: .md files, exclude MEMORY.md
3. for each file:
   - read first 30 lines
   - parse frontmatter: description, type
   - record mtime
4. sort by mtime descending
5. cap at 200 files
```

## 输出格式

```
- [type] filename (ISO timestamp): description
```

示例：
```
- [daily-note] 2026-04-13.md (2026-04-13T10:00:00.000Z): 工作日志
- [project] swarm-state.json (2026-04-12T08:00:00.000Z): Swarm 状态
- heartbeat-state.json (2026-04-11T20:00:00.000Z)
```

## 在 OpenClaw 中执行

```bash
ls ~/.openclaw/workspace/memory/ 
```

然后逐个读取文件头部（前30行）提取 frontmatter。
