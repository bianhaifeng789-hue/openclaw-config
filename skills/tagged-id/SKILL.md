# Tagged ID Skill

**优先级**: P30
**来源**: Claude Code `taggedId.ts`
**适用场景**: Base58编码、UUID转换

---

## 概述

Tagged ID将UUID转换为API的tagged ID格式（user_01PaGUP2rbg1XDh7Z9W1CEpd）。Base58编码，22 chars，version: '01'。

---

## 核心功能

### 1. Base58编码

```typescript
const BASE_58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const VERSION = '01'
const ENCODED_LENGTH = 22 // ceil(128 / log2(58))

function base58Encode(n: bigint): string {
  const base = BigInt(BASE_58_CHARS.length)
  const result = new Array<string>(ENCODED_LENGTH).fill(BASE_58_CHARS[0])
  let i = ENCODED_LENGTH - 1
  while (value > 0n) {
    const rem = Number(value % base)
    result[i] = BASE_58_CHARS[rem]
    value = value / base
    i--
  }
  return result.join('')
}
```

### 2. UUID转换

```typescript
function uuidToBigInt(uuid: string): bigint {
  const hex = uuid.replace(/-/g, '')
  return BigInt('0x' + hex)
}

export function toTaggedId(tag: string, uuid: string): string {
  const n = uuidToBigInt(uuid)
  return `${tag}_${VERSION}${base58Encode(n)}`
}
```

---

## OpenClaw应用

### 1. 飞书用户ID

```typescript
// UUID → Tagged ID
const taggedId = toTaggedId('user', userUuid)
// 输出: "user_01PaGUP2rbg1XDh7Z9W1CEpd"
```

---

## 状态文件

```json
{
  "skill": "tagged-id",
  "priority": "P30",
  "source": "taggedId.ts",
  "enabled": true,
  "version": "01",
  "encodedLength": 22,
  "createdAt": "2026-04-12T13:30:00Z"
}
```

---

## 参考

- Claude Code: `taggedId.ts`
- API: `tagged_id.py`