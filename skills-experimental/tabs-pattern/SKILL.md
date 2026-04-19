# Tabs Pattern Skill

Tabs Pattern - TabsContext + Controlled vs Uncontrolled + navFromContent + contentHeight fixed + headerFocused state。

## 功能概述

从Claude Code的Tabs.tsx提取的标签页模式，用于OpenClaw的多标签界面。

## 核心机制

### TabsContext

```typescript
type TabsContextValue = {
  selectedTab: string | undefined
  width: number | undefined
  headerFocused: boolean
  focusHeader: () => void
  blurHeader: () => void
  registerOptIn: () => () => void  // Returns unregister function
}

const TabsContext = createContext<TabsContextValue>({
  selectedTab: undefined,
  width: undefined,
  headerFocused: false,  // Default: content has focus
  focusHeader: () => {},
  blurHeader: () => {},
  registerOptIn: () => () => {}
})
// Context for tab state
// focusHeader/blurHeader for focus management
// registerOptIn returns unregister
```

### Controlled vs Uncontrolled

```typescript
const isControlled = controlledSelectedTab !== undefined
const [internalSelectedTab, setInternalSelectedTab] = useState(defaultTabIndex)

const selectedTabIndex = isControlled 
  ? (controlledTabIndex !== -1 ? controlledTabIndex : 0)
  : internalSelectedTab
// Controlled: parent provides selectedTab + onTabChange
// Uncontrolled: internal state + defaultTab
```

### navFromContent

```typescript
/**
 * Let Tab/←/→ switch tabs from focused content.
 * Opt-in since some content uses those keys.
 * Switching from content focuses the header.
 */
navFromContent?: boolean
// Tab/←/→ from content switches tabs
// Opt-in (content may use those keys)
// Auto-focus header on switch
```

### contentHeight Fixed

```typescript
/**
 * Fixed height for content area.
 * When set, all tabs render within same height (overflow hidden).
 * Shorter tabs get whitespace; taller tabs are clipped.
 */
contentHeight?: number
// Prevent layout shifts on tab switch
// Overflow hidden
// Whitespace for shorter tabs
```

### headerFocused State

```typescript
const [headerFocused, setHeaderFocused] = useState(initialHeaderFocused)

/**
 * Initial focus state for tab header row.
 * Defaults to true (header focused, nav always works).
 * Only set false when content binds left/right/tab.
 */
initialHeaderFocused?: boolean
// Default: true (header focused)
// Set false when content uses arrow keys
// Show "↑ tabs" footer hint
```

### disableNavigation

```typescript
/** Disable keyboard navigation (e.g. when child handles arrow keys) */
disableNavigation?: boolean
// Child component handles arrows
// Disable tab navigation
```

### Banner Slot

```typescript
/** Optional banner to display below tabs header */
banner?: React.ReactNode
// Banner below tabs header
// Flexible content
```

## 实现建议

### OpenClaw适配

1. **tabsContext**: TabsContext
2. **controlledMode**: Controlled vs Uncontrolled
3. **navFromContent**: navFromContent
4. **contentHeightFixed**: contentHeight fixed

### 状态文件示例

```json
{
  "selectedTab": "tab1",
  "headerFocused": true,
  "navFromContent": false,
  "contentHeight": 20
}
```

## 关键模式

### Context Value Pattern

```
TabsContext → selectedTab + width + headerFocused + focusHeader/blurHeader + registerOptIn
// registerOptIn返回unregister
// 双向注册机制
```

### Controlled Mode Detection

```
controlledSelectedTab !== undefined → controlled, else → uncontrolled
// 父组件提供selectedTab → controlled
// 否则内部state管理
```

### Navigation From Content

```
navFromContent → Tab/←/→ switch tabs → auto focusHeader
// 从content切换tabs
// 自动聚焦header
```

### Fixed Height Anti-Shift

```
contentHeight fixed → shorter: whitespace, taller: clipped
// 防止tab切换layout shift
// 固定高度overflow hidden
```

### Header Focus Default

```
initialHeaderFocused = true → nav always works, false when content uses arrows
// 默认header聚焦
// content用arrow时设false
```

## 借用价值

- ⭐⭐⭐⭐⭐ TabsContext pattern
- ⭐⭐⭐⭐⭐ Controlled vs Uncontrolled mode
- ⭐⭐⭐⭐⭐ navFromContent opt-in
- ⭐⭐⭐⭐ contentHeight fixed
- ⭐⭐⭐⭐ headerFocused state

## 来源

- Claude Code: `components/design-system/Tabs.tsx`
- 分析报告: P41-5