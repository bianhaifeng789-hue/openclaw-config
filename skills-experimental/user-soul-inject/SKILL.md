---
name: user-soul-inject
description: Inject USER.md (global user profile) and SOUL.md (agent personality) into agent context for personalized behavior. Automatically loads user preferences and agent identity from standardized files. Use when configuring agent identity or user profile injection.
---

# USER.md + SOUL.md Inject

借鉴 DeerFlow 2.0 的 USER.md/SOUL.md 注入机制。

## Why This Matters

Agent 行为应该个性化：
- **USER.md** - 全局用户偏好（注入所有 agent）
- **SOUL.md** - Agent personality/identity（注入特定 agent）

**DeerFlow 机制**:
- USER.md 放在 `{base_dir}/USER.md`
- SOUL.md 放在 `agents/{agent_name}/SOUL.md`
- 自动注入到 agent context

## Directory Layout

```
{base_dir}/
├── USER.md                <-- Global user profile (all agents)
├── agents/
│   └── {agent_name}/
│       ├── config.yaml    <-- Agent config
│       ├── SOUL.md        <-- Agent personality
│       └── memory.json    <-- Agent memory
```

## USER.md Template

```markdown
# USER.md - Global User Profile

## Preferences

- **Language**: Chinese / English
- **Communication Style**: Direct / Detailed
- **Response Length**: Concise / Comprehensive
- **Tone**: Professional / Friendly / Casual

## Interests

- Topics of interest
- Preferred domains
- Common use cases

## Constraints

- Budget constraints
- Time constraints
- Privacy requirements

## Notes

- Any additional context
- Frequently asked questions
- Common workflows

---

_This file is injected into all agents._
```

## SOUL.md Template

```markdown
# SOUL.md - Agent Personality/Identity

## Agent Name

{agent_name}

## Purpose

- Primary responsibilities
- Core capabilities
- Scope of work

## Personality

- Tone and style
- Decision preferences
- Communication approach

## Strengths

- Key strengths
- Expertise areas
- Problem-solving style

## Weaknesses

- Known limitations
- When to escalate
- Avoid doing X

## Identity

- Who am I?
- What makes me unique?
- My signature approach

---

_This file defines the agent's personality._
_Injected alongside lead prompt._
```

## Injection Mechanism

**DeerFlow 实现**:
```python
# Load USER.md
user_profile = Path(base_dir) / "USER.md"
if user_profile.exists():
    user_context = user_profile.read_text()
    # Inject into agent context

# Load SOUL.md
soul_file = Path(agents_dir) / agent_name / "SOUL.md"
if soul_file.exists():
    soul_context = soul_file.read_text()
    # Inject alongside lead prompt
```

**OpenClaw 实现**:
```javascript
const paths = getPaths();

// Load USER.md
if (fs.existsSync(paths.userProfileFile)) {
  const userProfile = fs.readFileSync(paths.userProfileFile, 'utf8');
  // Inject into agent context
}

// Load SOUL.md
const soulFile = paths.agentSoulFile(agentName);
if (fs.existsSync(soulFile)) {
  const soul = fs.readFileSync(soulFile, 'utf8');
  // Inject alongside lead prompt
}
```

## Paths Integration

**impl/bin/paths.js**:
- `paths.userProfileFile` - USER.md path
- `paths.agentSoulFile(agentName)` - SOUL.md path
- `paths.agentDir(agentName)` - Agent directory

**创建 agent 目录**:
```bash
node impl/bin/paths.js agent dispatcher
```

## Example Usage

**创建 USER.md**:
```bash
echo "# USER.md - Global User Profile\n\n## Preferences\n- Language: Chinese\n- Style: Direct\n" > .openclaw-data/USER.md
```

**创建 SOUL.md**:
```bash
mkdir -p .openclaw-data/agents/dispatcher
echo "# SOUL.md - Dispatcher Agent\n\n## Purpose\n- Task orchestration\n- Resource allocation\n" > .openclaw-data/agents/dispatcher/SOUL.md
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Personalization** | Agent behavior tailored to user |
| **Consistency** | All agents share user context |
| **Identity** | Agent has clear personality |
| **Evolution** | Profile evolves over time |

## Borrowed From

DeerFlow 2.0 - `backend/packages/harness/deerflow/config/paths.py`

**关键借鉴**:
- USER.md global user profile
- SOUL.md agent personality/identity
- 自动注入机制

---

_创建时间: 2026-04-15_
_借鉴来源: https://github.com/bytedance/deer-flow_