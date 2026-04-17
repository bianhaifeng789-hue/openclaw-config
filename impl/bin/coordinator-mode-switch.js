#!/usr/bin/env node
/**
 * Coordinator Mode - 基于 Claude Code coordinatorMode.ts
 * 
 * 多 Agent 协调模式：
 *   - 通过环境变量 CLAUDE_CODE_COORDINATOR_MODE 切换
 *   - Coordinator 调度 worker agents
 *   - Workers 只能使用特定工具集
 * 
 * Worker Tools (ASYNC_AGENT_ALLOWED_TOOLS):
 *   - BashTool
 *   - FileReadTool
 *   - FileEditTool
 *   - FileWriteTool
 *   - GlobTool
 *   - GrepTool
 *   - etc.
 * 
 * Internal Worker Tools (不暴露给 coordinator):
 *   - TeamCreateTool
 *   - TeamDeleteTool
 *   - SendMessageTool
 *   - SyntheticOutputTool
 * 
 * Usage:
 *   node coordinator-mode-switch.js enable
 *   node coordinator-mode-switch.js disable
 *   node coordinator-mode-switch.js status
 *   node coordinator-mode-switch.js match-session <sessionMode>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'coordinator');
const MODE_FILE = path.join(STATE_DIR, 'mode.json');

// ASYNC_AGENT_ALLOWED_TOOLS from Claude Code
const ASYNC_AGENT_ALLOWED_TOOLS = new Set([
  'BashTool',
  'FileReadTool',
  'FileEditTool',
  'FileWriteTool',
  'GlobTool',
  'GrepTool',
  'GlobTool',
  'AskUserQuestionTool',
  'NotebookEditTool',
  'WebFetchTool',
  'WebSearchTool',
  'TaskCreateTool',
  'TaskGetTool',
  'TaskUpdateTool',
  'TaskStopTool',
  'TodoWriteTool',
  'AgentTool'
]);

// Internal worker tools (not exposed)
const INTERNAL_WORKER_TOOLS = new Set([
  'TeamCreateTool',
  'TeamDeleteTool',
  'SendMessageTool',
  'SyntheticOutputTool',
  'TaskStopTool'
]);

function isCoordinatorMode() {
  // Check environment variable first
  if (process.env.CLAUDE_CODE_COORDINATOR_MODE === '1') {
    return true;
  }
  
  // Check persisted mode
  if (fs.existsSync(MODE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(MODE_FILE, 'utf8'));
      return data.mode === 'coordinator';
    } catch {
      return false;
    }
  }
  
  return false;
}

function enableCoordinatorMode() {
  process.env.CLAUDE_CODE_COORDINATOR_MODE = '1';
  
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(MODE_FILE, JSON.stringify({
    mode: 'coordinator',
    enabledAt: Date.now(),
    pid: process.pid
  }, null, 2));
  
  return {
    status: 'enabled',
    mode: 'coordinator',
    message: 'Entered coordinator mode. Workers can be spawned via AgentTool.',
    workerTools: getWorkerTools()
  };
}

function disableCoordinatorMode() {
  delete process.env.CLAUDE_CODE_COORDINATOR_MODE;
  
  if (fs.existsSync(MODE_FILE)) {
    fs.unlinkSync(MODE_FILE);
  }
  
  return {
    status: 'disabled',
    mode: 'normal',
    message: 'Exited coordinator mode. Back to single agent mode.'
  };
}

function getWorkerTools() {
  const tools = Array.from(ASYNC_AGENT_ALLOWED_TOOLS)
    .filter(name => !INTERNAL_WORKER_TOOLS.has(name))
    .sort();
  
  return {
    available: tools,
    count: tools.length,
    internalTools: Array.from(INTERNAL_WORKER_TOOLS).sort()
  };
}

function matchSessionMode(sessionMode) {
  // Match persisted session mode
  if (!sessionMode) {
    return { matched: false, reason: 'no stored mode' };
  }
  
  const currentIsCoordinator = isCoordinatorMode();
  const sessionIsCoordinator = sessionMode === 'coordinator';
  
  if (currentIsCoordinator === sessionIsCoordinator) {
    return { matched: true, mode: sessionMode };
  }
  
  // Flip mode to match session
  if (sessionIsCoordinator) {
    const result = enableCoordinatorMode();
    return { 
      matched: true, 
      switched: true, 
      from: 'normal', 
      to: 'coordinator',
      message: 'Entered coordinator mode to match resumed session'
    };
  } else {
    const result = disableCoordinatorMode();
    return {
      matched: true,
      switched: true,
      from: 'coordinator',
      to: 'normal',
      message: 'Exited coordinator mode to match resumed session'
    };
  }
}

function getCoordinatorUserContext(mcpClients, scratchpadDir) {
  if (!isCoordinatorMode()) {
    return {};
  }
  
  const workerTools = getWorkerTools();
  let content = `Workers spawned via the AgentTool have access to these tools: ${workerTools.available.join(', ')}`;
  
  if (mcpClients && mcpClients.length > 0) {
    const serverNames = mcpClients.map(c => c.name).join(', ');
    content += `\n\nMCP servers available to workers: ${serverNames}`;
  }
  
  if (scratchpadDir) {
    content += `\n\nScratchpad directory for coordination: ${scratchpadDir}`;
  }
  
  return {
    coordinatorMode: true,
    workerTools: workerTools.available,
    userContext: content
  };
}

function getStatus() {
  const mode = isCoordinatorMode();
  const workerTools = getWorkerTools();
  
  let persistedMode = null;
  if (fs.existsSync(MODE_FILE)) {
    try {
      persistedMode = JSON.parse(fs.readFileSync(MODE_FILE, 'utf8'));
    } catch {
      persistedMode = null;
    }
  }
  
  return {
    currentMode: mode ? 'coordinator' : 'normal',
    envVar: process.env.CLAUDE_CODE_COORDINATOR_MODE || 'not set',
    persistedMode,
    workerTools,
    stateFile: MODE_FILE
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'enable':
      console.log(JSON.stringify(enableCoordinatorMode(), null, 2));
      break;
    case 'disable':
      console.log(JSON.stringify(disableCoordinatorMode(), null, 2));
      break;
    case 'status':
      console.log(JSON.stringify(getStatus(), null, 2));
      break;
    case 'match-session':
      const sessionMode = args[1];
      console.log(JSON.stringify(matchSessionMode(sessionMode), null, 2));
      break;
    case 'worker-tools':
      console.log(JSON.stringify(getWorkerTools(), null, 2));
      break;
    default:
      console.log('Usage: node coordinator-mode-switch.js [enable|disable|status|match-session|worker-tools]');
      process.exit(1);
  }
}

main();

module.exports = { 
  isCoordinatorMode, 
  enableCoordinatorMode, 
  disableCoordinatorMode, 
  getWorkerTools,
  matchSessionMode,
  getCoordinatorUserContext
};