#!/usr/bin/env node
/**
 * Builtin Plugins Registry - 基于 Claude Code builtinPlugins
 * 
 * 内置插件注册：
 *   - 插件发现
 *   - 启用/禁用管理
 *   - 插件状态
 * 
 * Usage:
 *   node builtin-plugins-registry.js list
 *   node builtin-plugins-registry.js enable <name>
 *   node builtin-plugins-registry.js disable <name>
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'plugins');
const SETTINGS_FILE = path.join(STATE_DIR, 'plugin-settings.json');
const REGISTRY_FILE = path.join(STATE_DIR, 'plugin-registry.json');

const BUILTIN_MARKETPLACE_NAME = 'builtin';

const DEFAULT_BUILTIN_PLUGINS = [
  {
    name: 'auto-compact',
    description: 'Auto compact service',
    defaultEnabled: true,
    components: ['service', 'hook']
  },
  {
    name: 'auto-dream',
    description: 'Auto dream consolidation',
    defaultEnabled: true,
    components: ['service', 'hook']
  },
  {
    name: 'memory-maintenance',
    description: 'Memory maintenance service',
    defaultEnabled: true,
    components: ['service']
  },
  {
    name: 'heartbeat',
    description: 'Heartbeat scheduler',
    defaultEnabled: true,
    components: ['service', 'scheduler']
  },
  {
    name: 'task-visualizer',
    description: 'Background task visualizer',
    defaultEnabled: true,
    components: ['service', 'ui']
  },
  {
    name: 'buddy-companion',
    description: 'Buddy companion service',
    defaultEnabled: false,
    components: ['service']
  },
  {
    name: 'away-summary',
    description: 'Away summary generator',
    defaultEnabled: true,
    components: ['service', 'hook']
  },
  {
    name: 'magic-docs',
    description: 'Magic docs scanner',
    defaultEnabled: true,
    components: ['service']
  },
  {
    name: 'prompt-suggestion',
    description: 'Prompt suggestion service',
    defaultEnabled: true,
    components: ['service']
  },
  {
    name: 'voice-integration',
    description: 'Voice/TTS integration',
    defaultEnabled: false,
    components: ['service']
  }
];

function loadPluginRegistry() {
  if (!fs.existsSync(REGISTRY_FILE)) {
    return { plugins: DEFAULT_BUILTIN_PLUGINS };
  }
  
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
  } catch {
    return { plugins: DEFAULT_BUILTIN_PLUGINS };
  }
}

function savePluginRegistry(registry) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
}

function loadPluginSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return { enabledPlugins: {} };
  }
  
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch {
    return { enabledPlugins: {} };
  }
}

function savePluginSettings(settings) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function registerBuiltinPlugin(plugin) {
  const registry = loadPluginRegistry();
  
  const existingIndex = registry.plugins.findIndex(p => p.name === plugin.name);
  
  if (existingIndex >= 0) {
    registry.plugins[existingIndex] = plugin;
  } else {
    registry.plugins.push(plugin);
  }
  
  savePluginRegistry(registry);
  
  return {
    registered: true,
    plugin,
    pluginId: `${plugin.name}@${BUILTIN_MARKETPLACE_NAME}`
  };
}

function isBuiltinPluginId(pluginId) {
  return pluginId.endsWith(`@${BUILTIN_MARKETPLACE_NAME}`);
}

function getBuiltinPluginDefinition(name) {
  const registry = loadPluginRegistry();
  
  return registry.plugins.find(p => p.name === name);
}

function getBuiltinPlugins() {
  const registry = loadPluginRegistry();
  const settings = loadPluginSettings();
  
  const enabled = [];
  const disabled = [];
  
  for (const plugin of registry.plugins) {
    const pluginId = `${plugin.name}@${BUILTIN_MARKETPLACE_NAME}`;
    const userSetting = settings.enabledPlugins[pluginId];
    
    const isEnabled = userSetting !== undefined
      ? userSetting === true
      : (plugin.defaultEnabled ?? true);
    
    const loadedPlugin = {
      name: plugin.name,
      pluginId,
      description: plugin.description,
      components: plugin.components,
      enabled: isEnabled
    };
    
    if (isEnabled) {
      enabled.push(loadedPlugin);
    } else {
      disabled.push(loadedPlugin);
    }
  }
  
  return {
    enabled,
    disabled,
    enabledCount: enabled.length,
    disabledCount: disabled.length,
    total: registry.plugins.length
  };
}

function enablePlugin(name) {
  const registry = loadPluginRegistry();
  const settings = loadPluginSettings();
  
  const plugin = registry.plugins.find(p => p.name === name);
  
  if (!plugin) {
    return {
      enabled: false,
      error: 'plugin not found',
      name
    };
  }
  
  const pluginId = `${name}@${BUILTIN_MARKETPLACE_NAME}`;
  settings.enabledPlugins[pluginId] = true;
  
  savePluginSettings(settings);
  
  return {
    enabled: true,
    pluginId,
    name,
    description: plugin.description
  };
}

function disablePlugin(name) {
  const registry = loadPluginRegistry();
  const settings = loadPluginSettings();
  
  const plugin = registry.plugins.find(p => p.name === name);
  
  if (!plugin) {
    return {
      disabled: false,
      error: 'plugin not found',
      name
    };
  }
  
  const pluginId = `${name}@${BUILTIN_MARKETPLACE_NAME}`;
  settings.enabledPlugins[pluginId] = false;
  
  savePluginSettings(settings);
  
  return {
    disabled: true,
    pluginId,
    name,
    description: plugin.description
  };
}

function getPluginStatus(name) {
  const registry = loadPluginRegistry();
  const settings = loadPluginSettings();
  
  const plugin = registry.plugins.find(p => p.name === name);
  
  if (!plugin) {
    return {
      found: false,
      name
    };
  }
  
  const pluginId = `${name}@${BUILTIN_MARKETPLACE_NAME}`;
  const userSetting = settings.enabledPlugins[pluginId];
  const isEnabled = userSetting !== undefined
    ? userSetting === true
    : (plugin.defaultEnabled ?? true);
  
  return {
    found: true,
    pluginId,
    name,
    description: plugin.description,
    components: plugin.components,
    enabled: isEnabled,
    userSetting: userSetting,
    defaultEnabled: plugin.defaultEnabled
  };
}

function listBuiltinPlugins() {
  const plugins = getBuiltinPlugins();
  
  return {
    plugins: [...plugins.enabled, ...plugins.disabled],
    ...plugins
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'list':
      console.log(JSON.stringify(listBuiltinPlugins(), null, 2));
      break;
    case 'register':
      const regName = args[1];
      const regDesc = args[2] || 'Custom plugin';
      if (!regName) {
        console.log('Usage: node builtin-plugins-registry.js register <name> [description]');
        process.exit(1);
      }
      console.log(JSON.stringify(registerBuiltinPlugin({
        name: regName,
        description: regDesc,
        defaultEnabled: true,
        components: ['service']
      }), null, 2));
      break;
    case 'enable':
      const enableName = args[1];
      if (!enableName) {
        console.log('Usage: node builtin-plugins-registry.js enable <name>');
        process.exit(1);
      }
      console.log(JSON.stringify(enablePlugin(enableName), null, 2));
      break;
    case 'disable':
      const disableName = args[1];
      if (!disableName) {
        console.log('Usage: node builtin-plugins-registry.js disable <name>');
        process.exit(1);
      }
      console.log(JSON.stringify(disablePlugin(disableName), null, 2));
      break;
    case 'status':
      const statusName = args[1];
      if (!statusName) {
        console.log('Usage: node builtin-plugins-registry.js status <name>');
        process.exit(1);
      }
      console.log(JSON.stringify(getPluginStatus(statusName), null, 2));
      break;
    default:
      console.log('Usage: node builtin-plugins-registry.js [list|register|enable|disable|status]');
      process.exit(1);
  }
}

main();

module.exports = {
  registerBuiltinPlugin,
  isBuiltinPluginId,
  getBuiltinPluginDefinition,
  getBuiltinPlugins,
  enablePlugin,
  disablePlugin,
  getPluginStatus,
  BUILTIN_MARKETPLACE_NAME
};