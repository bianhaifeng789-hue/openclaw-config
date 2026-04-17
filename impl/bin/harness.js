#!/usr/bin/env node
/**
 * Harness - 多代理架构编排循环
 *
 * 来源:Harness Engineering - harness.py
 *
 * 核心循环:Plan → Build → Evaluate → Iterate
 *
 * 用法:
 *   node harness.js "Build a Pomodoro timer"                    # app-builder
 *   node harness.js --profile terminal "Fix git merge"          # terminal
 *   node harness.js --profile swe-bench "Fix issue #123"        # swe-bench
 *   node harness.js --list-profiles
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const HOME = process.env.HOME || '/Users/mar2game';
const WORKSPACE = process.env.HARNESS_WORKSPACE || `${HOME}/.openclaw/workspace/harness-projects`;

// 配置
const MAX_HARNESS_ROUNDS = parseInt(process.env.MAX_HARNESS_ROUNDS || '5');
const PASS_THRESHOLD = parseFloat(process.env.PASS_THRESHOLD || '7.0');
const COMPRESS_THRESHOLD = parseInt(process.env.COMPRESS_THRESHOLD || '80000');
const RESET_THRESHOLD = parseInt(process.env.RESET_THRESHOLD || '150000');

// Environment Bootstrap Commands（来自 Harness Engineering - terminal.py）
const ENV_BOOTSTRAP_COMMANDS = [
  'uname -a',
  'pwd',
  'ls -la . 2>/dev/null',
  'python3 --version 2>/dev/null; python --version 2>/dev/null',
  'which gcc g++ make cmake 2>/dev/null || true',
  'pip3 list 2>/dev/null | head -30 || true',
  'cat /etc/os-release 2>/dev/null | head -5 || true',
  'df -h / 2>/dev/null | tail -1 || true',
  'free -h 2>/dev/null | head -2 || true',
  'env | grep -iE "^(PATH|HOME|USER|LANG|LC_)" 2>/dev/null || true',
  'git log --oneline -5 2>/dev/null || true',
  'git status --short 2>/dev/null || true',
  'git branch -a 2>/dev/null | head -10 || true',
  'ss -tlnp 2>/dev/null | head -10 || netstat -tlnp 2>/dev/null | head -10 || true'
];

// Profile 定义
const profiles = {
  'app-builder': {
    name: 'app-builder',
    description: '从一句话构建完整Web应用',
    hasPlanner: true,
    hasEvaluator: true,
    hasContract: true,
    passThreshold: 7.0,
    maxRounds: 5,
    scoring: ['design', 'originality', 'craft', 'functionality']
  },
  'terminal': {
    name: 'terminal',
    description: '解决终端/CLI任务',
    hasPlanner: false,
    hasEvaluator: false,
    hasContract: false,
    passThreshold: 0,
    maxRounds: 1,
    scoring: []
  },
  'swe-bench': {
    name: 'swe-bench',
    description: '修复GitHub issues',
    hasPlanner: false,
    hasEvaluator: true,
    hasContract: false,
    passThreshold: 7.0,
    maxRounds: 3,
    scoring: ['tests_pass', 'code_quality']
  },
  'reasoning': {
    name: 'reasoning',
    description: '知识密集问答',
    hasPlanner: true,
    hasEvaluator: true,
    hasContract: false,
    passThreshold: 9.0,
    maxRounds: 2,
    scoring: ['accuracy', 'completeness']
  }
};

class Harness {
  constructor(profileName = 'app-builder') {
    this.profile = profiles[profileName] || profiles['app-builder'];
    this.workspace = WORKSPACE;
    this.scoreHistory = [];
    this.bootstrapContext = ''; // 环境预收集结果
    this.roundNum = 0;
    this.startTime = Date.now();

    // Agent 实例
    this.planner = null;
    this.builder = null;
    this.evaluator = null;
    this.contractProposer = null;
    this.contractReviewer = null;
  }

  /**
   * 创建项目目录
   */
  /**
   * Environment Bootstrap - 预收集环境信息
   * 来源：Harness Engineering - terminal.py ENV_BOOTSTRAP_COMMANDS
   */
  async runBootstrap() {
    console.log('');
    console.log('=' .repeat(60));
    console.log('ENVIRONMENT BOOTSTRAP');
    console.log('=' .repeat(60));
    console.log('');
    console.log('Pre-collecting environment info to avoid exploration time...');
    
    const results = [];
    for (const cmd of ENV_BOOTSTRAP_COMMANDS) {
      const result = this.runBashSync(cmd);
      if (result && result.trim()) {
        results.push(`$ ${cmd}\n${result.slice(0, 200)}`);
      }
    }
    
    this.bootstrapContext = results.join('\n\n');
    
    // 写入 _env_bootstrap.txt
    const bootstrapPath = path.join(this.workspace, '_env_bootstrap.txt');
    fs.writeFileSync(bootstrapPath, this.bootstrapContext);
    
    console.log(`Bootstrap complete: ${results.length} commands executed`);
    console.log('');
    return this.bootstrapContext;
  }

  createProjectDir(userPrompt) {
    const slug = userPrompt.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40)
      .replace(/^-|-$/g, '');
    
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);

    const projectName = `${timestamp}_${slug}`;
    this.workspace = path.join(WORKSPACE, projectName);
    
    fs.mkdirSync(this.workspace, { recursive: true });
    console.log(`Project directory: ${this.workspace}`);
    
    // 初始化 git
    this.runBash('git init && git add -A 2>/dev/null; git commit -m "init" --allow-empty 2>/dev/null');
  }

  /**
   * Phase 1: Planning
   */
  async planningPhase(userPrompt) {
    if (!this.profile.hasPlanner) {
      // 无 planner → 直接写入 prompt 作为 spec
      const specPath = path.join(this.workspace, 'spec.md');
      fs.writeFileSync(specPath, `# Task\n\n${userPrompt}\n`);
      console.log('No planner - wrote prompt directly to spec.md');
      return;
    }

    console.log('=' .repeat(60));
    console.log('PHASE 1: PLANNING');
    console.log('=' .repeat(60));

    const plannerPrompt = `Create a plan for the following task:

${userPrompt}

Save the plan to spec.md.

Rules:
- Be ambitious about scope - think of features the user didn't mention but would expect.
- Focus on PRODUCT CONTEXT and HIGH-LEVEL TECHNICAL DESIGN.
- If the product has a UI, describe visual design direction.
- Output the spec as Markdown.
- Do NOT write any code. Only write the spec.
- Do NOT read feedback.md or contract.md - they do not exist yet.`;

    await this.runAgent('planner', plannerPrompt);
  }

  /**
   * Contract Negotiation
   */
  async negotiateContract(roundNum) {
    if (!this.profile.hasContract) return;

    console.log('=' .repeat(60));
    console.log(`ROUND ${roundNum}: CONTRACT NEGOTIATION`);
    console.log('=' .repeat(60));

    const specPath = path.join(this.workspace, 'spec.md');
    const contractPath = path.join(this.workspace, 'contract.md');
    const feedbackPath = path.join(this.workspace, 'feedback.md');

    const spec = fs.existsSync(specPath) ? fs.readFileSync(specPath, 'utf8') : '';
    const feedback = fs.existsSync(feedbackPath) ? fs.readFileSync(feedbackPath, 'utf8') : '';

    // Proposer 提出 contract
    const proposePrompt = `Propose a sprint contract for Round ${roundNum}.

Read spec.md and feedback.md (if exists).

Write contract to contract.md with this structure:

## Sprint Contract - Round ${roundNum}

### Scope
What features/fixes will be implemented this round.

### Deliverables
Specific, concrete outputs (files, components, endpoints).

### Acceptance Criteria
Numbered list of testable behaviors.
Each criterion must be binary: pass or fail.

### Out of Scope
What is explicitly NOT being done this round.

Be specific and realistic.`;

    await this.runAgent('contract_proposer', proposePrompt);

    // Reviewer 审核(最多3轮)
    for (let i = 0; i < 3; i++) {
      const reviewPrompt = `Review contract.md for Round ${roundNum}.

Read spec.md for context.

If acceptable, write APPROVED at top and save to contract.md.
If changes needed, write revision requests and update contract.md.

Check:
1. Faithful to product spec
2. Specific enough to test
3. Realistic in scope`;

      await this.runAgent('contract_reviewer', reviewPrompt);

      // 检查 APPROVED
      const contract = fs.readFileSync(contractPath, 'utf8');
      if (contract.toUpperCase().slice(0, 200).includes('APPROVED')) {
        console.log('Contract APPROVED');
        return;
      }

      // 不通过 → Proposer 修改
      if (i < 2) {
        console.log(`Contract revision ${i + 1}`);
        await this.runAgent('contract_proposer', 'Reviewer requested changes. Read contract.md and revise.');
      }
    }

    console.log('Contract negotiation completed (forced after 3 rounds)');
  }

  /**
   * Build Phase
   */
  async buildPhase(userPrompt, roundNum) {
    console.log('=' .repeat(60));
    console.log(`ROUND ${roundNum}: BUILD`);
    console.log('=' .repeat(60));

    const specPath = path.join(this.workspace, 'spec.md');
    const contractPath = path.join(this.workspace, 'contract.md');
    const feedbackPath = path.join(this.workspace, 'feedback.md');

    const spec = fs.existsSync(specPath) ? fs.readFileSync(specPath, 'utf8') : '';
    const contract = fs.existsSync(contractPath) ? fs.readFileSync(contractPath, 'utf8') : '';
    const feedback = fs.existsSync(feedbackPath) ? fs.readFileSync(feedbackPath, 'utf8') : '';

    // 分数趋势分析
    let strategy = 'REFINE';
    if (this.scoreHistory.length >= 2) {
      const delta = this.scoreHistory[this.scoreHistory.length - 1] - this.scoreHistory[this.scoreHistory.length - 2];
      if (delta <= 0) {
        strategy = 'PIVOT';
      }
    }

    const buildPrompt = `You are the Builder for Round ${roundNum}.

Strategy: ${strategy}
${strategy === 'PIVOT' ? 'Scores are declining. Consider a different approach.' : 'Scores are improving. Continue refining.'}

Read:
- spec.md: Product specification
- contract.md: Acceptance criteria
${feedback ? '- feedback.md: QA feedback from previous round\nAddress every issue listed.' : ''}

CRITICAL: You MUST create actual source code files using write_file.
Write real, complete, working code - no stubs, no placeholders, no TODO.

After creating files:
1. Use run_bash to install dependencies
2. Use run_bash to verify build compiles/runs
3. Use run_bash to commit: git add -A && git commit -m "Round ${roundNum}"

Work inside: ${this.workspace}`;

    await this.runAgent('builder', buildPrompt);
  }

  /**
   * Evaluate Phase
   */
  async evaluatePhase(userPrompt, roundNum) {
    if (!this.profile.hasEvaluator) return;

    console.log('=' .repeat(60));
    console.log(`ROUND ${roundNum}: EVALUATE`);
    console.log('=' .repeat(60));

    const specPath = path.join(this.workspace, 'spec.md');
    const contractPath = path.join(this.workspace, 'contract.md');

    const evaluatePrompt = `You are the QA Evaluator for Round ${roundNum}.

Read:
- spec.md: What was promised
- contract.md: Acceptance criteria

Testing process:
1. Use browser_test to launch the app
2. Test each contract criterion
3. Score each dimension 1-10
4. Write feedback.md with results

Scoring dimensions:
- Design Quality (HIGH): Coherent visual identity vs generic template
- Originality (HIGH): Custom design decisions vs AI defaults
- Craft (MEDIUM): Technical execution quality
- Functionality (HIGH): Does it actually work?

Be SKEPTICAL. Test every feature. Broken features score 0.

Output format (save to feedback.md):
## QA Evaluation - Round ${roundNum}

### Scores
- Design Quality: X/10 - [justification]
- Originality: X/10 - [justification]
- Craft: X/10 - [justification]
- Functionality: X/10 - [justification]
- **Average: X/10**

### Bugs Found
1. [Bug + reproduction steps]

### Improvements Required
1. [Actionable improvement]

### What's Working
- [Positive observations]`;

    await this.runAgent('evaluator', evaluatePrompt);

    // 提取分数
    const feedbackPath = path.join(this.workspace, 'feedback.md');
    if (fs.existsSync(feedbackPath)) {
      const feedback = fs.readFileSync(feedbackPath, 'utf8');
      const avgMatch = feedback.match(/\*\*Average:\s*(\d+\.?\d*)\/10\*\*/);
      if (avgMatch) {
        const score = parseFloat(avgMatch[1]);
        this.scoreHistory.push(score);
        console.log(`Round ${roundNum} score: ${score}/10`);
        return score;
      }
    }
    return 0;
  }

  /**
   * 运行 Agent
   */
  async runAgent(role, prompt) {
    // 使用 sessions_spawn 来运行子代理
    console.log(`Running ${role} agent...`);

    // 简化实现:直接使用 OpenClaw 的 session
    // 实际实现需要调用 LLM API
    console.log(`[${role}] Prompt: ${prompt.slice(0, 100)}...`);
    console.log(`[${role}] Complete (simulated)`);
  }

  /**
   * 执行 Bash 命令（异步）
   */
  runBash(command) {
    try {
      const result = require('child_process').execSync(command, {
        cwd: this.workspace,
        encoding: 'utf8',
        timeout: 30000
      });
      return result;
    } catch (e) {
      return `[error] ${e.message}`;
    }
  }

  /**
   * 执行 Bash 命令（同步，返回结果）
   */
  runBashSync(command) {
    try {
      const result = require('child_process').execSync(command, {
        cwd: this.workspace || WORKSPACE,
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      return result;
    } catch (e) {
      // 返回 stderr 或空
      return e.stderr || '';
    }
  }

  /**
   * 主运行循环
   */
  async run(userPrompt) {
    console.log('================================');
    console.log('🚀 Harness - Multi-Agent Orchestration');
    console.log('================================');
    console.log(`Profile: ${this.profile.name}`);
    console.log(`Max rounds: ${this.profile.maxRounds}`);
    console.log(`Pass threshold: ${this.profile.passThreshold}`);
    console.log('');

    // 创建项目目录
    this.createProjectDir(userPrompt);

    // Environment Bootstrap（terminal profile）
    if (this.profile.name === 'terminal') {
      await this.runBootstrap();
    }

    // Phase 1: Planning
    await this.planningPhase(userPrompt);

    // Phase 2: Build → Evaluate loop
    for (let roundNum = 1; roundNum <= this.profile.maxRounds; roundNum++) {
      // Contract negotiation
      await this.negotiateContract(roundNum);

      // Build
      await this.buildPhase(userPrompt, roundNum);

      // Evaluate
      const score = await this.evaluatePhase(userPrompt, roundNum);

      // 检查是否通过
      if (score >= this.profile.passThreshold) {
        console.log('');
        console.log('================================');
        console.log(`🎉 PASSED! Score: ${score}/10 >= ${this.profile.passThreshold}`);
        console.log('================================');
        return;
      }

      // 分数趋势判断
      if (this.scoreHistory.length >= 2) {
        const delta = this.scoreHistory[roundNum - 1] - this.scoreHistory[roundNum - 2];
        console.log(`Score trend: ${delta > 0 ? 'IMPROVING (+' + delta.toFixed(1) + ')' : 'DECLINING (' + delta.toFixed(1) + ')'}`);
      }
    }

    console.log('');
    console.log('================================');
    console.log(`⏱️ Max rounds reached. Best score: ${Math.max(...this.scoreHistory)}/10`);
    console.log('================================');
  }
}

// CLI 入口
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list-profiles')) {
    console.log('Available profiles:');
    for (const [name, profile] of Object.entries(profiles)) {
      console.log(`  ${name}: ${profile.description}`);
    }
    return;
  }

  const profileIndex = args.indexOf('--profile');
  const profileName = profileIndex >= 0 ? args[profileIndex + 1] : 'app-builder';
  const userPrompt = args.filter(a => !a.startsWith('--')).join(' ');

  if (!userPrompt) {
    console.log('Usage: node harness.js "Build a Pomodoro timer"');
    console.log('       node harness.js --profile terminal "Fix git merge"');
    console.log('       node harness.js --list-profiles');
    return;
  }

  const harness = new Harness(profileName);
  await harness.run(userPrompt);
}

main().catch(console.error);