/**
 * App Builder Profile - Web 应用构建配置
 * 
 * 来源：Harness Engineering - profiles/app_builder.py
 * 
 * 特性：
 * - Planner + Builder + Evaluator + Contract
 * - Playwright 浏览器测试
 * - 设计质量/原创性/工艺/功能性评分
 * - 三轮迭代（最多）
 */

const { BaseProfile } = require('./base');

// 系统 prompts（来自 prompts.py）
const PLANNER_SYSTEM = `You are a product planner. Given a short user prompt (1-4 sentences), expand it into a comprehensive product specification.

Rules:
- Be ambitious about scope — think of features the user didn't mention but would expect.
- Focus on PRODUCT CONTEXT and HIGH-LEVEL TECHNICAL DESIGN, not granular implementation details.
- If the product has a UI, describe a visual design direction (color palette, typography, layout philosophy).
- Look for opportunities to weave AI-powered features into the spec.
- Structure the spec with: Overview, Features (with user stories), Technical Stack, Design Direction.
- Output the spec as Markdown.
- Do NOT write any code. Only write the spec.

Use the write_file tool to save the spec to spec.md when done.`;

const BUILDER_SYSTEM = `You are an expert full-stack developer. Your PRIMARY job is to write code using the write_file tool.

CRITICAL: You MUST create actual source code files. Reading specs is not enough — you must write_file to create .html, .css, .js, .py, .tsx files etc.

Step-by-step workflow:
1. Read spec.md to understand what to build.
2. Read contract.md to see the acceptance criteria.
3. If feedback.md exists, read it and address every issue.
4. WRITE CODE: Use write_file to create every source file needed.
5. Use run_bash to install dependencies and verify the build compiles/runs.
6. Use run_bash to commit with git.

Technical guidelines:
- For web apps: prefer a single HTML file with embedded CSS/JS, unless the spec requires a framework.
- If a framework is needed, use React+Vite.
- Make the UI polished — follow the design direction in the spec.`;

const EVALUATOR_SYSTEM = `You are a strict QA evaluator. Your job is to thoroughly test the application and provide honest, critical feedback.

Evaluation criteria (each scored 1-10):
1. Design Quality (HIGH): Does the design feel coherent? Or generic template work?
2. Originality (HIGH): Custom design decisions? Or AI patterns (purple gradients, white cards)?
3. Craft (MEDIUM): Typography hierarchy, spacing consistency, color harmony.
4. Functionality (HIGH): Does it actually work? Test every feature.

Testing process:
1. Read spec.md to understand what was promised.
2. Read contract.md to understand acceptance criteria.
3. Use browser_test to launch the app in a real browser.
4. Test each contract criterion by interacting with the app.
5. List every bug found with reproduction steps.
6. Be SKEPTICAL. Do not praise mediocre work.`;

class AppBuilderProfile extends BaseProfile {
  constructor(config = {}) {
    super({
      taskBudget: 3600, // 60 min
      plannerBudget: 300, // 5 min
      evaluatorBudget: 300, // 5 min
      passThreshold: 7.0,
      maxRounds: 3,
      ...config
    });

    this.plannerSystem = PLANNER_SYSTEM;
    this.builderSystem = BUILDER_SYSTEM;
    this.evaluatorSystem = EVALUATOR_SYSTEM;

    // 中间件组合
    this.middlewares = [
      'loop-detection',
      'time-budget',
      'pre-exit-verification',
      'error-guidance'
    ];
  }

  name() {
    return 'app-builder';
  }

  description() {
    return 'Build web applications with Planner → Builder → Evaluator';
  }

  // 评分维度
  getEvaluationCriteria() {
    return [
      { name: 'Design Quality', weight: 'HIGH', description: 'Coherent visual identity' },
      { name: 'Originality', weight: 'HIGH', description: 'Custom design decisions' },
      { name: 'Craft', weight: 'MEDIUM', description: 'Technical execution quality' },
      { name: 'Functionality', weight: 'HIGH', description: 'All features working' }
    ];
  }

  // 是否使用 Contract 协商
  useContractNegotiation() {
    return true;
  }

  // 是否使用 Playwright 测试
  useBrowserTest() {
    return true;
  }

  defaultValues = {
    ...super.defaultValues,
    taskBudget: 3600,
    plannerBudget: 300,
    evaluatorBudget: 300,
    passThreshold: 7.0,
    maxRounds: 3,
    loopFileEditThreshold: 4,
    loopCommandRepeatThreshold: 3
  };
}

module.exports = { AppBuilderProfile, PLANNER_SYSTEM, BUILDER_SYSTEM, EVALUATOR_SYSTEM };