#!/usr/bin/env node
/**
 * Profile Selector - 自动选择 Profile
 * 
 * 根据任务类型自动选择合适的 Profile：
 * - terminal: CLI 任务（默认）
 * - app-builder: Web 应用构建
 * - swe-bench: GitHub issue 修复
 * - reasoning: 知识问答
 * 
 * 用法：
 *   node profile-selector.js detect <task_prompt> <workspace>
 *   node profile-selector.js list
 *   node profile-selector.js status
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/Users/mar2game';
const PROFILES_DIR = `${HOME}/.openclaw/workspace/profiles`;

// Profile 检测规则
const PROFILE_RULES = [
  {
    profile: 'app-builder',
    keywords: ['build a', 'create a web', 'design a', 'develop an app', 'make a website', 'ui', 'frontend', 'dashboard', 'timer', 'game'],
    priority: 1
  },
  {
    profile: 'swe-bench',
    keywords: ['fix', 'bug', 'issue', 'github', 'error', 'crash', 'not working', 'fails', 'test fails'],
    priority: 2
  },
  {
    profile: 'reasoning',
    keywords: ['explain', 'why', 'how does', 'what is', 'calculate', 'analyze', 'compare', 'evaluate', 'reason'],
    priority: 3
  },
  {
    profile: 'terminal',
    keywords: ['install', 'configure', 'compile', 'run', 'deploy', 'setup', 'script', 'cli', 'command'],
    priority: 4 // 默认 fallback
  }
];

/**
 * 检测任务类型并选择 Profile
 */
function detectProfile(taskPrompt, workspacePath) {
  const promptLower = taskPrompt.toLowerCase();
  
  // 按优先级检测
  for (const rule of PROFILE_RULES) {
    for (const keyword of rule.keywords) {
      if (promptLower.includes(keyword)) {
        return {
          profile: rule.profile,
          confidence: 'HIGH',
          matchedKeyword: keyword
        };
      }
    }
  }
  
  // 默认 terminal
  return {
    profile: 'terminal',
    confidence: 'DEFAULT',
    matchedKeyword: null
  };
}

/**
 * 加载 Profile 配置
 */
function loadProfile(profileName) {
  const profilePath = path.join(PROFILES_DIR, `${profileName}.js`);
  
  if (!fs.existsSync(profilePath)) {
    return null;
  }
  
  try {
    const profileModule = require(profilePath);
    const profileClass = Object.values(profileModule)[0];
    return new profileClass();
  } catch (e) {
    console.error(`Failed to load profile ${profileName}:`, e.message);
    return null;
  }
}

/**
 * 列出所有 Profiles
 */
function listProfiles() {
  const profiles = [];
  
  if (fs.existsSync(PROFILES_DIR)) {
    const files = fs.readdirSync(PROFILES_DIR).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      const name = file.replace('.js', '');
      const profile = loadProfile(name);
      
      if (profile) {
        profiles.push({
          name: profile.name(),
          description: profile.description(),
          taskBudget: profile.resolve('taskBudget'),
          passThreshold: profile.resolve('passThreshold'),
          maxRounds: profile.resolve('maxRounds'),
          middlewares: profile.getMiddlewares()
        });
      }
    }
  }
  
  return profiles;
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'detect') {
    const taskPrompt = args[1] || '';
    const workspacePath = args[2] || process.cwd();
    
    const result = detectProfile(taskPrompt, workspacePath);
    
    console.log('================================');
    console.log('🎯 Profile Detection');
    console.log('================================');
    console.log('');
    console.log(`Task: "${taskPrompt.slice(0, 100)}..."`);
    console.log(`Workspace: ${workspacePath}`);
    console.log('');
    console.log(`Selected Profile: ${result.profile}`);
    console.log(`Confidence: ${result.confidence}`);
    if (result.matchedKeyword) {
      console.log(`Matched Keyword: "${result.matchedKeyword}"`);
    }
    
    // 加载 Profile 详情
    const profile = loadProfile(result.profile);
    if (profile) {
      console.log('');
      console.log('Profile Details:');
      console.log(`  Task Budget: ${profile.resolve('taskBudget')}s`);
      console.log(`  Pass Threshold: ${profile.resolve('passThreshold')}`);
      console.log(`  Max Rounds: ${profile.resolve('maxRounds')}`);
      console.log(`  Middlewares: ${profile.getMiddlewares().join(', ')}`);
    }
    
    return;
  }
  
  if (command === 'list') {
    const profiles = listProfiles();
    
    console.log('================================');
    console.log('📋 Available Profiles');
    console.log('================================');
    console.log('');
    
    for (const p of profiles) {
      console.log(`【${p.name}】`);
      console.log(`  Description: ${p.description}`);
      console.log(`  Budget: ${p.taskBudget}s | Threshold: ${p.passThreshold} | Rounds: ${p.maxRounds}`);
      console.log(`  Middlewares: ${p.middlewares.join(', ')}`);
      console.log('');
    }
    
    console.log(`Total: ${profiles.length} profiles`);
    return;
  }
  
  if (command === 'status') {
    console.log('================================');
    console.log('📊 Profile System Status');
    console.log('================================');
    console.log('');
    console.log(`Profiles Directory: ${PROFILES_DIR}`);
    console.log(`Profiles Available: ${listProfiles().length}`);
    console.log(`TB2 Tasks Loaded: ${Object.keys(loadTB2Tasks()).length}`);
    console.log('');
    return;
  }
  
  // 默认帮助
  console.log('Usage:');
  console.log('  node profile-selector.js detect <task_prompt> <workspace>');
  console.log('  node profile-selector.js list');
  console.log('  node profile-selector.js status');
}

function loadTB2Tasks() {
  const tb2Path = path.join(HOME, '.openclaw/workspace/benchmarks/tb2_tasks.json');
  if (fs.existsSync(tb2Path)) {
    return JSON.parse(fs.readFileSync(tb2Path, 'utf8'));
  }
  return {};
}

module.exports = {
  detectProfile,
  loadProfile,
  listProfiles,
  PROFILE_RULES
};

main();