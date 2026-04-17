#!/usr/bin/env node
/**
 * Evaluator Agent V2 - 集成 Agent Core 循环架构
 *
 * 来源：Harness Engineering - harness.py Evaluator + agents.py Agent.run()
 *
 * 功能：
 * - 使用 Agent Core 的 while 循环
 * - 支持 Playwright 浏览器测试
 * - 支持 parallel_tool_calls
 * - 集成 middleware（loop detection, time budget）
 * - 角色差异化压缩（保留 50%）
 *
 * 用法：
 *   node evaluator-v2.js --workspace /path/to/project --round 1
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
 * Evaluator System Prompt（来自 Harness Engineering - prompts.py EVALUATOR_SYSTEM）
 */
const EVALUATOR_SYSTEM_PROMPT = `
You are a QA engineer and product reviewer. Your job is to thoroughly test the application and write a detailed feedback.md file with scores and issues.

Testing workflow:
1. Use browser_test to launch the app and interact with it
2. Test every feature mentioned in spec.md and contract.md
3. Look for bugs, UI issues, missing features
4. Write feedback.md with sections: Design Quality, Originality, Craft, Functionality
5. Each section gets a score 1-10 and specific notes

Scoring criteria (from Anthropic article):
- Design Quality (HIGH): Visual identity, not AI slop (purple gradient + white cards)
- Originality (HIGH): Custom design decisions, not default AI aesthetic
- Craft (MEDIUM): Typography, spacing, color harmony
- Functionality (HIGH): Every feature actually works

After testing, write feedback.md with this format:
\`\`\`
# QA Feedback - Round {round_num}

## Scores
- Design Quality: X/10
- Originality: X/10
- Craft: X/10
- Functionality: X/10

## Overall Score: X/10

## Issues Found
1. [CRITICAL] Issue description...
2. [MINOR] Issue description...

## Recommendations
- Recommendation 1...
- Recommendation 2...
\`\`\`

You have tools: read_file, read_skill_file, write_file, list_files, run_bash, browser_test, stop_dev_server, web_search, web_fetch.
`;

/**
 * Browser Test Tool Schema（Evaluator 专属）
 */
const BROWSER_TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'browser_test',
      description: 'Launch a headless Chromium browser to test the running application. Navigates to a URL, performs UI actions, captures console errors, and takes a screenshot.',
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
          screenshot: { type: 'boolean', description: 'Take a screenshot after actions (default: true)', default: true },
          start_command: { type: 'string', description: 'Shell command to start the dev server (e.g. \'npm run dev\'). Only needed on first call.' },
          port: { type: 'integer', description: 'Port the dev server runs on (default: 5173)', default: 5173 },
          startup_wait: { type: 'integer', description: 'Seconds to wait for dev server to start (default: 8)', default: 8 }
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
 * 运行 Evaluator Agent
 */
async function runEvaluatorV2(workspace, roundNum, specPath = null, contractPath = null) {
  console.log('================================');
  console.log('🔍 Evaluator Agent V2 (Agent Core)');
  console.log('================================');
  console.log('');
  console.log('Workspace:', workspace);
  console.log('Round:', roundNum);
  console.log('');

  // 读取必要文件
  const spec = specPath && fs.existsSync(specPath) ? fs.readFileSync(specPath, 'utf8') : null;
  const contract = contractPath && fs.existsSync(contractPath) ? fs.readFileSync(contractPath, 'utf8') : null;

  // 生成评估任务提示
  const evalPrompt = generateEvalPrompt(spec, contract, roundNum, workspace);

  // 创建 middlewares
  const middlewares = [
    new LoopDetectionMiddleware(),
    new TimeBudgetMiddleware(15 * 60 * 1000), // 15分钟预算
    new AnxietyDetectionMiddleware(),
    new PreExitGateMiddleware(),
    new ErrorGuidanceMiddleware()
  ];

  // 创建 Agent 实例
  const agent = new Agent('evaluator', EVALUATOR_SYSTEM_PROMPT, [...TOOL_SCHEMAS, ...BROWSER_TOOL_SCHEMAS], middlewares, {
    maxIterations: 40,
    role: 'evaluator', // 角色差异化压缩（保留 50%）
    llmClient: createLLMClient(),
    traceWriter: createTraceWriter(workspace, 'evaluator'),
    toolExecutor: (fnName, fnArgs) => executeTool(fnName, fnArgs)
  });

  // 运行 Agent 循环
  console.log('Starting Agent loop...');
  const result = await agent.run(evalPrompt);

  console.log('');
  console.log('✅ Evaluator Agent finished');
  console.log('Result:', result.slice(0, 200) + '...');

  // 尝试读取生成的 feedback.md
  const feedbackPath = path.join(workspace, 'feedback.md');
  const feedback = fs.existsSync(feedbackPath) ? fs.readFileSync(feedbackPath, 'utf8') : null;

  // 提取分数
  const score = extractScore(feedback);

  return {
    success: true,
    result,
    feedback,
    score,
    workspace,
    roundNum
  };
}

/**
 * 生成评估任务提示
 */
function generateEvalPrompt(spec, contract, roundNum, workspace) {
  let prompt = `You are the Evaluator for Round ${roundNum}.

Task: Test the application and write feedback.md with scores and issues.

`;

  if (spec) {
    prompt += `=== spec.md ===\n${spec.slice(0, 2000)}\n\n`;
  }

  if (contract) {
    prompt += `=== contract.md ===\n${contract.slice(0, 1000)}\n\n`;
  }

  prompt += `Testing steps:
1. Use browser_test to launch the app
2. Test every feature
3. Look for bugs and UI issues
4. Write feedback.md with scores (1-10) and specific issues

Work inside: ${workspace}`;

  return prompt;
}

/**
 * 提取分数
 */
function extractScore(feedback) {
  if (!feedback) return 0;

  // 尝试匹配 "Overall Score: X/10"
  const match = feedback.match(/Overall Score:\s*(\d+)\/10/i);
  if (match) {
    return parseInt(match[1]);
  }

  // 尝试匹配总分
  const scores = feedback.match(/(\d+)\/10/g);
  if (scores && scores.length >= 4) {
    const total = scores.reduce((sum, s) => sum + parseInt(s.split('/')[0]), 0);
    return Math.ceil(total / scores.length);
  }

  return 0;
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
          content: 'I will start by launching the browser...',
          tool_calls: [{
            id: 'call_1',
            type: 'function',
            function: {
              name: 'browser_test',
              arguments: JSON.stringify({ url: 'http://localhost:5173', start_command: 'npm run dev' })
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

  const workspaceArg = args.find(a => a.startsWith('--workspace'));
  const roundArg = args.find(a => a.startsWith('--round'));

  const workspace = workspaceArg ? workspaceArg.split('=')[1] : DEFAULT_WORKSPACE;
  const roundNum = roundArg ? parseInt(roundArg.split('=')[1]) : 1;

  const result = await runEvaluatorV2(workspace, roundNum);

  console.log('');
  console.log('=== Result ===');
  console.log(JSON.stringify(result, null, 2));
}

// Export
module.exports = { runEvaluatorV2, EVALUATOR_SYSTEM_PROMPT, BROWSER_TOOL_SCHEMAS };

// Run CLI
if (require.main === module) {
  main();
}