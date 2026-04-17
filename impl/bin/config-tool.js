#!/usr/bin/env node
/**
 * Config Tool - 基于 Claude Code ConfigTool
 * 
 * 配置管理：
 *   - 查询/修改配置
 *   - 环境变量管理
 *   - 配置验证
 * 
 * Usage:
 *   node config-tool.js get <key>
 *   node config-tool.js set <key> <value>
 *   node config-tool.js list
 *   node config-tool.js validate
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const CONFIG_FILE = path.join(require('os').homedir(), '.openclaw', 'openclaw.json');
const WORKSPACE_CONFIG_FILE = path.join(WORKSPACE, 'config.json');

// Default config structure
const DEFAULT_CONFIG = {
  agents: {
    defaults: {
      heartbeat: { enabled: true, interval: 1800000 },
      model: { primary: 'bailian/glm-5' }
    },
    list: [
      { id: 'dispatcher', model: 'bailian/glm-5' }
    ]
  },
  providers: {
    bailian: {
      baseUrl: 'https://coding.dashscope.aliyuncs.com/v1',
      apiKey: ''
    },
    codex: {
      baseUrl: 'https://lucen.run/v1',
      apiKey: ''
    }
  },
  channels: {
    feishu: { enabled: true }
  }
};

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return DEFAULT_CONFIG;
  }
  
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  return config;
}

function getConfig(key) {
  const config = loadConfig();
  
  // Support nested key access (e.g., 'agents.defaults.model.primary')
  const parts = key.split('.');
  let value = config;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return {
        found: false,
        key,
        error: 'key not found'
      };
    }
  }
  
  return {
    found: true,
    key,
    value,
    type: typeof value
  };
}

function setConfig(key, value) {
  const config = loadConfig();
  
  // Parse value if it looks like JSON
  let parsedValue = value;
  try {
    if (value.startsWith('{') || value.startsWith('[') || value === 'true' || value === 'false') {
      parsedValue = JSON.parse(value);
    } else if (!isNaN(parseInt(value, 10))) {
      parsedValue = parseInt(value, 10);
    }
  } catch {
    // Keep as string
  }
  
  // Support nested key setting
  const parts = key.split('.');
  let current = config;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = parsedValue;
  
  saveConfig(config);
  
  return {
    set: true,
    key,
    value: parsedValue,
    previousValue: 'unknown' // Would need to track previous
  };
}

function listConfig(section = null) {
  const config = loadConfig();
  
  if (section) {
    const sectionConfig = config[section];
    if (sectionConfig) {
      return {
        section,
        config: sectionConfig,
        keys: Object.keys(sectionConfig)
      };
    }
    return {
      section,
      error: 'section not found'
    };
  }
  
  // Flatten config for display
  const flatConfig = flattenConfig(config);
  
  return {
    config,
    flatConfig,
    sections: Object.keys(config),
    totalKeys: Object.keys(flatConfig).length
  };
}

function flattenConfig(obj, prefix = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenConfig(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  
  return result;
}

function validateConfig() {
  const config = loadConfig();
  const issues = [];
  
  // Validate providers
  if (!config.providers) {
    issues.push({ severity: 'error', message: 'No providers configured' });
  } else {
    for (const [name, provider] of Object.entries(config.providers)) {
      if (!provider.baseUrl) {
        issues.push({ severity: 'warning', message: `Provider ${name} missing baseUrl` });
      }
      if (!provider.apiKey) {
        issues.push({ severity: 'warning', message: `Provider ${name} missing apiKey` });
      }
    }
  }
  
  // Validate agents
  if (!config.agents || !config.agents.defaults) {
    issues.push({ severity: 'error', message: 'No agent defaults configured' });
  } else {
    if (!config.agents.defaults.model || !config.agents.defaults.model.primary) {
      issues.push({ severity: 'error', message: 'No primary model configured' });
    }
  }
  
  // Validate channels
  if (!config.channels) {
    issues.push({ severity: 'info', message: 'No channels configured' });
  }
  
  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    errorCount: issues.filter(i => i.severity === 'error').length,
    warningCount: issues.filter(i => i.severity === 'warning').length
  };
}

function getEnvVars() {
  // Get relevant environment variables
  const envVars = {};
  
  const relevantKeys = [
    'OPENCLAW_WORKSPACE',
    'OPENCLAW_GATEWAY_PORT',
    'OPENCLAW_MEMORY_DIR',
    'CLAUDE_CODE_COORDINATOR_MODE',
    'CLAUDE_CODE_AUTO_COMPACT_WINDOW',
    'CLAUDE_AUTOCOMPACT_PCT_OVERRIDE'
  ];
  
  for (const key of relevantKeys) {
    if (process.env[key]) {
      envVars[key] = process.env[key];
    }
  }
  
  return {
    envVars,
    count: Object.keys(envVars).length
  };
}

function resetConfig() {
  saveConfig(DEFAULT_CONFIG);
  
  return {
    reset: true,
    config: DEFAULT_CONFIG
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'get':
      const key = args[1];
      if (!key) {
        console.log('Usage: node config-tool.js get <key>');
        process.exit(1);
      }
      console.log(JSON.stringify(getConfig(key), null, 2));
      break;
    case 'set':
      const setKey = args[1];
      const setValue = args[2];
      if (!setKey || !setValue) {
        console.log('Usage: node config-tool.js set <key> <value>');
        process.exit(1);
      }
      console.log(JSON.stringify(setConfig(setKey, setValue), null, 2));
      break;
    case 'list':
      const section = args[1];
      console.log(JSON.stringify(listConfig(section), null, 2));
      break;
    case 'validate':
      console.log(JSON.stringify(validateConfig(), null, 2));
      break;
    case 'env':
      console.log(JSON.stringify(getEnvVars(), null, 2));
      break;
    case 'reset':
      console.log(JSON.stringify(resetConfig(), null, 2));
      break;
    default:
      console.log('Usage: node config-tool.js [get|set|list|validate|env|reset]');
      process.exit(1);
  }
}

main();

module.exports = {
  getConfig,
  setConfig,
  listConfig,
  validateConfig,
  getEnvVars,
  resetConfig,
  loadConfig,
  saveConfig
};