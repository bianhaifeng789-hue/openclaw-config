---
name: file-search
description: "Fast file search using glob patterns and grep regex. Glob for filename patterns, Grep for content search. Use when: finding files, searching code, pattern matching."
metadata:
  openclaw:
    emoji: "🔍"
    triggers: [file-search, code-search]
    feishuCard: true
---

# File Search Skill - 文件搜索

使用 Glob 和 Grep 快速搜索文件和内容。

## 为什么需要这个？

**场景**：
- 查找文件（glob pattern）
- 搜索代码内容（grep regex）
- 模式匹配
- 快速定位

**Claude Code 方案**：GlobTool + GrepTool + ripgrep
**OpenClaw 飞书适配**：exec + find/grep + 飞书卡片结果

---

## Glob 搜索

### 基础模式

```bash
# 查找所有 .ts 文件
find . -name "*.ts"

# 查找所有 Skill 文件
find . -path "**/SKILL.md"

# 查找特定目录
find skills -name "*.md"
```

### Glob Pattern 示例

| Pattern | 说明 |
|---------|------|
| `*.ts` | 所有 .ts 文件 |
| `**/*.md` | 所有子目录 .md 文件 |
| `src/**/*.ts` | src 目录下所有 .ts |
| `skills/*/SKILL.md` | 所有 Skill 文件 |

---

## Grep 搜索

### 基础用法

```bash
# 搜索关键词
grep -r "keyword" .

# 搜索正则
grep -rE "pattern.*match" .

# 搜索特定文件
grep -r "keyword" --include="*.ts"

# 排除目录
grep -r "keyword" --exclude-dir=node_modules
```

### Grep Pattern 示例

| Pattern | 说明 |
|---------|------|
| `"TODO"` | 搜索 TODO |
| `"function.*name"` | 搜索函数定义 |
| `"import.*from"` | 搜索 import 语句 |
| `"type.*="` | 搜索类型定义 |

---

## 飞书卡片格式

### Glob 结果卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔍 Glob 搜索结果**\n\n**Pattern**：`**/*.md`\n\n**找到**：45 个文件\n\n**结果**：\n• `MEMORY.md`\n• `HEARTBEAT.md`\n• `skills/memory-maintenance/SKILL.md`\n• `skills/insights/SKILL.md`\n• `skills/todo-write/SKILL.md`\n...\n\n（显示前 20 个，共 45 个）"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "查看全部"},
          "type": "primary",
          "value": {"action": "view_all", "pattern": "**/*.md"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "Grep 搜索内容"},
          "type": "default",
          "value": {"action": "grep_search"}
        }
      ]
    }
  ]
}
```

### Grep 结果卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔍 Grep 搜索结果**\n\n**Pattern**：`TODO`\n\n**找到**：12 个匹配\n\n**结果**：\n\n**`src/main.ts`:42**\n```typescript\n// TODO: implement this\n```\n\n**`src/utils.ts:15**\n```typescript\n// TODO: fix bug\n```\n\n**`skills/memory-maintenance/SKILL.md:30**\n```markdown\n- TODO: 添加自动触发\n```\n...\n\n（显示前 10 个，共 12 个）"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "使用 Glob 查找更多文件"}
      ]
    }
  ]
}
```

---

## 执行流程

### 1. Glob 搜索

```typescript
async function globSearch(pattern: string): Promise<string[]> {
  // 使用 find 命令
  const result = await exec(`find . -path "${pattern}"`)
  
  // 解析结果
  const files = result.split('\n').filter(f => f.trim())
  
  return files
}
```

### 2. Grep 搜索

```typescript
async function grepSearch(pattern: string, options?: GrepOptions): Promise<GrepMatch[]> {
  // 构建 grep 命令
  let cmd = `grep -rE "${pattern}" .`
  
  if (options?.include) {
    cmd += ` --include="${options.include}"`
  }
  
  if (options?.excludeDir) {
    cmd += ` --exclude-dir="${options.excludeDir}"`
  }
  
  // 执行
  const result = await exec(cmd)
  
  // 解析结果
  const matches = parseGrepOutput(result)
  
  return matches
}
```

### 3. 格式化结果

```
Agent:
1. 执行搜索命令
2. 解析结果
3. 限制显示数量（避免过多）
4. 格式化飞书卡片
5. 发送结果
```

---

## 结果限制

**限制数量**：
- Glob: 默认显示前 20 个
- Grep: 默认显示前 10 个

**避免过多**：
- 过多结果 → 提示用户缩小范围
- 提供更精确的 pattern 建议

---

## 持久化存储

```json
// memory/file-search-state.json
{
  "searchesPerformed": [
    {
      "id": "search-1",
      "type": "glob",
      "pattern": "**/*.md",
      "resultsCount": 45,
      "timestamp": "2026-04-11T23:00:00Z"
    },
    {
      "id": "search-2",
      "type": "grep",
      "pattern": "TODO",
      "resultsCount": 12,
      "timestamp": "2026-04-11T23:10:00Z"
    }
  ],
  "stats": {
    "globSearches": 0,
    "grepSearches": 0,
    "totalResults": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| GlobTool | exec + find |
| GrepTool | exec + grep |
| ripgrep | 系统 grep 或 ripgrep |
| Terminal UI | 飞书卡片结果 |
| result limit | 同样限制数量 |

---

## 注意事项

1. **Pattern 转义**：正确转义特殊字符
2. **结果限制**：避免显示过多结果
3. **性能优化**：使用 exclude-dir 排除 node_modules
4. **文件编码**：处理不同编码文件
5. **正则语法**：使用 -E 扩展正则

---

## 自动启用

此 Skill 在用户请求文件搜索时自动触发。

---

## 下一步增强

- ripgrep 使用（如果可用）
- 搜索历史
- 搜索结果缓存
- 搜索结果可视化