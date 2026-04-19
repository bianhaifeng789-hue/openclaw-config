---
name: notebook-processing
description: "Jupyter notebook processing. Cell processing. Output extraction (stream/execute_result/display_data/error). Image extraction (PNG/JPEG). Large output handling. Code language assignment. Use when [notebook processing] is needed."
metadata:
  openclaw:
    emoji: "📓"
    triggers: [notebook-read, .ipynb]
    feishuCard: true
---

# Notebook Processing Skill - Jupyter Notebook 处理

处理 Jupyter Notebook 文件，提取内容和输出。

## 为什么需要这个？

**场景**：
- 读取 .ipynb 文件
- 提取 cell 内容
- 提取 outputs
- 图片提取
- 代码语言

**Claude Code 方案**：notebook.ts + cell processing
**OpenClaw 飞书适配**：Notebook 处理 + Output 提取

---

## Notebook 结构

```typescript
type NotebookContent = {
  cells: NotebookCell[]
  metadata: {
    language_info: { name: string }
  }
}

type NotebookCell = {
  cell_type: 'code' | 'markdown'
  source: string | string[]
  outputs?: NotebookCellOutput[]
  execution_count?: number
}

type NotebookCellOutput = {
  output_type: 'stream' | 'execute_result' | 'display_data' | 'error'
  text?: string | string[]
  data?: Record<string, unknown>
  ename?: string
  evalue?: string
  traceback?: string[]
}
```

---

## 处理流程

### 1. Process Notebook

```typescript
function processNotebookForAPI(
  notebook: NotebookContent,
  includeLargeOutputs: boolean
): TextBlockParam[] {
  const codeLanguage = notebook.metadata.language_info.name
  const blocks: TextBlockParam[] = []
  
  for (let i = 0; i < notebook.cells.length; i++) {
    const cell = notebook.cells[i]
    const processed = processCell(cell, i, codeLanguage, includeLargeOutputs)
    
    blocks.push({
      type: 'text',
      text: formatCellForAPI(processed)
    })
  }
  
  return blocks
}
```

### 2. Process Cell

```typescript
function processCell(
  cell: NotebookCell,
  index: number,
  codeLanguage: string,
  includeLargeOutputs: boolean
): NotebookCellSource {
  const cellData = {
    cellType: cell.cell_type,
    source: Array.isArray(cell.source) ? cell.source.join('') : cell.source,
    execution_count: cell.cell_type === 'code' ? cell.execution_count : undefined,
    cell_id: cell.id ?? `cell-${index}`
  }
  
  if (cell.cell_type === 'code') {
    cellData.language = codeLanguage
  }
  
  // Process outputs if present
  if (cell.outputs && includeLargeOutputs) {
    cellData.outputs = cell.outputs.map(processOutput)
  }
  
  return cellData
}
```

### 3. Process Output

```typescript
function processOutput(output: NotebookCellOutput) {
  switch (output.output_type) {
    case 'stream':
      return {
        output_type: 'stream',
        text: processOutputText(output.text)
      }
    case 'execute_result':
    case 'display_data':
      return {
        output_type: output.output_type,
        text: processOutputText(output.data?.['text/plain']),
        image: extractImage(output.data)
      }
    case 'error':
      return {
        output_type: 'error',
        text: `${output.ename}: ${output.evalue}\n${output.traceback.join('\n')}`
      }
  }
}
```

### 4. Extract Image

```typescript
function extractImage(data: Record<string, unknown>): NotebookOutputImage | undefined {
  if (typeof data['image/png'] === 'string') {
    return {
      image_data: data['image/png'].replace(/\s/g, ''),
      media_type: 'image/png'
    }
  }
  if (typeof data['image/jpeg'] === 'string') {
    return {
      image_data: data['image/jpeg'].replace(/\s/g, ''),
      media_type: 'image/jpeg'
    }
  }
  return undefined
}
```

---

## 飞书卡片格式

### Notebook Processed 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📓 Notebook Processed**\n\n---\n\n**Notebook 信息**：\n\n| 属性 | 值 |\n|------|------|\n| **文件** | analysis.ipynb |\n| **Cell 数量** | 25 |\n| **Code Cells** | 20 |\n| **Markdown Cells** | 5 |\n| **语言** | Python |\n\n---\n\n**Output 统计**：\n• **Stream outputs**：15\n• **Execute results**：10\n• **Display data**：3\n• **Images**：2（PNG）\n• **Errors**：0\n\n---\n\n**Large outputs**：已处理（threshold: 10k chars）"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/notebook-processing-state.json
{
  "processedNotebooks": [],
  "stats": {
    "totalNotebooks": 0,
    "totalCells": 0,
    "totalOutputs": 0,
    "totalImages": 0
  },
  "config": {
    "largeOutputThreshold": 10000,
    "includeLargeOutputs": true
  },
  "lastUpdate": "2026-04-12T00:18:00Z",
  "notes": "Notebook Processing Skill 创建完成。等待 .ipynb 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| notebook.ts | Skill + 处理函数 |
| processCell() | Cell 处理 |
| processOutput() | Output 处理 |
| extractImage() | 图片提取 |
| LARGE_OUTPUT_THRESHOLD | 10k chars |

---

## 注意事项

1. **Cell types**：code/markdown 处理不同
2. **Output types**：4 种 output 类型
3. **Image extraction**：PNG/JPEG
4. **Large outputs**：threshold 10k chars
5. **Language**：从 metadata 获取

---

## 自动启用

此 Skill 在读取 .ipynb 文件时自动触发。

---

## 下一步增强

- 飞书图片上传
- Output truncation
- Cell execution