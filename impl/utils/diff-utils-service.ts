// @ts-nocheck

/**
 * Diff Utils Pattern - Diff工具
 * 
 * Source: Claude Code utils/diff.ts
 * Pattern: diff utils + diff calculation + comparison + change detection
 */

interface DiffResult {
  additions: number
  deletions: number
  modifications: number
  unchanged: number
  changes: Array<{ type: string; old?: any; new?: any }>
  timestamp: number
}

class DiffUtilsService {
  private diffs: DiffResult[] = []

  /**
   * Diff strings
   */
  diffStrings(oldStr: string, newStr: string): DiffResult {
    const oldLines = oldStr.split('\n')
    const newLines = newStr.split('\n')

    const result: DiffResult = {
      additions: 0,
      deletions: 0,
      modifications: 0,
      unchanged: 0,
      changes: [],
      timestamp: Date.now()
    }

    const maxLen = Math.max(oldLines.length, newLines.length)

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i]
      const newLine = newLines[i]

      if (oldLine === undefined) {
        result.additions++
        result.changes.push({ type: 'addition', new: newLine })
      } else if (newLine === undefined) {
        result.deletions++
        result.changes.push({ type: 'deletion', old: oldLine })
      } else if (oldLine === newLine) {
        result.unchanged++
      } else {
        result.modifications++
        result.changes.push({ type: 'modification', old: oldLine, new: newLine })
      }
    }

    this.diffs.push(result)

    return result
  }

  /**
   * Diff objects
   */
  diffObjects(oldObj: Record<string, any>, newObj: Record<string, any>): DiffResult {
    const result: DiffResult = {
      additions: 0,
      deletions: 0,
      modifications: 0,
      unchanged: 0,
      changes: [],
      timestamp: Date.now()
    }

    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

    for (const key of allKeys) {
      const oldVal = oldObj[key]
      const newVal = newObj[key]

      if (oldVal === undefined) {
        result.additions++
        result.changes.push({ type: 'addition', new: { key, value: newVal } })
      } else if (newVal === undefined) {
        result.deletions++
        result.changes.push({ type: 'deletion', old: { key, value: oldVal } })
      } else if (oldVal === newVal) {
        result.unchanged++
      } else {
        result.modifications++
        result.changes.push({ type: 'modification', old: { key, value: oldVal }, new: { key, value: newVal } })
      }
    }

    this.diffs.push(result)

    return result
  }

  /**
   * Diff arrays
   */
  diffArrays(oldArr: any[], newArr: any[]): DiffResult {
    const result: DiffResult = {
      additions: newArr.length - oldArr.length,
      deletions: 0,
      modifications: 0,
      unchanged: 0,
      changes: [],
      timestamp: Date.now()
    }

    if (result.additions < 0) {
      result.deletions = -result.additions
      result.additions = 0
    }

    const minLen = Math.min(oldArr.length, newArr.length)

    for (let i = 0; i < minLen; i++) {
      if (oldArr[i] === newArr[i]) {
        result.unchanged++
      } else {
        result.modifications++
        result.changes.push({ type: 'modification', old: oldArr[i], new: newArr[i] })
      }
    }

    this.diffs.push(result)

    return result
  }

  /**
   * Get diffs
   */
  getDiffs(): DiffResult[] {
    return [...this.diffs]
  }

  /**
   * Get recent diffs
   */
  getRecent(count: number = 10): DiffResult[] {
    return this.diffs.slice(-count)
  }

  /**
   * Get stats
   */
  getStats(): {
    diffsCount: number
    totalAdditions: number
    totalDeletions: number
    totalModifications: number
    averageChanges: number
  } {
    const avgChanges = this.diffs.length > 0
      ? this.diffs.reduce((sum, d) => sum + d.additions + d.deletions + d.modifications, 0) / this.diffs.length
      : 0

    return {
      diffsCount: this.diffs.length,
      totalAdditions: this.diffs.reduce((sum, d) => sum + d.additions, 0),
      totalDeletions: this.diffs.reduce((sum, d) => sum + d.deletions, 0),
      totalModifications: this.diffs.reduce((sum, d) => sum + d.modifications, 0),
      averageChanges: avgChanges
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.diffs = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const diffUtilsService = new DiffUtilsService()

export default diffUtilsService