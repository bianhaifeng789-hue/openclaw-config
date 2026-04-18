# ClusteredChar Precompute Skill

ClusteredChar Precompute - ClusteredChar type + precomputed width + styleId cached + hyperlink string + charCache session-lived + setCellAt hot loop optimization + StylePool interning。

## 功能概述

从Claude Code的ink/output.ts提取的预计算优化模式，用于OpenClaw的终端渲染性能优化。

## 核心机制

### ClusteredChar Type

```typescript
/**
 * A grapheme cluster with precomputed terminal width, styleId, and hyperlink.
 * Built once per unique line (cached via charCache), so the per-char hot loop
 * is just property reads + setCellAt — no stringWidth, no style interning,
 * no hyperlink extraction per frame.
 */
type ClusteredChar = {
  value: string
  width: number      // Precomputed terminal width
  styleId: number    // Cached style ID (StylePool session-lived)
  hyperlink: string | undefined  // OSC8 hyperlink URI
}
// Precomputed: width + styleId + hyperlink
// Cached per unique line
// Hot loop: property reads + setCellAt
```

### Precomputed Width

```typescript
width: number  // Precomputed terminal width
// stringWidth computed once
// No per-frame stringWidth call
# Hot loop uses cached width
```

### styleId Cached

```typescript
styleId: number  // Cached style ID
// StylePool is session-lived (never reset)
// styleId safe to cache
# No per-frame style interning
```

### hyperlink String

```typescript
hyperlink: string | undefined
// hyperlinkPool resets every 5 min
// Store as string (not interned ID)
// setCellAt interns per-frame (cheap Map.get)
// Hyperlink stored as string
// Per-frame intern by setCellAt
# 5-minute pool reset handled
```

### charCache Session-Lived

```typescript
// Built once per unique line (cached via charCache)
// charCache is session-lived
// Unique line: build once, reuse
# Per-line caching
```

### setCellAt Hot Loop

```typescript
// Per-char hot loop is just property reads + setCellAt
// No stringWidth, no style interning, no hyperlink extraction per frame
for (const char of clusteredChars) {
  setCellAt(screen, x, y, char)
}
// Property reads only
// setCellAt call
# Zero extra computation
```

### StylePool Interning

```typescript
// StylePool is session-lived (never reset)
// styleId safe to cache: never invalidated
// Interning happens once
// Reuse across frames
// Session-lived StylePool
// styleId stable
# Safe to cache
```

## 实现建议

### OpenClaw适配

1. **clusteredCharType**: ClusteredChar type definition
2. **precomputedWidth**: width precompute pattern
3. **styleIdCache**: styleId caching pattern
4. **hyperlinkString**: hyperlink string storage pattern
5. **setCellAtHotLoop**: Hot loop optimization

### 状态文件示例

```json
{
  "clusteredCharsCached": 150,
  "uniqueLines": 50,
  "stylePoolSize": 200
}
```

## 关键模式

### Precompute Hot Loop Data

```
width + styleId + hyperlink → precompute → property reads → setCellAt
# 预计算hot loop所需数据
# 只读取property
# 调用setCellAt
# 无额外计算
```

### Session-Lived Pool

```
StylePool session-lived → styleId stable → cache safe → never reset
# StylePool会话生命周期
# styleId稳定不变
# 可安全cache
# 从不reset
```

### hyperlink String vs ID

```
hyperlinkPool resets 5min → store string → per-frame intern → cheap Map.get
# hyperlinkPool每5分钟reset
# 存储string而非ID
# 每帧intern
# Map.get开销小
```

### Per-Line Cache

```
unique line → charCache → build once → reuse across frames
# 每unique line一次build
# charCache缓存
# 跨frame复用
```

## 借用价值

- ⭐⭐⭐⭐⭐ ClusteredChar precompute pattern
- ⭐⭐⭐⭐⭐ setCellAt hot loop optimization
- ⭐⭐⭐⭐⭐ Session-lived StylePool caching
- ⭐⭐⭐⭐⭐ hyperlink string vs ID pattern
- ⭐⭐⭐⭐ Per-line charCache pattern

## 来源

- Claude Code: `ink/output.ts` (797 lines)
- 分析报告: P49-2