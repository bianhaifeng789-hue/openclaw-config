// @ts-nocheck

/**
 * Proxy Utils Pattern - 代理工具
 * 
 * Source: Claude Code utils/proxy.ts + utils/proxyUtils.ts
 * Pattern: proxy utils + proxy detection + proxy configuration + bypass
 */

interface ProxyConfig {
  enabled: boolean
  httpProxy?: string
  httpsProxy?: string
  noProxy?: string[]
  auth?: { username: string; password: string }
}

class ProxyUtils {
  private config: ProxyConfig = {
    enabled: false,
    noProxy: []
  }

  /**
   * Set proxy from environment
   */
  loadFromEnv(): void {
    const env = process.env

    if (env.HTTP_PROXY || env.http_proxy) {
      this.config.httpProxy = env.HTTP_PROXY ?? env.http_proxy
      this.config.enabled = true
    }

    if (env.HTTPS_PROXY || env.https_proxy) {
      this.config.httpsProxy = env.HTTPS_PROXY ?? env.https_proxy
      this.config.enabled = true
    }

    if (env.NO_PROXY || env.no_proxy) {
      const noProxy = (env.NO_PROXY ?? env.no_proxy ?? '').split(',')
      this.config.noProxy = noProxy.map(p => p.trim()).filter(p => p)
    }

    if (env.PROXY_USER && env.PROXY_PASS) {
      this.config.auth = {
        username: env.PROXY_USER,
        password: env.PROXY_PASS
      }
    }
  }

  /**
   * Set proxy config
   */
  setConfig(config: Partial<ProxyConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get proxy for URL
   */
  getProxyForUrl(url: string): string | null {
    if (!this.config.enabled) return null

    // Check noProxy bypass
    const hostname = this.extractHostname(url)

    for (const pattern of this.config.noProxy ?? []) {
      if (this.matchesNoProxy(hostname, pattern)) {
        return null
      }
    }

    // Return appropriate proxy
    if (url.startsWith('https://')) {
      return this.config.httpsProxy ?? this.config.httpProxy ?? null
    }

    return this.config.httpProxy ?? null
  }

  /**
   * Extract hostname from URL
   */
  private extractHostname(url: string): string {
    try {
      const parsed = new URL(url)
      return parsed.hostname
    } catch {
      return url
    }
  }

  /**
   * Check if hostname matches noProxy pattern
   */
  private matchesNoProxy(hostname: string, pattern: string): boolean {
    // Wildcard matching
    if (pattern === '*') return true

    // Exact match
    if (hostname === pattern) return true

    // Subdomain match (pattern starts with .)
    if (pattern.startsWith('.')) {
      return hostname.endsWith(pattern) || hostname === pattern.slice(1)
    }

    // Subdomain match (hostname ends with pattern)
    if (hostname.endsWith('.' + pattern)) return true

    return false
  }

  /**
   * Get auth header
   */
  getAuthHeader(): string | null {
    if (!this.config.auth) return null

    const credentials = `${this.config.auth.username}:${this.config.auth.password}`
    return `Basic ${Buffer.from(credentials).toString('base64')}`
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Get config
   */
  getConfig(): ProxyConfig {
    return { ...this.config }
  }

  /**
   * Get noProxy patterns
   */
  getNoProxyPatterns(): string[] {
    return [...(this.config.noProxy ?? [])]
  }

  /**
   * Add noProxy pattern
   */
  addNoProxy(pattern: string): void {
    if (!this.config.noProxy) {
      this.config.noProxy = []
    }

    if (!this.config.noProxy.includes(pattern)) {
      this.config.noProxy.push(pattern)
    }
  }

  /**
   * Clear proxy config
   */
  clear(): void {
    this.config = {
      enabled: false,
      noProxy: []
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const proxyUtils = new ProxyUtils()

// Auto-load from environment
proxyUtils.loadFromEnv()

export default proxyUtils