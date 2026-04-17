#!/usr/bin/env node
/**
 * Browser Test - Playwright 自动化测试
 * 
 * 来源：Harness Engineering - tools.py browser_test()
 * 
 * 功能：
 * - 启动 dev server
 * - Headless Chromium 浏览器
 * - 执行操作（click/fill/wait/evaluate/scroll）
 * - 截图保存
 * - Console 错误检测
 * 
 * 用法：
 *   node browser-test.js --url http://localhost:5173
 *   node browser-test.js --url http://localhost:5173 --actions actions.json
 *   node browser-test.js --start "npm run dev" --port 5173
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const HOME = process.env.HOME || '/Users/mar2game';
const WORKSPACE = process.env.HARNESS_WORKSPACE || `${HOME}/.openclaw/workspace`;

// 检查 Playwright 是否安装
let HAS_PLAYWRIGHT = false;
try {
  require.resolve('playwright');
  HAS_PLAYWRIGHT = true;
} catch (e) {
  console.log('Playwright not installed. Install with: npm install playwright && npx playwright install chromium');
}

// Dev server 进程
let devServerProc = null;

/**
 * 启动 dev server
 */
function ensureDevServer(startCommand, port, startupWait = 8) {
  if (devServerProc && devServerProc.pid) {
    try {
      process.kill(devServerProc.pid, 0); // 检查进程是否存活
      return { status: 'running', pid: devServerProc.pid };
    } catch (e) {
      devServerProc = null;
    }
  }

  if (!startCommand) {
    return { status: 'no_command' };
  }

  console.log(`Starting dev server: ${startCommand}`);
  devServerProc = spawn(startCommand, [], {
    cwd: WORKSPACE,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // 等待启动
  const waitMs = startupWait * 1000;
  console.log(`Waiting ${startupWait}s for server startup...`);

  // 检查进程状态
  setTimeout(() => {
    if (devServerProc && devServerProc.pid) {
      try {
        process.kill(devServerProc.pid, 0);
        console.log(`Dev server running (pid=${devServerProc.pid})`);
      } catch (e) {
        console.log('Dev server exited immediately');
        const stderr = devServerProc.stderr?.read()?.toString() || '';
        console.log(`stderr: ${stderr.slice(0, 500)}`);
      }
    }
  }, waitMs);

  return { status: 'started', pid: devServerProc.pid };
}

/**
 * 停止 dev server
 */
function stopDevServer() {
  if (!devServerProc) {
    return 'No dev server running';
  }

  devServerProc.kill('SIGTERM');
  
  setTimeout(() => {
    if (devServerProc && devServerProc.pid) {
      try {
        process.kill(devServerProc.pid, 'SIGKILL');
      } catch (e) {}
    }
  }, 5000);

  devServerProc = null;
  return 'Dev server stopped';
}

/**
 * Browser Test - 核心测试函数
 */
async function browserTest(options) {
  const {
    url,
    actions = [],
    screenshot = true,
    startCommand = null,
    port = 5173,
    startupWait = 8
  } = options;

  if (!HAS_PLAYWRIGHT) {
    return {
      error: 'Playwright not installed',
      hint: 'Install with: npm install playwright && npx playwright install chromium'
    };
  }

  const report = [];

  // 启动 dev server
  if (startCommand) {
    const srvResult = ensureDevServer(startCommand, port, startupWait);
    report.push(`Server: ${srvResult.status} (pid=${srvResult.pid || 'none'})`);
  }

  // Playwright 测试
  try {
    const { chromium } = require('playwright');

    console.log(`Launching Chromium...`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 }
    });

    // 监听 console 错误
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 导航
    try {
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { timeout: 15000 });
      const title = await page.title();
      report.push(`Navigated to ${url} — title: ${title}`);
    } catch (e) {
      report.push(`[error] Navigation failed: ${e.message}`);
      await browser.close();
      return { report: report.join('\n'), success: false };
    }

    // 执行操作
    for (const action of actions) {
      const { type, selector, value, delay = 1000 } = action;

      try {
        switch (type) {
          case 'click':
            await page.click(selector, { timeout: 5000 });
            report.push(`Clicked: ${selector}`);
            break;

          case 'fill':
            await page.fill(selector, value, { timeout: 5000 });
            report.push(`Filled '${selector}' with '${value.slice(0, 50)}'`);
            break;

          case 'wait':
            await page.waitForTimeout(delay);
            report.push(`Waited ${delay}ms`);
            break;

          case 'evaluate':
            const result = await page.evaluate(value);
            report.push(`JS eval result: ${JSON.stringify(result).slice(0, 500)}`);
            break;

          case 'scroll':
            await page.evaluate(`window.scrollBy(0, ${value || 500})`);
            report.push(`Scrolled by ${value || 500}px`);
            break;

          default:
            report.push(`[warn] Unknown action type: ${type}`);
        }
      } catch (e) {
        report.push(`[error] Action ${type}('${selector}'): ${e.message}`);
      }

      await page.waitForTimeout(300); // 操作间短暂暂停
    }

    // 页面信息
    const finalUrl = page.url();
    const bodyText = await page.inner_text('body');
    report.push(`Final URL: ${finalUrl}`);
    report.push(`Visible text (first 2000 chars): ${bodyText.slice(0, 2000)}`);

    // Console 错误
    if (consoleErrors.length > 0) {
      report.push(`Console errors (${consoleErrors.length}):`);
      for (const err of consoleErrors.slice(0, 10)) {
        report.push(`  - ${err.slice(0, 200)}`);
      }
    }

    // 截图
    if (screenshot) {
      const ssPath = path.join(WORKSPACE, '_screenshot.png');
      await page.screenshot({ path: ssPath, fullPage: false });
      report.push(`Screenshot saved to _screenshot.png`);
    }

    await browser.close();
    report.push('Browser test completed');

  } catch (e) {
    report.push(`[error] Browser test failed: ${e.message}`);
    return { report: report.join('\n'), success: false };
  }

  return {
    report: report.join('\n'),
    success: true,
    consoleErrors,
    screenshotPath: screenshot ? path.join(WORKSPACE, '_screenshot.png') : null
  };
}

/**
 * CLI 入口
 */
async function main() {
  const args = process.argv.slice(2);
  
  // 解析参数
  const options = {
    url: null,
    actions: [],
    screenshot: true,
    startCommand: null,
    port: 5173,
    startupWait: 8
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--url') {
      options.url = args[++i];
    } else if (arg === '--actions') {
      const actionsFile = args[++i];
      if (fs.existsSync(actionsFile)) {
        options.actions = JSON.parse(fs.readFileSync(actionsFile, 'utf8'));
      }
    } else if (arg === '--no-screenshot') {
      options.screenshot = false;
    } else if (arg === '--start') {
      options.startCommand = args[++i];
    } else if (arg === '--port') {
      options.port = parseInt(args[++i]);
    } else if (arg === '--wait') {
      options.startupWait = parseInt(args[++i]);
    }
  }

  if (!options.url) {
    console.log('Usage: node browser-test.js --url http://localhost:5173');
    console.log('       node browser-test.js --url http://localhost:5173 --start "npm run dev"');
    console.log('       node browser-test.js --url http://localhost:5173 --actions actions.json');
    console.log('');
    console.log('Actions JSON format:');
    console.log(JSON.stringify([
      { type: 'click', selector: '#start-btn' },
      { type: 'fill', selector: '#search', value: 'test' },
      { type: 'evaluate', value: 'document.querySelectorAll(".item").length' },
      { type: 'scroll', value: 500 }
    ], null, 2));
    return;
  }

  // 安装提示
  if (!HAS_PLAYWRIGHT) {
    console.log('⚠️ Playwright not installed. Installing...');
    try {
      execSync('npm install playwright', { cwd: WORKSPACE, stdio: 'inherit' });
      execSync('npx playwright install chromium', { cwd: WORKSPACE, stdio: 'inherit' });
      HAS_PLAYWRIGHT = true;
      console.log('✅ Playwright installed');
    } catch (e) {
      console.log('❌ Failed to install Playwright');
      return;
    }
  }

  // 运行测试
  console.log('================================');
  console.log('🌐 Browser Test');
  console.log('================================');
  console.log('');

  const result = await browserTest(options);
  
  console.log('');
  console.log('================================');
  console.log('📊 Test Report');
  console.log('================================');
  console.log(result.report);
  
  if (result.success) {
    console.log('');
    console.log('✅ Test completed successfully');
  } else {
    console.log('');
    console.log('❌ Test failed');
  }

  // 停止 dev server
  if (options.startCommand) {
    console.log('');
    console.log('Stopping dev server...');
    stopDevServer();
  }
}

// 导出函数
module.exports = {
  browserTest,
  ensureDevServer,
  stopDevServer,
  HAS_PLAYWRIGHT
};

main().catch(console.error);