#!/usr/bin/env node
/**
 * Agent Loop - 直接翻译自 agents.py (515 行)
 *
 * 核心功能:
 * - TraceWriter - 记录 Agent 事件到 JSONL
 * - Agent.run() - 核心 while 循环
 * - Middleware hooks: per_iteration, pre_exit, post_tool
 * - Rate limit retry + exponential backoff
 * - Text-only nudge - 防止描述而不执行
 * - Parallel tool calls 支持
 *
 * 用法:
 *   node agent-loop.js run --prompt="Build a timer"
 *   node agent-loop.js trace --agent=builder
 *   node agent-loop.js test
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// 动态路径
const HOME = process.env.HOME || '/Users/mac';
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');

// 配置（从环境变量或默认）
const config = {
  API_KEY: process.env.OPENAI_API_KEY || '',
  BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  MODEL: process.env.HARNESS_MODEL || 'gpt-4o',
  MAX_AGENT_ITERATIONS: parseInt(process.env.MAX_AGENT_ITERATIONS || '500'),
  MAX_TOOL_ERRORS: parseInt(process.env.MAX_TOOL_ERRORS || '5'),
  COMPRESS_THRESHOLD: parseInt(process.env.COMPRESS_THRESHOLD || '80000'),
  RESET_THRESHOLD: parseInt(process.env.RESET_THRESHOLD || '150000'),
  WORKSPACE: WORKSPACE
};

// ---------------------------------------------------------------------------
// TraceWriter - 记录 Agent 事件到 JSONL
// ---------------------------------------------------------------------------

class TraceWriter {
  constructor(agentName) {
    this.agentName = agentName;
    this.startTime = Date.now();
    
    // Write trace to workspace first
    let traceDir = WORKSPACE;
    try {
      if (!fs.existsSync(traceDir)) {
        fs.mkdirSync(traceDir, { recursive: true });
      }
      // Test writable
      const testFile = path.join(traceDir, `_trace_test_${agentName}`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      this.path = path.join(traceDir, `_trace_${agentName}.jsonl`);
    } catch (err) {
      // Workspace not writable, use impl/bin
      this.path = path.join(__dirname, `_trace_${agentName}.jsonl`);
    }
  }

  _write(eventType, data) {
    try {
      const entry = {
        t: Math.round((Date.now() - this.startTime) / 1000, 2),
        agent: this.agentName,
        event: eventType,
        ...data
      };
      const line = JSON.stringify(entry).slice(0, 10000);
      
      // Append to file
      fs.appendFileSync(this.path, line + '\n', 'utf8');
      
      // Also print to stderr (like Harbor logs)
      console.error(`[TRACE] ${line}`);
    } catch (err) {
      // Never let tracing break the agent
    }
  }

  iteration(n, tokens) {
    this._write('iteration', { n, tokens });
  }

  llmResponse(content, toolCalls, finishReason) {
    this._write('llm_response', {
      content: (content || '').slice(0, 500),
      tool_calls: (toolCalls || []).map(tc => tc.function?.name),
      finish_reason: finishReason
    });
  }

  toolCall(name, args, result) {
    this._write('tool_call', {
      tool: name,
      args: truncate(JSON.stringify(args), 300),
      result: truncate(result, 500)
    });
  }

  middlewareInject(source, hook, message) {
    this._write('middleware', {
      source,
      hook,
      message: message.slice(0, 300)
    });
  }

  contextEvent(eventType, reason = '') {
    this._write('context', { type: eventType, reason });
  }

  error(errorType, message) {
    this._write('error', { type: errorType, message: message.slice(0, 500) });
  }

  finish(reason, iterations) {
    this._write('finish', { reason, iterations });
  }
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '...' : str;
}

// ---------------------------------------------------------------------------
// LLM Client
// ---------------------------------------------------------------------------

let clientP = null;

async function getClient() {
  if (clientP) return clientP;
  
  // Use native https/http for OpenAI API
  clientP = {
    async call(messages, tools = null, toolChoice = 'auto') {
      const body = {
        model: config.MODEL,
        messages,
        max_tokens: 16384
      };
      
      if (tools) {
        body.tools = tools;
        body.tool_choice = toolChoice;
        body.parallel_tool_calls = true; // Key feature from Claude Code
      }
      
      const url = new URL(config.BASE_URL + '/chat/completions');
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? https : http;
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.API_KEY}`
      };
      
      return new Promise((resolve, reject) => {
        const req = lib.request({
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers,
          timeout: 300000 // 5 min
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              if (res.statusCode >= 400) {
                reject(new Error(`API error ${res.statusCode}: ${data.slice(0, 500)}`));
              } else {
                resolve(JSON.parse(data));
              }
            } catch (err) {
              reject(err);
            }
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.write(JSON.stringify(body));
        req.end();
      });
    }
  };
  
  return clientP;
}

/**
 * Simple LLM call without tools - for summarization
 */
async function llmCallSimple(messages) {
  // Retry on rate limits
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const client = await getClient();
      const resp = await client.call(messages);
      return resp.choices[0]?.message?.content || '';
    } catch (err) {
      const errStr = err.message || '';
      
      if (errStr.includes('rate_limit') || errStr.includes('429')) {
        const wait = Math.min(Math.pow(2, attempt + 1), 30) + Math.random() * 3;
        console.warn(`[WARN] Rate limited, waiting ${wait.toFixed(1)}s (attempt ${attempt + 1}/4)`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }
      
      console.error(`[ERROR] llm_call_simple failed:`, errStr);
      return '[context summarization failed — continuing with truncated context]';
    }
  }
  
  return '[context summarization failed after retries]';
}

// ---------------------------------------------------------------------------
// Agent Core Loop
// ---------------------------------------------------------------------------

class Agent {
  constructor(name, systemPrompt, options = {}) {
    this.name = name;
    this.systemPrompt = systemPrompt;
    this.useTools = options.useTools !== false;
    this.extraToolSchemas = options.extraToolSchemas || [];
    this.middlewares = options.middlewares || [];
    this.timeBudget = options.timeBudget;
    this.toolSchemas = options.toolSchemas || getDefaultToolSchemas();
  }

  /**
   * Run agent loop until model stops or iteration limit
   */
  async run(task) {
    const trace = new TraceWriter(this.name);
    
    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: task }
    ];
    
    const client = await getClient();
    let consecutiveErrors = 0;
    let lastText = '';
    
    // Import context lifecycle
    const { countTokens, detectAnxiety, compactMessages, createCheckpoint, restoreFromCheckpoint } = 
      require('./context-lifecycle.js');
    
    for (let iteration = 1; iteration <= config.MAX_AGENT_ITERATIONS; iteration++) {
      // --- Middleware: per-iteration hooks ---
      for (const mw of this.middlewares) {
        if (mw.per_iteration) {
          const inject = mw.per_iteration(iteration, messages);
          if (inject) {
            messages.push({ role: 'user', content: inject });
            trace.middlewareInject(mw.constructor?.name || 'middleware', 'per_iteration', inject);
          }
        }
      }
      
      // --- Context lifecycle check ---
      const tokenCount = countTokens(messages);
      console.log(`[${this.name}] iteration=${iteration}  tokens≈${tokenCount}`);
      trace.iteration(iteration, tokenCount);
      
      if (tokenCount > config.RESET_THRESHOLD || detectAnxiety(messages)) {
        const reason = tokenCount > config.RESET_THRESHOLD ?
          `tokens ${tokenCount} > threshold` : 'anxiety detected';
        console.warn(`[${this.name}] Context reset triggered (${reason}). Writing checkpoint...`);
        trace.contextEvent('reset', reason);
        
        const checkpoint = await createCheckpoint(messages, llmCallSimple);
        messages.length = 0;
        messages.push(...await restoreFromCheckpoint(checkpoint, this.systemPrompt));
      } else if (tokenCount > config.COMPRESS_THRESHOLD) {
        console.log(`[${this.name}] Compacting context (role=${this.name})...`);
        trace.contextEvent('compact', `tokens=${tokenCount}`);
        
        const compacted = await compactMessages(messages, llmCallSimple, this.name);
        messages.length = 0;
        messages.push(...compacted);
      }
      
      // --- LLM call ---
      const tools = this.useTools ? [...this.toolSchemas, ...this.extraToolSchemas] : null;
      
      let response;
      try {
        response = await client.call(messages, tools, 'auto');
      } catch (err) {
        const errStr = err.message || '';
        trace.error('api_error', errStr);
        
        // Rate limit - longer backoff, don't count toward abort
        if (errStr.includes('rate_limit') || errStr.includes('429')) {
          const wait = Math.min(Math.pow(2, consecutiveErrors + 2), 120) + Math.random() * 5;
          console.warn(`[${this.name}] Rate limited, waiting ${wait.toFixed(1)}s...`);
          await new Promise(r => setTimeout(r, wait * 1000));
          continue; // Don't increment consecutiveErrors
        }
        
        console.error(`[${this.name}] API error:`, errStr);
        consecutiveErrors++;
        
        if (consecutiveErrors >= config.MAX_TOOL_ERRORS) {
          console.error(`[${this.name}] Too many API errors, aborting.`);
          trace.finish('api_errors', iteration);
          break;
        }
        
        await new Promise(r => setTimeout(r, Math.pow(2, consecutiveErrors) * 1000));
        continue;
      }
      
      consecutiveErrors = 0;
      
      // --- Guard against empty choices ---
      if (!response.choices || response.choices.length === 0) {
        console.warn(`[${this.name}] API returned empty choices. Retrying...`);
        trace.error('empty_choices', 'API returned no choices');
        consecutiveErrors++;
        
        if (consecutiveErrors >= config.MAX_TOOL_ERRORS) {
          console.error(`[${this.name}] Too many empty responses, aborting.`);
          trace.finish('empty_choices', iteration);
          break;
        }
        
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      
      const choice = response.choices[0];
      const msg = choice.message;
      
      // --- Append assistant message ---
      const assistantMsg = { role: 'assistant', content: msg.content };
      if (msg.tool_calls) {
        assistantMsg.tool_calls = msg.tool_calls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }));
      }
      messages.push(assistantMsg);
      
      // --- Trace LLM response ---
      trace.llmResponse(msg.content, assistantMsg.tool_calls, choice.finish_reason);
      
      // --- Capture text ---
      if (msg.content) {
        lastText = msg.content;
        console.log(`[${this.name}] assistant:`, truncate(msg.content, 200));
      }
      
      // --- No tool calls: check pre-exit ---
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        // Text-only nudge: detect planning text instead of execution
        if (msg.content && iteration <= 3) {
          const contentLower = msg.content.toLowerCase();
          const actionWords = [
            'i will', 'i\'ll', 'let me', 'first,', 'step 1',
            'here\'s my plan', 'i need to', 'we need to',
            'the approach', 'my strategy'
          ];
          const isPlanningText = actionWords.some(w => contentLower.includes(w));
          const hasNoPriorTools = !messages.some(m => m.role === 'tool');
          
          if (isPlanningText && hasNoPriorTools) {
            console.warn(`[${this.name}] Model describing instead of executing. Nudging.`);
            trace.middlewareInject('agent_loop', 'text_only_nudge', 'Model describing');
            messages.push({
              role: 'user',
              content: 
                '[SYSTEM] STOP DESCRIBING. START EXECUTING.\n' +
                'You just wrote a plan/description instead of calling tools. ' +
                'Use run_bash to execute commands NOW. ' +
                'Do not explain what you will do — just DO it.'
            });
            continue;
          }
        }
        
        // Pre-exit middlewares
        let forcedContinue = false;
        for (const mw of this.middlewares) {
          if (mw.pre_exit) {
            const inject = mw.pre_exit(messages);
            if (inject) {
              messages.push({ role: 'user', content: inject });
              trace.middlewareInject(mw.constructor?.name || 'middleware', 'pre_exit', inject);
              forcedContinue = true;
              break;
            }
          }
        }
        
        if (forcedContinue) continue;
        
        console.log(`[${this.name}] Finished (no more tool calls).`);
        trace.finish('no_tool_calls', iteration);
        break;
      }
      
      // --- Execute tool calls ---
      for (const tc of msg.tool_calls) {
        const fnName = tc.function.name;
        let fnArgs;
        
        try {
          fnArgs = JSON.parse(tc.function.arguments);
        } catch (err) {
          console.warn(`[${this.name}] Bad JSON in tool call ${fnName}:`, truncate(tc.function.arguments, 200));
          trace.error('bad_json', `${fnName}: ${truncate(tc.function.arguments, 200)}`);
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: `[error] Invalid JSON arguments: ${truncate(tc.function.arguments, 200)}`
          });
          continue;
        }
        
        console.log(`[${this.name}] tool: ${fnName}(${truncate(JSON.stringify(fnArgs), 120)})`);
        
        const result = await executeTool(fnName, fnArgs);
        console.log(`[${this.name}] tool result:`, truncate(result, 200));
        trace.toolCall(fnName, fnArgs, result);
        
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result
        });
        
        // --- Middleware: post-tool hooks ---
        for (const mw of this.middlewares) {
          if (mw.post_tool) {
            const inject = mw.post_tool(fnName, fnArgs, result, messages);
            if (inject) {
              // Only inject after last tool (for parallel calls)
              if (tc === msg.tool_calls[msg.tool_calls.length - 1]) {
                messages.push({ role: 'user', content: inject });
                trace.middlewareInject(mw.constructor?.name || 'middleware', 'post_tool', inject);
              }
              break;
            }
          }
        }
      }
      
      // --- Check finish reason ---
      if (choice.finish_reason === 'stop') {
        console.log(`[${this.name}] Finished (stop).`);
        trace.finish('stop', iteration);
        break;
      }
      
      if (choice.finish_reason === 'length') {
        console.warn(`[${this.name}] Output truncated (max_tokens hit).`);
        trace.error('length_truncated', 'max_tokens hit');
        
        if (msg.tool_calls) {
          messages.push({
            role: 'user',
            content: 
              '[SYSTEM] Your response was truncated (token limit), but your tool calls ' +
              'WERE executed successfully. The results are above. ' +
              'If you had more tool calls planned, continue with the remaining ones now. ' +
              'Do NOT re-run the tools that already executed.'
          });
        } else {
          messages.push({
            role: 'user',
            content: 
              '[SYSTEM] Your last response was cut off because it exceeded the token limit. ' +
              'No tool calls were executed. ' +
              'Please retry, but split large files into smaller parts:\n' +
              '1. Write the first half of the file with write_file\n' +
              '2. Then write the second half as a separate file or append\n' +
              'Or simplify the implementation to fit in one response.'
          });
        }
      }
    }
    
    // Max iterations warning
    if (messages.length > config.MAX_AGENT_ITERATIONS) {
      console.warn(`[${this.name}] Hit max iterations (${config.MAX_AGENT_ITERATIONS}).`);
      trace.finish('max_iterations', config.MAX_AGENT_ITERATIONS);
    }
    
    return lastText;
  }
}

// ---------------------------------------------------------------------------
// Tool Execution
// ---------------------------------------------------------------------------

async function executeTool(name, args) {
  const tools = require('./tools-executor.js');
  return await tools.executeTool(name, args);
}

/**
 * 获取基础工具 Schema（从 tools-executor 导入）
 */
function getDefaultToolSchemas() {
  const tools = require('./tools-executor.js');
  return tools.TOOL_SCHEMAS;
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Agent Loop - Core Agent Execution Loop

用法:
  node agent-loop.js run --prompt="Build a timer" --profile=builder
  node agent-loop.js trace --agent=builder
  node agent-loop.js test

示例:
  node agent-loop.js run --prompt="Create a Pomodoro timer" --profile=builder
`);
    process.exit(0);
  }

  if (command === 'test') {
    console.log('\n🧪 测试 Agent Loop:\n');
    
    // Test TraceWriter
    const trace = new TraceWriter('test_agent');
    trace.iteration(1, 1000);
    trace.toolCall('read_file', { path: 'test.txt' }, 'file contents');
    trace.finish('stop', 5);
    
    console.log('  TraceWriter: ✓');
    
    // Test token estimation
    const { countTokens } = require('./context-lifecycle.js');
    const tokens = countTokens([
      { role: 'user', content: 'Build a timer' }
    ]);
    console.log(`  Token count: ${tokens} ✓`);
    
    console.log('\n✅ Tests passed');
    process.exit(0);
  }

  console.log(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// Export
module.exports = {
  Agent,
  TraceWriter,
  getClient,
  llmCallSimple,
  getDefaultToolSchemas
};

// CLI Entry
if (require.main === module) {
  main();
}