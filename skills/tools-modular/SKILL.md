---
name: tools-modular
description: Modular tool definitions with standardized schemas, validation, and documentation. Define tools as reusable modules with input/output schemas, error handling, and versioning. Use when defining new tools, standardizing tool interfaces, or creating tool modules.
---

# Tools Modular - 工具模块化定义

借鉴 DeerFlow 2.0 的 Tools 模块化设计。

## Why Modular Tools

工具定义混乱会导致：
- 输入验证不一致
- 错误处理重复
- 文档缺失
- 版本管理困难

**解决方案**: Tools Modular

## Tool Schema

**标准工具定义**:
```yaml
name: tool_name
version: 1.0.0
description: Tool description
category: file_operation | web_search | data_analysis | ...

inputs:
  - name: input_param
    type: string | number | boolean | object | array
    required: true | false
    default: null
    description: Param description
    validation:
      min_length: 1
      max_length: 100
      pattern: "^\\w+$"

outputs:
  - name: output_param
    type: object
    description: Output description
    schema:
      success: boolean
      data: object
      error: string | null

errors:
  - code: INVALID_INPUT
    message: Input validation failed
    http_status: 400
  
  - code: FILE_NOT_FOUND
    message: File not found
    http_status: 404

examples:
  - input:
      path: "/tmp/file.txt"
    output:
      success: true
      data: { content: "..." }

implementation:
  type: node | python | shell
  script: impl/bin/tool-script.js
  timeout_ms: 30000

metadata:
  author: OpenClaw
  created_at: 2026-04-15
  updated_at: 2026-04-15
  tags: [file, read, text]
```

## Implementation

**impl/bin/tools-registry.js**:
```javascript
class ToolsRegistry {
  constructor() {
    this.tools = new Map();
    this.categories = new Map();
    this.loadTools();
  }
  
  register(toolDefinition) {
    // Validate schema
    this.validate(toolDefinition);
    
    // Register tool
    const tool = {
      name: toolDefinition.name,
      version: toolDefinition.version,
      description: toolDefinition.description,
      inputs: toolDefinition.inputs,
      outputs: toolDefinition.outputs,
      errors: toolDefinition.errors,
      implementation: toolDefinition.implementation
    };
    
    this.tools.set(tool.name, tool);
    
    // Register category
    const category = toolDefinition.category;
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(tool.name);
    
    return tool;
  }
  
  validate(toolDef) {
    // Required fields
    if (!toolDef.name) throw new Error('Tool name required');
    if (!toolDef.description) throw new Error('Tool description required');
    if (!toolDef.inputs) throw new Error('Tool inputs required');
    if (!toolDef.outputs) throw new Error('Tool outputs required');
    
    // Validate inputs
    for (const input of toolDef.inputs) {
      if (!input.name) throw new Error('Input name required');
      if (!input.type) throw new Error(`Input ${input.name} type required`);
    }
    
    // Validate outputs
    for (const output of toolDef.outputs) {
      if (!output.name) throw new Error('Output name required');
      if (!output.type) throw new Error(`Output ${output.name} type required`);
    }
  }
  
  get(toolName) {
    return this.tools.get(toolName);
  }
  
  list(category = null) {
    if (category) {
      const toolNames = this.categories.get(category) || [];
      return toolNames.map(name => this.tools.get(name));
    }
    return Array.from(this.tools.values());
  }
  
  execute(toolName, inputs) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    
    // Validate inputs
    this.validateInputs(tool, inputs);
    
    // Execute tool
    const result = this.runTool(tool, inputs);
    
    // Validate outputs
    this.validateOutputs(tool, result);
    
    return result;
  }
  
  validateInputs(tool, inputs) {
    for (const inputDef of tool.inputs) {
      if (inputDef.required && !inputs[inputDef.name]) {
        throw new Error(`Input ${inputDef.name} required`);
      }
      
      if (inputs[inputDef.name]) {
        const value = inputs[inputDef.name];
        const type = inputDef.type;
        
        if (!this.checkType(value, type)) {
          throw new Error(`Input ${inputDef.name} type mismatch`);
        }
        
        if (inputDef.validation) {
          this.applyValidation(value, inputDef.validation);
        }
      }
    }
  }
  
  checkType(value, type) {
    if (type === 'string') return typeof value === 'string';
    if (type === 'number') return typeof value === 'number';
    if (type === 'boolean') return typeof value === 'boolean';
    if (type === 'object') return typeof value === 'object';
    if (type === 'array') return Array.isArray(value);
    return true;
  }
  
  applyValidation(value, validation) {
    if (validation.min_length && value.length < validation.min_length) {
      throw new Error(`Value length < ${validation.min_length}`);
    }
    if (validation.max_length && value.length > validation.max_length) {
      throw new Error(`Value length > ${validation.max_length}`);
    }
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      throw new Error(`Value pattern mismatch`);
    }
  }
}
```

## Tool Definition File

**tools/file-read.yaml**:
```yaml
name: file-read
version: 1.0.0
description: Read file contents with encoding support
category: file_operation

inputs:
  - name: path
    type: string
    required: true
    description: File path to read
    validation:
      min_length: 1
      max_length: 500
  
  - name: encoding
    type: string
    required: false
    default: utf-8
    description: File encoding
  
  - name: offset
    type: number
    required: false
    default: 0
    description: Line offset
  
  - name: limit
    type: number
    required: false
    default: 100
    description: Max lines to read

outputs:
  - name: result
    type: object
    description: Read result
    schema:
      success: boolean
      content: string
      lines: number
      path: string

errors:
  - code: FILE_NOT_FOUND
    message: File not found
    http_status: 404
  
  - code: INVALID_PATH
    message: Invalid file path
    http_status: 400

examples:
  - input:
      path: "/tmp/file.txt"
      encoding: utf-8
    output:
      success: true
      content: "..."
      lines: 50
      path: "/tmp/file.txt"

implementation:
  type: node
  script: impl/bin/file-read-tool.js
  timeout_ms: 10000

metadata:
  author: OpenClaw
  created_at: 2026-04-15
  tags: [file, read, text]
```

## Directory Structure

**tools/目录**:
```
tools/
├── file-operation/
│   ├── file-read.yaml
│   ├── file-write.yaml
│   ├── file-delete.yaml
│   └── file-copy.yaml
├── web-search/
│   ├── web-fetch.yaml
│   ├── web-search.yaml
│   └── web-crawl.yaml
├── data-analysis/
│   ├── csv-parse.yaml
│   ├── json-query.yaml
│   └── stats-calc.yaml
└── registry.json
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Standardized** | All tools follow same schema |
| **Validated** | Input/output validation |
| **Documented** | Examples + descriptions |
| **Versioned** | Tool version tracking |
| **Categorized** | Tools grouped by category |
| **Reusable** | Tools shared across agents |

## Commands

**List tools**:
```bash
node tools-registry.js list
node tools-registry.js list file_operation
```

**Get tool**:
```bash
node tools-registry.js get file-read
```

**Register tool**:
```bash
node tools-registry.js register tools/file-operation/file-read.yaml
```

**Execute tool**:
```bash
node tools-registry.js execute file-read '{"path":"/tmp/file.txt"}'
```

## Borrowed From

DeerFlow 2.0 - Tool Configuration Design

**关键借鉴**:
- 标准化 Tool Schema
- Input/Output Validation
- Error Handling（标准错误码）
- Tool Registry（集中管理）

---

_创建时间: 2026-04-15_
_借鉴来源: DeerFlow Tool Configuration_