# Skill Loaded Analytics Event Pattern

## Source
Claude Code: `utils/telemetry/skillLoadedEvent.ts` (logSkillsLoaded)

## Pattern
Log tengu_skill_loaded event for each available skill at session startup + analytics metadata.

## Code Example
```typescript
import { getSkillToolCommands } from '../../commands.js'
import { logEvent } from '../../services/analytics/index.js'
import { getCharBudget } from '../../tools/SkillTool/prompt.js'

export async function logSkillsLoaded(
  cwd: string,
  contextWindowTokens: number,
): Promise<void> {
  const skills = await getSkillToolCommands(cwd)
  const skillBudget = getCharBudget(contextWindowTokens)

  for (const skill of skills) {
    if (skill.type !== 'prompt') continue

    logEvent('tengu_skill_loaded', {
      // _PROTO prefix routes to privileged BQ column
      // Unredacted names don't go in additional_metadata
      _PROTO_skill_name: skill.name as AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED,

      skill_source: skill.source as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      skill_loaded_from: skill.loadedFrom as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      skill_budget: skillBudget,

      ...(skill.kind && {
        skill_kind: skill.kind as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
      }),
    })
  }
}

// Called during session startup:
await logSkillsLoaded(cwd, contextWindowTokens)
```

## Key Concepts
1. **tengu_skill_loaded Event**: Analytics event name
2. **_PROTO Prefix**: Routes to privileged BQ column (skill_name)
3. **PII Tagged**: AnalyticsMetadata_I_VERIFIED_THIS_IS_PII_TAGGED type
4. **Not Code Tag**: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
5. **Skill Budget**: getCharBudget(contextWindowTokens) for budget tracking
6. **Conditional Spread**: skill_kind only if skill.kind exists

## Benefits
- Analytics on skill availability across sessions
- PII protection via special metadata types
- Budget correlation with skills

## When to Use
- Skill availability analytics
- Session startup logging
- Analytics metadata patterns

## Related Patterns
- Analytics Service (services/analytics/index.ts)
- Skill Tool Commands (commands.ts)
- Skill Budget (SkillTool/prompt.ts)