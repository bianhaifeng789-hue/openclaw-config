# Keyword Trigger Position Pattern

## Source
Claude Code: `utils/ultraplan/keyword.ts` (findKeywordTriggerPositions)

## Pattern
Find keyword positions skipping quoted ranges + path context + slash command input.

## Code Example
```typescript
type TriggerPosition = { word: string; start: number; end: number }

const OPEN_TO_CLOSE: Record<string, string> = {
  '`': '`', '"': '"', '<': '>', '{': '}', '[': ']', '('': ')', "'": "'",
}

function findKeywordTriggerPositions(text: string, keyword: string): TriggerPosition[] {
  const re = new RegExp(keyword, 'i')
  if (!re.test(text)) return []
  if (text.startsWith('/')) return []  // Slash command - skip

  // Build quoted ranges (inside paired delimiters)
  const quotedRanges: Array<{ start: number; end: number }> = []
  let openQuote: string | null = null
  let openAt = 0
  const isWord = (ch: string | undefined) => !!ch && /[\p{L}\p{N}_]/u.test(ch)

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (openQuote) {
      if (ch !== OPEN_TO_CLOSE[openQuote]) continue
      // Single quote: closing must not be followed by word (apostrophe)
      if (openQuote === "'" && isWord(text[i + 1])) continue
      quotedRanges.push({ start: openAt, end: i + 1 })
      openQuote = null
    } else if (
      // Angle bracket: only when followed by letter (HTML tag)
      (ch === '<' && /[a-zA-Z]/.test(text[i + 1]!)) ||
      // Single quote: only when NOT preceded by word
      (ch === "'" && !isWord(text[i - 1])) ||
      (ch !== '<' && ch !== "'" && ch in OPEN_TO_CLOSE)
    ) {
      openQuote = ch
      openAt = i
    }
  }

  // Find keyword matches outside quoted ranges
  const positions: TriggerPosition[] = []
  const wordRe = new RegExp(`\\b${keyword}\\b`, 'gi')
  const matches = text.matchAll(wordRe)

  for (const match of matches) {
    if (match.index === undefined) continue
    const start = match.index
    const end = start + match[0].length

    // Skip if inside quoted range
    if (quotedRanges.some(r => start >= r.start && start < r.end)) continue

    const before = text[start - 1]
    const after = text[end]

    // Path/identifier context exclusion
    if (before === '/' || before === '\\' || before === '-') continue
    if (after === '/' || after === '\\' || after === '-' || after === '?') continue
    // File extension exclusion: `.` followed by word char
    if (after === '.' && isWord(text[end + 1])) continue

    positions.push({ word: match[0], start, end })
  }
  return positions
}

export function findUltraplanTriggerPositions(text: string): TriggerPosition[] {
  return findKeywordTriggerPositions(text, 'ultraplan')
}

export function replaceUltraplanKeyword(text: string): string {
  const [trigger] = findUltraplanTriggerPositions(text)
  if (!trigger) return text
  const before = text.slice(0, trigger.start)
  const after = text.slice(trigger.end)
  // Replace "ultraplan" → "plan" preserving casing
  return before + trigger.word.slice('ultra'.length) + after
}
```

## Key Concepts
1. **Paired Delimiters**: OPEN_TO_CLOSE map for quote tracking
2. **Quoted Ranges**: Build ranges array, skip matches inside
3. **Apostrophe Handling**: Single quote closing must NOT be followed by word
4. **Angle Bracket Tag**: `<` only opens quote when followed by letter (HTML)
5. **Path Context**: Skip when preceded/followed by `/`, `\`, `-`
6. **File Extension**: Skip when followed by `.` + word char
7. **Slash Command**: text.startsWith('/') → skip entirely
8. **Question Exclusion**: followed by `?` → skip

## Benefits
- Precise keyword detection without false positives
- Handles apostrophe vs single quote distinction
- Preserves casing in replacement

## When to Use
- Keyword trigger detection
- Magic word invocation
- Grammatical replacement

## Related Patterns
- Thinking Trigger Positions (thinking.ts)
- Prompt Input Processing (processUserInput.ts)
- Slash Command Parsing (slashCommandParsing.ts)