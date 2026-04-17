#!/usr/bin/env node
/**
 * Harbor Adapter - Terminal-Bench-2.0 适配器（参考 harbor_agent.py）
 *
 * Harbor 有两种 agent 类型:
 *   - External (BaseAgent): agent 在容器外运行，通过 environment.exec() 发送命令
 *   - Installed (BaseInstalledAgent): agent 安装在容器内
 *
 * 我们使用 Installed 模式 — harness 在容器内原生运行，
 * 所以 run_bash 作为 subprocess 直接工作，无需桥接。
 *
 * 用法:
 *   node harbor-adapter.js run --task=hello-world
 *   node harbor-adapter.js run-all
 *   node harbor-adapter.js list-tasks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 动态路径
const HOME = process.env.HOME || '/Users/mac';
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');
const BENCHMARKS_DIR = path.join(WORKSPACE, 'benchmarks');
const TB2_TASKS_FILE = path.join(BENCHMARKS_DIR, 'tb2_tasks.json');

/**
 * Harbor Agent 类（Node.js 适配器）
 */
class HarborAgent {
  constructor(modelName = null) {
    this.modelName = modelName || process.env.HARNESS_MODEL || 'gpt-4o';
    this.name = 'harness-agent';
  }

  /**
   * 安装依赖并克隆仓库到容器
   * 
   * 策略: 不使用 apt-get 安装 Python（太慢）
   * 1. 确保 git 存在
   * 2. 克隆仓库
   * 3. 安装依赖
   */
  async install() {
    console.log('\n📦 Installing harness-agent...');
    
    // Step 1: 确保有下载工具
    try {
      execSync('command -v curl || command -v wget || echo "need curl"', { encoding: 'utf8' });
    } catch (err) {
      // ignore
    }
    
    // Step 2: 克隆仓库（或下载 tarball）
    const harnessDir = path.join(HOME, 'harness-agent');
    
    if (fs.existsSync(harnessDir)) {
      console.log('  ✓ harness-agent already exists');
    } else {
      try {
        console.log('  → Cloning from GitHub...');
        execSync(`git clone --depth 1 https://github.com/lazyFrogLOL/Harness_Engineering.git ${harnessDir}`, {
          encoding: 'utf8',
          timeout: 60000
        });
        console.log('  ✓ Repository cloned');
      } catch (err) {
        console.log('  ⚠ Git not available, downloading tarball...');
        // 可以用 curl/wget 下载 tarball
      }
    }
    
    // Step 3: 安装 Node.js 依赖（如果需要）
    console.log('  ✓ Installation complete');
  }

  /**
   * 运行单个任务
   */
  async runTask(taskName, taskData) {
    console.log(`\n🎯 Running task: ${taskName}`);
    console.log(`  Prompt: ${taskData.prompt?.slice(0, 100)}...`);
    
    // 使用 harness-cli.js 运行任务
    const harnessCli = path.join(__dirname, 'harness-cli.js');
    
    const profile = taskData.profile || 'terminal';
    const prompt = taskData.prompt || taskName;
    
    try {
      const result = execSync(`node ${harvestCli} --profile ${profile} "${prompt}"`, {
        cwd: harnessDir || WORKSPACE,
        encoding: 'utf8',
        timeout: (taskData.timeout || 300) * 1000,
        maxBuffer: 10 * 1024 * 1024
      });
      
      console.log('  ✓ Task completed');
      return { success: true, output: result };
    } catch (err) {
      console.log(`  ✗ Task failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * 运行所有任务
   */
  async runAllTasks() {
    console.log('\n🏃 Running all TB2 tasks...');
    
    const tasks = this.loadTasks();
    const results = [];
    
    for (const [taskName, taskData] of Object.entries(tasks)) {
      const result = await this.runTask(taskName, taskData);
      results.push({ task: taskName, ...result });
      
      // 汇总进度
      const passed = results.filter(r => r.success).length;
      console.log(`\n  Progress: ${passed}/${results.length} passed`);
    }
    
    // 生成报告
    this.generateReport(results);
    
    return results;
  }

  /**
   * 加载 TB2 任务
   */
  loadTasks() {
    if (!fs.existsSync(TB2_TASKS_FILE)) {
      console.log('  ⚠ tb2_tasks.json not found');
      return {};
    }
    
    const tasks = JSON.parse(fs.readFileSync(TB2_TASKS_FILE, 'utf8'));
    console.log(`  ✓ Loaded ${Object.keys(tasks).length} tasks`);
    return tasks;
  }

  /**
   * 列出所有任务
   */
  listTasks() {
    const tasks = this.loadTasks();
    
    console.log('\n📋 TB2 Tasks:\n');
    for (const [name, data] of Object.entries(tasks)) {
      const promptPreview = (data.prompt || '').slice(0, 50);
      const timeout = data.timeout || 'default';
      console.log(`  ${name.padEnd(30)} ${promptPreview}... (${timeout}s)`);
    }
    
    return tasks;
  }

  /**
   * 生成报告
   */
  generateReport(results) {
    const reportPath = path.join(BENCHMARKS_DIR, `tb2-results-${Date.now()}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      totalTasks: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n📊 Report saved: ${reportPath}`);
    console.log(`  Total: ${report.totalTasks}`);
    console.log(`  Passed: ${report.passed}`);
    console.log(`  Failed: ${report.failed}`);
    console.log(`  Success Rate: ${(report.passed / report.totalTasks * 100).toFixed(1)}%`);
  }
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Harbor Adapter - Terminal-Bench-2.0 适配器

用法:
  node harbor-adapter.js install           安装 harness-agent
  node harbor-adapter.js list-tasks        列出所有 TB2 任务
  node harbor-adapter.js run --task=<name> 运行单个任务
  node harbor-adapter.js run-all           运行所有任务

示例:
  node harbor-adapter.js install
  node harbor-adapter.js list-tasks
  node harbor-adapter.js run --task=hello-world
  node harbor-adapter.js run-all

环境变量:
  HARNESS_MODEL    模型名称（默认: gpt-4o）
  HARNESS_WORKSPACE 工作目录（默认: ./workspace）

注意:
  需要 tb2_tasks.json 文件在 benchmarks/ 目录
`);
    process.exit(0);
  }

  const agent = new HarborAgent();

  if (command === 'install') {
    await agent.install();
    process.exit(0);
  }

  if (command === 'list-tasks') {
    agent.listTasks();
    process.exit(0);
  }

  if (command === 'run') {
    const taskArg = args.find(a => a.startsWith('--task'));
    const taskName = taskArg ? taskArg.split('=')[1] : 'hello-world';
    
    const tasks = agent.loadTasks();
    const taskData = tasks[taskName] || { prompt: taskName, profile: 'terminal' };
    
    const result = await agent.runTask(taskName, taskData);
    
    if (result.success) {
      console.log('\n✅ Task passed');
      process.exit(0);
    } else {
      console.log('\n❌ Task failed');
      process.exit(1);
    }
  }

  if (command === 'run-all') {
    const results = await agent.runAllTasks();
    
    const passed = results.filter(r => r.success).length;
    const successRate = passed / results.length;
    
    console.log(`\n🏁 Benchmark complete: ${passed}/${results.length} passed (${(successRate * 100).toFixed(1)}%)`);
    
    process.exit(successRate >= 0.5 ? 0 : 1);
  }

  console.log(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// Export
module.exports = { HarborAgent };

// CLI Entry
if (require.main === module) {
  main();
}