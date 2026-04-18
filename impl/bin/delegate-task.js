#!/usr/bin/env node
/**
 * Delegate Task - Sub-Agent 任务委派
 *
 * 来源：Harness Engineering - tools.py delegate_task()
 *
 * 功能：
 * - Spawn sub-agent in isolated context
 * - Execute task in clean context window
 * - Return only summary (max 8000 chars)
 * - Internal reasoning invisible to parent
 *
 * 用法：
 *   node delegate-task.js run <task_json>
 *   node delegate-task.js test
 */

const fs = require('fs');
const path = require('path');

// 导入 agent-core.js（Agent 类）
// 注意：agent-core.js 需要外部注入 llmClient
const HOME = process.env.HOME || '/Users/mar2game';
const WORKSPACE = process.env.HARNESS_WORKSPACE || `${HOME}/.openclaw/workspace/harness-projects`;
const PROJECT_ROOT = `${HOME}/.openclaw/workspace`;

// 配置
const MAX_SUBAGENT_ITERATIONS = parseInt(process.env.MAX_SUBAGENT_ITERATIONS || '20');
const SUBAGENT_TIMEOUT = parseInt(process.env.SUBAGENT_TIMEOUT || '120'); // seconds

/**
 * Delegate Task - 委派任务给 sub-agent
 */
async function delegateTask(args) {
  const { task, role = 'assistant' } = args;
  
  console.log(`[Delegate Task] Spawning sub-agent with role: ${role}`);
  console.log(`[Delegate Task] Task: ${task.slice(0, 100)}...`);
  
  // 简化版本：使用 llm-client 直接调用
  // 不使用完整 Agent 循环（避免递归）
  const { llmClient } = require('./llm-client');
  
  const TOOL_SCHEMAS = require('./tool-schemas.js').TOOL_SCHEMAS.slice(0, 6); // 只用基础工具（不包括 delegate_task）
  
  // Sub-agent system prompt
  const SUBAGENT_PROMPT = `You are a ${role} sub-agent. Your parent agent has delegated a task to you.

You have a CLEAN CONTEXT WINDOW - you do not see any of the parent's conversation history.

Your task: ${task}

Guidelines:
- Complete the task efficiently
- Use tools as needed
- Provide a clear, concise summary of your findings
- Do NOT include your internal reasoning process
- Maximum output length: 8000 characters

After completing, summarize your findings in a structured format.`;

  const messages = [
    { role: 'system', content: SUBAGENT_PROMPT },
    { role: 'user', content: task }
  ];
  
  try {
    // 调用 LLM（最多 5 轮）
    let iteration = 0;
    let lastResult = 'Sub-agent did not produce a final response.';
    
    while (iteration < 5) {
      const response = await llmClient({
        messages,
        tools: TOOL_SCHEMAS,
        parallel_tool_calls: false
      });
      
      const choice = response.choices[0];
      
      // 检查是否有 tool calls
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        // 执行工具（简化版本）
        const toolResults = await executeTools(choice.message.tool_calls);
        
        // 添加 assistant message 到 messages
        messages.push(choice.message);
        
        // 添加 tool 结果到 messages（OpenAI 格式要求 tool_call_id）
        for (let i = 0; i < choice.message.tool_calls.length; i++) {
          const call = choice.message.tool_calls[i];
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: toolResults[i]
          });
        }
        
        iteration++;
        continue;
      }
      
      // 没有 tool calls，结束
      lastResult = choice.message.content || '';
      break;
    }
    
    // 截断到 8000 字符
    const summary = lastResult.slice(0, 8000);
    
    console.log(`[Delegate Task] Sub-agent completed (${summary.length} chars)`);
    
    return summary;
    
  } catch (err) {
    console.error(`[Delegate Task] Error: ${err.message}`);
    return `[error] Sub-agent failed: ${err.message}`;
  }
}

/**
 * 执行工具调用（简化版本）
 */
async function executeTools(toolCalls) {
  const toolsExecutor = require('./tools-executor.js');
  
  const results = [];
  
  for (const call of toolCalls) {
    const fnName = call.function.name;
    const fnArgs = JSON.parse(call.function.arguments);
    
    console.log(`[Delegate Task] Executing tool: ${fnName}`);
    
    try {
      const result = await toolsExecutor.tools[fnName](fnArgs);
      results.push(result);
    } catch (err) {
      results.push(`[error] Tool ${fnName} failed: ${err.message}`);
    }
  }
  
  return results;
}

/**
 * CLI 入口
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'run') {
    const taskJson = args[1];
    if (!taskJson) {
      console.error('用法: node delegate-task.js run <task_json>');
      process.exit(1);
    }
    
    const task = JSON.parse(taskJson);
    const result = await delegateTask(task);
    console.log(result);
    
  } else if (command === 'test') {
    // 测试用例
    const testTask = {
      task: 'List all JavaScript files in impl/bin directory and count them',
      role: 'codebase_explorer'
    };
    
    console.log('=== 测试 delegate_task ===');
    const result = await delegateTask(testTask);
    console.log('\n=== 结果 ===');
    console.log(result);
    
  } else {
    console.error('用法:');
    console.error('  node delegate-task.js run <task_json>');
    console.error('  node delegate-task.js test');
    process.exit(1);
  }
}

// Export
module.exports = {
  delegateTask
};

// Run CLI if called directly
if (require.main === module) {
  main();
}