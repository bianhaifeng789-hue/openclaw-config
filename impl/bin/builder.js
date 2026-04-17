#!/usr/bin/env node
/**
 * Builder Agent - 代码构建代理
 * 
 * 来源：Harness Engineering - prompts.py BUILDER_SYSTEM
 * 
 * 功能：
 * - 按 spec.md 写代码
 * - 处理 QA 反馈
 * - 支持 REFINE/PIVOT 策略
 * 
 * 用法：
 *   node builder.js --workspace /path/to/project --round 1
 *   node builder.js --workspace /path/to/project --round 2 --strategy REFINE
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOME = process.env.HOME || '/Users/mar2game';
const DEFAULT_WORKSPACE = `${HOME}/.openclaw/workspace`;

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

You have these tools: read_file, write_file, list_files, run_bash, read_skill_file, delegate_task.
Work inside the current directory. All files you create will persist.
`;

/**
 * Builder Agent 执行
 */
function runBuilder(workspace, roundNum, strategy = 'REFINE', feedbackPath = null) {
  console.log('================================');
  console.log('🔧 Builder Agent');
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
  const buildPrompt = generateBuildPrompt(spec, contract, feedback, roundNum, strategy);
  
  console.log('Build prompt generated:');
  console.log(buildPrompt.slice(0, 200) + '...');
  console.log('');

  // 执行构建（简化版本 - 实际应调用 LLM）
  const result = executeBuild(workspace, spec);
  
  // Git commit
  if (result.filesCreated.length > 0) {
    try {
      execSync('git add -A && git commit -m "Round ' + roundNum + ' build"', {
        cwd: workspace,
        stdio: 'inherit'
      });
      console.log('✅ Git commit created');
    } catch (e) {
      console.log('⚠️ Git commit failed (may not have changes)');
    }
  }

  return {
    success: true,
    filesCreated: result.filesCreated,
    buildPrompt
  };
}

/**
 * 生成构建任务提示
 */
function generateBuildPrompt(spec, contract, feedback, roundNum, strategy) {
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
 * 执行构建（简化版）
 */
function executeBuild(workspace, spec) {
  // 分析 spec，确定需要创建的文件
  const isWebApp = spec.toLowerCase().includes('web') || 
                   spec.toLowerCase().includes('html') ||
                   spec.toLowerCase().includes('ui');

  const filesCreated = [];

  if (isWebApp) {
    // 创建基础 HTML 文件
    const htmlPath = path.join(workspace, 'index.html');
    const htmlContent = generateBasicHTML(spec);
    fs.writeFileSync(htmlPath, htmlContent);
    filesCreated.push('index.html');
    console.log('✅ Created index.html');
  }

  // 检测是否需要框架
  if (spec.toLowerCase().includes('react') || spec.toLowerCase().includes('framework')) {
    // 创建 package.json
    const pkgPath = path.join(workspace, 'package.json');
    const pkgContent = JSON.stringify({
      name: 'app',
      version: '1.0.0',
      scripts: {
        dev: 'vite',
        build: 'vite build'
      },
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0'
      },
      devDependencies: {
        vite: '^5.0.0'
      }
    }, null, 2);
    fs.writeFileSync(pkgPath, pkgContent);
    filesCreated.push('package.json');
    console.log('✅ Created package.json');
  }

  return { filesCreated };
}

/**
 * 生成基础 HTML
 */
function generateBasicHTML(spec) {
  // 提取标题
  const titleMatch = spec.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1] : 'Application';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      color: #333;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { margin-bottom: 1rem; }
    .main-content { min-height: 200px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="main-content">
      <!-- Main application content -->
      <p>Application content based on specification.</p>
    </div>
  </div>
  <script>
    // Main application logic
    console.log('Application initialized');
    
    // TODO: Implement core functionality based on spec.md
  </script>
</body>
</html>`;
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  
  let workspace = DEFAULT_WORKSPACE;
  let roundNum = 1;
  let strategy = 'REFINE';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workspace') {
      workspace = args[++i];
    } else if (args[i] === '--round') {
      roundNum = parseInt(args[++i]);
    } else if (args[i] === '--strategy') {
      strategy = args[++i];
    }
  }

  const feedbackPath = path.join(workspace, 'feedback.md');
  
  const result = runBuilder(workspace, roundNum, strategy, feedbackPath);
  
  if (result.success) {
    console.log('');
    console.log('================================');
    console.log('✅ Build Complete');
    console.log('================================');
    console.log('');
    console.log('Files created:', result.filesCreated.join(', ') || 'none');
    console.log('');
    console.log('Next step: run Evaluator Agent');
  }
}

module.exports = {
  runBuilder,
  generateBuildPrompt,
  BUILDER_SYSTEM_PROMPT
};

main();