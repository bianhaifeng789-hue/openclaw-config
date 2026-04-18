# App State Provider Skill

应用状态管理 - React Context + Zustand-like store。

## 功能概述

从Claude Code的AppState.tsx提取的状态管理模式，用于OpenClaw的UI状态管理。

## 核心机制

### Provider结构

```typescript
type Props = {
  children: React.ReactNode
  initialState?: AppState
  onChangeAppState?: (args: { newState, oldState }) => void
}

export function AppStateProvider({ children, initialState, onChangeAppState }) {
  const [store] = useState(() => createStore(initialState ?? getDefaultAppState(), onChangeAppState))
  // ...
}
```

### Context结构

```typescript
export const AppStoreContext = React.createContext<AppStateStore | null>(null)
const HasAppStateContext = React.createContext<boolean>(false)
// 双context：store + hasProvider检测
```

### Nesting Guard

```typescript
const hasAppStateContext = useContext(HasAppStateContext)
if (hasAppStateContext) {
  throw new Error("AppStateProvider can not be nested within another AppStateProvider")
}
// 防止多层嵌套
```

### Settings Change Hook

```typescript
const onSettingsChange = useEffectEvent(source => applySettingsChange(source, store.setState))
useSettingsChange(onSettingsChange)
// 监听settings变化并apply
```

### Voice Provider DCE

```typescript
const VoiceProvider = feature('VOICE_MODE')
  ? require('../context/voice.js').VoiceProvider
  : ({ children }) => children
// Feature-gated provider
// DCE: 外部builds使用passthrough
```

## 实现建议

### OpenClaw适配

1. **状态管理**: React Context + createStore
2. **嵌套防护**: 双context检测
3. **Settings同步**: useSettingsChange hook
4. **Feature gate**: DCE provider

### 状态文件示例

```json
{
  "appState": {
    "messages": [],
    "tasks": {},
    "ultraplanSessionUrl": null,
    "toolPermissionContext": {...}
  },
  "hasProvider": true
}
```

## 关键模式

### Nesting Prevention

使用HasAppStateContext防止嵌套：
- 初始化时检查
- 抛出错误阻止
- 保证单一provider

### Effect Event

```typescript
const onSettingsChange = useEffectEvent(...)
// 稳定callback，无需在依赖数组中声明
// React 18+推荐模式
```

### Conditional Provider

```typescript
<VoiceProvider>{children}</VoiceProvider>
// VoiceProvider可能是真实provider或passthrough
// 编译时决定，无运行开销
```

## 借用价值

- ⭐⭐⭐⭐ Nesting prevention模式
- ⭐⭐⭐⭐ Settings change hook
- ⭐⭐⭐⭐ DCE provider pattern
- ⭐⭐⭐⭐ 双context设计

## 来源

- Claude Code: `state/AppState.tsx`
- 分析报告: P34-7