// @ts-nocheck

/**
 * Use Typeahead Pattern - Typeahead Hook
 * 
 * Source: Claude Code hooks/useTypeahead.tsx
 * Pattern: typeahead + autocomplete + suggestions + fuzzy search
 */

interface TypeaheadOption {
  id: string
  label: string
  value: string
  category?: string
  score: number
}

class UseTypeahead {
  private options: TypeaheadOption[] = []
  private selectedIndex = 0
  private visible = false
  private query = ''
  private maxVisible = 10
  private listeners = new Set<(options: TypeaheadOption[]) => void>()

  /**
   * Set options
   */
  setOptions(options: Array<{ id: string; label: string; value: string; category?: string }>): void {
    this.options = options.map(o => ({ ...o, score: 0 }))
  }

  /**
   * Add option
   */
  addOption(id: string, label: string, value: string, category?: string): void {
    this.options.push({ id, label, value, category, score: 0 })
  }

  /**
   * Remove option
   */
  removeOption(id: string): boolean {
    const index = this.options.findIndex(o => o.id === id)
    if (index === -1) return false

    this.options.splice(index, 1)

    return true
  }

  /**
   * Set query
   */
  setQuery(query: string): TypeaheadOption[] {
    this.query = query

    if (query === '') {
      this.visible = false
      return []
    }

    // Score options
    const scored = this.scoreOptions(query)

    this.visible = true
    this.selectedIndex = 0

    this.notifyListeners(scored.slice(0, this.maxVisible))

    return scored.slice(0, this.maxVisible)
  }

  /**
   * Score options
   */
  private scoreOptions(query: string): TypeaheadOption[] {
    const lowerQuery = query.toLowerCase()

    return this.options
      .map(o => {
        const lowerLabel = o.label.toLowerCase()
        let score = 0

        // Exact match
        if (lowerLabel === lowerQuery) {
          score = 100
        }
        // Starts with
        else if (lowerLabel.startsWith(lowerQuery)) {
          score = 80
        }
        // Contains
        else if (lowerLabel.includes(lowerQuery)) {
          score = 60 - (lowerLabel.indexOf(lowerQuery) * 2)
        }
        // Fuzzy match
        else {
          score = this.fuzzyScore(lowerQuery, lowerLabel)
        }

        return { ...o, score }
      })
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Fuzzy score
   */
  private fuzzyScore(query: string, target: string): number {
    let score = 0
    let queryIndex = 0

    for (let i = 0; i < target.length && queryIndex < query.length; i++) {
      if (target[i] === query[queryIndex]) {
        score += 10
        queryIndex++
      }
    }

    return queryIndex === query.length ? score : 0
  }

  /**
   * Get visible options
   */
  getVisibleOptions(): TypeaheadOption[] {
    if (!this.visible) return []

    return this.scoreOptions(this.query).slice(0, this.maxVisible)
  }

  /**
   * Get selected
   */
  getSelected(): TypeaheadOption | null {
    const visible = this.getVisibleOptions()
    return visible[this.selectedIndex] ?? null
  }

  /**
   * Select next
   */
  selectNext(): boolean {
    const visible = this.getVisibleOptions()
    if (visible.length === 0) return false

    if (this.selectedIndex < visible.length - 1) {
      this.selectedIndex++
      return true
    }

    return false
  }

  /**
   * Select previous
   */
  selectPrevious(): boolean {
    if (this.selectedIndex > 0) {
      this.selectedIndex--
      return true
    }

    return false
  }

  /**
   * Confirm selection
   */
  confirm(): TypeaheadOption | null {
    const selected = this.getSelected()
    this.visible = false
    this.query = ''

    return selected
  }

  /**
   * Cancel
   */
  cancel(): void {
    this.visible = false
    this.selectedIndex = 0
    this.query = ''
  }

  /**
   * Is visible
   */
  isVisible(): boolean {
    return this.visible
  }

  /**
   * Subscribe
   */
  subscribe(listener: (options: TypeaheadOption[]) => void): () => void {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  /**
   * Notify listeners
   */
  private notifyListeners(options: TypeaheadOption[]): void {
    for (const listener of this.listeners) {
      listener(options)
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    optionsCount: number
    visibleCount: number
    selectedIndex: number
    visible: boolean
    query: string
  } {
    return {
      optionsCount: this.options.length,
      visibleCount: this.getVisibleOptions().length,
      selectedIndex: this.selectedIndex,
      visible: this.visible,
      query: this.query
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.options = []
    this.selectedIndex = 0
    this.visible = false
    this.query = ''
    this.listeners.clear()
  }
}

// Global singleton
export const useTypeahead = new UseTypeahead()

export default useTypeahead