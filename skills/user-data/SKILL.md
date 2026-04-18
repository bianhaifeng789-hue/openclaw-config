---
name: user-data
description: "Core user data for analytics. CoreUserData type (deviceId/sessionId/email/appVersion/platform) + getCoreUserData + initUser + resetUserCache + getUserForGrowthBook + GitHubActionsMetadata + memoize cache. Use when [user data] is needed."
metadata:
  openclaw:
    emoji: "👤"
    triggers: [user-data, analytics-user]
    feishuCard: true
---

# User Data Skill - User Data

User Data 用户数据工具。

## 为什么需要这个？

**场景**：
- Analytics user data
- GrowthBook integration
- Device/session ID
- Email caching
- GitHub Actions metadata

**Claude Code 方案**：user.ts + 200+ lines
**OpenClaw 飞书适配**：User data + Analytics

---

## Types

### CoreUserData

```typescript
type CoreUserData = {
  deviceId: string
  sessionId: string
  email?: string
  appVersion: string
  platform: typeof env.platform
  organizationUuid?: string
  accountUuid?: string
  userType?: string
  subscriptionType?: string
  rateLimitTier?: string
  firstTokenTime?: number
  githubActionsMetadata?: GitHubActionsMetadata
}
```

### GitHubActionsMetadata

```typescript
type GitHubActionsMetadata = {
  actor?: string
  actorId?: string
  repository?: string
  repositoryId?: string
  repositoryOwner?: string
  repositoryOwnerId?: string
}
```

---

## Functions

### 1. Initialize User

```typescript
async function initUser(): Promise<void> {
  if (cachedEmail === null && !emailFetchPromise) {
    emailFetchPromise = getEmailAsync()
    cachedEmail = await emailFetchPromise
    emailFetchPromise = null
    // Clear memoization cache
    getCoreUserData.cache.clear?.()
  }
}
```

### 2. Get Core User Data

```typescript
const getCoreUserData = memoize(
  (includeAnalyticsMetadata?: boolean): CoreUserData => {
    const deviceId = getOrCreateUserID()
    const config = getGlobalConfig()

    let subscriptionType: string | undefined
    let rateLimitTier: string | undefined
    let firstTokenTime: number | undefined
    if (includeAnalyticsMetadata) {
      subscriptionType = getSubscriptionType() ?? undefined
      rateLimitTier = getRateLimitTier() ?? undefined
      // ...
    }

    return {
      deviceId,
      sessionId: getSessionId(),
      email: getEmail(),
      appVersion: MACRO.VERSION,
      platform: getHostPlatformForAnalytics(),
      organizationUuid,
      accountUuid,
      userType: process.env.USER_TYPE,
      subscriptionType,
      rateLimitTier,
      firstTokenTime,
      // GitHub Actions metadata if in CI
      ...(isEnvTruthy(process.env.GITHUB_ACTIONS) && {
        githubActionsMetadata: {
          actor: process.env.GITHUB_ACTOR,
          actorId: process.env.GITHUB_ACTOR_ID,
          repository: process.env.GITHUB_REPOSITORY,
          repositoryId: process.env.GITHUB_REPOSITORY_ID,
          repositoryOwner: process.env.GITHUB_REPOSITORY_OWNER,
          repositoryOwnerId: process.env.GITHUB_REPOSITORY_OWNER_ID,
        },
      }),
    }
  },
)
```

### 3. Reset User Cache

```typescript
function resetUserCache(): void {
  cachedEmail = null
  emailFetchPromise = null
  getCoreUserData.cache.clear?.()
  getGitEmail.cache.clear?.()
}
```

---

## 飞书卡片格式

### User Data 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**👤 User Data**\n\n---\n\n**CoreUserData**：\n• deviceId - Device ID\n• sessionId - Session ID\n• email - Email\n• appVersion - App version\n• platform - Platform\n• organizationUuid - Org ID\n• accountUuid - Account ID\n\n---\n\n**Functions**：\n• initUser() - Async init\n• getCoreUserData() - Get data\n• resetUserCache() - Reset cache\n• getUserForGrowthBook() - GrowthBook\n\n---\n\n**Features**：\n• Email caching\n• GitHub Actions metadata\n• memoize"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/user-data-state.json
{
  "userData": null,
  "stats": {
    "totalCalls": 0
  },
  "lastUpdate": "2026-04-12T10:52:00Z",
  "notes": "User Data Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| user.ts (200+ lines) | Skill + User |
| CoreUserData | Analytics type |
| getCoreUserData() | Memoize |
| GitHubActionsMetadata | CI metadata |

---

## 注意事项

1. **memoize**：Cache user data
2. **Email caching**：Async fetch
3. **GitHub Actions**：CI metadata
4. **resetUserCache**：Auth changes
5. **GrowthBook**：getUserForGrowthBook()

---

## 自动启用

此 Skill 在 user data 时自动运行。

---

## 下一步增强

- 飞书 user 集成
- User analytics
- User debugging