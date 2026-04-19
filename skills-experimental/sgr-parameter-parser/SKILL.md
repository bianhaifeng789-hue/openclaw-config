# SGR Parameter Parser Skill

SGR Parameter Parser - parseParams function + semicolon (;) and colon (:) separation + Param type + subparams array + colon boolean flag + inSub state + parseInt parsing + empty param handling + value: number | null。

## 功能概述

从Claude Code的ink/termio/sgr.ts提取的SGR参数解析模式，用于OpenClaw的ANSI样式处理。

## 核心机制

### parseParams Function

```typescript
function parseParams(str: string): Param[] {
  if (str === '') return [{ value: 0, subparams: [], colon: false }]

  const result: Param[] = []
  let current: Param = { value: null, subparams: [], colon: false }
  let num = ''
  let inSub = false

  for (let i = 0; i <= str.length; i++) {
    const c = str[i]
    if (c === ';' || c === undefined) {
      const n = num === '' ? null : parseInt(num, 10)
      if (inSub) {
        if (n !== null) current.subparams.push(n)
      } else {
        current.value = n
      }
      result.push(current)
      current = { value: null, subparams: [], colon: false }
      num = ''
      inSub = false
    } else if (c === ':') {
      const n = num === '' ? null : parseInt(num, 10)
      if (!inSub) {
        current.value = n
        current.colon = true
        inSub = true
      } else {
        if (n !== null) current.subparams.push(n)
      }
      num = ''
    } else if (c >= '0' && c <= '9') {
      num += c
    }
  }
  return result
}
// Parse SGR parameters (semicolon and colon)
# Returns Param array
```

### Param Type

```typescript
type Param = {
  value: number | null   // Main parameter value
  subparams: number[]    // Colon-separated subparameters
  colon: boolean         // Has colon separator
}
// Param structure
# value: main param
# subparams: colon-separated
# colon: separator flag
```

### Semicolon (;) Separation

```typescript
if (c === ';' || c === undefined) {
  // End of parameter
  const n = num === '' ? null : parseInt(num, 10)
  // Push current param and reset
}
// ; separates parameters
# Multiple params separated by ;
```

### Colon (:) Separation

```typescript
else if (c === ':') {
  // Colon starts subparameters
  if (!inSub) {
    current.value = n
    current.colon = true
    inSub = true
  } else {
    current.subparams.push(n)
  }
}
// : starts subparameters
# inSub flag tracking
```

### subparams Array

```typescript
subparams: number[]  // Colon-separated subparameters
// e.g., 38:2:255:0:0 → value=38, subparams=[2,255,0,0]
// Colon-separated extended params
```

### colon Boolean Flag

```typescript
colon: boolean  // Has colon separator
// Marks colon-separated parameter
# Extended color format detection
```

### inSub State

```typescript
let inSub = false
// Track if parsing subparameters
// ; ends subparameter mode
# State machine pattern
```

### parseInt Parsing

```typescript
const n = num === '' ? null : parseInt(num, 10)
// Parse number from accumulated digits
# null for empty param
```

### Empty Param Handling

```typescript
if (str === '') return [{ value: 0, subparams: [], colon: false }]
const n = num === '' ? null : parseInt(num, 10)
// Empty string → default param {value: 0}
# Empty num → null value
```

### value: number | null

```typescript
value: number | null
// null means no value specified
// Valid values: 0, 1, 2, etc.
# null handling
```

## 实现建议

### OpenClaw适配

1. **parseParamsFunction**: parseParams function
2. **paramType**: Param type definition
3. **semicolonColon**: Semicolon and colon separation
4. **subparamsArray**: subparams array pattern
5. **inSubState**: inSub state tracking

### 状态文件示例

```json
{
  "params": [
    {"value": 38, "subparams": [2, 255, 0, 0], "colon": true}
  ],
  "inSub": true
}
```

## 关键模式

### Semicolon vs Colon Separation

```
; separates params | : starts subparams → different handling → Param array
# 分号分隔参数
# 冒号启动subparams
# 不同处理方式
```

### inSub State Machine

```
inSub=false → value | : → inSub=true → subparams | ; → inSub=false
# inSub状态机
# false时解析value
# true时解析subparams
# 分号结束subparams mode
```

### Colon Boolean Flag

```
colon=true → colon-separated → subparams exist → extended format
# colon flag标记colon-separated
# 表示有subparams
# extended color format
```

### Empty String Default

```
str === '' → [{value: 0}] → default param → handle no params case
# 空string返回默认param
# {value: 0}
# 无参数情况处理
```

## 借用价值

- ⭐⭐⭐⭐⭐ parseParams function pattern
- ⭐⭐⭐⭐⭐ Param type with subparams
- ⭐⭐⭐⭐⭐ Semicolon vs colon separation
- ⭐⭐⭐⭐⭐ inSub state machine pattern
- ⭐⭐⭐⭐ Empty string default handling

## 来源

- Claude Code: `ink/termio/sgr.ts` (308 lines)
- 分析报告: P51-1