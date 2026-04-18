# Todo Item Status Schema Pattern

## Source
Claude Code: `utils/todo/types.ts` (TodoItemSchema, TodoStatusSchema)

## Pattern
Zod lazy schema for todo item with 3-status enum + content + activeForm.

## Code Example
```typescript
import { z } from 'zod/v4'
import { lazySchema } from '../lazySchema.js'

const TodoStatusSchema = lazySchema(() =>
  z.enum(['pending', 'in_progress', 'completed']),
)

export const TodoItemSchema = lazySchema(() =>
  z.object({
    content: z.string().min(1, 'Content cannot be empty'),
    status: TodoStatusSchema(),
    activeForm: z.string().min(1, 'Active form cannot be empty'),
  }),
)
export type TodoItem = z.infer<ReturnType<typeof TodoItemSchema>>

export const TodoListSchema = lazySchema(() => z.array(TodoItemSchema()))
export type TodoList = z.infer<ReturnType<typeof TodoListSchema>>
```

## Key Concepts
1. **lazySchema**: Deferred schema creation (avoid circular dependency, reduce bundle)
2. **TodoStatus**: 3-state enum - pending, in_progress, completed
3. **TodoItem**: content (min 1 char) + status + activeForm (min 1 char)
4. **activeForm**: Active form of todo (e.g., "Working on..." vs "Fix...")
5. **Type Inference**: z.infer<ReturnType<typeof TodoItemSchema>>

## Benefits
- Deferred schema creation for bundle optimization
- Explicit 3-state enum for clarity
- Content validation prevents empty todos
- activeForm for context-aware display

## When to Use
- Todo/task tracking schemas
- Status enum patterns
- Zod lazy schema usage

## Related Patterns
- Lazy Schema Pattern (lazySchema.ts)
- Zod JSON Schema Pattern (zodToJsonSchema.ts)
- Todo Write Tool (TodoWriteTool.ts)