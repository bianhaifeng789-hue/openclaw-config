#!/usr/bin/env node
/**
 * Builder Agent V2 - 集成 Agent Core 循环架构
 *
 * 来源：Harness Engineering - harness.py Builder + agents.py Agent.run()
 *
 * 功能：
 * - 使用 Agent Core 的 while 循环
 * - 支持 parallel_tool_calls
 * - 支持 text_only_nudge
 * - 支持 REFINE/PIVOT 策略
 * - 集成 middleware（loop detection, time budget, task tracking）
 *
 * 用法：
 *   node builder-v2.js --workspace /path/to/project --round 1
 *   node builder-v2.js --workspace /path/to/project --round 2 --strategy REFINE
 */

const fs = require('fs');
const path = require('path');
const { Agent } = require('./agent-core');
const { TOOL_SCHEMAS, executeTool } = require('./tools-executor');
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
 * Builder System Prompt（来自 Harness Engineering - prompts.py BUILDER_SYSTEM）
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

After each QA round, decide: REFINE (keep improving) or PIVOT (start fresh with a different approach).

Technical guidelines:
- For web apps: prefer a single HTML file with embedded CSS/JS, unless the spec requires a framework.
- If a framework is needed, use React+Vite.
- Make the UI polished — follow the design direction in the spec.

You have these tools: read_file, read_skill_file, write_file, edit_file, list_files, run_bash, delegate_task, web_search, web_fetch.
Work inside the current directory. All files you create will persist.
`;

/**
 * 运行 Builder Agent
 */
async function runBuilderV2(workspace, roundNum, strategy = 'REFINE', feedbackPath = null) {
  console.log('================================');
  console.log('🔧 Builder Agent V2 (Agent Core)');
  console.log('================================');
  console.log('');
  console.log('Workspace:', workspace);
  console.log('Round:', roundNum);
  console.log('Strategy:', strategy);
  console.log('');

  // 读取必要文件
  const specPath = path.join(workspace, 'spec.md');
  const contractPath = path.join(workspace, 'contract.md');
  
  if (!fs.existsSync(specPath)) {
    console.log('❌ spec.md not found. Run planner.js first.');
    return { success: false, error: 'NO_SPEC' };
  }

  const spec = fs.readFileSync(specPath, 'utf8');
  const contract = fs.existsSync(contractPath) ? fs.readFileSync(contractPath, 'utf8') : null;
  const feedback = feedbackPath && fs.existsSync(feedbackPath) ? fs.readFileSync(feedbackPath, 'utf8') : null;

  // 生成构建任务提示
  const buildPrompt = generateBuildPrompt(spec, contract, feedback, roundNum, strategy, workspace);
  
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

  // 创建 Agent 实例
  const agent = new Agent('builder', BUILDER_SYSTEM_PROMPT, TOOL_SCHEMAS, middlewares, {
    maxIterations: 60,
    role: 'builder', // 角色差异化压缩（保留 20%）
    llmClient: createLLMClient(),
    traceWriter: createTraceWriter(workspace, 'builder'),
    toolExecutor: (fnName, fnArgs) => executeTool(fnName, fnArgs)
  });

  // 运行 Agent 循环
  console.log('Starting Agent loop...');
  const result = await agent.run(buildPrompt);
  
  console.log('');
  console.log('✅ Builder Agent finished');
  console.log('Result:', result.slice(0, 200) + '...');

  return {
    success: true,
    result,
    workspace,
    roundNum,
    strategy
  };
}

/**
 * 生成构建任务提示（来自 Harness Engineering - harness.py）
 */
function generateBuildPrompt(spec, contract, feedback, roundNum, strategy, workspace) {
  let prompt = `You are the Builder for Round ${roundNum}.

Strategy: ${strategy}
${strategy === 'PIVOT' ? 'Scores are declining. Consider a different approach.\n' : 'Scores are improving. Continue refining.\n'}

Read:
- spec.md: Product specification (below)
${contract ? '- contract.md: Acceptance criteria\n' : ''}
${feedback ? '- feedback.md: QA feedback from previous round\nAddress every issue listed.\n' : ''}

=== spec.md ===
${spec}

`;

  if (contract) {
    prompt += `\n=== contract.md ===\n${contract}\n\n`;
  }

  if (feedback) {
    prompt += `\n=== feedback.md ===\n${feedback}\n\n`;
  }

  prompt += `CRITICAL: You MUST create actual source code files.
Write real, complete, working code — no stubs, no placeholders, no TODO.

After creating files:
1. Install dependencies
2. Verify build compiles/runs
3. Git commit

Work inside: ${workspace}`;

  return prompt;
}

/**
 * 创建 LLM Client（需要外部配置）
 */
function createLLMClient() {
  // 返回一个 async function，接受 kwargs 参数
  return async (kwargs) => {
    // 这里需要集成实际的 LLM API 调用
    // 简化版本：返回 mock response
    
    console.log('[LLM Client] Calling model:', kwargs.model);
    console.log('[LLM Client] Messages:', kwargs.messages.length);
    
    // 如果有外部配置的 LLM client，使用它
    // 否则返回 mock response（用于测试）
    
    const mockResponse = {
      choices: [{
        message: {
          content: 'I will start by reading the spec...',
          tool_calls: [{
            id: 'call_1',
            type: 'function',
            function: {
              name: 'read_file',
              arguments: JSON.stringify({ path: 'spec.md' })
            }
          }]
        },
        finish_reason: null
      }]
    };
    
    // 实际集成时需要调用 OpenAI API 或其他 LLM provider
    // const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // return await client.chat.completions.create(kwargs);
    
    return mockResponse;
  };
}

/**
 * 创建 TraceWriter（简化版）
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
  
  // 解析参数
  const workspaceArg = args.find(a => a.startsWith('--workspace'));
  const roundArg = args.find(a => a.startsWith('--round'));
  const strategyArg = args.find(a => a.startsWith('--strategy'));
  const feedbackArg = args.find(a => a.startsWith('--feedback'));
  
  const workspace = workspaceArg ? workspaceArg.split('=')[1] : DEFAULT_WORKSPACE;
  const roundNum = roundArg ? parseInt(roundArg.split('=')[1]) : 1;
  const strategy = strategyArg ? strategyArg.split('=')[1] : 'REFINE';
  const feedbackPath = feedbackArg ? feedbackArg.split('=')[1] : null;
  
  const result = await runBuilderV2(workspace, roundNum, strategy, feedbackPath);
  
  console.log('');
  console.log('=== Result ===');
  console.log(JSON.stringify(result, null, 2));
}

// Export
module.exports = { runBuilderV2, BUILDER_SYSTEM_PROMPT };

// Run CLI
if (require.main === module) {
  main();
}