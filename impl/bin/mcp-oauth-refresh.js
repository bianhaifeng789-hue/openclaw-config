#!/usr/bin/env node
/**
 * MCP OAuth Auto-Refresh Script
 * 
 * 借鉴 DeerFlow 2.0 的 OAuth token 自动刷新机制
 * 支持 client_credentials 和 refresh_token grants
 * 提前 refresh_skew_seconds 秒刷新，避免过期
 * 
 * 来源: https://github.com/bytedance/deer-flow
 * 参考: backend/docs/MCP_SERVER.md
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const STATE_FILE = path.join(__dirname, '..', '..', 'state', 'mcp-oauth-state.json');
const CONFIG_FILE = path.join(__dirname, '..', '..', 'state', 'extensions-config.json');

/**
 * OAuth Token Manager
 */
class MCPOAuthManager {
  constructor() {
    this.state = this.loadState();
    this.config = this.loadConfig();
  }

  /**
   * 加载 OAuth state
   */
  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch (err) {
      console.error('[mcp-oauth] Load state failed:', err.message);
    }
    return {
      tokens: {}, // server_name -> {access_token, expires_at, refresh_token}
      refreshStats: {
        totalRefreshes: 0,
        failedRefreshes: 0,
        lastRefreshAt: null
      }
    };
  }

  /**
   * 保存 OAuth state
   */
  saveState() {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (err) {
      console.error('[mcp-oauth] Save state failed:', err.message);
    }
  }

  /**
   * 加载 extensions config
   */
  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      }
    } catch (err) {
      console.error('[mcp-oauth] Load config failed:', err.message);
    }
    return { mcpServers: {} };
  }

  /**
   * 获取环境变量（支持 $VAR_NAME 格式）
   */
  getEnvVar(value) {
    if (typeof value === 'string' && value.startsWith('$')) {
      const varName = value.slice(1);
      return process.env[varName] || '';
    }
    return value;
  }

  /**
   * 检查 token 是否即将过期
   * @param {number} expiresAt - Token过期时间（Unix timestamp，秒）
   * @param {number} skewSeconds - 提前刷新时间（秒）
   * @returns {boolean}
   */
  isTokenExpiring(expiresAt, skewSeconds = 60) {
    const now = Math.floor(Date.now() / 1000);
    return (expiresAt - now) <= skewSeconds;
  }

  /**
   * 刷新 OAuth token
   * @param {string} serverName - MCP server name
   * @param {object} oauthConfig - OAuth configuration
   * @returns {Promise<object|null>}
   */
  async refreshToken(serverName, oauthConfig) {
    const {
      token_url,
      grant_type,
      client_id,
      client_secret,
      scope,
      refresh_token
    } = oauthConfig;

    // 获取环境变量值
    const clientId = this.getEnvVar(client_id);
    const clientSecret = this.getEnvVar(client_secret);
    const refreshToken = this.getEnvVar(refresh_token);

    if (!clientId || !clientSecret) {
      console.error(`[mcp-oauth] Missing credentials for ${serverName}`);
      return null;
    }

    // 构建请求参数
    const params = new URLSearchParams();
    params.append('grant_type', grant_type);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    
    if (grant_type === 'client_credentials') {
      if (scope) params.append('scope', scope);
    } else if (grant_type === 'refresh_token') {
      if (!refreshToken) {
        console.error(`[mcp-oauth] Missing refresh_token for ${serverName}`);
        return null;
      }
      params.append('refresh_token', refreshToken);
    }

    // 发送 token 请求
    try {
      const tokens = await this.sendTokenRequest(token_url, params.toString());
      
      if (tokens && tokens.access_token) {
        // 计算过期时间
        const expiresIn = tokens.expires_in || 3600; // 默认1小时
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
        
        // 更新 state
        this.state.tokens[serverName] = {
          access_token: tokens.access_token,
          expires_at: expiresAt,
          expires_in: expiresIn,
          refresh_token: tokens.refresh_token || refreshToken,
          token_type: tokens.token_type || 'Bearer',
          scope: tokens.scope || scope
        };

        // 更新统计
        this.state.refreshStats.totalRefreshes++;
        this.state.refreshStats.lastRefreshAt = new Date().toISOString();

        this.saveState();

        console.log(`[mcp-oauth] Token refreshed for ${serverName}, expires_at: ${expiresAt}`);
        return this.state.tokens[serverName];
      }
    } catch (err) {
      console.error(`[mcp-oauth] Refresh failed for ${serverName}:`, err.message);
      this.state.refreshStats.failedRefreshes++;
      this.saveState();
    }

    return null;
  }

  /**
   * 发送 token 请求
   * @param {string} url - Token endpoint URL
   * @param {string} body - Request body
   * @returns {Promise<object>}
   */
  async sendTokenRequest(url, body) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  /**
   * 获取有效 token（自动刷新）
   * @param {string} serverName - MCP server name
   * @returns {Promise<string|null>}
   */
  async getValidToken(serverName) {
    const serverConfig = this.config.mcpServers?.[serverName];
    
    if (!serverConfig || !serverConfig.oauth?.enabled) {
      return null;
    }

    const oauthConfig = serverConfig.oauth;
    const skewSeconds = oauthConfig.refresh_skew_seconds || 60;

    // 检查现有 token
    const existingToken = this.state.tokens[serverName];
    
    if (existingToken && !this.isTokenExpiring(existingToken.expires_at, skewSeconds)) {
      return existingToken.access_token;
    }

    // Token 即将过期或不存在，刷新
    console.log(`[mcp-oauth] Token expiring or missing for ${serverName}, refreshing...`);
    
    const newToken = await this.refreshToken(serverName, oauthConfig);
    return newToken?.access_token || null;
  }

  /**
   * 扫描所有需要刷新的 token
   * @returns {Promise<object>}
   */
  async scanAllTokens() {
    const results = {
      scanned: 0,
      refreshed: 0,
      failed: 0,
      servers: []
    };

    const servers = this.config.mcpServers || {};
    
    for (const [serverName, serverConfig] of Object.entries(servers)) {
      if (!serverConfig.oauth?.enabled) {
        continue;
      }

      results.scanned++;

      const token = await this.getValidToken(serverName);
      
      results.servers.push({
        name: serverName,
        refreshed: !!token,
        expires_at: this.state.tokens[serverName]?.expires_at || null
      });

      if (token) {
        results.refreshed++;
      } else {
        results.failed++;
      }
    }

    return results;
  }

  /**
   * 生成状态报告
   */
  generateReport() {
    const stats = this.state.refreshStats;
    const tokens = this.state.tokens;

    return {
      stats: {
        totalRefreshes: stats.totalRefreshes,
        failedRefreshes: stats.failedRefreshes,
        successRate: stats.totalRefreshes > 0 
          ? ((stats.totalRefreshes - stats.failedRefreshes) / stats.totalRefreshes * 100).toFixed(1) + '%'
          : 'N/A',
        lastRefreshAt: stats.lastRefreshAt
      },
      tokens: Object.entries(tokens).map(([name, token]) => ({
        server: name,
        expires_at: token.expires_at,
        expires_in: token.expires_in,
        expires_in_human: this.formatExpiresIn(token.expires_at),
        token_type: token.token_type
      }))
    };
  }

  /**
   * 格式化过期时间（人类可读）
   */
  formatExpiresIn(expiresAt) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    if (remaining < 60) return `${remaining}s`;
    if (remaining < 3600) return `${Math.floor(remaining / 60)}m`;
    if (remaining < 86400) return `${Math.floor(remaining / 3600)}h`;
    return `${Math.floor(remaining / 86400)}d`;
  }
}

/**
 * CLI 命令处理
 */
async function handleCommand(command, args) {
  const manager = new MCPOAuthManager();

  switch (command) {
    case 'scan':
      console.log('[mcp-oauth] Scanning all OAuth tokens...');
      const results = await manager.scanAllTokens();
      console.log(JSON.stringify(results, null, 2));
      break;

    case 'refresh':
      const serverName = args[0];
      if (!serverName) {
        console.error('Usage: mcp-oauth-refresh.js refresh <server_name>');
        process.exit(1);
      }
      console.log(`[mcp-oauth] Refreshing token for ${serverName}...`);
      const token = await manager.getValidToken(serverName);
      console.log('Token:', token ? 'Refreshed successfully' : 'Failed');
      break;

    case 'status':
      const report = manager.generateReport();
      console.log(JSON.stringify(report, null, 2));
      break;

    case 'init':
      // 初始化 extensions-config.json
      const exampleConfig = {
        mcpServers: {
          "example-oauth-server": {
            enabled: false,
            type: "http",
            url: "https://api.example.com/mcp",
            oauth: {
              enabled: true,
              token_url: "https://auth.example.com/oauth/token",
              grant_type: "client_credentials",
              client_id: "$MCP_OAUTH_CLIENT_ID",
              client_secret: "$MCP_OAUTH_CLIENT_SECRET",
              scope: "mcp.read",
              refresh_skew_seconds: 60
            }
          }
        }
      };
      
      if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(exampleConfig, null, 2));
        console.log('[mcp-oauth] Created extensions-config.json');
      } else {
        console.log('[mcp-oauth] extensions-config.json already exists');
      }
      
      if (!fs.existsSync(STATE_FILE)) {
        manager.saveState();
        console.log('[mcp-oauth] Created mcp-oauth-state.json');
      }
      break;

    default:
      console.log('Usage: mcp-oauth-refresh.js <command>');
      console.log('Commands:');
      console.log('  init   - Initialize OAuth configuration files');
      console.log('  scan   - Scan and refresh all expiring tokens');
      console.log('  refresh <server> - Refresh token for specific server');
      console.log('  status - Show OAuth tokens status report');
  }
}

// 主入口
const args = process.argv.slice(2);
const command = args[0] || 'status';

handleCommand(command, args.slice(1)).catch(err => {
  console.error('[mcp-oauth] Error:', err.message);
  process.exit(1);
});