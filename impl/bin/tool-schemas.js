#!/usr/bin/env node
/**
 * Tool Schemas - OpenAI Function-Calling Schemas
 *
 * 来源：Harness Engineering - tools.py TOOL_SCHEMAS + BROWSER_TOOL_SCHEMAS
 *
 * 功能：定义 Agent 可用的工具集（11个工具）
 *
 * 用法：
 * node tool-schemas.js list
 * node tool-schemas.js export
 * node tool-schemas.js status
 */

// TOOL_SCHEMAS（来自 Harness Engineering）
const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a file from the workspace.',
      parameters: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string', description: 'Relative path inside workspace' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_skill_file',
      description: 'Read a skill guide from the skills/ directory (e.g. \'skills/frontend-design/SKILL.md\').',
      parameters: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string', description: 'Relative path to skill file from project root' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Create or overwrite a file in the workspace.',
      parameters: {
        type: 'object',
        required: ['path', 'content'],
        properties: {
          path: { type: 'string', description: 'Relative path inside workspace' },
          content: { type: 'string', description: 'File content to write' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Replace an exact string in a file. For modifying existing files — only sends the diff.',
      parameters: {
        type: 'object',
        required: ['path', 'old_string', 'new_string'],
        properties: {
          path: { type: 'string', description: 'Relative path inside workspace' },
          old_string: { type: 'string', description: 'Exact string to find and replace (must match EXACTLY including whitespace/indentation)' },
          new_string: { type: 'string', description: 'New string to replace with' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List all files in a directory recursively.',
      parameters: {
        type: 'object',
        properties: {
          directory: {
            type: 'string',
            description: 'Relative directory path (default: root)',
            default: '.'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'run_bash',
      description: 'Execute a shell command in the workspace directory.',
      parameters: {
        type: 'object',
        required: ['command'],
        properties: {
          command: { type: 'string', description: 'Shell command to run' },
          timeout: {
            type: 'integer',
            description: 'Timeout in seconds (default 300). Increase for long builds.',
            default: 300
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delegate_task',
      description: 'Spawn a sub-agent in an isolated context to handle a subtask. Returns only its summary.',
      parameters: {
        type: 'object',
        required: ['task'],
        properties: {
          task: { type: 'string', description: 'Detailed description of the subtask to delegate' },
          role: {
            type: 'string',
            description: 'Role hint (e.g. \'codebase_explorer\', \'test_runner\')',
            default: 'assistant'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web. Returns titles, URLs, and snippets.',
      parameters: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', description: 'Search query' },
          max_results: {
            type: 'integer',
            description: 'Max results (default 5)',
            default: 5
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'web_fetch',
      description: 'Fetch a web page as text. Use after web_search.',
      parameters: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', description: 'URL to fetch' }
        }
      }
    }
  }
];

// BROWSER_TOOL_SCHEMAS（Evaluator only）
const BROWSER_TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'browser_test',
      description: 'Launch a headless Chromium browser to test the running application. Navigates to a URL, performs UI actions (click, fill, scroll, evaluate JS), captures console errors, and takes a screenshot.',
      parameters: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', description: 'URL to navigate to (e.g. http://localhost:5173)' },
          actions: {
            type: 'array',
            description: 'List of browser actions to perform sequentially',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['click', 'fill', 'wait', 'evaluate', 'scroll'],
                  description: 'Action type'
                },
                selector: { type: 'string', description: 'CSS selector (for click/fill)' },
                value: { type: 'string', description: 'Text for fill, JS code for evaluate, pixels for scroll' },
                delay: { type: 'integer', description: 'Milliseconds to wait (for wait action)' }
              }
            }
          },
          screenshot: {
            type: 'boolean',
            description: 'Take a screenshot after actions (default: true)',
            default: true
          },
          start_command: {
            type: 'string',
            description: 'Shell command to start the dev server (e.g. \'npm run dev\'). Only needed on first call.'
          },
          port: {
            type: 'integer',
            description: 'Port the dev server runs on (default: 5173)',
            default: 5173
          },
          startup_wait: {
            type: 'integer',
            description: 'Seconds to wait for dev server to start (default: 8)',
            default: 8
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'stop_dev_server',
      description: 'Stop the background dev server started by browser_test.',
      parameters: { type: 'object', properties: {} }
    }
  }
];

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'list') {
    console.log('=== TOOL_SCHEMAS (8 tools) ===');
    TOOL_SCHEMAS.forEach(t => {
      console.log(`- ${t.function.name}: ${t.function.description.slice(0, 60)}...`);
    });
    console.log('');
    console.log('=== BROWSER_TOOL_SCHEMAS (2 tools) ===');
    BROWSER_TOOL_SCHEMAS.forEach(t => {
      console.log(`- ${t.function.name}: ${t.function.description.slice(0, 60)}...`);
    });
    
  } else if (command === 'export') {
    console.log(JSON.stringify({
      toolSchemas: TOOL_SCHEMAS,
      browserToolSchemas: BROWSER_TOOL_SCHEMAS,
      total: TOOL_SCHEMAS.length + BROWSER_TOOL_SCHEMAS.length
    }, null, 2));
    
  } else if (command === 'status') {
    console.log(JSON.stringify({
      version: '1.0.0',
      toolSchemas: TOOL_SCHEMAS.length,
      browserToolSchemas: BROWSER_TOOL_SCHEMAS.length,
      total: TOOL_SCHEMAS.length + BROWSER_TOOL_SCHEMAS.length,
      source: 'Harness Engineering - tools.py'
    }, null, 2));
    
  } else {
    console.error('用法:');
    console.error('  node tool-schemas.js list');
    console.error('  node tool-schemas.js export');
    console.error('  node tool-schemas.js status');
    process.exit(1);
  }
}

// Export for module usage
module.exports = {
  TOOL_SCHEMAS,
  BROWSER_TOOL_SCHEMAS
};

// Run CLI if called directly
if (require.main === module) {
  main();
}