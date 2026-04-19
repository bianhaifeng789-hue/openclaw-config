# Semver Utils Skill

**优先级**: P29
**来源**: Claude Code `semver.ts`
**适用场景**: 版本比较、兼容性检查

---

## 概述

Semver Utils提供版本比较函数，使用Bun.semver（快）或npm semver（兼容）。支持gt、gte、lt、lte、satisfies、order操作。

---

## 核心功能

### 1. 版本比较

```typescript
export function gt(a: string, b: string): boolean {
  if (typeof Bun !== 'undefined') {
    return Bun.semver.order(a, b) === 1
  }
  return getNpmSemver().gt(a, b, { loose: true })
}

export function gte(a: string, b: string): boolean {
  if (typeof Bun !== 'undefined') {
    return Bun.semver.order(a, b) >= 0
  }
  return getNpmSemver().gte(a, b, { loose: true })
}

export function lt(a: string, b: string): boolean {
  if (typeof Bun !== 'undefined') {
    return Bun.semver.order(a, b) === -1
  }
  return getNpmSemver().lt(a, b, { loose: true })
}
```

### 2. Range匹配

```typescript
export function satisfies(version: string, range: string): boolean {
  if (typeof Bun !== 'undefined') {
    return Bun.semver.satisfies(version, range)
  }
  return getNpmSemver().satisfies(version, range, { loose: true })
}
```

### 3. Order排序

```typescript
export function order(a: string, b: string): -1 | 0 | 1 {
  if (typeof Bun !== 'undefined') {
    return Bun.semver.order(a, b)
  }
  return getNpmSemver().compare(a, b, { loose: true })
}
```

---

## OpenClaw应用

### 1. 版本检查

```typescript
// 检查OpenClaw版本
const currentVersion = '1.0.0'
const minVersion = '0.9.0'

if (gte(currentVersion, minVersion)) {
  // 版本兼容
}
```

### 2. Range匹配

```typescript
// 检查Node版本范围
const nodeVersion = process.version.slice(1)
if (satisfies(nodeVersion, '>=18.0.0 <24.0.0')) {
  // Node版本在范围内
}
```

---

## 状态文件

```json
{
  "skill": "semver-utils",
  "priority": "P29",
  "source": "semver.ts",
  "enabled": true,
  "operations": ["gt", "gte", "lt", "lte", "satisfies", "order"],
  "comparisons": 0,
  "createdAt": "2026-04-12T13:00:00Z"
}
```

---

## 参考

- Claude Code: `semver.ts`