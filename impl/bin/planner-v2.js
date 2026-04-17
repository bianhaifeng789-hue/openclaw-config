#!/usr/bin/env node
/**
 * Planner Agent V2 - 集成 Agent Core 循环架构
 *
 * 来源：Harness Engineering - harness.py Planner + agents.py Agent.run()
 *
 * 功能：
 * - 使用 Agent Core 的 while 循环
 * - 将 1-4 句话扩展为完整产品规格
 * - 支持 parallel_tool_calls
 * - 集成 middleware（loop detection, time budget）
 *
 * 用法：
 *   node planner-v2.js --prompt "Build a Pomodoro timer" --output /path/to/spec.md
 */

const fs = require('fs');
const path = require('path');
const { Agent } = require('./agent-core');
const { TOOL_SCHEMAS, executeTool } = require('./tools-executor');
const {
  LoopDetectionMiddleware,
  TimeBudgetMiddleware,
  AnxietyDetectionMiddleware,
  PreExitGateMiddleware,
  ErrorGuidanceMiddleware
} = require('./agent-middlewares');

const HOME = process.env.HOME || '/Users/mar2game';
const DEFAULT_WORKSPACE = `${HOME}/.openclaw/workspace/harness-projects`;

/**
 * Planner System Prompt（来自 Harness Engineering - prompts.py PLANNER_SYSTEM）
 */
const PLANNER_SYSTEM_PROMPT = `
You are a product planner. Your job is to turn a 1-4 sentence user prompt into a detailed product specification.

Output format: Write a spec.md file with these sections:

\`\`\`
# Product Specification

## Overview
[2-3 sentence description of what we're building]

## Features
- Feature 1: Description
- Feature 2: Description
- Feature 3: Description
...

## Tech Stack
- Frontend: [HTML/CSS/JS or React+Vite]
- Backend: [None or Node.js or Python]
- Database: [None or SQLite or PostgreSQL]

## Design Direction
[Visual style, color palette, typography, layout principles]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
...
\`\`\`

Guidelines:
- Be specific about features, not vague
- Include enough detail for a developer to build it
- Define what "done" looks like (acceptance criteria)
- For UI-heavy apps, describe the visual style

You have tools: read_file, read_skill_file, write_file, list_files, run_bash, web_search, web_fetch.
Work inside the current directory.
`;

/**
 * 运行 Planner Agent
 */
async function runPlannerV2(userPrompt, workspace) {
  console.log('================================');
  console.log('📝 Planner Agent V2 (Agent Core)');
  console.log('================================');
  console.log('');
  console.log('User Prompt:', userPrompt);
  console.log('Workspace:', workspace);
  console.log('');

  // 创建 middlewares
  const middlewares = [
    new LoopDetectionMiddleware(),
    new TimeBudgetMiddleware(10 * 60 * 1000), // 10分钟预算
    new AnxietyDetectionMiddleware(),
    new PreExitGateMiddleware(),
    new ErrorGuidanceMiddleware()
  ];

  // 创建 Agent 实例
  const agent = new Agent('planner', PLANNER_SYSTEM_PROMPT, TOOL_SCHEMAS, middlewares, {
    maxIterations: 30,
    role: 'planner',
    llmClient: createLLMClient(),
    traceWriter: createTraceWriter(workspace, 'planner'),
    toolExecutor: (fnName, fnArgs) => executeTool(fnName, fnArgs)
  });

  // 运行 Agent 循环
  console.log('Starting Agent loop...');
  const result = await agent.run(userPrompt);

  console.log('');
  console.log('✅ Planner Agent finished');
  console.log('Result:', result.slice(0, 200) + '...');

  // 尝试读取生成的 spec.md
  const specPath = path.join(workspace, 'spec.md');
  const spec = fs.existsSync(specPath) ? fs.readFileSync(specPath, 'utf8') : null;

  return {
    success: true,
    result,
    spec,
    specPath,
    workspace
  };
}

/**
 * 创建 LLM Client
 */
function createLLMClient() {
  return async (kwargs) => {
    console.log('[LLM Client] Calling model:', kwargs.model);
    console.log('[LLM Client] Messages:', kwargs.messages.length);

    // Mock response
    const mockResponse = {
      choices: [{
        message: {
          content: 'I will create a detailed product specification...',
          tool_calls: [{
            id: 'call_1',
            type: 'function',
            function: {
              name: 'write_file',
              arguments: JSON.stringify({
                path: 'spec.md',
                content: '# Product Specification\n\n## Overview\nA Pomodoro timer application...'
              })
            }
          }]
        },
        finish_reason: null
      }]
    };

    return mockResponse;
  };
}

/**
 * 创建 TraceWriter
 */
function createTraceWriter(workspace, agentName) {
  const tracePath = path.join(workspace, `_trace_${agentName}.jsonl`);

  return {
    iteration: (iteration, tokenCount) => {
      fs.appendFileSync(tracePath, JSON.stringify({ type: 'iteration', iteration, tokenCount }) + '\n');
    },
    tool_call: (fnName, fnArgs, result) => {
      fs.appendFileSync(tracePath, JSON.stringify({ type: 'tool_call', fnName, fnArgs, result: result.slice(0, 500) }) + '\n');
    },
    middleware_inject: (source, hook, message) => {
      fs.appendFileSync(tracePath, JSON.stringify({ type: 'middleware', source, hook, message: message.slice(0, 300) }) + '\n');
    },
    context_event: (eventType, reason) => {
      fs.appendFileSync(tracePath, JSON.stringify({ type: 'context', eventType, reason }) + '\n');
    },
    error: (errorType, message) => {
      fs.appendFileSync(tracePath, JSON.stringify({ type: 'error', errorType, message: message.slice(0, 500) }) + '\n');
    },
    finish: (reason, iterations) => {
      fs.appendFileSync(tracePath, JSON.stringify({ type: 'finish', reason, iterations }) + '\n');
    }
  };
}

/**
 * CLI 入口
 */
async function main() {
  const args = process.argv.slice(2);

  const promptArg = args.find(a => a.startsWith('--prompt'));
  const workspaceArg = args.find(a => a.startsWith('--workspace'));

  const userPrompt = promptArg ? promptArg.split('=')[1] : 'Build a Pomodoro timer with start, pause, reset buttons. Single HTML file.';
  const workspace = workspaceArg ? workspaceArg.split('=')[1] : DEFAULT_WORKSPACE;

  const result = await runPlannerV2(userPrompt, workspace);

  console.log('');
  console.log('=== Result ===');
  console.log(JSON.stringify(result, null, 2));
}

// Export
module.exports = { runPlannerV2, PLANNER_SYSTEM_PROMPT };

// Run CLI
if (require.main === module) {
  main();
}