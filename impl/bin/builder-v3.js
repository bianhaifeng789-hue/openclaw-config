#!/usr/bin/env node
/**
 * Builder Agent V3 - 真实 LLM 集成版本
 *
 * 来源：Harness Engineering - harness.py Builder + agents.py Agent.run()
 *
 * 功能：
 * - 使用真实 LLM API（lucen.cc/v1, gpt-5.4）
 * - Agent Core while 循环
 * - parallel_tool_calls 支持
 * - middleware 集成
 * - 上下文生命周期管理
 *
 * 用法：
 *   node builder-v3.js --prompt "Build a Pomodoro timer" --workspace /path/to/project
 */

const fs = require('fs');
const path = require('path');
const { Agent } = require('./agent-core');
const { TOOL_SCHEMAS, executeTool } = require('./tools-executor');
const { llmClient, llmCallSimple, config } = require('./llm-client');
const {
  LoopDetectionMiddleware,
  TimeBudgetMiddleware,
  TaskTrackingMiddleware,
  AnxietyDetectionMiddleware,
  PreExitGateMiddleware,
  SkeletonDetectionMiddleware,
  ErrorGuidanceMiddleware
} = require('./agent-middlewares');

const HOME = process.env.HOME || '/Users/mar2game';
const DEFAULT_WORKSPACE = `${HOME}/.openclaw/workspace/harness-projects`;

/**
 * Builder System Prompt
 */
const BUILDER_SYSTEM_PROMPT = `
You are an expert full-stack developer. Your PRIMARY job is to write code using the write_file tool.

CRITICAL: You MUST create actual source code files. Reading specs is not enough — \
you must write_file to create .html, .css, .js, .py, .tsx files etc. \
If you finish without creating any source code files, you have FAILED.

Step-by-step workflow:
1. Read spec.md to understand what to build.
2. Read contract.md to see the acceptance criteria.
3. If feedback.md exists, read it and address every issue.
4. WRITE CODE: Use write_file to create every source file needed. \
   Write real, complete, working code — no stubs, no placeholders, no TODO comments.
5. Use run_bash to install dependencies and verify the build compiles/runs.
6. Use run_bash to commit with git: git add -A && git commit -m "description"

You have these tools: read_file, read_skill_file, write_file, edit_file, list_files, run_bash, delegate_task, web_search, web_fetch.
Work inside the current directory. All files you create will persist.
`;

/**
 * 运行 Builder Agent V3（真实 LLM）
 */
async function runBuilderV3(userPrompt, workspace) {
  console.log('================================');
  console.log('🔧 Builder Agent V3 (真实 LLM)');
  console.log('================================');
  console.log('');
  console.log('User Prompt:', userPrompt);
  console.log('Workspace:', workspace);
  console.log('Model:', config.model);
  console.log('');

  // 创建 workspace 目录
  if (!fs.existsSync(workspace)) {
    fs.mkdirSync(workspace, { recursive: true });
  }

  // 创建 middlewares
  const middlewares = [
    new LoopDetectionMiddleware(),
    new TimeBudgetMiddleware(30 * 60 * 1000), // 30分钟预算
    new TaskTrackingMiddleware(workspace),
    new AnxietyDetectionMiddleware(),
    new PreExitGateMiddleware(),
    new SkeletonDetectionMiddleware(workspace),
    new ErrorGuidanceMiddleware()
  ];

  // 创建 TraceWriter
  const traceWriter = createTraceWriter(workspace, 'builder');

  // 创建 Agent 实例（注入真实 LLM Client）
  const agent = new Agent('builder', BUILDER_SYSTEM_PROMPT, TOOL_SCHEMAS, middlewares, {
    maxIterations: 60,
    role: 'builder', // 角色差异化压缩（保留 20%）
    llmClient: llmClient, // ← 关键：注入真实 LLM Client
    traceWriter,
    toolExecutor: (fnName, fnArgs) => executeTool(fnName, fnArgs)
  });

  // 运行 Agent 循环
  console.log('Starting Agent loop...');
  const result = await agent.run(userPrompt);

  console.log('');
  console.log('✅ Builder Agent finished');
  console.log('Result:', result.slice(0, 500) + '...');

  // 列出生成的文件
  const files = fs.readdirSync(workspace).filter(f => !f.startsWith('_'));
  console.log('');
  console.log('Generated files:', files);

  return {
    success: true,
    result,
    workspace,
    files,
    model: config.model
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
  const workspace = workspaceArg ? workspaceArg.split('=')[1] : `${DEFAULT_WORKSPACE}/test-pomodoro`;

  const result = await runBuilderV3(userPrompt, workspace);

  console.log('');
  console.log('=== Result ===');
  console.log(JSON.stringify(result, null, 2));
}

// Export
module.exports = { runBuilderV3, BUILDER_SYSTEM_PROMPT };

// Run CLI
if (require.main === module) {
  main();
}