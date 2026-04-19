# Internal Write Echo Suppression Pattern

## Source
Claude Code: `utils/settings/internalWrites.ts` (53 lines)

## Pattern
Timestamp map to suppress file watcher echoes from own writes.

## Code Example
```typescript
const timestamps = new Map<string, number>()

// Mark before write (caller passes resolved path)
export function markInternalWrite(path: string): void {
  timestamps.set(path, Date.now())
}

// Consume on change detection (windowMs = 5000)
export function consumeInternalWrite(path: string, windowMs: number): boolean {
  const ts = timestamps.get(path)
  if (ts !== undefined && Date.now() - ts < windowMs) {
    timestamps.delete(path)  // One-shot - consume on match
    return true
  }
  return false
}

// Usage in changeDetector.ts handleChange:
if (consumeInternalWrite(path, INTERNAL_WRITE_WINDOW_MS)) {
  return  // Skip notification - our own write
}
```

## Key Concepts
1. **Mark Before Write**: timestamps.set(path, Date.now())
2. **Consume on Match**: timestamps.delete(path) on hit
3. **One-Shot Semantics**: each mark matches one watcher event
4. **WindowMs Threshold**: 5000ms typical (covers write + chokidar delay)

## Benefits
- Prevents feedback loops: write → watch → reload → write
- Avoids N-way thrashing when N listeners subscribed
- Clean separation: internalWrites.ts has no other imports

## When to Use
- File watcher + write operations in same process
- Settings/config files modified programmatically
- Hot-reload systems with user edits

## Related Patterns
- Change Detector with Deletion Grace (changeDetector.ts)
- Fan-Out Single Reload (changeDetector.ts)
- Cleanup Registry Pattern (cleanupRegistry.ts)