/**
 * MagicDocs - Automatic documentation maintenance.
 *
 * Detects `# MAGIC DOC:` markers and updates documents via forked agent.
 * Keeps key docs (MEMORY.md, HEARTBEAT.md) up-to-date automatically.
 *
 * Adapted from Claude Code's services/MagicDocs/magicDocs.ts
 */

import { runForkedAgent, type CacheSafeParams } from './forked-agent.js'
import { readFileSync, existsSync, writeFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'

/**
 * Magic doc header pattern.
 */
const MAGIC_DOC_HEADER_PATTERN = /^#\s*MAGIC\s+DOC:\s*(.+)$/im

/**
 * Magic doc marker info
 */
export type MagicDocMarker = {
  /** File path containing the marker */
  filePath: string
  /** Marker description */
  description: string
  /** Marker line number (1-based) */
  lineNumber: number
}

/**
 * Magic doc state
 */
export type MagicDocsState = {
  enabled: boolean
  lastScanAt: number
  markersFound: MagicDocMarker[]
}

let state: MagicDocsState = {
  enabled: true,
  lastScanAt: 0,
  markersFound: [],
}

/**
 * Check if file contains magic doc marker.
 */
export function hasMagicDocMarker(content: string): boolean {
  return MAGIC_DOC_HEADER_PATTERN.test(content)
}

/**
 * Extract magic doc marker info.
 */
export function extractMagicDocMarker(filePath: string): MagicDocMarker | null {
  try {
    if (!existsSync(filePath)) {
      return null
    }

    const content = readFileSync(filePath, 'utf8')
    const match = content.match(MAGIC_DOC_HEADER_PATTERN)

    if (!match) {
      return null
    }

    // Find line number
    const lines = content.split('\n')
    let lineNumber = 0
    for (let i = 0; i < lines.length; i++) {
      if (MAGIC_DOC_HEADER_PATTERN.test(lines[i])) {
        lineNumber = i + 1
        break
      }
    }

    return {
      filePath,
      description: match[1].trim(),
      lineNumber,
    }
  } catch (e) {
    console.error(`[MagicDocs] Error reading ${filePath}: ${(e as Error).message}`)
    return null
  }
}

/**
 * Scan directory for magic doc markers.
 */
export function scanForMagicDocs(directory: string): MagicDocMarker[] {
  const markers: MagicDocMarker[] = []

  try {
    const files = readdirSync(directory, { recursive: true })

    for (const file of files) {
      if (typeof file !== 'string') continue
      if (!file.endsWith('.md')) continue

      const filePath = join(directory, file)
      const marker = extractMagicDocMarker(filePath)

      if (marker) {
        markers.push(marker)
      }
    }
  } catch (e) {
    console.error(`[MagicDocs] Scan error: ${(e as Error).message}`)
  }

  return markers
}

/**
 * Build update prompt for a magic doc.
 */
export function buildMagicDocUpdatePrompt(marker: MagicDocMarker): string {
  return `# Magic Doc Update

You are updating a magic documentation file. These files are automatically maintained based on the marker description.

File: \`${marker.filePath}\`
Marker: \`# MAGIC DOC: ${marker.description}\`

---

## Task

1. Read the current file content
2. Review recent changes in the workspace (git status, recent file modifications)
3. Update the file content based on:
   - The marker description: "${marker.description}"
   - Recent project activity
   - Current system state

## Guidelines

- Preserve the \`# MAGIC DOC:\` header exactly
- Keep the file concise and well-organized
- Update stale information
- Add new relevant information
- Remove outdated content
- Use consistent formatting

---

Return the updated file content. If nothing needs updating, return the original content.`
}

/**
 * Update a magic doc via forked agent.
 */
export async function updateMagicDoc(
  marker: MagicDocMarker,
  cacheSafeParams?: CacheSafeParams,
): Promise<void> {
  console.log(`[MagicDocs] Updating ${marker.filePath}`)

  const prompt = buildMagicDocUpdatePrompt(marker)

  const result = await runForkedAgent({
    promptMessages: [{ type: 'user', content: prompt }],
    cacheSafeParams: cacheSafeParams || {
      systemPrompt: '',
      userContext: {},
      systemContext: {},
      model: 'bailian/glm-5',
      forkContextMessages: [],
    },
    canUseTool: async () => ({
      behavior: 'allow',
    }),
    querySource: 'magic_docs',
    forkLabel: 'magic_docs',
    skipTranscript: true,
  })

  // Extract updated content
  for (const msg of result.messages as Array<{ type: string; content?: string }>) {
    if (msg.type !== 'assistant') continue
    if (msg.content && typeof msg.content === 'string') {
      // Write updated content
      try {
        writeFileSync(marker.filePath, msg.content)
        console.log(`[MagicDocs] Updated ${marker.filePath}`)
      } catch (e) {
        console.error(`[MagicDocs] Write failed: ${(e as Error).message}`)
      }
      break
    }
  }
}

/**
 * Run magic docs maintenance scan.
 */
export async function runMagicDocsMaintenance(
  workspaceRoot: string,
  cacheSafeParams?: CacheSafeParams,
): Promise<void> {
  if (!state.enabled) {
    console.log('[MagicDocs] Disabled')
    return
  }

  console.log('[MagicDocs] Running maintenance...')

  // Scan for markers
  const markers = scanForMagicDocs(workspaceRoot)
  state.markersFound = markers
  state.lastScanAt = Date.now()

  console.log(`[MagicDocs] Found ${markers.length} magic docs`)

  // Update each marker
  for (const marker of markers) {
    try {
      await updateMagicDoc(marker, cacheSafeParams)
    } catch (e) {
      console.error(`[MagicDocs] Update failed for ${marker.filePath}: ${(e as Error).message}`)
    }
  }
}

/**
 * Get magic docs state.
 */
export function getMagicDocsState(): MagicDocsState {
  return { ...state }
}

/**
 * Enable/disable magic docs.
 */
export function setMagicDocsEnabled(enabled: boolean): void {
  state.enabled = enabled
}

/**
 * Quick check: does a file need magic doc maintenance?
 */
export function needsMagicDocMaintenance(filePath: string): boolean {
  return hasMagicDocMarker(readFileSync(filePath, 'utf8'))
}