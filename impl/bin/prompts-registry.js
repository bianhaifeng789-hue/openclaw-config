#!/usr/bin/env node
/**
 * OpenClaw Prompts Registry - 提示词标准化管理
 * 
 * 借鉴 DeerFlow 2.0 的 Prompts 管理系统
 * 标准化提示词定义、模板渲染、版本管理、效果评估
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const WORKSPACE = path.join(__dirname, '..', '..');
const PROMPTS_DIR = path.join(WORKSPACE, 'prompts');
const REGISTRY_FILE = path.join(PROMPTS_DIR, 'registry.json');

/**
 * Prompts Registry
 */
class PromptsRegistry {
  constructor() {
    this.prompts = new Map();
    this.categories = new Map();
    this.loadRegistry();
  }

  /**
   * Load prompts registry
   */
  loadRegistry() {
    try {
      if (fs.existsSync(REGISTRY_FILE)) {
        const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
        for (const [promptName, promptDef] of Object.entries(registry.prompts || {})) {
          this.prompts.set(promptName, promptDef);
          
          const category = promptDef.category;
          if (!this.categories.has(category)) {
            this.categories.set(category, []);
          }
          this.categories.get(category).push(promptName);
        }
      }
    } catch (err) {
      console.error('[prompts-registry] Load registry failed:', err.message);
    }
  }

  /**
   * Save prompts registry
   */
  saveRegistry() {
    try {
      if (!fs.existsSync(PROMPTS_DIR)) {
        fs.mkdirSync(PROMPTS_DIR, { recursive: true });
      }
      
      const registry = {
        prompts: Object.fromEntries(this.prompts),
        categories: Object.fromEntries(this.categories),
        timestamp: Date.now()
      };
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
    } catch (err) {
      console.error('[prompts-registry] Save registry failed:', err.message);
    }
  }

  /**
   * Register prompt from YAML file
   */
  register(promptYamlPath) {
    try {
      if (!fs.existsSync(promptYamlPath)) {
        throw new Error(`Prompt file not found: ${promptYamlPath}`);
      }
      
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
      if (!this.categories.get(category).includes(promptDef.name)) {
        this.categories.get(category).push(promptDef.name);
      }
      
      this.saveRegistry();
      
      console.log(`[prompts-registry] Prompt registered: ${promptDef.name} (${category})`);
      return promptDef;
    } catch (err) {
      console.error('[prompts-registry] Register failed:', err.message);
      throw err;
    }
  }

  /**
   * Validate prompt definition
   */
  validate(promptDef) {
    if (!promptDef.name) throw new Error('Prompt name required');
    if (!promptDef.template) throw new Error('Prompt template required');
    if (!promptDef.category) throw new Error('Prompt category required');
    if (!promptDef.variables || !Array.isArray(promptDef.variables)) {
      throw new Error('Prompt variables array required');
    }
    
    // Validate variables
    for (const varDef of promptDef.variables) {
      if (!varDef.name) throw new Error('Variable name required');
      if (!varDef.type) throw new Error(`Variable ${varDef.name} type required`);
    }
  }

  /**
   * Get prompt by name
   */
  get(promptName) {
    return this.prompts.get(promptName);
  }

  /**
   * List prompts (optionally filter by category)
   */
  list(category = null) {
    if (category) {
      const promptNames = this.categories.get(category) || [];
      return promptNames.map(name => this.prompts.get(name));
    }
    return Array.from(this.prompts.values());
  }

  /**
   * List categories
   */
  categories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Render prompt template with variables
   */
  render(promptName, variables = {}) {
    const prompt = this.prompts.get(promptName);
    if (!prompt) {
      throw new Error(`Prompt ${promptName} not found`);
    }
    
    // Merge variables with defaults
    const mergedVars = this.mergeVariables(prompt, variables);
    
    // Render template (replace {{var}} placeholders)
    let template = prompt.template;
    for (const [key, value] of Object.entries(mergedVars)) {
      const placeholder = `{{${key}}}`;
      template = template.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return template;
  }

  /**
   * Merge variables with defaults
   */
  mergeVariables(prompt, variables) {
    const merged = {};
    for (const varDef of prompt.variables) {
      const value = variables[varDef.name];
      if (value !== undefined) {
        merged[varDef.name] = value;
      } else if (varDef.default !== undefined) {
        merged[varDef.name] = varDef.default;
      } else if (varDef.required) {
        throw new Error(`Required variable ${varDef.name} not provided`);
      }
    }
    return merged;
  }

  /**
   * Evaluate prompt (score + feedback)
   */
  evaluate(promptName, score, feedback) {
    const prompt = this.prompts.get(promptName);
    if (!prompt) {
      throw new Error(`Prompt ${promptName} not found`);
    }
    
    if (!prompt.metadata) {
      prompt.metadata = {};
    }
    
    prompt.metadata.evaluation = {
      score,
      feedback,
      evaluated_at: Date.now()
    };
    
    this.saveRegistry();
    
    console.log(`[prompts-registry] Prompt evaluated: ${promptName} (score: ${score})`);
    return prompt;
  }

  /**
   * Get prompts summary
   */
  summary() {
    return {
      total: this.prompts.size,
      categories: this.categories.size,
      by_category: Object.fromEntries(
        Array.from(this.categories.entries()).map(([cat, names]) => [cat, names.length])
      )
    };
  }

  /**
   * Auto-discover prompts from directory
   */
  discover() {
    if (!fs.existsSync(PROMPTS_DIR)) {
      console.log('[prompts-registry] Prompts directory not found');
      return 0;
    }
    
    const categories = fs.readdirSync(PROMPTS_DIR)
      .filter(dir => fs.statSync(path.join(PROMPTS_DIR, dir)).isDirectory());
    
    let registered = 0;
    
    for (const category of categories) {
      const catDir = path.join(PROMPTS_DIR, category);
      const yamlFiles = fs.readdirSync(catDir)
        .filter(file => file.endsWith('.yaml'));
      
      for (const yamlFile of yamlFiles) {
        const yamlPath = path.join(catDir, yamlFile);
        try {
          this.register(yamlPath);
          registered++;
        } catch (err) {
          console.error(`[prompts-registry] Failed to register ${yamlPath}:`, err.message);
        }
      }
    }
    
    console.log(`[prompts-registry] Auto-discovered ${registered} prompts`);
    return registered;
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'summary';

const registry = new PromptsRegistry();

if (command === 'summary') {
  const summary = registry.summary();
  console.log(JSON.stringify(summary, null, 2));
} else if (command === 'list') {
  const category = args[1] || null;
  const prompts = registry.list(category);
  console.log(JSON.stringify(prompts, null, 2));
} else if (command === 'categories') {
  const cats = registry.categories();
  console.log(JSON.stringify(cats, null, 2));
} else if (command === 'get') {
  const promptName = args[1];
  if (!promptName) {
    console.error('Usage: prompts-registry.js get <prompt_name>');
    process.exit(1);
  }
  
  const prompt = registry.get(promptName);
  console.log(JSON.stringify(prompt, null, 2));
} else if (command === 'render') {
  const promptName = args[1];
  const variablesJson = args[2] || '{}';
  
  if (!promptName) {
    console.error('Usage: prompts-registry.js render <prompt_name> [variables_json]');
    process.exit(1);
  }
  
  const variables = JSON.parse(variablesJson);
  const rendered = registry.render(promptName, variables);
  console.log(rendered);
} else if (command === 'register') {
  const yamlPath = args[1];
  if (!yamlPath) {
    console.error('Usage: prompts-registry.js register <yaml_path>');
    process.exit(1);
  }
  
  const prompt = registry.register(yamlPath);
  console.log(`Prompt registered: ${prompt.name}`);
} else if (command === 'evaluate') {
  const promptName = args[1];
  const score = parseFloat(args[2]);
  const feedback = args[3] || '';
  
  if (!promptName || !score) {
    console.error('Usage: prompts-registry.js evaluate <prompt_name> <score> [feedback]');
    process.exit(1);
  }
  
  const prompt = registry.evaluate(promptName, score, feedback);
  console.log(`Prompt evaluated: ${promptName} (score: ${score})`);
} else if (command === 'discover') {
  const registered = registry.discover();
  console.log(`Discovered ${registered} prompts`);
} else if (command === 'init') {
  // Create prompts directory structure
  if (!fs.existsSync(PROMPTS_DIR)) {
    fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  }
  
  // Create category directories
  const categories = ['agent-instruction', 'task-prompts', 'system-prompts'];
  for (const cat of categories) {
    const catDir = path.join(PROMPTS_DIR, cat);
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir, { recursive: true });
    }
  }
  
  // Create registry.json
  registry.saveRegistry();
  
  console.log('✓ Prompts directory created');
  console.log(`  ${PROMPTS_DIR}`);
  for (const cat of categories) {
    console.log(`  ${path.join(PROMPTS_DIR, cat)}`);
  }
} else if (command === 'help') {
  console.log('Usage: prompts-registry.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  summary      - Show prompts summary');
  console.log('  list [cat]   - List prompts (filter by category)');
  console.log('  categories   - List categories');
  console.log('  get <name>   - Get prompt by name');
  console.log('  render <name> [vars] - Render prompt template');
  console.log('  register <yaml> - Register prompt from YAML');
  console.log('  evaluate <name> <score> [feedback] - Evaluate prompt');
  console.log('  discover     - Auto-discover prompts from directory');
  console.log('  init         - Create prompts directory structure');
  console.log('  help         - Show this help');
} else {
  console.log('Unknown command:', command);
  console.log('Run: node prompts-registry.js help');
}

module.exports = { PromptsRegistry };