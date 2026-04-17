/**
 * Consolidation prompt builder for AutoDream.
 *
 * Builds the prompt for memory consolidation forked agent.
 * Adapted from Claude Code's services/autoDream/consolidationPrompt.ts
 */

const ENTRYPOINT_NAME = 'MEMORY.md'
const MAX_ENTRYPOINT_LINES = 200

/**
 * Build the consolidation prompt.
 */
export function buildConsolidationPrompt(
  memoryRoot: string,
  extra?: string,
): string {
  return `# Dream: Memory Consolidation

You are performing a dream — a reflective pass over your memory files. Synthesize what you've learned recently into durable, well-organized memories so that future sessions can orient quickly.

Memory directory: \`${memoryRoot}\`

---

## Phase 1 — Orient

- \`ls\` the memory directory to see what already exists
- Read \`${ENTRYPOINT_NAME}\` to understand the current index
- Skim existing topic files so you improve them rather than creating duplicates

## Phase 2 — Gather recent signal

Look for new information worth persisting. Sources in rough priority order:

1. **Daily logs** (\`memory/YYYY-MM-DD.md\`) if present — these are the append-only stream
2. **Existing memories that drifted** — facts that contradict something you see now
3. **Transcript search** — if you need specific context, grep recent session transcripts

Don't exhaustively read transcripts. Look only for things you already suspect matter.

## Phase 3 — Consolidate

For each thing worth remembering, write or update a memory file. Use the memory file format from your system prompt.

Focus on:
- Merging new signal into existing topic files rather than creating near-duplicates
- Converting relative dates ("yesterday", "last week") to absolute dates
- Deleting contradicted facts — if investigation disproves an old memory, fix it

## Phase 4 — Prune and index

Update \`${ENTRYPOINT_NAME}\` so it stays under ${MAX_ENTRYPOINT_LINES} lines AND under ~25KB. It's an **index**, not a dump — each entry should be one line under ~150 characters.

- Remove pointers to memories that are now stale, wrong, or superseded
- Demote verbose entries: if an index line is over ~200 chars, shorten the line, move detail to topic file
- Add pointers to newly important memories
- Resolve contradictions

---

Return a brief summary of what you consolidated, updated, or pruned. If nothing changed, say so.${extra ? `\n\n## Additional context\n\n${extra}` : ''}`
}

/**
 * Build consolidation prompt with session hints.
 */
export function buildConsolidationPromptWithSessions(
  memoryRoot: string,
  sessionIds: string[],
): string {
  const extra = sessionIds.length > 0
    ? `\n\nSessions since last consolidation (${sessionIds.length}):\n${sessionIds.map(id => `- ${id}`).join('\n')}`
    : ''

  return buildConsolidationPrompt(memoryRoot, extra)
}