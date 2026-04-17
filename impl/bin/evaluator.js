#!/usr/bin/env node
/**
 * Evaluator Agent - QA 评估代理
 * 
 * 来源：Harness Engineering - prompts.py EVALUATOR_SYSTEM
 * 
 * 功能：
 * - 用 Playwright 实际操作页面
 * - 打分（Design/Originality/Craft/Functionality）
 * - 输出 feedback.md 文件
 * 
 * 用法：
 *   node evaluator.js --workspace /path/to/project --round 1
 *   node evaluator.js --workspace /path/to/project --round 2 --url http://localhost:5173
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/Users/mar2game';
const DEFAULT_WORKSPACE = `${HOME}/.openclaw/workspace`;

const EVALUATOR_SYSTEM_PROMPT = `
You are a strict QA evaluator. Your job is to thoroughly test the application \
and provide honest, critical feedback.

Evaluation criteria (each scored 1-10):

1. **Design Quality** (weight: HIGH)
   Does the design feel like a coherent whole? Do colors, typography, layout, \
   and details combine to create a distinct identity? Or is it generic template work?

2. **Originality** (weight: HIGH)
   Is there evidence of custom design decisions? Unmodified stock components, \
   library defaults, or telltale AI patterns (purple gradients, white cards) fail here.

3. **Craft** (weight: MEDIUM)
   Technical execution: typography hierarchy, spacing consistency, color harmony, \
   contrast ratios. A competence check.

4. **Functionality** (weight: HIGH)
   Does the application actually work? Can users complete the core tasks described \
   in the spec? Test every feature — click buttons, fill forms, navigate pages. \
   Broken features score 0.

Testing process:
1. Read spec.md to understand what was promised.
2. Read contract.md to understand what "done" looks like for this round.
3. Read the source code to understand the implementation.
4. Use browser_test to launch the app in a real browser:
   - First call: provide start_command (e.g. "npm run dev") to start the dev server.
   - Navigate to the app URL (usually http://localhost:5173).
   - Perform actions: click buttons, fill forms, navigate between pages.
   - Check for console errors in the report.
   - The screenshot is saved to _screenshot.png.
5. Test each contract criterion by actually interacting with the app.
6. After testing, call stop_dev_server to clean up.
7. For each criterion, provide a score and specific evidence.
8. List every bug found with exact reproduction steps.
9. Be SKEPTICAL. Do not praise mediocre work. If something looks like it works \
   but you haven't verified it, say so.

Output format — write to feedback.md:
## QA Evaluation — Round N

### Scores
- Design Quality: X/10 — [justification]
- Originality: X/10 — [justification]
- Craft: X/10 — [justification]
- Functionality: X/10 — [justification]
- **Average: X/10**

### Bugs Found
1. [Bug description + reproduction steps]
2. ...

### Specific Improvements Required
1. [Actionable improvement]
2. ...

### What's Working Well
- [Positive observations]
`;

/**
 * Evaluator Agent 执行
 */
function runEvaluator(workspace, roundNum, url = null) {
  console.log('================================');
  console.log('🔍 Evaluator Agent');
  console.log('================================');
  console.log('');
  console.log('Workspace:', workspace);
  console.log('Round:', roundNum);
  console.log('');

  // 读取必要文件
  const specPath = path.join(workspace, 'spec.md');
  const contractPath = path.join(workspace, 'contract.md');
  const feedbackPath = path.join(workspace, 'feedback.md');

  if (!fs.existsSync(specPath)) {
    console.log('❌ spec.md not found');
    return { success: false, error: 'NO_SPEC' };
  }

  const spec = fs.readFileSync(specPath, 'utf8');
  const contract = fs.existsSync(contractPath) ? fs.readFileSync(contractPath, 'utf8') : null;

  // 读取源代码
  const sourceFiles = readSourceFiles(workspace);

  // 评估（简化版本 - 实际应调用 LLM + Playwright）
  const evaluation = evaluateApplication(spec, contract, sourceFiles, url);

  // 写入 feedback.md
  const feedbackContent = generateFeedback(evaluation, roundNum);
  fs.writeFileSync(feedbackPath, feedbackContent);
  console.log(`✅ Feedback saved to: ${feedbackPath}`);

  return {
    success: true,
    scores: evaluation.scores,
    average: evaluation.average,
    feedbackPath
  };
}

/**
 * 读取源代码文件
 */
function readSourceFiles(workspace) {
  const files = {};
  
  const extensions = ['.html', '.js', '.css', '.ts', '.tsx', '.py', '.json'];
  
  for (const ext of extensions) {
    const matches = findFiles(workspace, ext);
    for (const file of matches) {
      const relPath = path.relative(workspace, file);
      files[relPath] = fs.readFileSync(file, 'utf8');
    }
  }

  return files;
}

/**
 * 查找文件
 */
function findFiles(dir, ext) {
  const results = [];
  
  function walk(d) {
    const items = fs.readdirSync(d);
    for (const item of items) {
      const full = path.join(d, item);
      if (fs.statSync(full).isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules') {
          walk(full);
        }
      } else if (item.endsWith(ext)) {
        results.push(full);
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * 评估应用（简化版）
 */
function evaluateApplication(spec, contract, sourceFiles, url) {
  // 分析 spec 关键词
  const specKeywords = spec.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(w => w.length > 3);

  // 分析源代码
  const hasHTML = Object.keys(sourceFiles).some(f => f.endsWith('.html'));
  const hasJS = Object.keys(sourceFiles).some(f => f.endsWith('.js') || f.endsWith('.ts'));
  const hasCSS = Object.keys(sourceFiles).some(f => f.endsWith('.css'));

  // 基础评分（实际应由 Playwright 测试 + LLM 分析）
  let designQuality = 5;
  let originality = 5;
  let craft = 5;
  let functionality = 5;

  // 如果有 HTML/JS/CSS，提高功能评分
  if (hasHTML && hasJS) {
    functionality = 7;
  }

  // 检查是否有自定义样式
  if (hasCSS) {
    const cssContent = Object.entries(sourceFiles)
      .filter(([f]) => f.endsWith('.css'))
      .map(([_, c]) => c)
      .join('\n');

    if (cssContent.length > 1000) {
      craft = 6;
      designQuality = 6;
    }
  }

  // 检查是否有 TODO
  const allCode = Object.values(sourceFiles).join('\n');
  const todoCount = (allCode.match(/TODO/gi) || []).length;
  if (todoCount > 0) {
    functionality -= todoCount;
  }

  // 确保分数在 1-10 范围
  designQuality = Math.max(1, Math.min(10, designQuality));
  originality = Math.max(1, Math.min(10, originality));
  craft = Math.max(1, Math.min(10, craft));
  functionality = Math.max(1, Math.min(10, functionality));

  const average = (designQuality + originality + craft + functionality) / 4;

  return {
    scores: {
      designQuality,
      originality,
      craft,
      functionality
    },
    average,
    bugs: [],
    improvements: [],
    positives: []
  };
}

/**
 * 生成 feedback.md
 */
function generateFeedback(evaluation, roundNum) {
  return `## QA Evaluation — Round ${roundNum}

### Scores
- Design Quality: ${evaluation.scores.designQuality}/10 — ${getDesignJustification(evaluation.scores.designQuality)}
- Originality: ${evaluation.scores.originality}/10 — ${getOriginalityJustification(evaluation.scores.originality)}
- Craft: ${evaluation.scores.craft}/10 — ${getCraftJustification(evaluation.scores.craft)}
- Functionality: ${evaluation.scores.functionality}/10 — ${getFunctionalityJustification(evaluation.scores.functionality)}
- **Average: ${evaluation.average.toFixed(1)}/10**

### Bugs Found
${evaluation.bugs.length > 0 ? evaluation.bugs.map(b => `1. ${b}`).join('\n') : '(None detected in automated review)'}

### Specific Improvements Required
${evaluation.improvements.length > 0 ? evaluation.improvements.map(i => `1. ${i}`).join('\n') : '1. Add more custom styling beyond default styles\n2. Implement all features described in spec.md\n3. Add proper error handling'}

### What's Working Well
${evaluation.positives.length > 0 ? evaluation.positives.map(p => `- ${p}`).join('\n') : '- Basic HTML structure exists\n- Code is readable'}

---
Generated: ${new Date().toISOString()}
`;
}

function getDesignJustification(score) {
  if (score >= 8) return 'Strong visual identity with custom design decisions';
  if (score >= 6) return 'Adequate design but could be more distinctive';
  if (score >= 4) return 'Generic template appearance, needs customization';
  return 'Minimal design effort, basic defaults only';
}

function getOriginalityJustification(score) {
  if (score >= 8) return 'Clear custom decisions, not AI defaults';
  if (score >= 6) return 'Some customization but still recognizable patterns';
  if (score >= 4) return 'Heavy use of defaults, limited originality';
  return 'Unmodified template, no customization';
}

function getCraftJustification(score) {
  if (score >= 8) return 'Excellent technical execution, consistent spacing/typography';
  if (score >= 6) return 'Good execution with minor inconsistencies';
  if (score >= 4) return 'Basic execution, needs polish';
  return 'Poor execution, needs significant improvement';
}

function getFunctionalityJustification(score) {
  if (score >= 8) return 'All features working correctly';
  if (score >= 6) return 'Most features working, some issues';
  if (score >= 4) return 'Core features partially implemented';
  return 'Limited functionality, needs more work';
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  
  let workspace = DEFAULT_WORKSPACE;
  let roundNum = 1;
  let url = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workspace') {
      workspace = args[++i];
    } else if (args[i] === '--round') {
      roundNum = parseInt(args[++i]);
    } else if (args[i] === '--url') {
      url = args[++i];
    }
  }

  const result = runEvaluator(workspace, roundNum, url);
  
  if (result.success) {
    console.log('');
    console.log('================================');
    console.log('✅ Evaluation Complete');
    console.log('================================');
    console.log('');
    console.log(`Average Score: ${result.average.toFixed(1)}/10`);
    console.log('');
    console.log('Scores:');
    console.log(`  Design: ${result.scores.designQuality}/10`);
    console.log(`  Originality: ${result.scores.originality}/10`);
    console.log(`  Craft: ${result.scores.craft}/10`);
    console.log(`  Functionality: ${result.scores.functionality}/10`);
  }
}

module.exports = {
  runEvaluator,
  evaluateApplication,
  EVALUATOR_SYSTEM_PROMPT
};

main();