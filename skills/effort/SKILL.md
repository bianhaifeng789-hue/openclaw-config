---
name: effort
description: "Effort levels for task complexity. Low/Medium/High/Max effort corresponds to task difficulty and model capability. Helps match task complexity with appropriate effort. Use when [effort] is needed."
metadata:
  openclaw:
    emoji: "⚡"
    triggers: [effort-keyword, task-assignment]
    feishuCard: true
---

# Effort Skill - 工作量级别

任务复杂度级别，匹配任务难度和模型能力。

## 为什么需要这个？

**场景**：
- 简单任务（low effort）
- 中等任务（medium effort）
- 复杂任务（high effort）
- 极难任务（max effort - Opus 4.6 only）

**Claude Code 方案**：effort.ts + EFFORT_LEVELS
**OpenClaw 飞书适配**：关键词触发 + 任务匹配

---

## Effort Levels

```typescript
const EFFORT_LEVELS = [
  'low',      // 简单任务
  'medium',   // 中等任务（默认）
  'high',     // 复杂任务
  'max'       // 极难任务（Opus 4.6 only）
] as const
```

### Low Effort

**适用任务**：
- 单行修复
- 简单查询
- 格式化
- 文档更新

**示例**：
```
用户：low effort 修复这个 typo

Agent:
→ Effort: low
→ 快速执行
→ 简单验证
```

### Medium Effort

**适用任务**（默认）：
- 函数修改
- 文件重构
- API 调用
- 配置更新

**示例**：
```
用户：medium effort 添加一个新 endpoint

Agent:
→ Effort: medium（默认）
→ 正常执行
→ 标准验证
```

### High Effort

**适用任务**：
- 模块重构
- 架构调整
- 性能优化
- 安全审计

**示例**：
```
用户：high effort 重构认证系统

Agent:
→ Effort: high
→ 深度分析
→ 多步验证
→ 全面测试
```

### Max Effort

**适用任务**（Opus 4.6 only）：
- 系统级重构
- 极难问题
- 创新设计
- 前沿研究

**示例**：
```
用户：max effort 设计一个全新的认证架构

Agent:
→ Effort: max（仅 Opus 4.6 支持）
→ 深度推理
→ 多方案对比
→ 全面验证
```

---

## 模型支持检测

```typescript
function modelSupportsEffort(model: string): boolean {
  const m = model.toLowerCase()
  // Opus 4.6 和 Sonnet 4.6 支持
  if (m.includes('opus-4-6') || m.includes('sonnet-4-6')) {
    return true
  }
  // 其他模型不支持
  return false
}

function modelSupportsMaxEffort(model: string): boolean {
  // 只有 Opus 4.6 支持 max effort
  return model.toLowerCase().includes('opus-4-6')
}
```

---

## 关键词触发

用户输入包含 effort 关键词时：

```
用户：high effort 分析这个性能问题

Agent:
→ 检测关键词 "high effort"
→ 设置 EffortLevel: 'high'
→ 执行高复杂度分析
```

---

## 飞书卡片格式

### Effort 级别卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⚡ Effort 级别**\n\n**任务**：重构认证系统\n**级别**：High\n\n**说明**：\n这是一个复杂任务，需要深度分析和多步验证。\n\n**预计耗时**：30-60 分钟\n**验证步骤**：\n• 架构分析\n• 代码修改\n• 测试验证\n• 文档更新"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "执行中..."}
      ]
    }
  ]
}
```

### Effort 完成卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⚡ Effort 完成**\n\n**任务**：重构认证系统\n**级别**：High\n\n**完成内容**：\n✅ 架构分析完成\n✅ 代码修改完成\n✅ 测试验证通过\n✅ 文档更新完成\n\n**实际耗时**：45 分钟\n**验证结果**：全部通过"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 检测 Effort 关键词

```typescript
function parseEffortValue(value: unknown): EffortLevel | undefined {
  if (value === undefined) return 'medium'  // 默认
  
  const str = String(value).toLowerCase()
  if (['low', 'medium', 'high', 'max'].includes(str)) {
    return str as EffortLevel
  }
  
  return undefined
}
```

### 2. 设置 Effort 级别

```
Agent:
1. 检测用户输入中的 effort 关键词
2. 解析 EffortLevel
3. 检查模型支持（max effort 需要 Opus 4.6）
4. 发送飞书卡片："⚡ Effort 级别"
5. 执行对应复杂度的任务
```

### 3. 执行任务

```
Model:
1. 根据 effort 级别调整思考深度
2. Low: 快速执行，简单验证
3. Medium: 正常执行，标准验证
4. High: 深度分析，多步验证
5. Max: 极深推理，全面验证
```

---

## 持久化存储

```json
// memory/effort-state.json
{
  "currentLevel": "medium",
  "effortsExecuted": [
    {
      "id": "effort-1",
      "level": "high",
      "task": "重构认证系统",
      "estimatedDuration": 45,
      "actualDuration": 45,
      "status": "completed",
      "timestamp": "2026-04-11T23:00:00Z"
    }
  ],
  "stats": {
    "lowEfforts": 0,
    "mediumEfforts": 0,
    "highEfforts": 0,
    "maxEfforts": 0,
    "totalEfforts": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| EFFORT_LEVELS | 同样 4 个级别 |
| modelSupportsEffort | 同样检测 |
| modelSupportsMaxEffort | Opus 4.6 only |
| parseEffortValue | 同样解析 |
| Terminal UI | 飞书卡片展示 |

---

## 注意事项

1. **默认 Medium**：未指定时使用 medium effort
2. **Max 需要 Opus 4.6**：其他模型不支持 max
3. **耗时估算**：effort 级别影响预计耗时
4. **验证深度**：effort 级别影响验证步骤
5. **成本影响**：高 effort 消耗更多 tokens

---

## 自动启用

此 Skill 在用户输入包含 effort 关键词时自动触发。

---

## 下一步增强

- 自动 effort 评估（根据任务复杂度）
- Effort 历史记录
- Effort 统计分析
- Effort 成本估算