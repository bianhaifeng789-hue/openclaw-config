/**
 * SWE-Bench Profile - GitHub Issue 修复配置
 * 
 * 来源：Harness Engineering - profiles/swe_bench.py
 * 
 * 特性：
 * - minimal focused changes 原则
 * - 测试通过 + 代码质量评分
 * - Git diff 分析
 */

const { BaseProfile } = require('./base');

const SWE_BENCH_SYSTEM = `You are a software engineer fixing a GitHub issue.

Principles:
1. MINIMAL CHANGES: Fix only what's broken. Don't refactor unrelated code.
2. FOCUSED: One issue at a time. Don't add features or improve style.
3. TEST-DRIVEN: The test must pass after your fix.

Workflow:
1. Read the issue description and understand the problem.
2. Read the test file to understand what "passing" looks like.
3. Find the relevant source code.
4. Make minimal changes to fix the issue.
5. Run the test to verify.
6. If test fails, iterate.

Do NOT:
- Add new features
- Refactor code structure
- Change unrelated files
- Improve code style unless it's the bug cause`;

class SWEBenchProfile extends BaseProfile {
  constructor(config = {}) {
    super({
      taskBudget: 1800,
      plannerBudget: 0, // 直接开始
      evaluatorBudget: 180,
      passThreshold: 9.0, // 测试必须通过
      maxRounds: 3,
      ...config
    });

    this.systemPrompt = SWE_BENCH_SYSTEM;

    this.middlewares = [
      'loop-detection',
      'time-budget',
      'pre-exit-verification',
      'task-tracking',
      'skeleton-detection'
    ];
  }

  name() {
    return 'swe-bench';
  }

  description() {
    return 'Fix GitHub issues with minimal focused changes';
  }

  // 评分标准
  getEvaluationCriteria() {
    return [
      { name: 'Test Pass', weight: 'CRITICAL', description: 'Test must pass' },
      { name: 'Code Quality', weight: 'MEDIUM', description: 'Clean, minimal changes' },
      { name: 'No Side Effects', weight: 'HIGH', description: 'No unrelated changes' }
    ];
  }

  // Git diff 分析
  analyzeGitDiff(diffOutput) {
    const lines = diffOutput.split('\n');
    const stats = {
      filesChanged: 0,
      additions: 0,
      deletions: 0,
      files: []
    };

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        stats.filesChanged++;
        const fileMatch = line.match(/b\/(.+)/);
        if (fileMatch) {
          stats.files.push(fileMatch[1]);
        }
      }
      if (line.startsWith('+') && !line.startsWith('+++')) {
        stats.additions++;
      }
      if (line.startsWith('-') && !line.startsWith('---')) {
        stats.deletions++;
      }
    }

    return stats;
  }

  // 检查是否 minimal changes
  isMinimalChanges(diffStats) {
    // 规则：
    // - 文件数 ≤ 3
    // - 总改动 ≤ 50 行
    // - 无新文件
    return diffStats.filesChanged <= 3 && 
           (diffStats.additions + diffStats.deletions) <= 50;
  }

  defaultValues = {
    ...super.defaultValues,
    taskBudget: 1800,
    passThreshold: 9.0,
    maxRounds: 3,
    maxFilesChanged: 3,
    maxLinesChanged: 50
  };
}

module.exports = { SWEBenchProfile, SWE_BENCH_SYSTEM };