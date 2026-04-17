// @ts-nocheck

/**
 * Browser Utils Pattern - 浏览器工具
 * 
 * Source: Claude Code utils/browser.ts
 * Pattern: browser utils + URL handling + open + headless detection
 */

interface BrowserConfig {
  headless: boolean
  defaultTimeoutMs: number
}

class BrowserUtils {
  private config: BrowserConfig = {
    headless: false,
    defaultTimeoutMs: 10000
  }

  private openedUrls: string[] = []

  /**
   * Open URL in browser
   */
  async open(url: string): Promise<boolean> {
    // Would use actual browser opening mechanism
    // For demo, track URL
    this.openedUrls.push(url)

    console.log(`[Browser] Opening: ${url}`)

    return true
  }

  /**
   * Open URL with fallback
   */
  async openWithFallback(url: string, fallbackUrl?: string): Promise<boolean> {
    try {
      return await this.open(url)
    } catch {
      if (fallbackUrl) {
        return await this.open(fallbackUrl)
      }
      return false
    }
  }

  /**
   * Check if headless mode
   */
  isHeadless(): boolean {
    // Check environment for headless indicators
    const env = process.env

    return env.CI === 'true' ||
           env.DISPLAY === undefined ||
           env.TERM === 'dumb' ||
           this.config.headless
  }

  /**
   * Get browser type
   */
  getBrowserType(): string {
    // Would detect browser
    // For demo, return default
    return 'default'
  }

  /**
   * Parse URL
   */
  parseUrl(url: string): {
    protocol: string
    host: string
    path: string
    query: Record<string, string>
  } | null {
    try {
      const parsed = new URL(url)

      const query: Record<string, string> = {}
      parsed.searchParams.forEach((value, key) => {
        query[key] = value
      })

      return {
        protocol: parsed.protocol,
        host: parsed.host,
        path: parsed.pathname,
        query
      }
    } catch {
      return null
    }
  }

  /**
   * Build URL
   */
  buildUrl(base: string, path?: string, query?: Record<string, string>): string {
    let url = base

    if (path) {
      url += path.startsWith('/') ? path : '/' + path
    }

    if (query) {
      const queryString = Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')

      url += '?' + queryString
    }

    return url
  }

  /**
   * Validate URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get opened URLs
   */
  getOpenedUrls(): string[] {
    return [...this.openedUrls]
  }

  /**
   * Set config
   */
  setConfig(config: Partial<BrowserConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get config
   */
  getConfig(): BrowserConfig {
    return { ...this.config }
  }

  /**
   * Get stats
   */
  getStats(): {
    openedCount: number
    headless: boolean
    lastOpenedUrl: string | null
  } {
    return {
      openedCount: this.openedUrls.length,
      headless: this.isHeadless(),
      lastOpenedUrl: this.openedUrls.length > 0 ? this.openedUrls[this.openedUrls.length - 1] : null
    }
  }

  /**
   * Clear opened URLs
   */
  clearOpened(): void {
    this.openedUrls = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearOpened()
    this.config = {
      headless: false,
      defaultTimeoutMs: 10000
    }
  }
}

// Global singleton
export const browserUtils = new BrowserUtils()

export default browserUtils