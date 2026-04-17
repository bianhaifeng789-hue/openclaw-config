#!/usr/bin/env node
/**
 * LSP Tool - 基于 Claude Code LSPTool
 * 
 * LSP (Language Server Protocol) 工具：
 *   - 语言服务器管理
 *   - 代码补全/诊断
 *   - 符号查询
 * 
 * Usage:
 *   node lsp-tool.js start <language>
 *   node lsp-tool.js request <method> <params>
 *   node lsp-tool.js status
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'lsp');
const SERVERS_FILE = path.join(STATE_DIR, 'servers.json');

// Known language servers
const LANGUAGE_SERVERS = {
  typescript: {
    command: 'typescript-language-server',
    args: ['--stdio'],
    modules: ['ts', 'typescript']
  },
  javascript: {
    command: 'typescript-language-server',
    args: ['--stdio'],
    modules: ['js', 'javascript']
  },
  python: {
    command: 'pyright-langserver',
    args: ['--stdio'],
    modules: ['py', 'python']
  },
  go: {
    command: 'gopls',
    args: ['--stdio'],
    modules: ['go', 'golang']
  },
  rust: {
    command: 'rust-analyzer',
    args: [],
    modules: ['rs', 'rust']
  }
};

function loadServers() {
  if (!fs.existsSync(SERVERS_FILE)) {
    return { servers: {} };
  }
  
  try {
    return JSON.parse(fs.readFileSync(SERVERS_FILE, 'utf8'));
  } catch {
    return { servers: {} };
  }
}

function saveServers(servers) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers, null, 2));
}

function startLanguageServer(language) {
  const serverConfig = LANGUAGE_SERVERS[language];
  
  if (!serverConfig) {
    return {
      started: false,
      error: 'unknown language',
      language,
      supportedLanguages: Object.keys(LANGUAGE_SERVERS)
    };
  }
  
  // Check if server is already running
  const servers = loadServers();
  if (servers.servers[language] && servers.servers[language].running) {
    return {
      started: false,
      reason: 'already running',
      language,
      server: servers.servers[language]
    };
  }
  
  // Try to start server (in real implementation, would use actual LSP client)
  const serverEntry = {
    language,
    command: serverConfig.command,
    args: serverConfig.args,
    startedAt: Date.now(),
    running: true,
    pid: null // Would have actual PID in real implementation
  };
  
  servers.servers[language] = serverEntry;
  saveServers(servers);
  
  return {
    started: true,
    language,
    server: serverEntry,
    note: 'In real implementation, would spawn actual language server process'
  };
}

function stopLanguageServer(language) {
  const servers = loadServers();
  const server = servers.servers[language];
  
  if (!server) {
    return {
      stopped: false,
      error: 'server not found',
      language
    };
  }
  
  server.running = false;
  server.stoppedAt = Date.now();
  
  saveServers(servers);
  
  return {
    stopped: true,
    language,
    server
  };
}

function getServerStatus(language = null) {
  const servers = loadServers();
  
  if (language) {
    const server = servers.servers[language];
    if (!server) {
      return {
        language,
        status: 'not started',
        running: false
      };
    }
    
    return {
      language,
      status: server.running ? 'running' : 'stopped',
      server
    };
  }
  
  // Return all servers status
  const allStatus = {};
  for (const [lang, server] of Object.entries(servers.servers)) {
    allStatus[lang] = {
      status: server.running ? 'running' : 'stopped',
      startedAt: server.startedAt
    };
  }
  
  return {
    servers: allStatus,
    runningCount: Object.values(servers.servers).filter(s => s.running).length,
    stoppedCount: Object.values(servers.servers).filter(s => !s.running).length
  };
}

function makeLSPRequest(method, params) {
  // Simulated LSP request
  const request = {
    method,
    params: typeof params === 'string' ? JSON.parse(params) : params,
    timestamp: Date.now()
  };
  
  // Common LSP methods
  const SUPPORTED_METHODS = [
    'textDocument/completion',
    'textDocument/hover',
    'textDocument/definition',
    'textDocument/references',
    'textDocument/diagnostics',
    'textDocument/formatting',
    'workspace/symbol'
  ];
  
  if (!SUPPORTED_METHODS.includes(method)) {
    return {
      error: 'unsupported method',
      method,
      supportedMethods: SUPPORTED_METHODS
    };
  }
  
  // Simulated response
  const response = {
    method,
    result: [],
    note: 'In real implementation, would send actual LSP request and return response'
  };
  
  return {
    request,
    response,
    method
  };
}

function listSupportedLanguages() {
  return {
    languages: Object.keys(LANGUAGE_SERVERS),
    configs: LANGUAGE_SERVERS,
    count: Object.keys(LANGUAGE_SERVERS).length
  };
}

function detectLanguageFromFile(filePath) {
  const ext = path.extname(filePath).slice(1);
  
  for (const [language, config] of Object.entries(LANGUAGE_SERVERS)) {
    if (config.modules.includes(ext)) {
      return {
        language,
        extension: ext,
        config
      };
    }
  }
  
  return {
    language: null,
    extension: ext,
    error: 'unknown language extension'
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'start':
      const startLang = args[1];
      if (!startLang) {
        console.log('Usage: node lsp-tool.js start <language>');
        process.exit(1);
      }
      console.log(JSON.stringify(startLanguageServer(startLang), null, 2));
      break;
    case 'stop':
      const stopLang = args[1];
      if (!stopLang) {
        console.log('Usage: node lsp-tool.js stop <language>');
        process.exit(1);
      }
      console.log(JSON.stringify(stopLanguageServer(stopLang), null, 2));
      break;
    case 'status':
      const statusLang = args[1];
      console.log(JSON.stringify(getServerStatus(statusLang), null, 2));
      break;
    case 'request':
      const method = args[1];
      const params = args[2] || '{}';
      if (!method) {
        console.log('Usage: node lsp-tool.js request <method> [params]');
        process.exit(1);
      }
      console.log(JSON.stringify(makeLSPRequest(method, params), null, 2));
      break;
    case 'languages':
      console.log(JSON.stringify(listSupportedLanguages(), null, 2));
      break;
    case 'detect':
      const filePath = args[1];
      if (!filePath) {
        console.log('Usage: node lsp-tool.js detect <filePath>');
        process.exit(1);
      }
      console.log(JSON.stringify(detectLanguageFromFile(filePath), null, 2));
      break;
    default:
      console.log('Usage: node lsp-tool.js [start|stop|status|request|languages|detect]');
      process.exit(1);
  }
}

main();

module.exports = {
  startLanguageServer,
  stopLanguageServer,
  getServerStatus,
  makeLSPRequest,
  listSupportedLanguages,
  detectLanguageFromFile,
  LANGUAGE_SERVERS
};