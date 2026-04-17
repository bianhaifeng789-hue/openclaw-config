// @ts-nocheck

/**
 * Desktop Deep Link Pattern - Desktop深度链接
 * 
 * Source: Claude Code utils/desktopDeepLink.ts
 * Pattern: deep link + URL scheme + desktop integration + protocol handler
 */

interface DeepLink {
  scheme: string
  action: string
  params: Record<string, string>
  timestamp: number
}

interface DeepLinkHandler {
  action: string
  handler: (params: Record<string, string>) => Promise<void>
}

class DesktopDeepLink {
  private handlers = new Map<string, DeepLinkHandler>()
  private processedLinks: DeepLink[] = []
  private scheme = 'openclaw'

  /**
   * Register handler
   */
  registerHandler(action: string, handler: (params: Record<string, string>) => Promise<void>): void {
    this.handlers.set(action, { action, handler })
  }

  /**
   * Parse deep link
   */
  parse(url: string): DeepLink | null {
    try {
      // Parse URL like openclaw://action?param1=value1&param2=value2
      const withoutScheme = url.replace(`${this.scheme}://`, '')

      const [action, queryString] = withoutScheme.split('?')

      const params: Record<string, string> = {}

      if (queryString) {
        for (const pair of queryString.split('&')) {
          const [key, value] = pair.split('=')
          params[key] = decodeURIComponent(value)
        }
      }

      return {
        scheme: this.scheme,
        action,
        params,
        timestamp: Date.now()
      }
    } catch {
      return null
    }
  }

  /**
   * Handle deep link
   */
  async handle(url: string): Promise<boolean> {
    const link = this.parse(url)
    if (!link) return false

    this.processedLinks.push(link)

    const handler = this.handlers.get(link.action)
    if (!handler) {
      console.warn(`[DeepLink] No handler for action: ${link.action}`)
      return false
    }

    try {
      await handler.handler(link.params)
      return true
    } catch (e) {
      console.error(`[DeepLink] Handler error:`, e)
      return false
    }
  }

  /**
   * Generate deep link URL
   */
  generate(action: string, params?: Record<string, string>): string {
    const queryString = params
      ? Object.entries(params)
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join('&')
      : ''

    return `${this.scheme}://${action}${queryString ? `?${queryString}` : ''}`
  }

  /**
   * Get processed links
   */
  getProcessedLinks(): DeepLink[] {
    return [...this.processedLinks]
  }

  /**
   * Set scheme
   */
  setScheme(scheme: string): void {
    this.scheme = scheme
  }

  /**
   * Get scheme
   */
  getScheme(): string {
    return this.scheme
  }

  /**
   * Get registered actions
   */
  getRegisteredActions(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Get stats
   */
  getStats(): {
    handlersCount: number
    processedCount: number
    scheme: string
  } {
    return {
      handlersCount: this.handlers.size,
      processedCount: this.processedLinks.length,
      scheme: this.scheme
    }
  }

  /**
   * Clear processed links
   */
  clearProcessed(): void {
    this.processedLinks = []
  }

  /**
   * Unregister handler
   */
  unregisterHandler(action: string): boolean {
    return this.handlers.delete(action)
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.handlers.clear()
    this.processedLinks = []
    this.scheme = 'openclaw'
  }
}

// Global singleton
export const desktopDeepLink = new DesktopDeepLink()

// Register default handlers
desktopDeepLink.registerHandler('open', async params => {
  console.log(`[DeepLink] Opening: ${params.path ?? params.file}`)
})

desktopDeepLink.registerHandler('settings', async params => {
  console.log(`[DeepLink] Settings: ${params.section ?? 'general'}`)
})

export default desktopDeepLink