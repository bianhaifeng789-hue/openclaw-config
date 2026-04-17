// @ts-nocheck

/**
 * OAuth Service Pattern - OAuth服务
 * 
 * Source: Claude Code services/oauth/index.ts
 * Pattern: OAuth + authentication + tokens + refresh + callback
 */

interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  scope?: string[]
}

interface OAuthConfig {
  clientId: string
  clientSecret?: string
  redirectUri: string
  scope: string[]
}

interface OAuthState {
  provider: string
  token: OAuthToken | null
  authenticated: boolean
  lastRefresh: number
}

class OAuthService {
  private states = new Map<string, OAuthState>()
  private configs = new Map<string, OAuthConfig>()

  /**
   * Register OAuth provider
   */
  registerProvider(provider: string, config: OAuthConfig): void {
    this.configs.set(provider, config)

    this.states.set(provider, {
      provider,
      token: null,
      authenticated: false,
      lastRefresh: 0
    })
  }

  /**
   * Generate authorization URL
   */
  getAuthorizationUrl(provider: string): string | null {
    const config = this.configs.get(provider)
    if (!config) return null

    const state = Math.random().toString(36).slice(2, 16)
    const scope = config.scope.join(' ')

    // Would generate actual OAuth URL
    // For demo, return placeholder
    return `https://oauth.${provider}.com/authorize?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=${scope}&state=${state}`
  }

  /**
   * Handle callback
   */
  async handleCallback(provider: string, code: string): Promise<boolean> {
    const config = this.configs.get(provider)
    if (!config) return false

    // Would exchange code for token
    // For demo, simulate token exchange
    const token: OAuthToken = {
      accessToken: `access-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      refreshToken: `refresh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      expiresAt: Date.now() + 3600 * 1000, // 1 hour
      scope: config.scope
    }

    const state = this.states.get(provider)
    if (state) {
      state.token = token
      state.authenticated = true
      state.lastRefresh = Date.now()
    }

    return true
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(provider: string): boolean {
    const state = this.states.get(provider)
    if (!state) return false

    if (!state.authenticated || !state.token) return false

    // Check expiration
    if (Date.now() >= state.token.expiresAt) {
      return this.refreshToken(provider)
    }

    return true
  }

  /**
   * Refresh token
   */
  async refreshToken(provider: string): Promise<boolean> {
    const state = this.states.get(provider)
    if (!state || !state.token?.refreshToken) return false

    // Would refresh token
    // For demo, simulate refresh
    state.token.expiresAt = Date.now() + 3600 * 1000
    state.lastRefresh = Date.now()

    return true
  }

  /**
   * Get access token
   */
  getAccessToken(provider: string): string | null {
    if (!this.isAuthenticated(provider)) return null

    const state = this.states.get(provider)
    return state?.token?.accessToken ?? null
  }

  /**
   * Logout
   */
  logout(provider: string): void {
    const state = this.states.get(provider)
    if (state) {
      state.token = null
      state.authenticated = false
    }
  }

  /**
   * Get state
   */
  getState(provider: string): OAuthState | undefined {
    return this.states.get(provider)
  }

  /**
   * Get all providers
   */
  getProviders(): string[] {
    return Array.from(this.states.keys())
  }

  /**
   * Get authenticated providers
   */
  getAuthenticatedProviders(): string[] {
    return Array.from(this.states.keys())
      .filter(p => this.isAuthenticated(p))
  }

  /**
   * Get stats
   */
  getStats(): {
    totalProviders: number
    authenticated: number
    needsRefresh: number
  } {
    const needsRefresh = Array.from(this.states.values())
      .filter(s => s.token && Date.now() >= s.token.expiresAt - 5 * 60 * 1000) // Within 5 minutes
      .length

    return {
      totalProviders: this.states.size,
      authenticated: this.getAuthenticatedProviders().length,
      needsRefresh
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.states.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.configs.clear()
  }
}

// Global singleton
export const oAuthService = new OAuthService()

export default oAuthService