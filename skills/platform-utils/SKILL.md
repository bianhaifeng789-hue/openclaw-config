---
name: platform-utils
description: "Platform detection utilities. Platform type (macos/windows/wsl/linux/unknown) + getPlatform + getWslVersion + getLinuxDistroInfo + detectVcs + VCS_MARKERS (git/hg/svn/p4/tfs/jj/sl) + SUPPORTED_PLATFORMS + /proc/version check. Use when [platform utils] is needed."
metadata:
  openclaw:
    emoji: "💻"
    triggers: [platform, wsl]
    feishuCard: true
---

# Platform Utils Skill - Platform Utils

Platform Utils 平台检测工具。

## 为什么需要这个？

**场景**：
- Platform detection
- WSL version detection
- Linux distro info
- VCS detection
- Timeout adjustment

**Claude Code 方案**：platform.ts + 150+ lines
**OpenClaw 飞书适配**：Platform utils + Platform detection

---

## Types

### Platform

```typescript
export type Platform = 'macos' | 'windows' | 'wsl' | 'linux' | 'unknown'

export const SUPPORTED_PLATFORMS: Platform[] = ['macos', 'wsl']
```

### LinuxDistroInfo

```typescript
export type LinuxDistroInfo = {
  linuxDistroId?: string
  linuxDistroVersion?: string
  linuxKernel?: string
}
```

---

## VCS Markers

```typescript
const VCS_MARKERS: Array<[string, string]> = [
  ['.git', 'git'],
  ['.hg', 'mercurial'],
  ['.svn', 'svn'],
  ['.p4config', 'perforce'],
  ['$tf', 'tfs'],
  ['.tfvc', 'tfs'],
  ['.jj', 'jujutsu'],
  ['.sl', 'sapling'],
]
```

---

## Functions

### 1. Get Platform

```typescript
export const getPlatform = memoize((): Platform => {
  if (process.platform === 'darwin') {
    return 'macos'
  }

  if (process.platform === 'win32') {
    return 'windows'
  }

  if (process.platform === 'linux') {
    try {
      const procVersion = fs.readFileSync('/proc/version', { encoding: 'utf8' })
      if (
        procVersion.toLowerCase().includes('microsoft') ||
        procVersion.toLowerCase().includes('wsl')
      ) {
        return 'wsl'
      }
    } catch {}

    return 'linux'
  }

  return 'unknown'
})
```

### 2. Get WSL Version

```typescript
export const getWslVersion = memoize((): string | undefined => {
  if (process.platform !== 'linux') return undefined

  try {
    const procVersion = fs.readFileSync('/proc/version', { encoding: 'utf8' })

    // WSL2, WSL3, etc.
    const wslVersionMatch = procVersion.match(/WSL(\d+)/i)
    if (wslVersionMatch && wslVersionMatch[1]) {
      return wslVersionMatch[1]
    }

    // WSL1（Microsoft without explicit version）
    if (procVersion.toLowerCase().includes('microsoft')) {
      return '1'
    }

    return undefined
  } catch {
    return undefined
  }
})
```

### 3. Get Linux Distro Info

```typescript
export const getLinuxDistroInfo = memoize(
  async (): Promise<LinuxDistroInfo | undefined> => {
    if (process.platform !== 'linux') return undefined

    const result: LinuxDistroInfo = {
      linuxKernel: osRelease(),
    }

    try {
      const content = await readFile('/etc/os-release', 'utf8')
      for (const line of content.split('\n')) {
        const match = line.match(/^(ID|VERSION_ID)=(.*)$/)
        if (match && match[1] && match[2]) {
          const value = match[2].replace(/^"|"$/g, '')
          if (match[1] === 'ID') {
            result.linuxDistroId = value
          } else {
            result.linuxDistroVersion = value
          }
        }
      }
    } catch {}

    return result
  },
)
```

### 4. Detect VCS

```typescript
export async function detectVcs(dir?: string): Promise<string[]> {
  const detected = new Set<string>()

  // Perforce via env
  if (process.env.P4PORT) {
    detected.add('perforce')
  }

  try {
    const targetDir = dir ?? fs.cwd()
    const entries = new Set(await readdir(targetDir))
    for (const [marker, vcs] of VCS_MARKERS) {
      if (entries.has(marker)) {
        detected.add(vcs)
      }
    }
  } catch {}

  return [...detected]
}
```

---

## WSL Timeout Adjustment

| Platform | Ripgrep Timeout |
|----------|-----------------|
| **WSL** | 60s（3-5x slower） |
| **Other** | 20s |

---

## 飞书卡片格式

### Platform Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**💻 Platform Utils**\n\n---\n\n**Platform Types**：\n• macos/windows/wsl/linux/unknown\n\n---\n\n**Functions**：\n• getPlatform()\n• getWslVersion()\n• getLinuxDistroInfo()\n• detectVcs()\n\n---\n\n**VCS Markers**：\n• .git/.hg/.svn\n• .p4config/$tf/.tfvc\n• .jj/.sl\n\n---\n\n**WSL**：\n• WSL1/WSL2 detection\n• Timeout adjustment（60s）"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/platform-utils-state.json
{
  "stats": {
    "platformChecks": 0,
    "wslCount": 0
  },
  "lastUpdate": "2026-04-12T12:37:00Z",
  "notes": "Platform Utils Skill 创建完成。"
}