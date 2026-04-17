#!/usr/bin/env node
/**
 * REPL Tool - 基于 Claude Code REPLTool
 * 
 * REPL (Read-Eval-Print-Loop) 工具：
 *   - 执行代码片段
 *   - 支持多语言
 *   - 状态持久化
 * 
 * Usage:
 *   node repl-tool.js exec <code> [language]
 *   node repl-tool.js session <sessionId>
 *   node repl-tool.js history
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'repl');
const HISTORY_FILE = path.join(STATE_DIR, 'repl-history.json');
const SESSIONS_DIR = path.join(STATE_DIR, 'sessions');

const REPL_TOOL_NAME = 'REPL';
const SUPPORTED_LANGUAGES = ['javascript', 'python', 'bash', 'ruby', 'go'];

function loadReplHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return { executions: [], totalExecs: 0 };
  }
  
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return { executions: [], totalExecs: 0 };
  }
}

function saveReplHistory(history) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function execCode(code, language = 'javascript', timeout = 10000) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return {
      executed: false,
      error: 'unsupported language',
      language,
      supportedLanguages: SUPPORTED_LANGUAGES
    };
  }
  
  let result;
  let stdout = '';
  let stderr = '';
  
  try {
    switch (language) {
      case 'javascript':
        // Use node eval
        stdout = execSync(`node -e "${code.replace(/"/g, '\\"')}"`, { 
          encoding: 'utf8', 
          timeout 
        });
        break;
      case 'python':
        stdout = execSync(`python3 -c "${code.replace(/"/g, '\\"')}"`, { 
          encoding: 'utf8', 
          timeout 
        });
        break;
      case 'bash':
        stdout = execSync(code, { 
          encoding: 'utf8', 
          timeout,
          shell: '/bin/bash'
        });
        break;
      default:
        return {
          executed: false,
          error: 'language runner not implemented',
          language
        };
    }
    
    result = {
      executed: true,
      language,
      code,
      stdout,
      stderr,
      exitCode: 0,
      duration: Date.now()
    };
  } catch (e) {
    result = {
      executed: false,
      language,
      code,
      stdout: e.stdout || '',
      stderr: e.stderr || e.message,
      exitCode: e.status || 1,
      error: true
    };
  }
  
  // Add to history
  const history = loadReplHistory();
  history.executions.push({
    ...result,
    timestamp: Date.now()
  });
  history.totalExecs++;
  
  // Keep only last 50
  if (history.executions.length > 50) {
    history.executions = history.executions.slice(-50);
  }
  
  saveReplHistory(history);
  
  return result;
}

function createReplSession(sessionId, language = 'javascript') {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  
  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
  
  const session = {
    id: sessionId,
    language,
    state: {},
    history: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
  
  return {
    created: true,
    session,
    path: sessionFile
  };
}

function loadReplSession(sessionId) {
  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
  
  if (!fs.existsSync(sessionFile)) {
    return {
      error: 'session not found',
      sessionId
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  } catch {
    return {
      error: 'session load failed',
      sessionId
    };
  }
}

function execInSession(sessionId, code) {
  const session = loadReplSession(sessionId);
  
  if (session.error) {
    return session;
  }
  
  const result = execCode(code, session.language);
  
  // Update session
  session.history.push({
    code,
    result,
    timestamp: Date.now()
  });
  session.updatedAt = Date.now();
  
  // Save session
  const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
  
  return {
    ...result,
    sessionId
  };
}

function getReplHistory(limit = 20) {
  const history = loadReplHistory();
  
  return {
    executions: history.executions.slice(-limit),
    total: history.executions.length,
    byLanguage: history.executions.reduce((acc, e) => {
      acc[e.language] = (acc[e.language] || 0) + 1;
      return acc;
    }, {})
  };
}

function getReplStats() {
  const history = loadReplHistory();
  
  const successRate = history.executions.length > 0
    ? history.executions.filter(e => e.exitCode === 0).length / history.executions.length * 100
    : 0;
  
  return {
    totalExecs: history.totalExecs,
    successRate: successRate.toFixed(1) + '%',
    languagesUsed: Object.keys(history.executions.reduce((acc, e) => {
      acc[e.language] = true;
      return acc;
    }, {}))
  };
}

function clearReplHistory() {
  const history = { executions: [], totalExecs: 0 };
  saveReplHistory(history);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'history';
  
  switch (command) {
    case 'exec':
      const code = args[1];
      const language = args[2] || 'javascript';
      if (!code) {
        console.log('Usage: node repl-tool.js exec <code> [language]');
        process.exit(1);
      }
      console.log(JSON.stringify(execCode(code, language), null, 2));
      break;
    case 'session':
      const sessionCommand = args[1];
      const sessionId = args[2];
      
      if (sessionCommand === 'create') {
        const lang = args[3] || 'javascript';
        console.log(JSON.stringify(createReplSession(sessionId || `session_${Date.now()}`, lang), null, 2));
      } else if (sessionCommand === 'exec') {
        const sessionCode = args[3];
        console.log(JSON.stringify(execInSession(sessionId, sessionCode), null, 2));
      } else if (sessionCommand === 'load') {
        console.log(JSON.stringify(loadReplSession(sessionId), null, 2));
      } else {
        console.log('Usage: node repl-tool.js session [create|exec|load] <sessionId>');
      }
      break;
    case 'history':
      const limit = parseInt(args[1], 10) || 20;
      console.log(JSON.stringify(getReplHistory(limit), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getReplStats(), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearReplHistory(), null, 2));
      break;
    default:
      console.log('Usage: node repl-tool.js [exec|session|history|stats|clear]');
      process.exit(1);
  }
}

main();

module.exports = {
  execCode,
  createReplSession,
  loadReplSession,
  execInSession,
  getReplHistory,
  REPL_TOOL_NAME,
  SUPPORTED_LANGUAGES
};