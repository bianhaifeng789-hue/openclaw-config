#!/usr/bin/env node
/**
 * Agent Core - 核心 Agent 循环架构
 *
 * 来源：Harness Engineering - agents.py Agent.run()
 *
 * 核心功能：
 * - while 循环（llm.call → tool → context check → repeat）
 * - parallel_tool_calls 支持
 * - text_only_nudge 检测
 * - middleware 集成（per_iteration, pre_exit, post_tool）
 * - 上下文生命周期管理（compact/reset）
 *
 * 用法：
 *   const agent = new Agent('builder', BUILDER_PROMPT, TOOL_SCHEMAS, middlewares);
 *   const result = await agent.run('Build a Pomodoro timer');
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/Users/mar2game';
const WORKSPACE = process.env.HARNESS_WORKSPACE || `${HOME}/.openclaw/workspace/harness-projects`;

// 配置（来自 Harness Engineering - config.py）
const MAX_AGENT_ITERATIONS = parseInt(process.env.MAX_AGENT_ITERATIONS || '60');
const COMPRESS_THRESHOLD = parseInt(process.env.COMPRESS_THRESHOLD || '80000');
const RESET_THRESHOLD = parseInt(process.env.RESET_THRESHOLD || '150000');
const MAX_TOOL_ERRORS = parseInt(process.env.MAX_TOOL_ERRORS || '10');

// Text-only nudge 检测关键词
const ACTION_WORDS = [
  'i will', 'i\'ll', 'let me', 'first,', 'step 1',
  'here\'s my plan', 'i need to', 'we need to',
  'the approach', 'my strategy',
  '我将', '让我', '第一步', '我的计划', '我需要'
];

/**
 * Agent 类 - 核心 while 循环架构
 */
class Agent {
  /**
   * 创建 Agent 实例
   * @param {string} name - Agent 名称（planner/builder/evaluator）
   * @param {string} systemPrompt - System prompt
   * @param {Array} tools - Tool schemas（OpenAI function-calling format）
   * @param {Array} middlewares - Middleware 实例（per_iteration, pre_exit, post_tool）
   * @param {Object} options - 配置选项
   */
  constructor(name, systemPrompt, tools = [], middlewares = [], options = {}) {
    this.name = name;
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.middlewares = middlewares;
    this.maxIterations = options.maxIterations || MAX_AGENT_ITERATIONS;
    this.llmClient = options.llmClient || null; // 外部注入 LLM client
    this.traceWriter = options.traceWriter || null; // 外部注入 TraceWriter
    this.role = options.role || name; // 用于角色差异化压缩
  }

  /**
   * 执行 Agent 循环
   * @param {string} task - 任务描述
   * @returns {string} 最终响应文本
   */
  async run(task) {
    console.log(`[${this.name}] Starting agent loop...`);
    console.log(`[${this.name}] Task: ${task.slice(0, 100)}...`);

    // 初始化消息列表
    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: task }
    ];

    let consecutiveErrors = 0;
    let lastText = '';
    let iteration = 0;

    // 核心 while 循环
    for (iteration = 1; iteration <= this.maxIterations; iteration++) {
      // --- Middleware: per_iteration hooks ---
      for (const mw of this.middlewares) {
        if (mw.per_iteration) {
          const inject = mw.per_iteration(iteration, messages);
          if (inject) {
            messages.push({ role: 'user', content: inject });
            if (this.traceWriter) {
              this.traceWriter.middleware_inject(mw.constructor.name, 'per_iteration', inject);
            }
          }
        }
      }

      // --- Context lifecycle check ---
      const tokenCount = this._estimateTokens(messages);
      console.log(`[${this.name}] iteration=${iteration}  tokens≈${tokenCount}`);
      
      if (this.traceWriter) {
        this.traceWriter.iteration(iteration, tokenCount);
      }

      // 检查是否需要 reset（焦虑检测或 token 超限）
      const needsReset = tokenCount > RESET_THRESHOLD || this._detectAnxiety(messages);
      
      if (needsReset) {
        const reason = tokenCount <= RESET_THRESHOLD ? 'anxiety detected' : `tokens ${tokenCount} > threshold`;
        console.log(`[${this.name}] Context reset triggered (${reason}). Writing checkpoint...`);
        
        if (this.traceWriter) {
          this.traceWriter.context_event('reset', reason);
        }
        
        // 写 checkpoint 并恢复
        const checkpoint = this._createCheckpoint(messages);
        messages.length = 0;
        messages.push(...this._restoreFromCheckpoint(checkpoint, this.systemPrompt));
        
      } else if (tokenCount > COMPRESS_THRESHOLD) {
        // 检查是否需要 compact
        console.log(`[${this.name}] Compacting context (role=${this.role})...`);
        
        if (this.traceWriter) {
          this.traceWriter.context_event('compact', `tokens=${tokenCount}`);
        }
        
        // 执行压缩
        const compacted = await this._compactMessages(messages, this.role);
        messages.length = 0;
        messages.push(...compacted);
      }

      // --- LLM call ---
      const kwargs = {
        model: process.env.HARNESS_MODEL || 'gpt-4o',
        messages,
        max_tokens: 16384
      };

      // 添加 tools（如果启用）
      if (this.tools.length > 0) {
        kwargs.tools = this.tools;
        kwargs.tool_choice = 'auto';
        // 关键：parallel_tool_calls
        kwargs.parallel_tool_calls = true;
      }

      // 调用 LLM
      try {
        const response = await this._llmCall(kwargs);
        
        // --- Guard against empty choices ---
        if (!response.choices || response.choices.length === 0) {
          console.log(`[${this.name}] API returned empty choices. Retrying...`);
          
          if (this.traceWriter) {
            this.traceWriter.error('empty_choices', 'API returned no choices');
          }
          
          consecutiveErrors++;
          if (consecutiveErrors >= MAX_TOOL_ERRORS) {
            console.log(`[${this.name}] Too many empty responses, aborting.`);
            if (this.traceWriter) {
              this.traceWriter.finish('empty_choices', iteration);
            }
            break;
          }
          
          await this._sleep(2000);
          continue;
        }

        consecutiveErrors = 0;

        const choice = response.choices[0];
        const msg = choice.message;

        // --- Append assistant message to history ---
        const assistantMsg = { role: 'assistant', content: msg.content };
        
        if (msg.tool_calls && msg.tool_calls.length > 0) {
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

        // --- Trace the LLM response ---
        if (this.traceWriter) {
          this.traceWriter.llm_response(msg.content, assistantMsg.tool_calls, choice.finish_reason);
        }

        // --- If model produced text, capture it ---
        if (msg.content) {
          lastText = msg.content;
          console.log(`[${this.name}] assistant: ${msg.content.slice(0, 200)}...`);
        }

        // --- If no tool calls, check pre-exit middlewares ---
        if (!msg.tool_calls || msg.tool_calls.length === 0) {
          // text_only_nudge 检测（前3次迭代）
          if (msg.content && iteration <= 3) {
            const contentLower = msg.content.toLowerCase();
            const matchedWords = ACTION_WORDS.filter(w => contentLower.includes(w));
            const isPlanningText = matchedWords.length > 0;
            const hasPriorTools = messages.some(m => m.role === 'tool');
            
            if (isPlanningText && !hasPriorTools) {
              console.log(`[${this.name}] Model is describing instead of executing. Nudging.`);
              
              if (this.traceWriter) {
                this.traceWriter.middleware_inject('agent_loop', 'text_only_nudge', 
                  'Model describing instead of executing');
              }
              
              messages.push({
                role: 'user',
                content: `[SYSTEM] STOP DESCRIBING. START EXECUTING.
You just wrote a plan/description instead of calling tools.
Use run_bash to execute commands NOW.
Do not explain what you will do — just DO it.`
              });
              
              continue; // 强制继续
            }
          }

          // Middleware: pre_exit hooks
          let forcedContinue = false;
          for (const mw of this.middlewares) {
            if (mw.pre_exit) {
              const inject = mw.pre_exit(messages);
              if (inject) {
                messages.push({ role: 'user', content: inject });
                
                if (this.traceWriter) {
                  this.traceWriter.middleware_inject(mw.constructor.name, 'pre_exit', inject);
                }
                
                forcedContinue = true;
                break;
              }
            }
          }
          
          if (forcedContinue) {
            continue;
          }
          
          // 真正结束
          console.log(`[${this.name}] Finished (no more tool calls).`);
          
          if (this.traceWriter) {
            this.traceWriter.finish('no_tool_calls', iteration);
          }
          
          break;
        }

        // --- Execute tool calls ---
        for (const tc of msg.tool_calls) {
          const fnName = tc.function.name;
          
          try {
            const fnArgs = JSON.parse(tc.function.arguments);
          } catch (err) {
            console.log(`[${this.name}] Bad JSON in tool call ${fnName}: ${tc.function.arguments.slice(0, 200)}`);
            
            if (this.traceWriter) {
              this.traceWriter.error('bad_json', `${fnName}: ${tc.function.arguments.slice(0, 200)}`);
            }
            
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: `[error] Invalid JSON arguments: ${tc.function.arguments.slice(0, 200)}`
            });
            
            continue;
          }

          const fnArgs = JSON.parse(tc.function.arguments);
          console.log(`[${this.name}] tool: ${fnName}(${this._truncate(JSON.stringify(fnArgs), 120)})`);
          
          // 执行工具
          const result = await this._executeTool(fnName, fnArgs);
          console.log(`[${this.name}] tool result: ${this._truncate(result, 200)}`);
          
          if (this.traceWriter) {
            this.traceWriter.tool_call(fnName, fnArgs, result);
          }

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
                // 只在最后一个工具执行后注入（避免打断 tool_call/tool_result 序列）
                if (tc === msg.tool_calls[msg.tool_calls.length - 1]) {
                  messages.push({ role: 'user', content: inject });
                  
                  if (this.traceWriter) {
                    this.traceWriter.middleware_inject(mw.constructor.name, 'post_tool', inject);
                  }
                  
                  break;
                }
              }
            }
          }
        }

        // --- Check finish reason ---
        if (choice.finish_reason === 'stop') {
          console.log(`[${this.name}] Finished (stop).`);
          
          if (this.traceWriter) {
            this.traceWriter.finish('stop', iteration);
          }
          
          break;
        }

      } catch (err) {
        const errStr = err.message || String(err);
        
        if (this.traceWriter) {
          this.traceWriter.error('api_error', errStr);
        }

        // Rate limit 处理
        if (errStr.toLowerCase().includes('rate_limit') || errStr.includes('429')) {
          const wait = Math.min(Math.pow(2, consecutiveErrors + 2), 120) + Math.random() * 5;
          console.log(`[${this.name}] Rate limited, waiting ${wait.toFixed(1)}s...`);
          await this._sleep(wait * 1000);
          continue; // 不计入 consecutiveErrors
        }

        console.log(`[${this.name}] API error: ${errStr}`);
        consecutiveErrors++;
        
        if (consecutiveErrors >= MAX_TOOL_ERRORS) {
          console.log(`[${this.name}] Too many API errors, aborting.`);
          
          if (this.traceWriter) {
            this.traceWriter.finish('api_errors', iteration);
          }
          
          break;
        }
        
        await this._sleep(Math.pow(2, consecutiveErrors) * 1000);
        continue;
      }
    }

    console.log(`[${this.name}] Agent loop finished after ${iteration} iterations.`);
    return lastText;
  }

  // --- 内部方法 ---
  
  /**
   * 估算 token 数量（简化版）
   */
  _estimateTokens(messages) {
    let totalChars = 0;
    for (const msg of messages) {
      totalChars += (msg.content || '').length;
      if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          totalChars += (tc.function.arguments || '').length;
        }
      }
    }
    // 简化估算：1 token ≈ 4 chars (英文)，CJK ≈ 1 char/token
    return Math.ceil(totalChars / 4);
  }

  /**
   * 检测焦虑信号
   */
  _detectAnxiety(messages) {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant') return false;
    
    const content = (lastMsg.content || '').toLowerCase();
    const patterns = [
      'let me wrap up',
      'running (low on|out of) (context|space|tokens)',
      'that should be (enough|sufficient)',
      'wrapping up',
      '总结一下',
      '最后一步'
    ];
    
    return patterns.some(p => {
      try {
        return new RegExp(p, 'i').test(content);
      } catch (e) {
        return content.includes(p);
      }
    });
  }

  /**
   * 创建 checkpoint
   */
  _createCheckpoint(messages) {
    // 提取关键信息：最后的 assistant 文本 + 工具调用摘要
    const checkpoint = {
      timestamp: Date.now(),
      lastAssistantText: '',
      toolCallsSummary: [],
      filesCreated: [],
      filesModified: []
    };

    // 找到最后一条 assistant 文本
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].content) {
        checkpoint.lastAssistantText = messages[i].content;
        break;
      }
    }

    // 提取工具调用摘要
    for (const msg of messages) {
      if (msg.role === 'assistant' && msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          const fnName = tc.function.name;
          try {
            const args = JSON.parse(tc.function.arguments);
            checkpoint.toolCallsSummary.push({ fnName, args });
            
            // 提取文件操作
            if (fnName === 'write_file' && args.path) {
              checkpoint.filesCreated.push(args.path);
            }
            if (fnName === 'edit_file' && args.path) {
              checkpoint.filesModified.push(args.path);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    return checkpoint;
  }

  /**
   * 从 checkpoint 恢复
   */
  _restoreFromCheckpoint(checkpoint, systemPrompt) {
    const restored = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `[CONTEXT RESET] Previous context exceeded limits.

What you've done so far:
- Files created: ${checkpoint.filesCreated.join(', ') || '(none)'}
- Files modified: ${checkpoint.filesModified.join(', ') || '(none)'}
- Last action: ${checkpoint.lastAssistantText.slice(0, 500) || '(none)'}

Continue from here. Do NOT re-explain what you've done — just continue.` }
    ];
    
    return restored;
  }

  /**
   * 压缩消息（角色差异化）
   */
  async _compactMessages(messages, role) {
    // 角色差异化压缩比例
    const retentionPercent = {
      'evaluator': 0.5,  // 保留 50%（需要跨轮对比质量趋势）
      'builder': 0.2,    // 保留 20%（只留架构决策和最新错误）
      'default': 0.3     // 保留 30%（通用策略）
    };

    const percent = retentionPercent[role] || retentionPercent['default'];
    const keepCount = Math.ceil(messages.length * percent);

    // 简化压缩：保留 system + 最近的 N 条消息
    const compacted = [];
    
    // 始终保留 system prompt
    if (messages[0] && messages[0].role === 'system') {
      compacted.push(messages[0]);
    }

    // 保留最近的消息
    const recentMessages = messages.slice(-keepCount);
    
    // 添加摘要前缀
    const summaryPrefix = {
      role: 'user',
      content: `[CONTEXT COMPACTED] Earlier context summarized. Key points preserved.`
    };
    
    compacted.push(summaryPrefix);
    compacted.push(...recentMessages);

    return compacted;
  }

  /**
   * LLM 调用（需要外部注入 client）
   */
  async _llmCall(kwargs) {
    if (this.llmClient) {
      return await this.llmClient(kwargs);
    }
    
    // 如果没有注入 client，返回模拟响应（用于测试）
    console.log(`[${this.name}] Warning: No LLM client injected. Returning mock response.`);
    return {
      choices: [{
        message: { content: '[mock response]', tool_calls: null },
        finish_reason: 'stop'
      }]
    };
  }

  /**
   * 执行工具（需要外部注入 tool executor）
   */
  async _executeTool(fnName, fnArgs) {
    // 如果有外部注入的工具执行器，使用它
    if (this.toolExecutor) {
      return await this.toolExecutor(fnName, fnArgs);
    }
    
    // 否则返回模拟结果（用于测试）
    return `[mock tool result for ${fnName}]`;
  }

  /**
   * 截断文本
   */
  _truncate(text, limit) {
    if (!text) return '';
    return text.length > limit ? text.slice(0, limit) + '...' : text;
  }

  /**
   * 等待
   */
  async _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export
module.exports = { Agent, ACTION_WORDS, MAX_AGENT_ITERATIONS, COMPRESS_THRESHOLD, RESET_THRESHOLD };