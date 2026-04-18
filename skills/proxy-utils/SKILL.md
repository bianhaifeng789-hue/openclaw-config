---
name: proxy-utils
description: "Proxy configuration utilities. getProxyUrl + getNoProxy + shouldBypassProxy + createHttpsProxyAgent + getAddressFamily + disableKeepAlive + HTTPS_PROXY/HTTP_PROXY env + NO_PROXY wildcard (*) + Domain suffix matching + Port-specific matches + mTLS support + ~929KB AWS SDK deferred + ~1.5MB undici deferred. Use when [proxy utils] is needed."
metadata:
  openclaw:
    emoji: "🌐"
    triggers: [proxy, https-proxy]
    feishuCard: true
---

# Proxy Utils Skill - Proxy Utils

Proxy Utils 代理配置工具。

## 为什么需要这个？

**场景**：
- HTTPS_PROXY configuration
- NO_PROXY bypass
- mTLS support
- Proxy agent creation
- Connection pooling

**Claude Code 方案**：proxy.ts + 400+ lines
**OpenClaw 飞书适配**：Proxy utils + Proxy config

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| **HTTPS_PROXY** | HTTPS proxy URL（preferred） |
| **HTTP_PROXY** | HTTP proxy URL |
| **https_proxy** | Lowercase variant |
| **http_proxy** | Lowercase variant |
| **NO_PROXY** | Bypass list（comma/space） |
| **no_proxy** | Lowercase variant |

---

## Functions

### 1. Get Proxy URL

```typescript
export function getProxyUrl(env: EnvLike = process.env): string | undefined {
  return env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY
}
```

### 2. Get NO_PROXY

```typescript
export function getNoProxy(env: EnvLike = process.env): string | undefined {
  return env.no_proxy || env.NO_PROXY
}
```

### 3. Should Bypass Proxy

```typescript
export function shouldBypassProxy(
  urlString: string,
  noProxy: string | undefined = getNoProxy(),
): boolean {
  if (!noProxy) return false

  // Wildcard
  if (noProxy === '*') return true

  try {
    const url = new URL(urlString)
    const hostname = url.hostname.toLowerCase()
    const port = url.port || (url.protocol === 'https:' ? '443' : '80')
    const hostWithPort = `${hostname}:${port}`

    const noProxyList = noProxy.split(/[,\s]+/).filter(Boolean)

    return noProxyList.some(pattern => {
      pattern = pattern.toLowerCase().trim()

      // Port-specific match
      if (pattern.includes(':')) {
        return hostWithPort === pattern
      }

      // Domain suffix match（.example.com）
      if (pattern.startsWith('.')) {
        return hostname === pattern.substring(1) || hostname.endsWith(pattern)
      }

      // Exact match
      return hostname === pattern
    })
  } catch {
    return false
  }
}
```

### 4. Create HTTPS Proxy Agent

```typescript
function createHttpsProxyAgent(
  proxyUrl: string,
  extra: HttpsProxyAgentOptions<string> = {},
): HttpsProxyAgent<string> {
  const mtlsConfig = getMTLSConfig()
  const caCerts = getCACertificates()

  const agentOptions: HttpsProxyAgentOptions<string> = {
    ...(mtlsConfig && {
      cert: mtlsConfig.cert,
      key: mtlsConfig.key,
      passphrase: mtlsConfig.passphrase,
    }),
    ...(caCerts && { ca: caCerts }),
  }

  return new HttpsProxyAgent(proxyUrl, agentOptions)
}
```

### 5. Disable Keep-Alive

```typescript
export function disableKeepAlive(): void {
  keepAliveDisabled = true
}
```

---

## NO_PROXY Patterns

| Pattern | Match |
|---------|-------|
| **Wildcard (*)** | All hosts |
| **.example.com** | sub.example.com, example.com |
| **example.com** | Exact match |
| **example.com:8080** | Port-specific |
| **127.0.0.1** | IP address |

---

## Deferred Imports

| Module | Size | Deferred |
|--------|------|----------|
| **@aws-sdk/credential-provider-node** | ~929KB | Yes |
| **@smithy/node-http-handler** | ~929KB | Yes |
| **undici** | ~1.5MB | Yes |

---

## 飞书卡片格式

### Proxy Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🌐 Proxy Utils**\n\n---\n\n**Env Variables**：\n• HTTPS_PROXY/HTTP_PROXY\n• NO_PROXY/no_proxy\n\n---\n\n**Functions**：\n• getProxyUrl()\n• getNoProxy()\n• shouldBypassProxy()\n• createHttpsProxyAgent()\n• disableKeepAlive()\n\n---\n\n**NO_PROXY Patterns**：\n• Wildcard (*)\n• Domain suffix (.example.com)\n• Port-specific\n\n---\n\n**Deferred**：\n• ~929KB AWS SDK\n• ~1.5MB undici"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/proxy-utils-state.json
{
  "stats": {
    "proxyRequests": 0,
    "bypassedRequests": 0
  },
  "lastUpdate": "2026-04-12T12:37:00Z",
  "notes": "Proxy Utils Skill 创建完成。"
}