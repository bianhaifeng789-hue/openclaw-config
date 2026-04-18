---
name: fs-operations
description: "File system operations abstraction. FsOperations type (cwd/existsSync/stat/readdir/unlink/rmdir/rm/mkdir/readFile/rename/readFileSync/writeFileSync/mkdirSync) + safeResolvePath + UNC path blocking + FIFO/Socket blocking + Type safety + Alternative implementations. Use when [fs operations] is needed."
metadata:
  openclaw:
    emoji: "📁"
    triggers: [fs-ops, file-system]
    feishuCard: true
---

# FS Operations Skill - FS Operations

FS Operations 文件系统操作抽象。

## 为什么需要这个？

**场景**：
- File system abstraction
- Type-safe operations
- Alternative implementations（mock, virtual）
- Safe path resolution
- UNC/FIFO blocking

**Claude Code 方案**：fsOperations.ts + 771+ lines
**OpenClaw 飞书适配**：FS operations + File system

---

## FsOperations Type

```typescript
export type FsOperations = {
  // File access
  cwd(): string
  existsSync(path: string): boolean
  stat(path: string): Promise<fs.Stats>
  readdir(path: string): Promise<fs.Dirent[]>
  unlink(path: string): Promise<void>
  rmdir(path: string): Promise<void>
  rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>
  mkdir(path: string, options?: { mode?: number }): Promise<void>
  readFile(path: string, options: { encoding: BufferEncoding }): Promise<string>
  rename(oldPath: string, newPath: string): Promise<void>
  statSync(path: string): fs.Stats
  lstatSync(path: string): fs.Stats

  // File content
  readFileSync(path: string, options: { encoding: BufferEncoding }): string
  readFileBytesSync(path: string): Buffer
  readSync(path: string, options: { length: number }): { buffer: Buffer; bytesRead: number }
  appendFileSync(path: string, data: string, options?: { mode?: number }): void
  copyFileSync(src: string, dest: string): void
  unlinkSync(path: string): void
  renameSync(oldPath: string, newPath: string): void
  linkSync(target: string, path: string): void
  symlinkSync(target: string, path: string, type?: 'dir' | 'file' | 'junction'): void
  readlinkSync(path: string): string
  realpathSync(path: string): string

  // Directory
  mkdirSync(path: string, options?: { mode?: number }): void
  readdirSync(path: string): fs.Dirent[]
  readdirStringSync(path: string): string[]
  isDirEmptySync(path: string): boolean
  rmdirSync(path: string): void
  rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void
  createWriteStream(path: string): fs.WriteStream
  readFileBytes(path: string, maxBytes?: number): Promise<Buffer>
}
```

---

## Functions

### 1. Safe Resolve Path

```typescript
export function safeResolvePath(
  fs: FsOperations,
  filePath: string,
): { resolvedPath: string; isSymlink: boolean; isCanonical: boolean } {
  // Block UNC paths（Windows network）
  if (filePath.startsWith('//') || filePath.startsWith('\\\\')) {
    return { resolvedPath: filePath, isSymlink: false, isCanonical: false }
  }

  try {
    // Check for FIFOs, sockets, devices
    // realpathSync can block on FIFOs
    const lstat = fs.lstatSync(filePath)
    
    if (lstat.isFIFO() || lstat.isSocket() || lstat.isBlockDevice() || lstat.isCharacterDevice()) {
      return { resolvedPath: filePath, isSymlink: false, isCanonical: false }
    }

    const resolved = fs.realpathSync(filePath)
    const isSymlink = lstat.isSymbolicLink()
    return { resolvedPath: resolved, isSymlink, isCanonical: true }
  } catch {
    // File doesn't exist or symlink resolution failed
    return { resolvedPath: filePath, isSymlink: false, isCanonical: false }
  }
}
```

---

## Security Features

| Feature | Description |
|---------|-------------|
| **UNC blocking** | Prevent DNS/SMB on Windows |
| **FIFO blocking** | Prevent hangs on FIFOs |
| **Socket blocking** | Prevent hangs on sockets |
| **Device blocking** | Prevent device access |
| **Symlink safe** | Handle broken symlinks |

---

## 飞书卡片格式

### FS Operations 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📁 FS Operations**\n\n---\n\n**FsOperations Type**：\n• cwd/existsSync/stat/readdir\n• unlink/rmdir/rm/mkdir/readFile\n• rename/statSync/lstatSync\n• readFileSync/writeFileSync\n• mkdirSync/readdirSync\n\n---\n\n**Security**：\n• UNC path blocking\n• FIFO/Socket blocking\n• Symlink safe resolution\n\n---\n\n**Functions**：\n• safeResolvePath()"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/fs-operations-state.json
{
  "stats": {
    "totalOperations": 0,
    "blockedPaths": 0
  },
  "lastUpdate": "2026-04-12T12:37:00Z",
  "notes": "FS Operations Skill 创建完成。"
}