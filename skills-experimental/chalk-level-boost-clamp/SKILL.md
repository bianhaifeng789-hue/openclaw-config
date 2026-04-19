# Chalk Level Boost/Clamp Skill

Chalk Level Boost/Clamp - boostChalkLevelForXtermJs + clampChalkLevelForTmux + COLORTERM detection + tmux terminal-overrides + level 2 fallback。

## 功能概述

从Claude Code的ink/colorize.ts提取的颜色级别调整模式，用于OpenClaw的终端颜色适配。

## 核心机制

### boostChalkLevelForXtermJs

```typescript
/**
 * xterm.js (VS Code, Cursor, code-server, Coder) has supported truecolor
 * since 2017, but code-server/Coder containers often don't set
 * COLORTERM=truecolor. chalk's supports-color doesn't recognize
 * TERM_PROGRAM=vscode → falls through to 256-color regex → level 2.
 *
 * Gated on level === 2 (not < 3) to respect NO_COLOR / FORCE_COLOR=0.
 * Must run BEFORE the tmux clamp.
 */
function boostChalkLevelForXtermJs(): boolean {
  if (process.env.TERM_PROGRAM === 'vscode' && chalk.level === 2) {
    chalk.level = 3
    return true
  }
  return false
}
// xterm.js truecolor support
// COLORTERM detection workaround
// VS Code TERM_PROGRAM detection
// Respect NO_COLOR/FORCE_COLOR=0
```

### clampChalkLevelForTmux

```typescript
/**
 * tmux parses truecolor SGR correctly but only re-emits to outer terminal
 * if outer terminal advertises Tc/RGB capability. Default tmux config
 * doesn't set this → black background on dark profiles.
 *
 * Clamping to level 2 makes chalk emit 256-color, which tmux passes through.
 *
 * Users with terminal-overrides ,*:Tc get downgrade but visual difference
 * imperceptible.
 */
function clampChalkLevelForTmux(): boolean {
  // Escape hatch for properly configured tmux
  if (process.env.CLAUDE_CODE_TMUX_TRUECOLOR) return false
  
  if (process.env.TMUX && chalk.level > 2) {
    chalk.level = 2
    return true
  }
  return false
}
// tmux truecolor passthrough limitation
// Level 2 fallback for 256-color
// CLAUDE_CODE_TMUX_TRUECOLOR escape hatch
```

### Order Matters

```typescript
// Computed once at module load — terminal/tmux environment doesn't change mid-session.
// Order matters: boost first so tmux clamp can re-clamp if tmux inside VS Code.
export const CHALK_BOOSTED_FOR_XTERMJS = boostChalkLevelForXtermJs()
export const CHALK_CLAMPED_FOR_TMUX = clampChalkLevelForTmux()
// Boost BEFORE clamp
// tmux inside VS Code: boost → level 3 → clamp → level 2
// Order critical
```

### NO_COLOR Respect

```typescript
// Gated on level === 2 (not < 3) to respect NO_COLOR / FORCE_COLOR=0
// Those yield level 0 and are explicit "no colors" request
// Don't boost from level 0
// Respect user intent
```

### Escape Hatch Pattern

```typescript
// CLAUDE_CODE_TMUX_TRUECOLOR environment variable
// Users who set terminal-overrides :Tc can skip clamp
// Explicit escape hatch
// Don't query tmux show -gv (subprocess overhead)
```

### colorize Function

```typescript
export const colorize = (
  str: string,
  color: string | undefined,
  type: ColorType,  // 'foreground' | 'background'
): string => {
  if (!color) return str

  if (color.startsWith('ansi:')) { ... }
  if (RGB_REGEX.test(color)) { ... }  // rgb(r,g,b)
  if (ANSI_REGEX.test(color)) { ... }  // ansi256(n)
  // ...
}
// Multiple color format support
// ansi: prefix, rgb(), ansi256()
```

## 实现建议

### OpenClaw适配

1. **boostChalk**: boostChalkLevelForXtermJs
2. **clampChalk**: clampChalkLevelForTmux
3. **orderMatters**: Boost before clamp
4. **escapeHatch**: CLAUDE_CODE_TMUX_TRUECOLOR
5. **respectNoColor**: NO_COLOR/FORCE_COLOR=0 respect

### 状态文件示例

```json
{
  "chalkLevel": 3,
  "boostedForXtermJs": true,
  "clampedForTmux": false,
  "termProgram": "vscode",
  "tmuxEnv": null
}
```

## 关键模式

### Boost Before Clamp

```
boostChalkLevelForXtermJs() → clampChalkLevelForTmux() → order matters
// 先boost再clamp
// tmux in VS Code: boost→level3→clamp→level2
```

### Level 2 Gate

```
level === 2 (not < 3) → respect NO_COLOR/FORCE_COLOR=0
// level===2检查
// 不从level 0 boost
// 尊重no color意图
```

### Escape Hatch

```
CLAUDE_CODE_TMUX_TRUECOLOR → skip clamp → user override
// 环境变量escape hatch
// 用户可跳过clamp
```

### Terminal Detection

```
TERM_PROGRAM === 'vscode' + TMUX env → terminal detection
// VS Code检测
// tmux检测
// 不同terminal不同处理
```

## 借用价值

- ⭐⭐⭐⭐⭐ boostChalkLevelForXtermJs (VS Code)
- ⭐⭐⭐⭐⭐ clampChalkLevelForTmux (tmux)
- ⭐⭐⭐⭐⭐ Boost before clamp order
- ⭐⭐⭐⭐⭐ NO_COLOR/FORCE_COLOR respect
- ⭐⭐⭐⭐ Escape hatch pattern

## 来源

- Claude Code: `ink/colorize.ts`
- 分析报告: P44-3