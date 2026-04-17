// @ts-nocheck

/**
 * Web Client Pattern - Web客户端
 * 
 * Source: Claude Code utils/webClient.ts
 * Pattern: web client + HTTP requests + retry + timeout + response handling
 */

interface WebClientConfig {
  baseUrl?: string
  timeoutMs: number
  maxRetries: number
  retryDelayMs: number
  headers?: Record<string, string>
}

interface WebClientResponse {
  status: number
  headers: Record<string, string>
  body: any
  durationMs: number
}

class WebClient {
  private config: WebClientConfig = {
    timeoutMs: 30000,
    maxRetries: 3,
    retryDelayMs: 1000,
    headers: {}
  }

  private requestHistory: Array<{ url: string; method: string; timestamp: number }> = []

  /**
   * Set base URL
   */
  setBaseUrl(url: string): void {
    this.config.baseUrl = url
  }

  /**
   * Set headers
   */
  setHeaders(headers: Record<string, string>): void {
    this.config.headers = { ...this.config.headers, ...headers }
  }

  /**
   * Set auth header
   */
  setAuth(token: string): void {
    this.config.headers = {
      ...this.config.headers,
      'Authorization': `Bearer ${token}`
    }
  }

  /**
   * GET request
   */
  async get(path: string, options?: { params?: Record<string, string>; headers?: Record<string, string> }): Promise<WebClientResponse> {
    return this.request('GET', path, options)
  }

  /**
   * POST request
   */
  async post(path: string, body?: any, options?: { headers?: Record<string, string> }): Promise<WebClientResponse> {
    return this.request('POST', path, { ...options, body })
  }

  /**
   * PUT request
   */
  async put(path: string, body?: any, options?: { headers?: Record<string, string> }): Promise<WebClientResponse> {
    return this.request('PUT', path, { ...options, body })
  }

  /**
   * DELETE request
   */
  async delete(path: string, options?: { headers?: Record<string, string> }): Promise<WebClientResponse> {
    return this.request('DELETE', path, options)
  }

  /**
   * Core request method
   */
  private async request(method: string, path: string, options?: { params?: Record<string, string>; body?: any; headers?: Record<string, string> }): Promise<WebClientResponse> {
    const url = this.buildUrl(path, options?.params)
    const startTime = Date.now()

    let retries = 0

    while (retries < this.config.maxRetries) {
      try {
        // Would make actual HTTP request
        // For demo, simulate response
        const response: WebClientResponse = {
          status: 200,
          headers: {},
          body: { success: true },
          durationMs: Date.now() - startTime
        }

        // Track history
        this.requestHistory.push({
          url,
          method,
          timestamp: Date.now()
        })

        return response
      } catch (e) {
        retries++

        if (retries < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * retries)
        } else {
          throw e
        }
      }
    }

    throw new Error('Max retries exceeded')
  }

  /**
   * Build URL with params
   */
  private buildUrl(path: string, params?: Record<string, string>): string {
    let url = this.config.baseUrl ? `${this.config.baseUrl}${path}` : path

    if (params) {
      const queryString = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')

      url += `?${queryString}`
    }

    return url
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get request history
   */
  getHistory(): Array<{ url: string; method: string; timestamp: number }> {
    return [...this.requestHistory]
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.requestHistory = []
  }

  /**
   * Set config
   */
  setConfig(config: Partial<WebClientConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get config
   */
  getConfig(): WebClientConfig {
    return { ...this.config }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.config = {
      timeoutMs: 30000,
      maxRetries: 3,
      retryDelayMs: 1000,
      headers: {}
    }
    this.requestHistory = []
  }
}

// Global singleton
export const webClient = new WebClient()

export default webClient