---
name: mcp-oauth-service
description: "| Use when [mcp oauth service] is needed."
  MCP OAuth service.
  
  Types:
  - AuthorizationServerMetadata
  - OAuthClientInformation, OAuthClientInformationFull
  - OAuthClientMetadata, OAuthTokens
  
  Functions:
  - discoverAuthorizationServerMetadata
  - discoverOAuthServerInfo
  - buildRedirectUri, findAvailablePort
  
  Errors:
  - InvalidGrantError, OAuthError, ServerError
  - TemporarilyUnavailableError, TooManyRequestsError
  
  Keywords:
  - Service reference - MCP OAuth
metadata:
  openclaw:
    emoji: "🔐"
    source: claude-code-services
    triggers: [mcp-oauth-service]
    priority: P2
---

# MCP OAuth Service

MCP OAuth服务。

---

来源: Claude Code services/mcp/auth.ts