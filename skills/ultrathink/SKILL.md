---
name: ultrathink
description: "Deep thinking mode with extended reasoning. Use 'ultrathink' keyword to trigger adaptive thinking budget. Suitable for complex problems, architecture design, difficult decisions. Use when [ultrathink] is needed."
metadata:
  openclaw:
    emoji: "🧠"
    triggers: [ultrathink-keyword]
    feishuCard: true
---

# Ultrathink Skill - 超级思考模式

扩展推理能力，处理复杂问题和困难决策。

## 为什么需要这个？

**场景**：
- 复杂架构设计
- 困难问题分析
- 多因素决策
- 深度推理任务

**Claude Code 方案**：thinking.ts + ThinkingConfig
**OpenClaw 飞书适配**：关键词触发 + 思考预算

---

## 关键词触发

用户输入包含 "ultrathink" 时自动启用：

```
用户：ultrathink 分析这个架构

Agent:
→ 检测关键词 "ultrathink"
→ 启用超级思考模式
→ budgetTokens: 自动设置
→ 执行深度分析
```

---

## Thinking Config

```typescript
type ThinkingConfig =
  | { type: 'adaptive' }      // 自适应（默认）
  | { type: 'enabled'; budgetTokens: number }  // 固定预算
  | { type: 'disabled' }      // 禁用
```

### Adaptive Mode

自适应模式（推荐）：
- 根据问题复杂度自动调整
- 模型决定思考深度
- 无固定预算限制

### Enabled Mode

固定预算模式：
- budgetTokens: 用户的思考预算
- 例如：10000 tokens
- 适合需要控制成本的场景

### Disabled Mode

禁用模式：
- 不使用扩展思考
- 快速响应

---

## Rainbow Colors

Claude Code 使用彩虹色显示思考过程（仅终端 UI）：

```typescript
const RAINBOW_COLORS: Array<keyof Theme> = [
  'rainbow_red',
  'rainbow_orange',
  'rainbow_yellow',
  'rainbow_green',
  'rainbow_blue',
  'rainbow_indigo',
  'rainbow_violet'
]
```

**飞书适配**：不使用彩虹色，改为飞书卡片展示思考过程。

---

## 飞书卡片格式

### Ultrathink 启动卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🧠 超级思考模式启用**\n\n**触发关键词**：ultrathink\n**模式**：adaptive（自适应）\n\n**说明**：\n我将进行深度分析和推理。\n思考过程可能较长，请耐心等待。\n\n预计耗时：5-10 分钟"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "思考中..."}
      ]
    }
  ]
}
```

### 思考过程卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🧠 思考过程**\n\n**步骤 1**：问题分解\n正在分析问题的核心要素...\n\n**步骤 2**：因素识别\n识别关键因素和约束条件...\n\n**步骤 3**：方案探索\n生成多个可行方案...\n\n**步骤 4**：方案评估\n评估各方案的优劣...\n\n**步骤 5**：最优选择\n选择最优方案并准备执行..."
      }
    }
  ]
}
```

### Ultrathink 结果卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🧠 Ultrathink 完成**\n\n**分析结果**：\n\n**问题**：架构设计选择\n\n**分析因素**：\n• 性能需求：高并发\n• 成本预算：中等\n• 团队技能：TypeScript\n\n**方案对比**：\n• A: Next.js + PostgreSQL\n• B: NestJS + MongoDB\n• C: Express + Redis\n\n**推荐方案**：A（Next.js + PostgreSQL）\n\n**理由**：\n1. 性能最优\n2. 团队熟悉\n3. 成本可控\n\n**思考预算**：8,542 tokens"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 检测关键词

```typescript
function hasUltrathinkKeyword(text: string): boolean {
  return /\bultrathink\b/i.test(text)
}
```

### 2. 启用思考模式

```
Agent:
1. 检测用户输入包含 "ultrathink"
2. 设置 thinkingConfig: { type: 'adaptive' }
3. 发送飞书卡片："🧠 超级思考模式启用"
4. 开始深度分析
```

### 3. 执行深度推理

```
Model:
1. 接收带有 thinking budget 的请求
2. 执行扩展推理（thinking blocks）
3. 输出思考过程和结果
```

### 4. 展示结果

```
Agent:
1. 接收模型输出
2. 解析思考内容
3. 发送飞书卡片："🧠 Ultrathink 完成"
```

---

## 持久化存储

```json
// memory/ultrathink-state.json
{
  "config": {
    "type": "adaptive"
  },
  "ultrathinksTriggered": [
    {
      "id": "ultrathink-1",
      "keyword": "ultrathink",
      "prompt": "分析架构",
      "budgetTokens": 8542,
      "timestamp": "2026-04-11T23:00:00Z",
      "duration": 420
    }
  ],
  "stats": {
    "ultrathinksTriggered": 0,
    "totalBudgetTokens": 0,
    "averageDuration": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| ThinkingConfig | 同样结构 |
| Rainbow Colors | 飞书卡片替代 |
| hasUltrathinkKeyword | 同样检测 |
| Terminal UI | 飞书卡片展示 |
| findThinkingTriggerPositions | 不需要 UI 高亮 |

---

## 适用场景

| 场景 | 说明 |
|------|------|
| **架构设计** | 多方案对比，选择最优 |
| **问题分析** | 复杂问题分解，根因分析 |
| **决策制定** | 多因素权衡，最优决策 |
| **代码重构** | 大规模重构，风险评估 |
| **安全审计** | 漏洞分析，风险评估 |

---

## 注意事项

1. **成本控制**：ultrathink 会消耗更多 tokens
2. **时间较长**：思考过程可能需要几分钟
3. **适时使用**：只在复杂问题时启用
4. **结果质量**：思考深度影响结果质量
5. **用户选择**：用户可以选择禁用

---

## 自动启用

此 Skill 在用户输入包含 "ultrathink" 关键词时自动触发。

---

## 下一步增强

- 用户自定义思考预算
- 思考过程可视化（分步展示）
- 思考结果质量评估
- 思考历史记录