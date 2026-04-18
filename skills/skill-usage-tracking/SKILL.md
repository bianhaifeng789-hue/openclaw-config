---
name: skill-usage-tracking
description: |
  Track skill usage frequency and recency. Rank skills by usage score using 7-day exponential decay half-life. Debounce writes to avoid excessive I/O.
  
  Use when:
  - Recording that a skill was invoked
  - Ranking skills by usage for autocomplete/suggestions
  - Prioritizing frequently-used skills in skill lists
  
  Keywords: skill usage, skill ranking, usage tracking, skill score, recency decay
metadata:
  openclaw:
    emoji: "📊"
    source: claude-code-skill-usage-tracking
    triggers: [skill-ranking, usage-score, skill-frequency]
    priority: P2
---

# Skill Usage Tracking

基于 Claude Code `utils/suggestions/skillUsageTracking.ts` 的 skill 使用频率追踪和排名系统。

## 核心算法（直接来自 Claude Code）

### 评分公式
```
score = usageCount × max(0.5^(daysSinceUse/7), 0.1)
```

- **7天半衰期**：7天前的使用价值减半
- **最低系数 0.1**：避免高频历史 skill 完全消失
- **防抖 60秒**：同一 skill 60秒内只写一次

### 示例
```
skill A: 使用 10 次，最后使用 0 天前 → score = 10 × 1.0 = 10.0
skill B: 使用 10 次，最后使用 7 天前 → score = 10 × 0.5 = 5.0
skill C: 使用 10 次，最后使用 30 天前 → score = 10 × 0.1 = 1.0（最低系数）
```

## OpenClaw 适配实现

### 存储格式（memory/skill-usage.json）
```json
{
  "memory-maintenance": {
    "usageCount": 15,
    "lastUsedAt": 1744545600000
  },
  "coding-agent": {
    "usageCount": 8,
    "lastUsedAt": 1744459200000
  }
}
```

### 实现

```javascript
const SKILL_USAGE_FILE = 'memory/skill-usage.json'
const DEBOUNCE_MS = 60_000
const lastWriteBySkill = new Map()

async function recordSkillUsage(skillName) {
  const now = Date.now()
  const lastWrite = lastWriteBySkill.get(skillName)
  
  // 防抖：60秒内不重复写
  if (lastWrite && now - lastWrite < DEBOUNCE_MS) return
  lastWriteBySkill.set(skillName, now)
  
  // 读取现有数据
  let data = {}
  try {
    data = JSON.parse(await readFile(SKILL_USAGE_FILE, 'utf-8'))
  } catch {}
  
  // 更新
  const existing = data[skillName] ?? { usageCount: 0, lastUsedAt: 0 }
  data[skillName] = {
    usageCount: existing.usageCount + 1,
    lastUsedAt: now,
  }
  
  await writeFile(SKILL_USAGE_FILE, JSON.stringify(data, null, 2))
}

function getSkillUsageScore(skillName) {
  const data = readSkillUsageSync()
  const usage = data[skillName]
  if (!usage) return 0
  
  const daysSinceUse = (Date.now() - usage.lastUsedAt) / (1000 * 60 * 60 * 24)
  const recencyFactor = Math.pow(0.5, daysSinceUse / 7)
  
  return usage.usageCount * Math.max(recencyFactor, 0.1)
}

// 按使用分数排序 skills
function rankSkillsByUsage(skillNames) {
  return skillNames
    .map(name => ({ name, score: getSkillUsageScore(name) }))
    .sort((a, b) => b.score - a.score)
    .map(({ name }) => name)
}
```

## 使用场景

### 在 heartbeat 中记录
```javascript
// 每次 skill 被调用时
await recordSkillUsage('memory-maintenance')
```

### 在 skill 列表中排序
```javascript
const skills = await listAvailableSkills()
const ranked = rankSkillsByUsage(skills.map(s => s.name))
// 最常用的 skill 排在前面
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 存储位置 | globalConfig（~/.claude/config.json） | memory/skill-usage.json |
| 防抖 | 进程内 Map | 进程内 Map（相同） |
| 半衰期 | 7天 | 7天（相同） |
| 最低系数 | 0.1 | 0.1（相同） |
