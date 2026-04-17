// @ts-nocheck

/**
 * Teammate Layout Pattern - Teammate布局
 * 
 * Source: Claude Code utils/swarm/teammateLayoutManager.tsx
 * Pattern: layout manager + UI arrangement + panel management
 */

interface LayoutConfig {
  id: string
  type: 'split' | 'tabs' | 'stack' | 'grid'
  panels: Array<{ id: string; position: number; size: number }>
  mainPanel: string
}

interface LayoutState {
  sessionId: string
  config: LayoutConfig
  activePanel: string
  visiblePanels: string[]
}

class TeammateLayoutManager {
  private configs = new Map<string, LayoutConfig>()
  private states = new Map<string, LayoutState>()

  /**
   * Create layout
   */
  createLayout(id: string, type: LayoutConfig['type'], panels: string[], mainPanel: string): LayoutConfig {
    const config: LayoutConfig = {
      id,
      type,
      panels: panels.map((p, i) => ({ id: p, position: i, size: 100 / panels.length })),
      mainPanel
    }

    this.configs.set(id, config)

    return config
  }

  /**
   * Apply layout
   */
  apply(sessionId: string, configId: string): LayoutState {
    const config = this.configs.get(configId)
    if (!config) throw new Error('Config not found')

    const state: LayoutState = {
      sessionId,
      config,
      activePanel: config.mainPanel,
      visiblePanels: config.panels.map(p => p.id)
    }

    this.states.set(sessionId, state)

    return state
  }

  /**
   * Get state
   */
  getState(sessionId: string): LayoutState | undefined {
    return this.states.get(sessionId)
  }

  /**
   * Get config
   */
  getConfig(id: string): LayoutConfig | undefined {
    return this.configs.get(id)
  }

  /**
   * Set active panel
   */
  setActive(sessionId: string, panelId: string): boolean {
    const state = this.states.get(sessionId)
    if (!state) return false

    if (!state.visiblePanels.includes(panelId)) return false

    state.activePanel = panelId

    return true
  }

  /**
   * Show panel
   */
  showPanel(sessionId: string, panelId: string): boolean {
    const state = this.states.get(sessionId)
    if (!state) return false

    if (!state.visiblePanels.includes(panelId)) {
      state.visiblePanels.push(panelId)
    }

    return true
  }

  /**
   * Hide panel
   */
  hidePanel(sessionId: string, panelId: string): boolean {
    const state = this.states.get(sessionId)
    if (!state) return false

    if (panelId === state.config.mainPanel) return false

    state.visiblePanels = state.visiblePanels.filter(p => p !== panelId)

    return true
  }

  /**
   * Resize panel
   */
  resize(sessionId: string, panelId: string, size: number): boolean {
    const state = this.states.get(sessionId)
    if (!state) return false

    const panel = state.config.panels.find(p => p.id === panelId)
    if (!panel) return false

    panel.size = size

    return true
  }

  /**
   * Get visible panels
   */
  getVisible(sessionId: string): string[] {
    const state = this.states.get(sessionId)
    return state?.visiblePanels ?? []
  }

  /**
   * Get active panel
   */
  getActive(sessionId: string): string | null {
    const state = this.states.get(sessionId)
    return state?.activePanel ?? null
  }

  /**
   * Get stats
   */
  getStats(): {
    configsCount: number
    statesCount: number
    layoutsByType: Record<LayoutConfig['type'], number>
  } {
    const configs = Array.from(this.configs.values())

    const byType: Record<LayoutConfig['type'], number> = {
      split: 0, tabs: 0, stack: 0, grid: 0
    }

    for (const c of configs) byType[c.type]++

    return {
      configsCount: configs.length,
      statesCount: this.states.size,
      layoutsByType: byType
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.configs.clear()
    this.states.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const teammateLayoutManager = new TeammateLayoutManager()

export default teammateLayoutManager