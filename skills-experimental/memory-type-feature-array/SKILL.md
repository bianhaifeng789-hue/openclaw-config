# Memory Type Feature Array Pattern

## Source
Claude Code: `utils/memory/types.ts` (MEMORY_TYPE_VALUES)

## Pattern
Feature-gated const array + spread conditional + as const narrowing.

## Code Example
```typescript
import { feature } from 'bun:bundle'

export const MEMORY_TYPE_VALUES = [
  'User',
  'Project',
  'Local',
  'Managed',
  'AutoMem',
  ...(feature('TEAMMEM') ? (['TeamMem'] as const) : []),
] as const

export type MemoryType = (typeof MEMORY_TYPE_VALUES)[number]
```

## Key Concepts
1. **Base Array**: User, Project, Local, Managed, AutoMem always present
2. **Feature Gate**: feature('TEAMMEM') check for TeamMem inclusion
3. **Conditional Spread**: ...(feature() ? ['TeamMem'] as const : [])
4. **as const Narrowing**: Array literal becomes readonly tuple
5. **Type Extraction**: (typeof MEMORY_TYPE_VALUES)[number] for union type

## Benefits
- Feature-gated enum without duplication
- Type-safe union from runtime array
- Conditional inclusion via spread

## When to Use
- Feature-gated constant arrays
- Runtime-configurable enums
- Type extraction from const arrays

## Related Patterns
- Feature Conditional Import (feature-conditional-import)
- Backend Type Discriminated Union (backends/types.ts)
- Todo Item Status Schema (todo/types.ts)