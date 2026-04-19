# HyperlinkPool Pattern Skill

HyperlinkPool Pattern - HyperlinkPool class + strings array + stringMap + Index 0 no hyperlink + intern(hyperlink) + get(id) + undefined handling + 5-minute reset + OSC8 hyperlink interning。

## 功能概述

从Claude Code的ink/screen.ts提取的HyperlinkPool模式，用于OpenClaw的OSC8超链接池管理。

## 核心机制

### HyperlinkPool Class

```typescript
export class HyperlinkPool {
  private strings: string[] = ['']  // Index 0 = no hyperlink
  private stringMap = new Map<string, number>()
  // strings array for storage
  // stringMap for lookup
  // Index 0: no hyperlink
}
```

### Index 0 No Hyperlink

```typescript
private strings: string[] = ['']  // Index 0 = no hyperlink
// Index 0: empty string = no hyperlink
// Default state
# Most cells have no hyperlink
```

### intern Method

```typescript
intern(hyperlink: string | undefined): number {
  if (!hyperlink) return 0  // undefined/null → Index 0
  let id = this.stringMap.get(hyperlink)
  if (id === undefined) {
    id = this.strings.length
    this.strings.push(hyperlink)
    this.stringMap.set(hyperlink, id)
  }
  return id
}
// undefined → 0 (no hyperlink)
# Returns ID index
```

### get Method

```typescript
get(id: number): string | undefined {
  return id === 0 ? undefined : this.strings[id]  // ID 0 → undefined
}
// ID 0: return undefined
# Non-zero: return string
```

### undefined Handling

```typescript
if (!hyperlink) return 0  // intern
return id === 0 ? undefined : this.strings[id]  // get
// Both directions handle undefined
# Consistent undefined mapping
```

### 5-Minute Reset

```typescript
// hyperlinkPool resets every 5 min
// Store as string (not interned ID) in ClusteredChar
// setCellAt interns per-frame (cheap Map.get)
// 5-minute pool reset
# ClusteredChar stores string
# Per-frame intern
```

### OSC8 Hyperlink Interning

```typescript
// OSC8: ESC ] 8 ; params ; URI ST
// hyperlink URI string interned
// ID reference in cell
// OSC8 hyperlink protocol
# URI → ID mapping
```

## 实现建议

### OpenClaw适配

1. **hyperlinkPoolClass**: HyperlinkPool class
2. **index0Pattern**: Index 0 no hyperlink pattern
3. **undefinedHandling**: undefined handling pattern
4. **fiveMinuteReset**: 5-minute reset pattern
5. **osc8Interning**: OSC8 hyperlink interning

### 状态文件示例

```json
{
  "stringsCount": 25,
  "uniqueHyperlinks": 20,
  "resetIntervalMinutes": 5
}
```

## 关键模式

### Index 0 Default State

```
Index 0 = '' → no hyperlink → most cells use Index 0 → avoid interning empty
# Index 0表示无hyperlink
# 大部分cells无hyperlink
# 避免interning空值
```

### undefined Bidirectional Mapping

```
intern(undefined) → 0 | get(0) → undefined → consistent undefined mapping
# 双向undefined映射
# intern时undefined→0
# get时0→undefined
```

### 5-Minute Reset Pattern

```
hyperlinkPool resets 5min → ClusteredChar stores string → per-frame intern → cheap Map.get
# 5分钟pool reset
# ClusteredChar存储string而非ID
# 每帧intern
# Map.get开销小
```

### OSC8 Hyperlink Protocol

```
OSC8: ESC ] 8 ; params ; URI ST → URI interned → ID reference → cell.hyperlink
# OSC8协议
# URI interned
# ID reference
```

## 借用价值

- ⭐⭐⭐⭐⭐ HyperlinkPool pattern
- ⭐⭐⭐⭐⭐ Index 0 default state pattern
- ⭐⭐⭐⭐⭐ undefined bidirectional mapping
- ⭐⭐⭐⭐⭐ 5-minute reset pattern
- ⭐⭐⭐⭐ OSC8 hyperlink interning

## 来源

- Claude Code: `ink/screen.ts` (1486 lines)
- 分析报告: P50-2