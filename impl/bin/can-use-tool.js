#!/usr/bin/env node
/**
 * Can Use Tool Permission Checker - 基于 Claude Code useCanUseTool.tsx
 * 
 * 工具权限控制：
 *   - 检查工具是否允许被使用
 *   - 支持动态权限配置
 *   - 记录权限检查历史
 * 
 * Usage:
 *   node can-use-tool.js check <toolName> <context>
 *   node can-use-tool.js grant <toolName>
 *   node can-use-tool.js deny <toolName>
 *   node can-use-tool.js list
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const PERMISSIONS_DIR = path.join(WORKSPACE, 'state', 'tool-permissions');
const PERMISSIONS_FILE = path.join(PERMISSIONS_DIR, 'permissions.json');

// Default allowed tools (worker tools from Claude Code)
const DEFAULT_ALLOWED_TOOLS = new Set([
  'BashTool',
  'FileReadTool',
  'FileEditTool',
  'FileWriteTool',
  'GlobTool',
  'GrepTool',
  'WebFetchTool',
  'WebSearchTool',
  'AskUserQuestionTool',
  'NotebookEditTool',
  'TaskCreateTool',
  'TaskGetTool',
  'TaskUpdateTool',
  'TodoWriteTool',
  'AgentTool',
  'SkillTool',
  'ReadTool',
  'WriteTool',
  'EditTool'
]);

// Default denied tools (internal)
const DEFAULT_DENIED_TOOLS = new Set([
  'TeamCreateTool',
  'TeamDeleteTool',
  'SendMessageTool',
  'SyntheticOutputTool',
  'ScheduleCronTool'
]);

// Tool categories
const TOOL_CATEGORIES = {
  filesystem: ['FileReadTool', 'FileEditTool', 'FileWriteTool', 'GlobTool', 'GrepTool'],
  web: ['WebFetchTool', 'WebSearchTool'],
  agent: ['AgentTool', 'TaskCreateTool', 'TaskGetTool', 'TaskUpdateTool'],
  internal: ['TeamCreateTool', 'TeamDeleteTool', 'SendMessageTool', 'SyntheticOutputTool'],
  skill: ['SkillTool'],
  shell: ['BashTool', 'PowerShellTool', 'REPLTool']
};

function loadPermissions() {
  if (!fs.existsSync(PERMISSIONS_FILE)) {
    return {
      allowed: Array.from(DEFAULT_ALLOWED_TOOLS),
      denied: Array.from(DEFAULT_DENIED_TOOLS),
      custom: {}
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(PERMISSIONS_FILE, 'utf8'));
  } catch {
    return {
      allowed: Array.from(DEFAULT_ALLOWED_TOOLS),
      denied: Array.from(DEFAULT_DENIED_TOOLS),
      custom: {}
    };
  }
}

function savePermissions(permissions) {
  fs.mkdirSync(PERMISSIONS_DIR, { recursive: true });
  fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(permissions, null, 2));
}

function canUseTool(toolName, context = {}) {
  const permissions = loadPermissions();
  const allowedSet = new Set(permissions.allowed);
  const deniedSet = new Set(permissions.denied);
  
  // Check custom overrides first
  if (permissions.custom[toolName]) {
    return {
      canUse: permissions.custom[toolName] === 'allow',
      reason: 'custom override',
      toolName,
      context
    };
  }
  
  // Check denied list
  if (deniedSet.has(toolName)) {
    return {
      canUse: false,
      reason: 'in denied list',
      toolName,
      context
    };
  }
  
  // Check allowed list
  if (allowedSet.has(toolName)) {
    return {
      canUse: true,
      reason: 'in allowed list',
      toolName,
      context
    };
  }
  
  // Default: deny unknown tools
  return {
    canUse: false,
    reason: 'not in allowed list',
    toolName,
    context
  };
}

function grantToolPermission(toolName) {
  const permissions = loadPermissions();
  
  // Remove from denied if present
  permissions.denied = permissions.denied.filter(t => t !== toolName);
  
  // Add to allowed if not present
  if (!permissions.allowed.includes(toolName)) {
    permissions.allowed.push(toolName);
  }
  
  // Clear custom override
  delete permissions.custom[toolName];
  
  savePermissions(permissions);
  
  return {
    success: true,
    toolName,
    action: 'granted',
    permissions: {
      allowedCount: permissions.allowed.length,
      deniedCount: permissions.denied.length
    }
  };
}

function denyToolPermission(toolName) {
  const permissions = loadPermissions();
  
  // Remove from allowed if present
  permissions.allowed = permissions.allowed.filter(t => t !== toolName);
  
  // Add to denied if not present
  if (!permissions.denied.includes(toolName)) {
    permissions.denied.push(toolName);
  }
  
  // Clear custom override
  delete permissions.custom[toolName];
  
  savePermissions(permissions);
  
  return {
    success: true,
    toolName,
    action: 'denied',
    permissions: {
      allowedCount: permissions.allowed.length,
      deniedCount: permissions.denied.length
    }
  };
}

function listToolPermissions() {
  const permissions = loadPermissions();
  
  return {
    allowed: permissions.allowed,
    denied: permissions.denied,
    custom: permissions.custom,
    categories: TOOL_CATEGORIES,
    stats: {
      allowedCount: permissions.allowed.length,
      deniedCount: permissions.denied.length,
      customCount: Object.keys(permissions.custom).length
    }
  };
}

function resetToolPermissions() {
  const permissions = {
    allowed: Array.from(DEFAULT_ALLOWED_TOOLS),
    denied: Array.from(DEFAULT_DENIED_TOOLS),
    custom: {}
  };
  
  savePermissions(permissions);
  
  return {
    success: true,
    action: 'reset',
    permissions
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'check':
      const toolName = args[1];
      const context = args[2] ? JSON.parse(args[2]) : {};
      if (!toolName) {
        console.log('Usage: node can-use-tool.js check <toolName> [contextJson]');
        process.exit(1);
      }
      console.log(JSON.stringify(canUseTool(toolName, context), null, 2));
      break;
    case 'grant':
      const grantTool = args[1];
      if (!grantTool) {
        console.log('Usage: node can-use-tool.js grant <toolName>');
        process.exit(1);
      }
      console.log(JSON.stringify(grantToolPermission(grantTool), null, 2));
      break;
    case 'deny':
      const denyTool = args[1];
      if (!denyTool) {
        console.log('Usage: node can-use-tool.js deny <toolName>');
        process.exit(1);
      }
      console.log(JSON.stringify(denyToolPermission(denyTool), null, 2));
      break;
    case 'list':
      console.log(JSON.stringify(listToolPermissions(), null, 2));
      break;
    case 'reset':
      console.log(JSON.stringify(resetToolPermissions(), null, 2));
      break;
    default:
      console.log('Usage: node can-use-tool.js [check|grant|deny|list|reset]');
      process.exit(1);
  }
}

main();

module.exports = {
  canUseTool,
  grantToolPermission,
  denyToolPermission,
  listToolPermissions,
  resetToolPermissions,
  DEFAULT_ALLOWED_TOOLS,
  DEFAULT_DENIED_TOOLS
};