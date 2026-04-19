# CSI Sequence Generator Skill

CSI Sequence Generator - CSI_PREFIX + csi() function + parameter byte ranges + isCSIParam/Intermediate/Final checks + cursor movement constants + erase/insert/delete commands + DECSTBM scroll region + SU/SD scroll commands + single arg raw body pattern。

## 功能概述

从Claude Code的ink/termio/csi.ts提取的CSI序列生成模式，用于OpenClaw的终端控制序列。

## 核心机制

### CSI_PREFIX

```typescript
import { ESC, ESC_TYPE, SEP } from './ansi.js'
export const CSI_PREFIX = ESC + String.fromCharCode(ESC_TYPE.CSI)
// ESC [ = CSI prefix
// Control Sequence Introducer
```

### csi() Function

```typescript
/**
 * Generate a CSI sequence: ESC [ p1;p2;...;pN final
 * Single arg: treated as raw body
 * Multiple args: last is final byte, rest are params joined by ;
 */
export function csi(...args: (string | number)[]): string {
  if (args.length === 0) return CSI_PREFIX
  if (args.length === 1) return `${CSI_PREFIX}${args[0]}`  // Raw body
  const params = args.slice(0, -1)
  const final = args[args.length - 1]
  return `${CSI_PREFIX}${params.join(SEP)}${final}`
}
// Single arg: raw body (ESC [ <arg>)
# Multiple args: params + final byte
```

### Parameter Byte Ranges

```typescript
export const CSI_RANGE = {
  PARAM_START: 0x30,      // 0x30-0x3f: parameter bytes
  PARAM_END: 0x3f,
  INTERMEDIATE_START: 0x20,  // 0x20-0x2f: intermediate bytes
  INTERMEDIATE_END: 0x2f,
  FINAL_START: 0x40,      // 0x40-0x7e: final bytes (@ through ~)
  FINAL_END: 0x7e,
} as const
// CSI structure: ESC [ params intermediate final
# Byte range definitions
```

### isCSIParam/Intermediate/Final

```typescript
export function isCSIParam(byte: number): boolean {
  return byte >= CSI_RANGE.PARAM_START && byte <= CSI_RANGE.PARAM_END
}

export function isCSIIntermediate(byte: number): boolean {
  return byte >= CSI_RANGE.INTERMEDIATE_START && byte <= CSI_RANGE.INTERMEDIATE_END
}

export function isCSIFinal(byte: number): boolean {
  return byte >= CSI_RANGE.FINAL_START && byte <= CSI_RANGE.FINAL_END
}
// Byte type checks
# Parser helpers
```

### Cursor Movement Constants

```typescript
export const CSI = {
  CUU: 0x41,  // A - Cursor Up
  CUD: 0x42,  // B - Cursor Down
  CUF: 0x43,  // C - Cursor Forward
  CUB: 0x44,  // D - Cursor Back
  CNL: 0x45,  // E - Cursor Next Line
  CPL: 0x46,  // F - Cursor Previous Line
  CHA: 0x47,  // G - Cursor Horizontal Absolute
  CUP: 0x48,  // H - Cursor Position
  CHT: 0x49,  // I - Cursor Horizontal Tab
  VPA: 0x64,  // d - Vertical Position Absolute
  HVP: 0x66,  // f - Horizontal Vertical Position
}
// Cursor movement final bytes
# Hex constants
```

### Erase Commands

```typescript
export const CSI = {
  ED: 0x4a,  // J - Erase in Display
  EL: 0x4b,  // K - Erase in Line
  ECH: 0x58, // X - Erase Character
}
// Erase commands
# Display/Line/Char erase
```

### Insert/Delete Commands

```typescript
export const CSI = {
  IL: 0x4c,  // L - Insert Lines
  DL: 0x4d,  // M - Delete Lines
  ICH: 0x40, // @ - Insert Characters
  DCH: 0x50, // P - Delete Characters
}
// Insert/Delete commands
# Lines/Characters
```

### DECSTBM Scroll Region

```typescript
// DECSTBM: Set Top and Bottom Margins
// CSI top ; bottom r
export const CSI = {
  DECSTBM: 0x72,  // r - Set Scrolling Region
}
// DECSTBM scroll region
# top ; bottom r
```

### SU/SD Scroll Commands

```typescript
// CSI n S: Scroll Down (content moves up)
// CSI n T: Scroll Up (content moves down)
export const CSI = {
  SU: 0x53,  // S - Scroll Up
  SD: 0x54,  // T - Scroll Down
}
// Hardware scroll commands
# Scroll Up/Down
```

### Single Arg Raw Body

```typescript
if (args.length === 1) return `${CSI_PREFIX}${args[0]}`  // Raw body
// Single arg: treated as raw body
// No params, no final byte separation
# Direct CSI + body
```

## 实现建议

### OpenClaw适配

1. **csiGenerator**: csi() function
2. **csiRange**: CSI_RANGE constants
3. **csiChecks**: isCSIParam/Intermediate/Final
4. **cursorCommands**: CSI cursor constants
5. **scrollCommands**: DECSTBM + SU/SD

### 状态文件示例

```json
{
  "csiSequence": "ESC[5;10r",
  "command": "DECSTBM",
  "params": [5, 10]
}
```

## 关键模式

### CSI Generation Pattern

```
csi(...args) → ESC [ params ; final → CSI sequence string
# csi()函数生成CSI sequence
# 多args: params + final byte
# 单arg: raw body
```

### Byte Range Classification

```
PARAM: 0x30-0x3f | INTERMEDIATE: 0x20-0x2f | FINAL: 0x40-0x7e → parser classification
# 参数字节、中间字节、终结字节分类
# Parser使用
```

### Final Byte Hex Constants

```
CSI.CUU = 0x41 → 'A' → Cursor Up → hex constant → readable
# Final byte用hex constant定义
# 可读性好
# 符合ANSI标准
```

### DECSTBM + SU/SD Hardware Scroll

```
CSI top ; bottom r → DECSTBM → CSI n S/T → hardware scroll → terminal optimization
# DECSTBM设置滚动区域
# CSI n S/T硬件滚动
# 终端优化
```

## 借用价值

- ⭐⭐⭐⭐⭐ CSI sequence generator pattern
- ⭐⭐⭐⭐⭐ csi() function with single/multiple args
- ⭐⭐⭐⭐⭐ Byte range classification
- ⭐⭐⭐⭐⭐ Cursor/Erase/Insert/Delete constants
- ⭐⭐⭐⭐⭐ DECSTBM + SU/SD scroll commands

## 来源

- Claude Code: `ink/termio/csi.ts` (319 lines)
- 分析报告: P50-4