---
name: clarification-handler
description: Handle user clarification requests gracefully. Use when the agent needs to ask the user for clarification before proceeding - missing info, ambiguous requirements, approach choices, or risk confirmations. Implements DeerFlow's ClarificationMiddleware pattern.
---

# Clarification Handler

优雅处理用户澄清请求，在 Agent 需要用户确认时中断执行。

## 澄清类型

| 类型 | 图标 | 说明 |
|------|------|------|
| missing_info | ❓ | 缺少必要信息 |
| ambiguous_requirement | 🤔 | 需求不明确 |
| approach_choice | 🔀 | 多种方案选择 |
| risk_confirmation | ⚠️ | 需要风险确认 |
| suggestion | 💡 | 建议/提示 |

## 澄清消息格式

```javascript
function formatClarificationMessage(args) {
  const { question, clarification_type, context, options } = args;
  
  const icons = {
    missing_info: '❓',
    ambiguous_requirement: '🤔',
    approach_choice: '🔀',
    risk_confirmation: '⚠️',
    suggestion: '💡'
  };
  
  const icon = icons[clarification_type] || '❓';
  
  let messageParts = [];
  
  // 上下文优先
  if (context) {
    messageParts.push(`${icon} ${context}`);
    messageParts.push(`\n${question}`);
  } else {
    messageParts.push(`${icon} ${question}`);
  }
  
  // 选项列表
  if (options && options.length > 0) {
    messageParts.push('');
    for (let i = 0; i < options.length; i++) {
      messageParts.push(`  ${i + 1}. ${options[i]}`);
    }
  }
  
  return messageParts.join('\n');
}
```

## 示例

### 缺少信息

```
❓ 我需要知道目标数据库的类型才能生成正确的连接代码。

  1. MySQL
  2. PostgreSQL
  3. MongoDB
  4. SQLite
```

### 方案选择

```
🔀 你提到的报表有几种实现方式：

  1. 使用 Pandas 直接生成 Excel
  2. 使用 openpyxl 生成带格式的 Excel
  3. 使用 ReportLab 生成 PDF 报表

你倾向于哪种？
```

### 风险确认

```
⚠️ 这个操作会删除所有测试数据，约 1000 条记录。确认继续吗？
```

## ask_clarification 工具

```javascript
// 工具定义
const askClarificationTool = {
  name: 'ask_clarification',
  description: 'Ask user for clarification before proceeding',
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'The clarification question'
      },
      clarification_type: {
        type: 'string',
        enum: ['missing_info', 'ambiguous_requirement', 'approach_choice', 'risk_confirmation', 'suggestion'],
        description: 'Type of clarification needed'
      },
      context: {
        type: 'string',
        description: 'Optional background context'
      },
      options: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional list of options for user to choose'
      }
    },
    required: ['question', 'clarification_type']
  }
};
```

## 中断执行流程

```javascript
// 拦截 ask_clarification 工具调用
function wrapToolCall(request, handler) {
  if (request.tool_call.name !== 'ask_clarification') {
    return handler(request);  // 正常执行其他工具
  }
  
  // 格式化澄清消息
  const formattedMessage = formatClarificationMessage(request.tool_call.args);
  
  // 创建 ToolMessage
  const toolMessage = {
    type: 'tool',
    content: formattedMessage,
    tool_call_id: request.tool_call.id,
    name: 'ask_clarification'
  };
  
  // 返回中断命令
  return {
    update: { messages: [toolMessage] },
    goto: '__end__'  // 中断，等待用户回复
  };
}
```

## 中文检测

```javascript
function isChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

// 根据语言调整格式
if (isChinese(question)) {
  // 使用中文格式："请确认..." 而非 "Please confirm..."
}
```

## 应用场景

- **数据库操作** - 确认目标数据库类型
- **文件处理** - 确认文件格式/编码
- **批量操作** - 确认影响范围
- **敏感操作** - 确认风险

---

**来源**: DeerFlow `clarification_middleware.py` (155 行)
**移植时间**: 2026-04-15