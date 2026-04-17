#!/usr/bin/env node
/**
 * OpenClaw Doctor - 系统诊断工具（完整修复版）
 * 
 * 借鉴 DeerFlow 2.0 的 doctor.py 诊断机制
 * 检查 Gateway + Node + LLM + Channel 配置完整性
 * 提供修复建议
 * 
 * 来源: https://github.com/bytedance/deer-flow
 * 参考: scripts/doctor.py
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_FILE = path.join(__dirname, '..', '..', 'gateway-config.yaml');
const CONFIG_FILE_ALT = '/Users/mar2game/.openclaw/config/gateway-config.yaml';
const ENV_FILE = path.join(__dirname, '..', '..', '.env');
const OPENCLAW_JSON = '/Users/mar2game/.openclaw/openclaw.json';
const WORKSPACE = path.join(__dirname, '..', '..');

/**
 * Diagnostic Result
 */
class DiagnosticResult {
  constructor(category, check, status, message, suggestion = null) {
    this.category = category;
    this.check = check;
    this.status = status; // 'ok', 'warning', 'error', 'missing'
    this.message = message;
    this.suggestion = suggestion;
  }
}

/**
 * Doctor - System Diagnostic
 */
class Doctor {
  constructor() {
    this.results = [];
    this.openclawConfig = null;
    
    // 预加载openclaw.json配置
    this.loadOpenClawConfig();
  }

  /**
   * 加载openclaw.json配置
   */
  loadOpenClawConfig() {
    try {
      if (fs.existsSync(OPENCLAW_JSON)) {
        this.openclawConfig = JSON.parse(fs.readFileSync(OPENCLAW_JSON, 'utf8'));
      }
    } catch (err) {
      // ignore
    }
  }

  /**
   * Run all diagnostics
   */
  runAllChecks() {
    console.log('\n🏥 OpenClaw Doctor - System Diagnostic\n');
    
    // Category 1: Configuration Files
    this.checkConfigFiles();
    
    // Category 2: Gateway Status
    this.checkGatewayStatus();
    
    // Category 3: Node Status
    this.checkNodeStatus();
    
    // Category 4: LLM Configuration
    this.checkLLMConfig();
    
    // Category 5: Channel Configuration
    this.checkChannelConfig();
    
    // Category 6: Skills Status
    this.checkSkillsStatus();
    
    // Category 7: Scripts Status
    this.checkScriptsStatus();
    
    // Print results
    this.printResults();
  }

  /**
   * Check Configuration Files
   */
  checkConfigFiles() {
    console.log('📋 Checking Configuration Files...\n');
    
    // gateway-config.yaml
    const configExists = fs.existsSync(CONFIG_FILE) || fs.existsSync(CONFIG_FILE_ALT);
    if (configExists) {
      this.results.push(new DiagnosticResult(
        'Configuration',
        'gateway-config.yaml',
        'ok',
        '✅ gateway-config.yaml exists'
      ));
    } else {
      this.results.push(new DiagnosticResult(
        'Configuration',
        'gateway-config.yaml',
        'missing',
        '❌ gateway-config.yaml missing',
        'Run: node impl/bin/setup-wizard.js run'
      ));
    }
    
    // .env（可选，实际使用环境变量或openclaw.json）
    if (fs.existsSync(ENV_FILE)) {
      this.results.push(new DiagnosticResult(
        'Configuration',
        '.env',
        'ok',
        '✅ .env exists'
      ));
    } else {
      // 检查是否有其他配置方式
      const hasEnvVars = process.env.OPENAI_API_KEY || process.env.BAILIAN_API_KEY;
      const hasJsonConfig = this.openclawConfig && this.openclawConfig.models;
      
      if (hasEnvVars || hasJsonConfig) {
        this.results.push(new DiagnosticResult(
          'Configuration',
          '.env',
          'ok',
          '✅ Configuration via environment variables or openclaw.json'
        ));
      } else {
        this.results.push(new DiagnosticResult(
          'Configuration',
          '.env',
          'warning',
          '⚠️ .env missing (using environment variables)',
          'Optional: create .env for secrets'
        ));
      }
    }
    
    // extensions-config.json
    const extensionsConfig = path.join(WORKSPACE, 'state', 'extensions-config.json');
    if (fs.existsSync(extensionsConfig)) {
      this.results.push(new DiagnosticResult(
        'Configuration',
        'extensions-config.json',
        'ok',
        '✅ extensions-config.json exists'
      ));
    } else {
      this.results.push(new DiagnosticResult(
        'Configuration',
        'extensions-config.json',
        'warning',
        '⚠️ extensions-config.json missing (no MCP servers configured)',
        'Optional: run node impl/bin/mcp-oauth-refresh.js init'
      ));
    }
  }

  /**
   * Check Gateway status
   */
  checkGatewayStatus() {
    console.log('🌐 Checking Gateway Status...\n');
    
    try {
      const result = execSync('openclaw gateway status', { encoding: 'utf8', timeout: 5000 });
      this.results.push(new DiagnosticResult(
        'Gateway',
        'Gateway Status',
        'ok',
        '✅ Gateway running'
      ));
    } catch (err) {
      if (err.message.includes('not running')) {
        this.results.push(new DiagnosticResult(
          'Gateway',
          'Gateway Status',
          'error',
          '❌ Gateway not running',
          'Run: openclaw gateway start'
        ));
      } else {
        this.results.push(new DiagnosticResult(
          'Gateway',
          'Gateway Status',
          'error',
          '❌ Gateway check failed: ' + err.message,
          'Run: openclaw gateway start'
        ));
      }
    }
  }

  /**
   * Check Node status
   */
  checkNodeStatus() {
    console.log('🔗 Checking Node Status...\n');
    
    // Check node_modules
    const nodeModules = path.join(WORKSPACE, 'node_modules');
    if (fs.existsSync(nodeModules)) {
      this.results.push(new DiagnosticResult(
        'Node',
        'node_modules',
        'ok',
        '✅ node_modules exists'
      ));
    } else {
      this.results.push(new DiagnosticResult(
        'Node',
        'node_modules',
        'error',
        '❌ node_modules missing',
        'Run: npm install'
      ));
    }
    
    // Check Node.js version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      if (nodeVersion >= 'v18.0.0') {
        this.results.push(new DiagnosticResult(
          'Node',
          'Node.js Version',
          'ok',
          `✅ Node.js ${nodeVersion} (>= 18)`
        ));
      } else {
        this.results.push(new DiagnosticResult(
          'Node',
          'Node.js Version',
          'warning',
          `⚠️ Node.js ${nodeVersion} (>= 18 recommended)`,
          'Upgrade Node.js to v18+'
        ));
      }
    } catch (err) {
      this.results.push(new DiagnosticResult(
        'Node',
        'Node.js Version',
        'error',
        '❌ Node.js not found',
        'Install Node.js: https://nodejs.org/'
      ));
    }
  }

  /**
   * Check LLM Configuration
   */
  checkLLMConfig() {
    console.log('🤖 Checking LLM Configuration...\n');
    
    // 检查环境变量
    const hasEnvApiKey = process.env.OPENAI_API_KEY || 
                        process.env.ANTHROPIC_API_KEY || 
                        process.env.BAILIAN_API_KEY;
    
    // 检查openclaw.json中的模型配置
    let hasJsonModelConfig = false;
    let providers = [];
    if (this.openclawConfig && this.openclawConfig.models && this.openclawConfig.models.providers) {
      providers = Object.keys(this.openclawConfig.models.providers);
      hasJsonModelConfig = providers.length > 0;
    }
    
    if (hasEnvApiKey || hasJsonModelConfig) {
      const details = hasJsonModelConfig ? 
        ` (${providers.length} providers: ${providers.join(', ')})` : '';
      this.results.push(new DiagnosticResult(
        'LLM',
        'API Key',
        'ok',
        `✅ API key configured${details}`
      ));
    } else {
      this.results.push(new DiagnosticResult(
        'LLM',
        'API Key',
        'warning',
        '⚠️ No API key configured (may use default)',
        'Optional: Add API key to .env or openclaw.json'
      ));
    }
  }

  /**
   * Check Channel Configuration
   */
  checkChannelConfig() {
    console.log('💬 Checking Channel Configuration...\n');
    
    // 检查环境变量
    const hasFeishuEnv = process.env.FEISHU_APP_ID && process.env.FEISHU_APP_SECRET;
    
    // 检查openclaw.json中的Feishu配置
    let hasFeishuJson = false;
    if (this.openclawConfig && this.openclawConfig.channels && this.openclawConfig.channels.feishu) {
      hasFeishuJson = this.openclawConfig.channels.feishu.enabled === true;
    }
    
    if (hasFeishuEnv || hasFeishuJson) {
      this.results.push(new DiagnosticResult(
        'Channel',
        'Feishu',
        'ok',
        '✅ Feishu configured'
      ));
    } else {
      this.results.push(new DiagnosticResult(
        'Channel',
        'Feishu',
        'warning',
        '⚠️ Feishu not configured',
        'Optional: configure Feishu in openclaw.json'
      ));
    }
    
    // Check Telegram
    const hasTelegramEnv = process.env.TELEGRAM_BOT_TOKEN;
    let hasTelegramJson = false;
    if (this.openclawConfig && this.openclawConfig.channels && this.openclawConfig.channels.telegram) {
      hasTelegramJson = this.openclawConfig.channels.telegram.enabled === true;
    }
    
    if (hasTelegramEnv || hasTelegramJson) {
      this.results.push(new DiagnosticResult(
        'Channel',
        'Telegram',
        'ok',
        '✅ Telegram configured'
      ));
    }
    
    // Check Discord
    const hasDiscordEnv = process.env.DISCORD_BOT_TOKEN;
    let hasDiscordJson = false;
    if (this.openclawConfig && this.openclawConfig.channels && this.openclawConfig.channels.discord) {
      hasDiscordJson = this.openclawConfig.channels.discord.enabled === true;
    }
    
    if (hasDiscordEnv || hasDiscordJson) {
      this.results.push(new DiagnosticResult(
        'Channel',
        'Discord',
        'ok',
        '✅ Discord configured'
      ));
    }
  }

  /**
   * Check Skills status
   */
  checkSkillsStatus() {
    console.log('📚 Checking Skills Status...\n');
    
    const skillsDir = path.join(WORKSPACE, 'skills');
    if (fs.existsSync(skillsDir)) {
      const skillCount = this.countSkills(skillsDir);
      this.results.push(new DiagnosticResult(
        'Skills',
        'Skills Directory',
        'ok',
        `✅ ${skillCount} skills available`
      ));
    } else {
      this.results.push(new DiagnosticResult(
        'Skills',
        'Skills Directory',
        'error',
        '❌ skills directory missing',
        'Skills should be in workspace/skills/'
      ));
    }
  }

  /**
   * Check Scripts status
   */
  checkScriptsStatus() {
    console.log('🔧 Checking Scripts Status...\n');
    
    const implBin = path.join(WORKSPACE, 'impl', 'bin');
    if (fs.existsSync(implBin)) {
      const scriptCount = this.countScripts(implBin);
      this.results.push(new DiagnosticResult(
        'Scripts',
        'impl/bin Scripts',
        'ok',
        `✅ ${scriptCount} scripts available`
      ));
    } else {
      this.results.push(new DiagnosticResult(
        'Scripts',
        'impl/bin Scripts',
        'error',
        '❌ impl/bin directory missing',
        'Scripts should be in workspace/impl/bin/'
      ));
    }
  }

  /**
   * Count Skills
   */
  countSkills(skillsDir) {
    let count = 0;
    try {
      const dirs = fs.readdirSync(skillsDir);
      for (const dir of dirs) {
        const skillPath = path.join(skillsDir, dir, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
          count++;
        }
      }
    } catch (err) {
      // ignore
    }
    return count;
  }

  /**
   * Count Scripts
   */
  countScripts(implBin) {
    let count = 0;
    try {
      const files = fs.readdirSync(implBin);
      for (const file of files) {
        if (file.endsWith('.js')) {
          count++;
        }
      }
    } catch (err) {
      // ignore
    }
    return count;
  }

  /**
   * Print results
   */
  printResults() {
    console.log('📊 Diagnostic Results:\n');
    
    // Group by category
    const categories = {};
    for (const result of this.results) {
      if (!categories[result.category]) {
        categories[result.category] = [];
      }
      categories[result.category].push(result);
    }
    
    // Print each category
    for (const [category, results] of Object.entries(categories)) {
      for (const result of results) {
        console.log(`${result.category}: ${result.check}`);
        console.log(`  ${result.message}`);
        if (result.suggestion) {
          console.log(`  💡 Suggestion: ${result.suggestion}`);
        }
        console.log();
      }
    }
    
    // Summary
    const okCount = this.results.filter(r => r.status === 'ok').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const missingCount = this.results.filter(r => r.status === 'missing').length;
    
    console.log('📈 Summary:\n');
    console.log(`  ✅ OK: ${okCount}`);
    console.log(`  ⚠️  Warnings: ${warningCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  🚫 Missing: ${missingCount}`);
    console.log();
    
    if (errorCount > 0 || missingCount > 0) {
      console.log('⚠️  Some checks failed. Please fix the issues above.');
      console.log();
      console.log('💡 Quick fix commands:');
      console.log();
      console.log('  - Setup: node impl/bin/setup-wizard.js run');
      console.log('  - Start Gateway: openclaw gateway start');
      console.log('  - Install deps: npm install');
    } else if (warningCount > 0) {
      console.log('⚠️  Some optional configurations missing. System is functional.');
    } else {
      console.log('✅ All checks passed! OpenClaw is healthy.');
    }
  }
}

// CLI entry point
if (require.main === module) {
  const doctor = new Doctor();
  doctor.runAllChecks();
}

module.exports = { Doctor, DiagnosticResult };