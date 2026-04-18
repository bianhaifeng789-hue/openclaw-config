# System Directories Skill

**优先级**: P30
**来源**: Claude Code `systemDirectories.ts`
**适用场景**: 跨平台系统目录访问

---

## 概述

System Directories提供跨平台系统目录访问（HOME、DESKTOP、DOCUMENTS、DOWNLOADS），支持Windows、macOS、Linux、WSL。遵循XDG Base Directory规范。

---

## 核心功能

### 1. 目录类型

```typescript
export type SystemDirectories = {
  HOME: string
  DESKTOP: string
  DOCUMENTS: string
  DOWNLOADS: string
  [key: string]: string
}
```

### 2. 跨平台支持

```typescript
export function getSystemDirectories(
  options?: SystemDirectoriesOptions
): SystemDirectories {
  switch (platform) {
    case 'windows': {
      // Windows: Use USERPROFILE (handles localized folder names)
      const userProfile = env.USERPROFILE || homeDir
      return {
        HOME: homeDir,
        DESKTOP: join(userProfile, 'Desktop'),
        DOCUMENTS: join(userProfile, 'Documents'),
        DOWNLOADS: join(userProfile, 'Downloads')
      }
    }
    
    case 'linux': case 'wsl': {
      // Linux/WSL: XDG Base Directory specification
      return {
        HOME: homeDir,
        DESKTOP: env.XDG_DESKTOP_DIR || defaults.DESKTOP,
        DOCUMENTS: env.XDG_DOCUMENTS_DIR || defaults.DOCUMENTS,
        DOWNLOADS: env.XDG_DOWNLOAD_DIR || defaults.DOWNLOADS
      }
    }
    
    case 'macos': default: {
      // macOS: Standard paths
      return defaults
    }
  }
}
```

---

## OpenClaw应用

### 1. 飞书文件保存

```typescript
const dirs = getSystemDirectories()

// 保存到Documents
const savePath = join(dirs.DOCUMENTS, 'report.pdf')

// 保存到Downloads
const downloadPath = join(dirs.DOWNLOADS, 'export.xlsx')
```

### 2. 跨平台兼容

```typescript
// 自动处理Windows/macOS/Linux差异
// XDG env: XDG_DESKTOP_DIR, XDG_DOCUMENTS_DIR, XDG_DOWNLOAD_DIR
```

---

## 状态文件

```json
{
  "skill": "system-directories",
  "priority": "P30",
  "source": "systemDirectories.ts",
  "enabled": true,
  "platforms": ["windows", "macos", "linux", "wsl"],
  "xdgSupport": true,
  "createdAt": "2026-04-12T13:30:00Z"
}
```

---

## 参考

- Claude Code: `systemDirectories.ts`
- XDG Base Directory Specification