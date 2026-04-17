// @ts-nocheck

/**
 * Use Virtual Scroll Pattern - 虚拟滚动Hook
 * 
 * Source: Claude Code hooks/useVirtualScroll.ts
 * Pattern: virtual scroll + efficient rendering + viewport + items
 */

interface VirtualScrollConfig {
  itemHeight: number
  viewportHeight: number
  totalItems: number
  overscan: number
}

interface VirtualScrollState {
  startIndex: number
  endIndex: number
  offsetY: number
  visibleCount: number
}

class UseVirtualScroll {
  private config: VirtualScrollConfig = {
    itemHeight: 40,
    viewportHeight: 400,
    totalItems: 0,
    overscan: 3
  }
  private scrollTop = 0
  private listeners = new Set<(state: VirtualScrollState) => void>()

  /**
   * Set config
   */
  setConfig(config: Partial<VirtualScrollConfig>): void {
    this.config = { ...this.config, ...config }
    this.notifyListeners()
  }

  /**
   * Set scroll position
   */
  setScrollTop(scrollTop: number): VirtualScrollState {
    this.scrollTop = scrollTop

    const state = this.calculateVisibleRange()
    this.notifyListeners()

    return state
  }

  /**
   * Calculate visible range
   */
  private calculateVisibleRange(): VirtualScrollState {
    const { itemHeight, viewportHeight, totalItems, overscan } = this.config

    const startIndex = Math.max(0, Math.floor(this.scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(viewportHeight / itemHeight) + overscan * 2
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount)
    const offsetY = startIndex * itemHeight

    return {
      startIndex,
      endIndex,
      offsetY,
      visibleCount: endIndex - startIndex + 1
    }
  }

  /**
   * Get visible range
   */
  getVisibleRange(): VirtualScrollState {
    return this.calculateVisibleRange()
  }

  /**
   * Get total height
   */
  getTotalHeight(): number {
    return this.config.totalItems * this.config.itemHeight
  }

  /**
   * Scroll to index
   */
  scrollToIndex(index: number): number {
    const { itemHeight, viewportHeight } = this.config

    const scrollTop = Math.max(0, index * itemHeight - viewportHeight / 2)
    this.scrollTop = scrollTop

    this.notifyListeners()

    return scrollTop
  }

  /**
   * Scroll to top
   */
  scrollToTop(): void {
    this.scrollTop = 0
    this.notifyListeners()
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom(): void {
    const totalHeight = this.getTotalHeight()
    this.scrollTop = totalHeight - this.config.viewportHeight
    this.notifyListeners()
  }

  /**
   * Get item position
   */
  getItemPosition(index: number): number {
    return index * this.config.itemHeight
  }

  /**
   * Get item at scroll position
   */
  getItemAtPosition(position: number): number {
    return Math.floor(position / this.config.itemHeight)
  }

  /**
   * Subscribe
   */
  subscribe(listener: (state: VirtualScrollState) => void): () => void {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.getVisibleRange())
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    config: VirtualScrollConfig
    scrollTop: number
    totalHeight: number
    visibleRange: VirtualScrollState
    listenersCount: number
  } {
    return {
      config: this.config,
      scrollTop: this.scrollTop,
      totalHeight: this.getTotalHeight(),
      visibleRange: this.getVisibleRange(),
      listenersCount: this.listeners.size
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.config = {
      itemHeight: 40,
      viewportHeight: 400,
      totalItems: 0,
      overscan: 3
    }
    this.scrollTop = 0
    this.listeners.clear()
  }
}

// Global singleton
export const useVirtualScroll = new UseVirtualScroll()

export default useVirtualScroll