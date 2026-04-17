#!/usr/bin/env node
/**
 * OpenClaw Tools Registry - 工具模块化管理
 * 
 * 借鉴 DeerFlow 2.0 的 Tools 模块化设计
 * 标准化工具定义、验证、注册、执行
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const WORKSPACE = path.join(__dirname, '..', '..');
const TOOLS_DIR = path.join(WORKSPACE, 'tools');
const REGISTRY_FILE = path.join(TOOLS_DIR, 'registry.json');

/**
 * Tools Registry
 */
class ToolsRegistry {
  constructor() {
    this.tools = new Map();
    this.categories = new Map();
    this.loadRegistry();
  }

  /**
   * Load tools registry
   */
  loadRegistry() {
    try {
      if (fs.existsSync(REGISTRY_FILE)) {
        const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
        for (const [toolName, toolDef] of Object.entries(registry.tools || {})) {
          this.tools.set(toolName, toolDef);
          
          const category = toolDef.category;
          if (!this.categories.has(category)) {
            this.categories.set(category, []);
          }
          this.categories.get(category).push(toolName);
        }
      }
    } catch (err) {
      console.error('[tools-registry] Load registry failed:', err.message);
    }
  }

  /**
   * Save tools registry
   */
  saveRegistry() {
    try {
      if (!fs.existsSync(TOOLS_DIR)) {
        fs.mkdirSync(TOOLS_DIR, { recursive: true });
      }
      
      const registry = {
        tools: Object.fromEntries(this.tools),
        categories: Object.fromEntries(this.categories),
        timestamp: Date.now()
      };
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
    } catch (err) {
      console.error('[tools-registry] Save registry failed:', err.message);
    }
  }

  /**
   * Register tool from YAML file
   */
  register(toolYamlPath) {
    try {
      if (!fs.existsSync(toolYamlPath)) {
        throw new Error(`Tool file not found: ${toolYamlPath}`);
      }
      
      const content = fs.readFileSync(toolYamlPath, 'utf8');
      const toolDef = yaml.parse(content);
      
      // Validate
      this.validate(toolDef);
      
      // Register
      this.tools.set(toolDef.name, toolDef);
      
      // Category
      const category = toolDef.category;
      if (!this.categories.has(category)) {
        this.categories.set(category, []);
      }
      if (!this.categories.get(category).includes(toolDef.name)) {
        this.categories.get(category).push(toolDef.name);
      }
      
      this.saveRegistry();
      
      console.log(`[tools-registry] Tool registered: ${toolDef.name} (${category})`);
      return toolDef;
    } catch (err) {
      console.error('[tools-registry] Register failed:', err.message);
      throw err;
    }
  }

  /**
   * Validate tool definition
   */
  validate(toolDef) {
    if (!toolDef.name) throw new Error('Tool name required');
    if (!toolDef.description) throw new Error('Tool description required');
    if (!toolDef.category) throw new Error('Tool category required');
    if (!toolDef.inputs || !Array.isArray(toolDef.inputs)) {
      throw new Error('Tool inputs array required');
    }
    if (!toolDef.outputs || !Array.isArray(toolDef.outputs)) {
      throw new Error('Tool outputs array required');
    }
    
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

  /**
   * Get tool by name
   */
  get(toolName) {
    return this.tools.get(toolName);
  }

  /**
   * List tools (optionally filter by category)
   */
  list(category = null) {
    if (category) {
      const toolNames = this.categories.get(category) || [];
      return toolNames.map(name => this.tools.get(name));
    }
    return Array.from(this.tools.values());
  }

  /**
   * List categories
   */
  categories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Get tool summary
   */
  summary() {
    return {
      total: this.tools.size,
      categories: this.categories.size,
      by_category: Object.fromEntries(
        Array.from(this.categories.entries()).map(([cat, names]) => [cat, names.length])
      )
    };
  }

  /**
   * Generate tool schema JSON
   */
  generateSchema(toolName) {
    const tool = this.tools.get(toolName);
    if (!tool) return null;
    
    return {
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: tool.inputs.reduce((acc, input) => {
          acc[input.name] = {
            type: input.type,
            description: input.description
          };
          if (input.default) acc[input.name].default = input.default;
          return acc;
        }, {}),
        required: tool.inputs.filter(i => i.required).map(i => i.name)
      },
      output_schema: {
        type: 'object',
        properties: tool.outputs.reduce((acc, output) => {
          acc[output.name] = {
            type: output.type,
            description: output.description
          };
          return acc;
        }, {})
      }
    };
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'summary';

const registry = new ToolsRegistry();

if (command === 'summary') {
  const summary = registry.summary();
  console.log(JSON.stringify(summary, null, 2));
} else if (command === 'list') {
  const category = args[1] || null;
  const tools = registry.list(category);
  console.log(JSON.stringify(tools, null, 2));
} else if (command === 'categories') {
  const cats = registry.categories();
  console.log(JSON.stringify(cats, null, 2));
} else if (command === 'get') {
  const toolName = args[1];
  if (!toolName) {
    console.error('Usage: tools-registry.js get <tool_name>');
    process.exit(1);
  }
  
  const tool = registry.get(toolName);
  console.log(JSON.stringify(tool, null, 2));
} else if (command === 'register') {
  const yamlPath = args[1];
  if (!yamlPath) {
    console.error('Usage: tools-registry.js register <yaml_path>');
    process.exit(1);
  }
  
  const tool = registry.register(yamlPath);
  console.log(`Tool registered: ${tool.name}`);
} else if (command === 'schema') {
  const toolName = args[1];
  if (!toolName) {
    console.error('Usage: tools-registry.js schema <tool_name>');
    process.exit(1);
  }
  
  const schema = registry.generateSchema(toolName);
  console.log(JSON.stringify(schema, null, 2));
} else if (command === 'init') {
  // Create tools directory structure
  if (!fs.existsSync(TOOLS_DIR)) {
    fs.mkdirSync(TOOLS_DIR, { recursive: true });
  }
  
  // Create category directories
  const categories = ['file-operation', 'web-search', 'data-analysis'];
  for (const cat of categories) {
    const catDir = path.join(TOOLS_DIR, cat);
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir, { recursive: true });
    }
  }
  
  // Create registry.json
  registry.saveRegistry();
  
  console.log('✓ Tools directory created');
  console.log(`  ${TOOLS_DIR}`);
  for (const cat of categories) {
    console.log(`  ${path.join(TOOLS_DIR, cat)}`);
  }
} else if (command === 'help') {
  console.log('Usage: tools-registry.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  summary      - Show tools summary');
  console.log('  list [cat]   - List tools (filter by category)');
  console.log('  categories   - List categories');
  console.log('  get <name>   - Get tool by name');
  console.log('  register <yaml> - Register tool from YAML');
  console.log('  schema <name> - Generate tool schema JSON');
  console.log('  init         - Create tools directory structure');
  console.log('  help         - Show this help');
} else {
  console.log('Unknown command:', command);
  console.log('Run: node tools-registry.js help');
}

module.exports = { ToolsRegistry };