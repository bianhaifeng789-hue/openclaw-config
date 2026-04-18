# Buddy Companion Pattern Skill

Buddy Companion Pattern - Mulberry32 PRNG + Rarity Roll + hashString + rollCache + CompanionBones vs CompanionSoul + Shiny chance 1%。

## 功能概述

从Claude Code的buddy/companion.ts提取的伙伴系统模式，用于OpenClaw的趣味性功能。

## 核心机制

### Mulberry32 PRNG

```typescript
// Mulberry32 — tiny seeded PRNG, good enough for picking ducks
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// Tiny seeded PRNG
// Deterministic from seed
// Good enough for casual use
```

### hashString Platform-Aware

```typescript
function hashString(s: string): number {
  if (typeof Bun !== 'undefined') {
    return Number(BigInt(Bun.hash(s)) & 0xffffffffn)
  }
  // FNV-1a hash for Node
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
// Bun: use Bun.hash (fast)
// Node: FNV-1a hash (fallback)
// Platform-aware implementation
```

### Rarity Roll

```typescript
const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
}

function rollRarity(rng: () => number): Rarity {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0)
  let roll = rng() * total
  for (const rarity of RARITIES) {
    roll -= RARITY_WEIGHTS[rarity]
    if (roll < 0) return rarity
  }
  return 'common'
}
// Weighted random roll
// Rarity weights: common 60%, legendary 1%
// Cumulative subtraction
```

### rollCache Pattern

```typescript
let rollCache: { key: string; value: Roll } | undefined

export function roll(userId: string): Roll {
  const key = userId + SALT
  if (rollCache?.key === key) return rollCache.value  // Cache hit
  const value = rollFrom(mulberry32(hashString(key)))
  rollCache = { key, value }
  return value
}
// Deterministic result from userId
// Cache for hot paths (500ms sprite tick, per-keystroke, per-turn)
// Same userId = same result
```

### CompanionBones vs CompanionSoul

```typescript
// Deterministic parts — derived from hash(userId)
export type CompanionBones = {
  rarity: Rarity
  species: Species
  eye: Eye
  hat: Hat
  shiny: boolean
  stats: Record<StatName, number>
}

// Model-generated soul — stored in config after first hatch
export type CompanionSoul = {
  name: string
  personality: string
}

// Bones regenerated from hash(userId) so species renames don't break stored companions
// and users can't edit their way to a legendary.
// Bones never persist → stale bones fields get overridden
export function getCompanion(): Companion | undefined {
  const stored = getGlobalConfig().companion
  if (!stored) return undefined
  const { bones } = roll(companionUserId())
  return { ...stored, ...bones }  // bones last → override stale fields
}
// Bones: deterministic from userId hash
// Soul: model-generated, stored in config
// Separation prevents config editing abuse
```

### Shiny Chance 1%

```typescript
function rollFrom(rng: () => number): Roll {
  const rarity = rollRarity(rng)
  const bones: CompanionBones = {
    rarity,
    species: pick(rng, SPECIES),
    eye: pick(rng, EYES),
    hat: rarity === 'common' ? 'none' : pick(rng, HATS),
    shiny: rng() < 0.01,  // 1% shiny chance
    stats: rollStats(rng, rarity),
  }
  return { bones, inspirationSeed: Math.floor(rng() * 1e9) }
}
// shiny: 1% chance
// hat: common has no hat
// inspirationSeed: for name/personality generation
```

### Stats Roll Pattern

```typescript
const RARITY_FLOOR: Record<Rarity, number> = {
  common: 5,
  uncommon: 15,
  rare: 25,
  epic: 35,
  legendary: 50,
}

function rollStats(rng: () => number, rarity: Rarity): Record<StatName, number> {
  const floor = RARITY_FLOOR[rarity]
  const peak = pick(rng, STAT_NAMES)       // One peak stat
  let dump = pick(rng, STAT_NAMES)
  while (dump === peak) dump = pick(rng, STAT_NAMES)  // One dump stat (different)

  const stats = {} as Record<StatName, number>
  for (const name of STAT_NAMES) {
    if (name === peak) {
      stats[name] = Math.min(100, floor + 50 + Math.floor(rng() * 30))  // Peak: floor + 50-80
    } else if (name === dump) {
      stats[name] = Math.max(1, floor - 10 + Math.floor(rng() * 15))    // Dump: floor - 10-5
    } else {
      stats[name] = floor + Math.floor(rng() * 40)                      // Others: floor + 0-40
    }
  }
  return stats
}
// Rarity floor determines minimum
// One peak stat, one dump stat
// Rest scattered
```

## 实现建议

### OpenClaw适配

1. **mulberry32PRNG**: 种子化PRNG
2. **rarityRoll**: 稀有度roll系统
3. **rollCache**: 确定性缓存
4. **bonesSoul**: Bones/Soul分离
5. **shinyChance**: 闪光几率

### 状态文件示例

```json
{
  "userId": "user_abc",
  "rarity": "rare",
  "species": "duck",
  "shiny": false,
  "stats": {
    "DEBUGGING": 75,
    "PATIENCE": 25,
    "CHAOS": 40
  }
}
```

## 关键模式

### Seeded Determinism

```
hashString(userId) → seed → mulberry32(seed) → deterministic roll
// userId→hash→seed→PRNG→确定性结果
// 同userId永远相同结果
```

### Cache Hot Paths

```
500ms tick + per-keystroke + per-turn → cache prevents repeated hash
// 高频调用缓存
// 避免重复hash计算
```

### Bones vs Soul Separation

```
Bones: deterministic, never persist → can't edit config for legendary
Soul: model-generated, stored → persists across sessions
// Bones防作弊
// Soul持久化
```

### Rarity Floor System

```
RARITY_FLOOR[rarity] → minimum stat value → rarity matters
// 稀有度影响最低属性
// legendary最低50分
```

## 借用价值

- ⭐⭐⭐⭐⭐ Mulberry32 seeded PRNG
- ⭐⭐⭐⭐⭐ Deterministic rollCache pattern
- ⭐⭐⭐⭐⭐ Bones/Soul separation (anti-cheat)
- ⭐⭐⭐⭐ Rarity weighted roll
- ⭐⭐⭐⭐ Shiny 1% chance

## 来源

- Claude Code: `buddy/companion.ts`, `buddy/types.ts`
- 分析报告: P45-2