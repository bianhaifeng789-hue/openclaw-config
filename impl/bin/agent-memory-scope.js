#!/usr/bin/env node
/**
 * Agent Memory Scope - 基于 Claude Code agentMemory.ts
 * 
 * Agent 间内存共享：
 *   - user scope: ~/.claude/agent-memory/<agentType>/ (全局)
 *   - project scope: <cwd>/.claude/agent-memory/<agentType>/ (项目级)
 *   - local scope: <cwd>/.claude/agent-memory-local/<agentType>/ (本地，不入 VCS)
 * 
 * 支持 CLAUDE_CODE_REMOTE_MEMORY_DIR 远程挂载
 * 
 * Usage:
 *   node agent-memory-scope.js get-dir <agentType> <scope>
 *   node agent-memory-scope.js is-memory-path <absolutePath>
 *   node agent-memory-scope.js write <agentType> <scope> <key> <value>
 *   node agent-memory-scope.js read <agentType> <scope> <key>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const MEMORY_BASE_DIR = process.env.OPENCLAW_MEMORY_DIR || path.join(os.homedir(), '.openclaw');

/**
 * Sanitize agent type name for use as directory name
 * Replaces colons (invalid on Windows, used in plugin-namespaced agents)
 */
function sanitizeAgentTypeForPath(agentType) {
  return agentType.replace(/:/g, '-');
}

/**
 * Get local agent memory dir (project-specific, not in VCS)
 */
function getLocalAgentMemoryDir(dirName, cwd) {
  const remoteDir = process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR;
  
  if (remoteDir) {
    return path.join(
      remoteDir,
      'projects',
      sanitizePath(findGitRoot(cwd) || cwd),
      'agent-memory-local',
      dirName
    ) + path.sep;
  }
  
  return path.join(cwd || process.cwd(), '.claude', 'agent-memory-local', dirName) + path.sep;
}

/**
 * Get agent memory dir for a given agent type and scope
 */
function getAgentMemoryDir(agentType, scope, cwd) {
  const dirName = sanitizeAgentTypeForPath(agentType);
  cwd = cwd || process.cwd();
  
  switch (scope) {
    case 'project':
      return path.join(cwd, '.claude', 'agent-memory', dirName) + path.sep;
    case 'local':
      return getLocalAgentMemoryDir(dirName, cwd);
    case 'user':
      return path.join(MEMORY_BASE_DIR, 'agent-memory', dirName) + path.sep;
    default:
      throw new Error(`Invalid scope: ${scope}`);
  }
}

/**
 * Check if path is within agent memory directory
 */
function isAgentMemoryPath(absolutePath) {
  const normalizedPath = path.normalize(absolutePath);
  const cwd = process.cwd();
  
  // User scope
  if (normalizedPath.startsWith(path.join(MEMORY_BASE_DIR, 'agent-memory') + path.sep)) {
    return true;
  }
  
  // Project scope
  if (normalizedPath.startsWith(path.join(cwd, '.claude', 'agent-memory') + path.sep)) {
    return true;
  }
  
  // Local scope
  const remoteDir = process.env.CLAUDE_CODE_REMOTE_MEMORY_DIR;
  if (remoteDir) {
    if (
      normalizedPath.includes(path.sep + 'agent-memory-local' + path.sep) &&
      normalizedPath.startsWith(path.join(remoteDir, 'projects') + path.sep)
    ) {
      return true;
    }
  } else if (normalizedPath.startsWith(path.join(cwd, '.claude', 'agent-memory-local') + path.sep)) {
    return true;
  }
  
  return false;
}

/**
 * Sanitize path for cross-platform safety
 */
function sanitizePath(p) {
  return p.replace(/[<>:"|?*]/g, '-').replace(/\.+/g, '.');
}

/**
 * Find git root (simplified)
 */
function findGitRoot(cwd) {
  try {
    const { execSync } = require('child_process');
    const result = execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf8' });
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * Write agent memory
 */
function writeAgentMemory(agentType, scope, key, value) {
  const dir = getAgentMemoryDir(agentType, scope);
  fs.mkdirSync(dir, { recursive: true });
  
  const filePath = path.join(dir, `${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify({
    value,
    writtenAt: Date.now(),
    agentType,
    scope,
    key
  }, null, 2));
  
  return {
    success: true,
    path: filePath,
    scope,
    agentType,
    key
  };
}

/**
 * Read agent memory
 */
function readAgentMemory(agentType, scope, key) {
  const dir = getAgentMemoryDir(agentType, scope);
  const filePath = path.join(dir, `${key}.json`);
  
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      error: 'memory not found',
      path: filePath
    };
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      success: true,
      value: data.value,
      writtenAt: data.writtenAt,
      path: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      path: filePath
    };
  }
}

/**
 * List all memories for an agent
 */
function listAgentMemories(agentType, scope) {
  const dir = getAgentMemoryDir(agentType, scope);
  
  if (!fs.existsSync(dir)) {
    return { memories: [], dir };
  }
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const memories = files.map(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      return {
        key: data.key,
        writtenAt: data.writtenAt,
        valuePreview: JSON.stringify(data.value).slice(0, 100)
      };
    } catch {
      return { key: f.replace('.json', ''), error: 'read failed' };
    }
  });
  
  return { memories, dir, count: memories.length };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'get-dir':
      const agentType = args[1];
      const scope = args[2] || 'user';
      console.log(getAgentMemoryDir(agentType, scope));
      break;
    case 'is-memory-path':
      const testPath = args[1];
      console.log(JSON.stringify({ path: testPath, isMemory: isAgentMemoryPath(testPath) }, null, 2));
      break;
    case 'write':
      const writeAgent = args[1];
      const writeScope = args[2] || 'user';
      const writeKey = args[3];
      const writeValue = args[4] || '';
      console.log(JSON.stringify(writeAgentMemory(writeAgent, writeScope, writeKey, writeValue), null, 2));
      break;
    case 'read':
      const readAgent = args[1];
      const readScope = args[2] || 'user';
      const readKey = args[3];
      console.log(JSON.stringify(readAgentMemory(readAgent, readScope, readKey), null, 2));
      break;
    case 'list':
      const listAgent = args[1];
      const listScope = args[2] || 'user';
      console.log(JSON.stringify(listAgentMemories(listAgent || 'default', listScope), null, 2));
      break;
    default:
      console.log('Usage: node agent-memory-scope.js [get-dir|is-memory-path|write|read|list]');
      process.exit(1);
  }
}

main();

module.exports = { getAgentMemoryDir, isAgentMemoryPath, writeAgentMemory, readAgentMemory };