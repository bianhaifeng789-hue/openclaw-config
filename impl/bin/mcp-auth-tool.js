#!/usr/bin/env node
/**
 * MCP Auth Tool - 基于 Claude Code McpAuthTool
 * 
 * MCP 服务器认证：
 *   - OAuth 认证管理
 *   - Token 存储
 *   - 权限验证
 * 
 * Usage:
 *   node mcp-auth-tool.js auth <serverName>
 *   node mcp-auth-tool.js token <serverName>
 *   node mcp-auth-tool.js list
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'mcp');
const AUTH_FILE = path.join(STATE_DIR, 'auth-store.json');

const MCP_AUTH_TOOL_NAME = 'McpAuth';

function loadAuthStore() {
  if (!fs.existsSync(AUTH_FILE)) {
    return { servers: {}, pendingAuths: [] };
  }
  
  try {
    return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  } catch {
    return { servers: {}, pendingAuths: [] };
  }
}

function saveAuthStore(authStore) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(authStore, null, 2));
}

function authServer(serverName, authMethod = 'oauth') {
  const authStore = loadAuthStore();
  
  // Check if already authenticated
  if (authStore.servers[serverName] && authStore.servers[serverName].authenticated) {
    return {
      authenticated: true,
      serverName,
      existingAuth: authStore.servers[serverName],
      message: 'Server already authenticated'
    };
  }
  
  // Create auth request (in real implementation, would start OAuth flow)
  const authRequest = {
    serverName,
    authMethod,
    status: 'pending',
    requestedAt: Date.now(),
    id: `auth_${serverName}_${Date.now()}`
  };
  
  authStore.pendingAuths.push(authRequest);
  saveAuthStore(authStore);
  
  return {
    requested: true,
    authRequest,
    message: 'Auth request created. In real implementation, would start OAuth flow',
    note: 'User would need to visit auth URL and grant permissions'
  };
}

function completeAuth(serverName, token) {
  const authStore = loadAuthStore();
  
  // Remove from pending
  authStore.pendingAuths = authStore.pendingAuths.filter(
    a => a.serverName !== serverName
  );
  
  // Store auth
  authStore.servers[serverName] = {
    serverName,
    authenticated: true,
    token,
    authMethod: 'oauth',
    authenticatedAt: Date.now(),
    expiresAt: null // Would calculate from token
  };
  
  saveAuthStore(authStore);
  
  return {
    completed: true,
    serverName,
    authenticatedAt: Date.now()
  };
}

function getToken(serverName) {
  const authStore = loadAuthStore();
  
  if (!authStore.servers[serverName]) {
    return {
      found: false,
      serverName,
      error: 'server not authenticated'
    };
  }
  
  const serverAuth = authStore.servers[serverName];
  
  if (!serverAuth.authenticated) {
    return {
      found: false,
      serverName,
      status: serverAuth.status
    };
  }
  
  return {
    found: true,
    serverName,
    token: serverAuth.token,
    authenticatedAt: serverAuth.authenticatedAt,
    expiresAt: serverAuth.expiresAt
  };
}

function revokeAuth(serverName) {
  const authStore = loadAuthStore();
  
  if (!authStore.servers[serverName]) {
    return {
      revoked: false,
      serverName,
      error: 'server not found'
    };
  }
  
  authStore.servers[serverName] = {
    ...authStore.servers[serverName],
    authenticated: false,
    revokedAt: Date.now(),
    token: null
  };
  
  saveAuthStore(authStore);
  
  return {
    revoked: true,
    serverName
  };
}

function listAuthenticatedServers() {
  const authStore = loadAuthStore();
  
  const authenticated = Object.entries(authStore.servers)
    .filter(([_, s]) => s.authenticated)
    .map(([name, s]) => ({
      serverName: name,
      authMethod: s.authMethod,
      authenticatedAt: s.authenticatedAt
    }));
  
  const pending = authStore.pendingAuths.map(a => ({
    serverName: a.serverName,
    status: a.status,
    requestedAt: a.requestedAt
  }));
  
  return {
    authenticated,
    pending,
    authenticatedCount: authenticated.length,
    pendingCount: pending.length
  };
}

function checkAuthStatus(serverName) {
  const authStore = loadAuthStore();
  
  const server = authStore.servers[serverName];
  const pending = authStore.pendingAuths.find(a => a.serverName === serverName);
  
  return {
    serverName,
    authenticated: server?.authenticated || false,
    pending: pending?.status || null,
    lastAuth: server?.authenticatedAt || null
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'auth':
      const authServerName = args[1];
      const authMethod = args[2] || 'oauth';
      if (!authServerName) {
        console.log('Usage: node mcp-auth-tool.js auth <serverName> [method]');
        process.exit(1);
      }
      console.log(JSON.stringify(authServer(authServerName, authMethod), null, 2));
      break;
    case 'complete':
      const completeServerName = args[1];
      const completeToken = args[2];
      if (!completeServerName || !completeToken) {
        console.log('Usage: node mcp-auth-tool.js complete <serverName> <token>');
        process.exit(1);
      }
      console.log(JSON.stringify(completeAuth(completeServerName, completeToken), null, 2));
      break;
    case 'token':
      const tokenServerName = args[1];
      if (!tokenServerName) {
        console.log('Usage: node mcp-auth-tool.js token <serverName>');
        process.exit(1);
      }
      console.log(JSON.stringify(getToken(tokenServerName), null, 2));
      break;
    case 'revoke':
      const revokeServerName = args[1];
      if (!revokeServerName) {
        console.log('Usage: node mcp-auth-tool.js revoke <serverName>');
        process.exit(1);
      }
      console.log(JSON.stringify(revokeAuth(revokeServerName), null, 2));
      break;
    case 'list':
      console.log(JSON.stringify(listAuthenticatedServers(), null, 2));
      break;
    case 'status':
      const statusServerName = args[1];
      if (!statusServerName) {
        console.log('Usage: node mcp-auth-tool.js status <serverName>');
        process.exit(1);
      }
      console.log(JSON.stringify(checkAuthStatus(statusServerName), null, 2));
      break;
    default:
      console.log('Usage: node mcp-auth-tool.js [auth|complete|token|revoke|list|status]');
      process.exit(1);
  }
}

main();

module.exports = {
  authServer,
  completeAuth,
  getToken,
  revokeAuth,
  listAuthenticatedServers,
  checkAuthStatus,
  MCP_AUTH_TOOL_NAME
};