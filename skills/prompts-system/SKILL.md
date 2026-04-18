---
name: prompts-system
description: Standardized prompt management system with templates, variables, versioning, and evaluation. Store, retrieve, and manage prompts for consistent agent behavior. Use when managing prompts, standardizing agent instructions, or creating prompt templates.
---

# Prompts System - 提示词标准化系统

借鉴 DeerFlow 2.0 的 Prompts 管理。

## Why Standardized Prompts

提示词混乱会导致：
- Agent行为不一致
- 重复定义相同提示词
- 版本管理困难
- 无法评估效果

**解决方案**: Prompts System

## Prompt Schema

**标准提示词定义**:
```yaml
name: prompt_name
version: 1.0.0
description: Prompt description
category: agent_instruction | task_prompt | system_prompt

template: |
  You are a {{role}}.
  
  Your task: {{task}}
  
  Constraints:
  - {{constraint_1}}
  - {{constraint_2}}
  
  Output format: {{output_format}}

variables:
  - name: role
    type: string
    default: "assistant"
    description: Agent role
  
  - name: task
    type: string
    required: true
    description: Task description
  
  - name: constraint_1
    type: string
    default: "Be concise"
  
  - name: output_format
    type: string
    default: "Markdown"

examples:
  - variables:
      role: "data analyst"
      task: "Analyze CSV file"
    output: |
      You are a data analyst.
      
      Your task: Analyze CSV file
      
      Constraints:
      - Be concise
      
      Output format: Markdown

metadata:
  author: OpenClaw
  created_at: 2026-04-15
  tags: [agent, instruction, template]
  evaluation:
    score: 8.5
    feedback: "Clear and actionable"
```

## Implementation

**impl/bin/prompts-registry.js**:
```javascript
class PromptsRegistry {
  constructor() {
    this.prompts = new Map();
    this.categories = new Map();
    this.loadPrompts();
  }
  
  register(promptYamlPath) {
    const content = fs.readFileSync(promptYamlPath, 'utf8');
    const promptDef = yaml.parse(content);
    
    // Validate
    this.validate(promptDef);
    
    // Register
    this.prompts.set(promptDef.name, promptDef);
    
    // Category
    const category = promptDef.category;
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category).push(promptDef.name);
    
    return promptDef;
  }
  
  render(promptName, variables) {
    const prompt = this.prompts.get(promptName);
    if (!prompt) {
      throw new Error(`Prompt ${promptName} not found`);
    }
    
    // Merge variables with defaults
    const mergedVars = this.mergeVariables(prompt, variables);
    
    // Render template
    let template = prompt.template;
    for (const [key, value] of Object.entries(mergedVars)) {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    
    return template;
  }
  
  mergeVariables(prompt, variables) {
    const merged = {};
    for (const varDef of prompt.variables) {
      merged[varDef.name] = variables[varDef.name] || varDef.default;
    }
    return merged;
  }
  
  validate(promptDef) {
    if (!promptDef.name) throw new Error('Prompt name required');
    if (!promptDef.template) throw new Error('Prompt template required');
    if (!promptDef.variables) throw new Error('Prompt variables required');
  }
  
  evaluate(promptName, feedback, score) {
    const prompt = this.prompts.get(promptName);
    if (!prompt) {
      throw new Error(`Prompt ${promptName} not found`);
    }
    
    prompt.metadata.evaluation = {
      score,
      feedback,
      evaluated_at: Date.now()
    };
    
    this.savePrompts();
    
    return prompt;
  }
}
```

## Directory Structure

**prompts/目录**:
```
prompts/
├── agent-instruction/
│   ├── lead-agent.yaml
│   ├── subagent.yaml
│   └── dispatcher.yaml
├── task-prompts/
│   ├── research.yaml
│   ├── analysis.yaml
│   ├── migration.yaml
├── system-prompts/
│   ├── safety.yaml
│   ├── guardrails.yaml
│   └── thinking.yaml
└── registry.json
```

## Prompt Templates

**prompts/agent-instruction/lead-agent.yaml**:
```yaml
name: lead-agent
version: 1.0.0
description: Lead agent instruction for task orchestration
category: agent_instruction

template: |
  You are the lead agent orchestrating complex tasks.
  
  Your role: {{role}}
  Your capabilities: {{capabilities}}
  
  Task execution guidelines:
  1. Decompose complex tasks into subtasks
  2. Delegate subtasks to appropriate subagents
  3. Synthesize results into coherent output
  4. Report progress to user
  
  Constraints:
  - {{constraint_1}}
  - {{constraint_2}}
  
  Output format: {{output_format}}

variables:
  - name: role
    type: string
    default: "task orchestrator"
  
  - name: capabilities
    type: string
    default: "task decomposition, subagent delegation, result synthesis"
  
  - name: constraint_1
    type: string
    default: "Spawn subagents only when necessary"
  
  - name: constraint_2
    type: string
    default: "Report progress every 5 minutes"
  
  - name: output_format
    type: string
    default: "Markdown report"

metadata:
  author: OpenClaw
  tags: [lead, orchestration, agent]
```

## Usage

**Register prompt**:
```javascript
const registry = new PromptsRegistry();

registry.register('prompts/agent-instruction/lead-agent.yaml');
```

**Render prompt**:
```javascript
const prompt = registry.render('lead-agent', {
  role: 'research orchestrator',
  constraint_1: 'Use web-search for research'
});

console.log(prompt);
```

**Evaluate prompt**:
```javascript
registry.evaluate('lead-agent', 'Effective for research tasks', 9.0);
```

## Commands

**List prompts**:
```bash
node prompts-registry.js list
node prompts-registry.js list agent_instruction
```

**Get prompt**:
```bash
node prompts-registry.js get lead-agent
```

**Render prompt**:
```bash
node prompts-registry.js render lead-agent '{"role":"researcher"}'
```

**Evaluate prompt**:
```bash
node prompts-registry.js evaluate lead-agent 9.0 "Very effective"
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Standardized** | All prompts follow same schema |
| **Templated** | Variables + defaults |
| **Versioned** | Prompt version tracking |
| **Evaluated** | Score + feedback tracking |
| **Categorized** | Prompts grouped by purpose |
| **Reusable** | Prompts shared across agents |

## Borrowed From

DeerFlow 2.0 - Prompt Configuration Design

**关键借鉴**:
- 标准化 Prompt Schema
- Template Variables（{{var}}）
- Prompt Registry（集中管理）
- Evaluation Tracking（score + feedback）

---

_创建时间: 2026-04-15_
_借鉴来源: DeerFlow Prompt Configuration_