#!/usr/bin/env node
/**
 * Skill Tool Handler - 基于 Claude Code SkillTool
 * 
 * Skill 工具处理：
 *   - Skill 发现和执行
 *   - Skill 参数绑定
 *   - Skill 结果处理
 * 
 * Usage:
 *   node skill-tool-handler.js discover [path]
 *   node skill-tool-handler.js execute <skillName>
 *   node skill-tool-handler.js list
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const SKILLS_DIR = path.join(WORKSPACE, 'skills');
const STATE_DIR = path.join(WORKSPACE, 'state', 'skill-tool');
const STATE_FILE = path.join(STATE_DIR, 'skill-tool-state.json');

const SKILL_TOOL_NAME = 'Skill';

function loadSkillToolState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      discoveredSkills: [],
      executedSkills: [],
      totalExecutions: 0
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {
      discoveredSkills: [],
      executedSkills: [],
      totalExecutions: 0
    };
  }
}

function saveSkillToolState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function discoverSkills(searchPath = SKILLS_DIR) {
  const skills = [];
  
  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Check for SKILL.md
          const skillFile = path.join(fullPath, 'SKILL.md');
          
          if (fs.existsSync(skillFile)) {
            try {
              const content = fs.readFileSync(skillFile, 'utf8');
              const relativePath = path.relative(searchPath, fullPath);
              
              // Extract skill metadata
              const name = entry.name;
              const lines = content.split('\n');
              const title = lines[0]?.replace(/^#+\s*/, '') || name;
              const description = lines.slice(1, 5).join('\n').trim();
              
              skills.push({
                name,
                title,
                description,
                path: fullPath,
                relativePath,
                skillFile,
                exists: true
              });
            } catch {
              // Ignore
            }
          }
          
          // Also walk subdirectories
          walkDir(fullPath);
        }
      }
    } catch {
      // Ignore permission errors
    }
  }
  
  walkDir(searchPath);
  
  // Update state
  const state = loadSkillToolState();
  state.discoveredSkills = skills;
  saveSkillToolState(state);
  
  return {
    discovered: skills.length,
    skills,
    searchPath
  };
}

function getSkillDefinition(skillName) {
  const state = loadSkillToolState();
  
  const skill = state.discoveredSkills.find(s => s.name === skillName);
  
  if (!skill) {
    return {
      found: false,
      skillName
    };
  }
  
  // Read SKILL.md content
  try {
    const content = fs.readFileSync(skill.skillFile, 'utf8');
    
    return {
      found: true,
      skillName,
      ...skill,
      content
    };
  } catch {
    return {
      found: false,
      skillName,
      error: 'could not read skill file'
    };
  }
}

function executeSkill(skillName, params = {}) {
  const state = loadSkillToolState();
  
  const skill = state.discoveredSkills.find(s => s.name === skillName);
  
  if (!skill) {
    return {
      executed: false,
      error: 'skill not found',
      skillName
    };
  }
  
  const execution = {
    skillName,
    params,
    timestamp: Date.now(),
    executionId: `skill_exec_${Date.now()}`,
    simulated: true
  };
  
  state.executedSkills.push(execution);
  state.totalExecutions++;
  
  // Keep only last 50
  if (state.executedSkills.length > 50) {
    state.executedSkills = state.executedSkills.slice(-50);
  }
  
  saveSkillToolState(state);
  
  return {
    executed: true,
    skillName,
    execution,
    note: 'In real implementation, would parse SKILL.md and execute instructions',
    skillPath: skill.path
  };
}

function listDiscoveredSkills() {
  const state = loadSkillToolState();
  
  return {
    skills: state.discoveredSkills,
    count: state.discoveredSkills.length,
    categories: state.discoveredSkills.reduce((acc, s) => {
      const category = path.dirname(s.relativePath) || 'root';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {})
  };
}

function listExecutedSkills(limit = 20) {
  const state = loadSkillToolState();
  
  return {
    executions: state.executedSkills.slice(-limit),
    totalExecutions: state.totalExecutions,
    recentSkills: state.executedSkills.slice(-10).map(e => e.skillName)
  };
}

function getSkillStats() {
  const state = loadSkillToolState();
  
  const uniqueSkills = new Set(state.executedSkills.map(e => e.skillName));
  
  return {
    discoveredCount: state.discoveredSkills.length,
    executedCount: state.executedSkills.length,
    totalExecutions: state.totalExecutions,
    uniqueSkillsExecuted: uniqueSkills.size,
    mostExecuted: state.executedSkills.length > 0
      ? getMostExecutedSkill(state.executedSkills)
      : null
  };
}

function getMostExecutedSkill(executions) {
  const counts = {};
  for (const exec of executions) {
    counts[exec.skillName] = (counts[exec.skillName] || 0) + 1;
  }
  
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
  return {
    skillName: sorted[0][0],
    count: sorted[0][1]
  };
}

function clearSkillHistory() {
  const state = loadSkillToolState();
  
  state.executedSkills = [];
  state.totalExecutions = 0;
  
  saveSkillToolState(state);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'discover':
      const discoverPath = args[1] || SKILLS_DIR;
      console.log(JSON.stringify(discoverSkills(discoverPath), null, 2));
      break;
    case 'execute':
      const execSkillName = args[1];
      const execParams = args[2] ? JSON.parse(args[2]) : {};
      if (!execSkillName) {
        console.log('Usage: node skill-tool-handler.js execute <skillName> [paramsJson]');
        process.exit(1);
      }
      console.log(JSON.stringify(executeSkill(execSkillName, execParams), null, 2));
      break;
    case 'get':
      const getSkillName = args[1];
      if (!getSkillName) {
        console.log('Usage: node skill-tool-handler.js get <skillName>');
        process.exit(1);
      }
      console.log(JSON.stringify(getSkillDefinition(getSkillName), null, 2));
      break;
    case 'list':
      console.log(JSON.stringify(listDiscoveredSkills(), null, 2));
      break;
    case 'history':
      const histLimit = parseInt(args[1], 10) || 20;
      console.log(JSON.stringify(listExecutedSkills(histLimit), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getSkillStats(), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearSkillHistory(), null, 2));
      break;
    default:
      console.log('Usage: node skill-tool-handler.js [discover|execute|get|list|history|stats|clear]');
      process.exit(1);
  }
}

main();

module.exports = {
  discoverSkills,
  getSkillDefinition,
  executeSkill,
  listDiscoveredSkills,
  listExecutedSkills,
  getSkillStats,
  SKILL_TOOL_NAME
};