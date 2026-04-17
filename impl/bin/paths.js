#!/usr/bin/env node
/**
 * OpenClaw Paths - 集中化路径管理
 * 
 * 借鉴 DeerFlow 2.0 的 Paths.py 标准化目录布局
 * 避免散乱路径，集中管理所有数据目录
 * 
 * 来源: https://github.com/bytedance/deer-flow
 * 参考: backend/packages/harness/deerflow/config/paths.py
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const WORKSPACE = path.join(__dirname, '..', '..');

/**
 * Paths - Centralized Path Management
 */
class Paths {
  constructor(baseDir = null) {
    this._baseDir = baseDir ? path.resolve(baseDir) : this._defaultBaseDir();
  }

  /**
   * Default base dir resolution (priority order)
   * 1. OPENCLAW_HOME environment variable
   * 2. Repo-local fallback: {workspace}/.openclaw-data
   */
  _defaultBaseDir() {
    if (process.env.OPENCLAW_HOME) {
      return path.resolve(process.env.OPENCLAW_HOME);
    }
    return path.join(WORKSPACE, '.openclaw-data');
  }

  /**
   * Validate thread_id (only alphanumeric, hyphens, underscores)
   */
  _validateThreadId(threadId) {
    const SAFE_THREAD_ID_RE = /^[A-Za-z0-9_\-]+$/;
    if (!SAFE_THREAD_ID_RE.test(threadId)) {
      throw new Error(`Invalid thread_id '${threadId}': only alphanumeric characters, hyphens, and underscores are allowed.`);
    }
    return threadId;
  }

  /**
   * Ensure directory exists
   */
  _ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  }

  // ============================================================================
  // Base Paths
  // ============================================================================

  /**
   * Host-visible base dir
   */
  get hostBaseDir() {
    return this._baseDir;
  }

  /**
   * Memory file path (global)
   */
  get memoryFile() {
    return path.join(this._baseDir, 'memory', 'memory.json');
  }

  /**
   * USER.md path (global user profile)
   */
  get userProfileFile() {
    return path.join(this._baseDir, 'USER.md');
  }

  // ============================================================================
  // Agents Paths
  // ============================================================================

  /**
   * Agents base directory
   */
  get agentsDir() {
    return path.join(this._baseDir, 'agents');
  }

  /**
   * Agent-specific directory
   * @param {string} agentName - Agent name
   */
  agentDir(agentName) {
    return path.join(this.agentsDir, agentName);
  }

  /**
   * Agent config file
   * @param {string} agentName - Agent name
   */
  agentConfigFile(agentName) {
    return path.join(this.agentDir(agentName), 'config.yaml');
  }

  /**
   * Agent SOUL.md (personality/identity)
   * @param {string} agentName - Agent name
   */
  agentSoulFile(agentName) {
    return path.join(this.agentDir(agentName), 'SOUL.md');
  }

  /**
   * Agent memory file
   * @param {string} agentName - Agent name
   */
  agentMemoryFile(agentName) {
    return path.join(this.agentDir(agentName), 'memory.json');
  }

  /**
   * Ensure agent directory exists
   * @param {string} agentName - Agent name
   */
  ensureAgentDir(agentName) {
    return this._ensureDir(this.agentDir(agentName));
  }

  // ============================================================================
  // Threads Paths
  // ============================================================================

  /**
   * Threads base directory
   */
  get threadsDir() {
    return path.join(this._baseDir, 'threads');
  }

  /**
   * Thread-specific directory
   * @param {string} threadId - Thread ID
   */
  threadDir(threadId) {
    this._validateThreadId(threadId);
    return path.join(this.threadsDir, threadId);
  }

  /**
   * Thread user-data directory (mounted as /mnt/user-data/ in sandbox)
   * @param {string} threadId - Thread ID
   */
  threadUserDataDir(threadId) {
    return path.join(this.threadDir(threadId), 'user-data');
  }

  /**
   * Thread workspace directory
   * @param {string} threadId - Thread ID
   */
  threadWorkspaceDir(threadId) {
    return path.join(this.threadUserDataDir(threadId), 'workspace');
  }

  /**
   * Thread uploads directory
   * @param {string} threadId - Thread ID
   */
  threadUploadsDir(threadId) {
    return path.join(this.threadUserDataDir(threadId), 'uploads');
  }

  /**
   * Thread outputs directory
   * @param {string} threadId - Thread ID
   */
  threadOutputsDir(threadId) {
    return path.join(this.threadUserDataDir(threadId), 'outputs');
  }

  /**
   * Ensure thread directories exist
   * @param {string} threadId - Thread ID
   */
  ensureThreadDirs(threadId) {
    this._validateThreadId(threadId);
    
    // Create all thread directories
    this._ensureDir(this.threadDir(threadId));
    this._ensureDir(this.threadUserDataDir(threadId));
    this._ensureDir(this.threadWorkspaceDir(threadId));
    this._ensureDir(this.threadUploadsDir(threadId));
    this._ensureDir(this.threadOutputsDir(threadId));
    
    return {
      threadDir: this.threadDir(threadId),
      userDataDir: this.threadUserDataDir(threadId),
      workspaceDir: this.threadWorkspaceDir(threadId),
      uploadsDir: this.threadUploadsDir(threadId),
      outputsDir: this.threadOutputsDir(threadId)
    };
  }

  // ============================================================================
  // Sandbox Paths
  // ============================================================================

  /**
   * Sandbox base directory
   */
  get sandboxBaseDir() {
    return path.join(this._baseDir, 'sandbox');
  }

  /**
   * Sandbox work directory
   * @param {string} threadId - Thread ID
   */
  sandboxWorkDir(threadId) {
    return this.threadWorkspaceDir(threadId);
  }

  /**
   * Sandbox uploads directory
   * @param {string} threadId - Thread ID
   */
  sandboxUploadsDir(threadId) {
    return this.threadUploadsDir(threadId);
  }

  /**
   * Sandbox outputs directory
   * @param {string} threadId - Thread ID
   */
  sandboxOutputsDir(threadId) {
    return this.threadOutputsDir(threadId);
  }

  // ============================================================================
  // State Paths
  // ============================================================================

  /**
   * State directory
   */
  get stateDir() {
    return path.join(WORKSPACE, 'state');
  }

  /**
   * Heartbeat state file
   */
  get heartbeatStateFile() {
    return path.join(this.stateDir, 'heartbeat-state.json');
  }

  /**
   * Extensions config file
   */
  get extensionsConfigFile() {
    return path.join(this.stateDir, 'extensions-config.json');
  }

  /**
   * MCP OAuth state file
   */
  get mcpOAuthStateFile() {
    return path.join(this.stateDir, 'mcp-oauth-state.json');
  }

  /**
   * Guardrails config file
   */
  get guardrailsConfigFile() {
    return path.join(this.stateDir, 'guardrails-config.json');
  }

  /**
   * Hooks config file
   */
  get hooksConfigFile() {
    return path.join(WORKSPACE, 'hooks-config.json');
  }

  // ============================================================================
  // Workspace Paths
  // ============================================================================

  /**
   * Skills directory
   */
  get skillsDir() {
    return path.join(WORKSPACE, 'skills');
  }

  /**
   * impl/bin directory
   */
  get implBinDir() {
    return path.join(WORKSPACE, 'impl', 'bin');
  }

  /**
   * Scripts directory
   */
  get scriptsDir() {
    return path.join(WORKSPACE, 'scripts');
  }

  /**
   * Memory directory (daily notes)
   */
  get memoryDailyDir() {
    return path.join(WORKSPACE, 'memory');
  }

  /**
   * Docs directory
   */
  get docsDir() {
    return path.join(WORKSPACE, 'docs');
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get all paths as object
   */
  getAllPaths() {
    return {
      baseDir: this.hostBaseDir,
      memoryFile: this.memoryFile,
      userProfileFile: this.userProfileFile,
      agentsDir: this.agentsDir,
      threadsDir: this.threadsDir,
      sandboxBaseDir: this.sandboxBaseDir,
      stateDir: this.stateDir,
      skillsDir: this.skillsDir,
      implBinDir: this.implBinDir,
      scriptsDir: this.scriptsDir,
      memoryDailyDir: this.memoryDailyDir,
      docsDir: this.docsDir
    };
  }

  /**
   * Ensure base directories exist
   */
  ensureBaseDirs() {
    // Create base structure
    this._ensureDir(this._baseDir);
    this._ensureDir(path.join(this._baseDir, 'memory'));
    this._ensureDir(this.agentsDir);
    this._ensureDir(this.threadsDir);
    this._ensureDir(this.sandboxBaseDir);
    this._ensureDir(this.stateDir);
    this._ensureDir(this.skillsDir);
    this._ensureDir(this.implBinDir);
    this._ensureDir(this.scriptsDir);
    this._ensureDir(this.memoryDailyDir);
    this._ensureDir(this.docsDir);
    
    return this.getAllPaths();
  }

  /**
   * Print directory layout
   */
  printLayout() {
    console.log(`
OpenClaw Directory Layout:

${this._baseDir}/
├── memory/
│   └── memory.json        <-- Global memory
├── USER.md                <-- Global user profile (injected into all agents)
├── agents/
│   └── {agent_name}/
│       ├── config.yaml    <-- Agent config
│       ├── SOUL.md        <-- Agent personality/identity
│       └── memory.json    <-- Agent memory
├── threads/
│   └── {thread_id}/
│       └── user-data/     <-- Mounted as /mnt/user-data/ in sandbox
│           ├── workspace/
│           ├── uploads/
│           └── outputs/
└── sandbox/               <-- Sandbox base

Workspace:
${WORKSPACE}/
├── skills/                <-- Skills directory
├── impl/bin/              <-- Scripts
├── scripts/               <-- Shell scripts
├── memory/                <-- Daily notes
├── docs/                  <-- Documentation
└── state/                 <-- State files
    ├── heartbeat-state.json
    ├── extensions-config.json
    ├── mcp-oauth-state.json
    ├── guardrails-config.json
    └── ...
`);
  }
}

// Singleton instance
let _pathsInstance = null;

/**
 * Get Paths instance (singleton)
 */
function getPaths(baseDir = null) {
  if (!_pathsInstance || baseDir) {
    _pathsInstance = new Paths(baseDir);
  }
  return _pathsInstance;
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'layout';

if (command === 'layout') {
  const paths = getPaths();
  paths.printLayout();
} else if (command === 'init') {
  const paths = getPaths();
  const created = paths.ensureBaseDirs();
  console.log('✓ Base directories created:');
  console.log(JSON.stringify(created, null, 2));
} else if (command === 'status') {
  const paths = getPaths();
  const allPaths = paths.getAllPaths();
  
  console.log('OpenClaw Paths Status:\n');
  for (const [name, pathStr] of Object.entries(allPaths)) {
    const exists = fs.existsSync(pathStr);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${name}: ${pathStr}`);
  }
} else if (command === 'thread') {
  const threadId = args[1];
  if (!threadId) {
    console.error('Usage: paths.js thread <thread_id>');
    process.exit(1);
  }
  
  const paths = getPaths();
  const threadPaths = paths.ensureThreadDirs(threadId);
  
  console.log('✓ Thread directories created:');
  console.log(JSON.stringify(threadPaths, null, 2));
} else if (command === 'agent') {
  const agentName = args[1];
  if (!agentName) {
    console.error('Usage: paths.js agent <agent_name>');
    process.exit(1);
  }
  
  const paths = getPaths();
  paths.ensureAgentDir(agentName);
  
  console.log('✓ Agent directory created:');
  console.log(`  ${paths.agentDir(agentName)}`);
} else {
  console.log('Usage: paths.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  layout   - Show directory layout');
  console.log('  init     - Create base directories');
  console.log('  status   - Check paths status');
  console.log('  thread <id> - Create thread directories');
  console.log('  agent <name> - Create agent directory');
}

module.exports = { Paths, getPaths };