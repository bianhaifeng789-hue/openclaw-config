---
name: commit-attribution
description: "Commit/PR attribution text generation. Model name sanitization. Internal vs external repo detection. Co-authored-by format. Use when [commit attribution] is needed."
metadata:
  openclaw:
    emoji: "📝"
    triggers: [commit, pr, git-operation]
    feishuCard: true
---

# Commit Attribution Skill - 提交归属

生成 commit 和 PR 的归属文本，清理模型名称。

## 为什么需要这个？

**场景**：
- Git commit attribution
- PR description attribution
- Model name sanitization
- Internal repo detection

**Claude Code 方案**：attribution.ts + commitAttribution.ts
**OpenClaw 飞书适配**：飞书提交归属 + 模型名处理

---

## Attribution 格式

### Commit Attribution

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

### PR Attribution

```
🤖 Generated with [Claude Code](https://claude.ai/code)
```

---

## Model Name Sanitization

```typescript
// 内部 repo 使用真实模型名
// 外部 repo 使用通用名称避免泄露 codenames

function sanitizeModelName(model: string, isInternal: boolean): string {
  if (isInternal) {
    return getPublicModelName(model)
  }
  
  // 外部 repo：使用 "Claude" 避免 codename 泄露
  return 'Claude'
}
```

---

## Internal Repo Detection

```typescript
// Internal repo allowlist
const INTERNAL_REPO_PATTERNS = [
  /anthropic\.com/i,
  /claude\.ai/i,
  /internal.*repo/i
]

function isInternalRepo(remote: string): boolean {
  return INTERNAL_REPO_PATTERNS.some(p => p.test(remote))
}
```

---

## 飞书卡片格式

### Attribution Preview 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📝 Attribution Preview**\n\n---\n\n**Commit Attribution**：\n```\nCo-Authored-By: Claude <noreply@anthropic.com>\n```\n\n**PR Attribution**：\n```\n🤖 Generated with [Claude Code](https://claude.ai/code)\n```\n\n---\n\n**Repo 类型**：External\n\n**模型名**：Claude（sanitized）\n\n---\n\n**是否添加 attribution？**"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "添加 Attribution"},
          "type": "primary"
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "跳过"},
          "type": "default"
        }
      ]
    }
  ]
}
```

---

## 执行流程

### 1. 检测 Repo 类型

```
Commit Attribution:
1. 检测 git remote
2. 判断是否 internal repo
3. 选择模型名（真实/sanitized）
4. 生成 attribution 文本
```

### 2. 生成 Attribution

```typescript
function getAttributionTexts(): AttributionTexts {
  const isInternal = isInternalRepoCached()
  const model = getMainLoopModel()
  
  const modelName = sanitizeModelName(model, isInternal)
  
  return {
    commit: `Co-Authored-By: ${modelName} <noreply@anthropic.com>`,
    pr: `🤖 Generated with [Claude Code](${PRODUCT_URL})`
  }
}
```

---

## 持久化存储

```json
// memory/commit-attribution-state.json
{
  "attributions": [
    {
      "commit": "abc123",
      "model": "Claude",
      "repoType": "external",
      "timestamp": "2026-04-12T00:00:00Z"
    }
  ],
  "stats": {
    "totalAttributions": 0,
    "internalAttributions": 0,
    "externalAttributions": 0
  },
  "config": {
    "includeAttribution": true,
    "internalRepoPatterns": []
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| getAttributionTexts() | Skill + 函数 |
| isInternalModelRepo() | Repo detection |
| sanitizeModelName() | Model name clean |
| Undercover mode | 飞书场景适配 |

---

## 注意事项

1. **Internal repo**：使用真实模型名
2. **External repo**：使用 "Claude" 避免 codename 泄露
3. **Undercover mode**：不添加 attribution
4. **飞书适配**：飞书场景的 attribution 格式
5. **用户选择**：可选添加或不添加

---

## 自动启用

此 Skill 在 git commit 或 PR 创建时自动触发。

---

## 下一步增强

- 自定义 attribution 格式
- 飞书集成 attribution
- Attribution analytics