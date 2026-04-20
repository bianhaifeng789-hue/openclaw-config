/**
 * Memory Maintenance Skill - 记忆维护自动化
 * 
 * Source: Claude Code skills/memory-maintenance/SKILL.md
 * Pattern: Periodic check + daily notes extraction + MEMORY.md update + minimal heartbeat review timestamp
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, appendFileSync } from 'fs'
import { join } from 'path'

interface MemoryMaintenanceConfig {
  workspacePath: string
  memoryDir: string
  heartbeatStatePath: string
  memoryMdPath: string
  checkIntervalMs: number // 2-4 hours
  maxDailyNotesToRead: number
}

interface HeartbeatState {
  lastChecks?: {
    memoryReview?: number | null
    [key: string]: any
  }
  lastNotices?: Record<string, any>
  notes?: Record<string, any>
  [key: string]: any
}

class MemoryMaintenanceSkill {
  private config: MemoryMaintenanceConfig

  constructor(config: Partial<MemoryMaintenanceConfig> = {}) {
    this.config = {
      workspacePath: config.workspacePath ?? process.cwd(),
      memoryDir: config.memoryDir ?? 'memory',
      heartbeatStatePath: config.heartbeatStatePath ?? 'memory/heartbeat-state.json',
      memoryMdPath: config.memoryMdPath ?? 'MEMORY.md',
      checkIntervalMs: config.checkIntervalMs ?? 2 * 60 * 60 * 1000, // 2 hours
      maxDailyNotesToRead: config.maxDailyNotesToRead ?? 10,
    }
  }

  /**
   * Check if memory maintenance is needed
   * Returns true if lastChecks.memoryReview > checkIntervalMs ago
   */
  shouldRun(): boolean {
    const state = this.readHeartbeatState()
    const lastReview = state?.lastChecks?.memoryReview
    if (!lastReview) return true

    const elapsed = Date.now() - lastReview
    return elapsed > this.config.checkIntervalMs
  }

  /**
   * Run memory maintenance
   * Returns summary of updates made
   */
  run(): { updated: boolean; insights: string[]; decisions: string[] } {
    const result = {
      updated: false,
      insights: [] as string[],
      decisions: [] as string[]
    }

    // Read recent daily notes
    const dailyNotes = this.readRecentDailyNotes()

    // Extract key information
    for (const note of dailyNotes) {
      const extracted = this.extractKeyInfo(note.content)
      result.insights.push(...extracted.insights)
      result.decisions.push(...extracted.decisions)
    }

    // Update MEMORY.md if there's new content
    if (result.insights.length > 0 || result.decisions.length > 0) {
      this.updateMemoryMd(result.insights, result.decisions)
      result.updated = true
    }

    // Update heartbeat state
    this.updateHeartbeatState()

    return result
  }

  /**
   * Read heartbeat state file
   */
  private readHeartbeatState(): HeartbeatState | null {
    const path = join(this.config.workspacePath, this.config.heartbeatStatePath)
    if (!existsSync(path)) return null

    try {
      const content = readFileSync(path, 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  /**
   * Update heartbeat state with current timestamp
   */
  private updateHeartbeatState(): void {
    const path = join(this.config.workspacePath, this.config.heartbeatStatePath)
    let state: HeartbeatState = {}

    if (existsSync(path)) {
      try {
        state = JSON.parse(readFileSync(path, 'utf-8'))
      } catch {}
    }

    state.lastChecks = {
      ...(state.lastChecks || {}),
      memoryReview: Date.now(),
    }
    state.notes = {
      ...(state.notes || {}),
      comment: state.notes?.comment || 'Minimal heartbeat state schema. Keep small and stable.',
    }

    writeFileSync(path, JSON.stringify(state, null, 2))
  }

  /**
   * Read recent daily notes (YYYY-MM-DD.md files)
   */
  private readRecentDailyNotes(): { date: string; content: string }[] {
    const memoryDir = join(this.config.workspacePath, this.config.memoryDir)
    if (!existsSync(memoryDir)) return []

    const files = readdirSync(memoryDir)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .reverse()
      .slice(0, this.config.maxDailyNotesToRead)

    return files.map(file => {
      const content = readFileSync(join(memoryDir, file), 'utf-8')
      return { date: file.replace('.md', ''), content }
    })
  }

  /**
   * Extract key information from daily note
   */
  private extractKeyInfo(content: string): { insights: string[]; decisions: string[] } {
    const insights: string[] = []
    const decisions: string[] = []

    // Simple extraction patterns
    const lines = content.split('\n')

    for (const line of lines) {
      // Look for insight markers
      if (line.includes('关键发现') || line.includes('Insight:')) {
        const cleaned = this.cleanLine(line)
        if (cleaned) insights.push(cleaned)
      }

      // Look for decision markers
      if (line.includes('决策') || line.includes('Decision:') || line.includes('下一步')) {
        const cleaned = this.cleanLine(line)
        if (cleaned) decisions.push(cleaned)
      }
    }

    return { insights, decisions }
  }

  /**
   * Clean line for memory storage
   */
  private cleanLine(line: string): string {
    return line
      .replace(/^#+ /, '')
      .replace(/\*\*/g, '')
      .replace(/^- /, '')
      .trim()
      .slice(0, 200) // Truncate long lines
  }

  /**
   * Update MEMORY.md with extracted content
   */
  private updateMemoryMd(insights: string[], decisions: string[]): void {
    const path = join(this.config.workspacePath, this.config.memoryMdPath)

    // Check for AUTO_UPDATE markers
    const content = existsSync(path) ? readFileSync(path, 'utf-8') : ''

    // Find or create Insights section
    const timestamp = new Date().toISOString().slice(0, 10)

    const updateBlock = `
<!-- AUTO_UPDATE: insights_${timestamp} -->
## Insights (${timestamp})

${insights.map(i => `- ${i}`).join('\n')}

<!-- AUTO_UPDATE: decisions_${timestamp} -->
## Decisions (${timestamp})

${decisions.map(d => `- ${d}`).join('\n')}

`

    if (content.includes('<!-- AUTO_UPDATE:')) {
      // Append to existing markers
      // Would need more sophisticated parsing in production
      appendFileSync(path, updateBlock)
    } else {
      // Append at end
      appendFileSync(path, updateBlock)
    }
  }

  /**
   * Get config
   */
  getConfig(): MemoryMaintenanceConfig {
    return { ...this.config }
  }

  /**
   * Set config
   */
  setConfig(config: Partial<MemoryMaintenanceConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Export
export const memoryMaintenance = new MemoryMaintenanceSkill()

export default memoryMaintenance