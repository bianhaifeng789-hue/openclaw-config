#!/usr/bin/env node
/**
 * Skill Progressive Disclosure - Skill渐进披露实现
 * 
 * 只在启动时注入目录，Agent自主加载详细内容
 * 
 * 来源：Harness Engineering - skills.py
 * 
 * 三级加载：
 * - Level 1: 目录注入（启动时）
 * - Level 2: Agent自主加载SKILL.md
 * - Level 3: 引用子文件
 * 
 * 用法：
 * node skill-progressive-disclosure.js catalog
 * node skill-progressive-disclosure.js load <skill_name>
 * node skill-progressive-disclosure.js match <prompt>
 */

const fs = require('fs');
const path = require('path');

// Skills目录
const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');

// 截断阈值
const CONTENT_LIMIT = 12000;

/**
 * 构建Skills目录
 * @returns {string} 目录内容
 */
function buildCatalog() {
  const skills = [];
  
  if (!fs.existsSync(SKILLS_DIR)) {
    return 'No skills directory found.';
  }
  
  for (const dir of fs.readdirSync(SKILLS_DIR)) {
    const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
    
    if (fs.existsSync(skillPath)) {
      try {
        const frontmatter = parseFrontmatter(skillPath);
        if (frontmatter.name && frontmatter.description) {
          skills.push({
            name: frontmatter.name,
            desc: frontmatter.description.slice(0, 200)  // 截断描述
          });
        }
      } catch (err) {
        // 忽略解析错误
      }
    }
  }
  
  // 按名称长度排序（降序，最长匹配优先）
  skills.sort((a, b) => b.name.length - a.name.length);
  
  // 格式化目录
  const catalog = skills.map(s => `${s.name}: ${s.desc}`).join('\n');
  
  return `# Available Skills (${skills.length} skills)

${catalog}

---
Use read_skill_file("skills/{name}/SKILL.md") to load detailed guidance when task matches skill description.
`;
}

/**
 * 解析YAML frontmatter
 * @param {string} filePath - 文件路径
 * @returns {Object} frontmatter对象
 */
function parseFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 提取frontmatter
  const match = content.match(/^---\s*\n(.*?)\n---\s*\n/);
  
  if (!match) {
    return {};
  }
  
  const frontmatterText = match[1];
  const frontmatter = {};
  
  // 解析YAML（简化版）
  for (const line of frontmatterText.split('\n')) {
    const keyValue = line.match(/^(\w+):\s*(.+)$/);
    if (keyValue) {
      frontmatter[keyValue[1]] = keyValue[2].trim();
    }
  }
  
  return frontmatter;
}

/**
 * 加载Skill内容
 * @param {string} skillName - Skill名称
 * @returns {Object} Skill内容
 */
function loadSkill(skillName) {
  // 查找Skill目录
  const skillDir = findSkillDir(skillName);
  
  if (!skillDir) {
    return {
      found: false,
      error: `Skill not found: ${skillName}`
    };
  }
  
  const skillPath = path.join(skillDir, 'SKILL.md');
  
  if (!fs.existsSync(skillPath)) {
    return {
      found: false,
      error: `SKILL.md not found: ${skillPath}`
    };
  }
  
  const content = fs.readFileSync(skillPath, 'utf8');
  
  // 移除frontmatter
  const cleanContent = content.replace(/^---\s*\n.*?\n---\s*\n/, '');
  
  // 截断
  const truncated = cleanContent.length > CONTENT_LIMIT ?
    cleanContent.slice(0, CONTENT_LIMIT) + '\n... (truncated)' :
    cleanContent;
  
  return {
    found: true,
    name: skillName,
    path: skillPath,
    content: truncated,
    originalLength: cleanContent.length,
    truncated: cleanContent.length > CONTENT_LIMIT
  };
}

/**
 * 查找Skill目录
 * @param {string} skillName - Skill名称
 * @returns {string|null} 目录路径
 */
function findSkillDir(skillName) {
  // 精确匹配
  const exactPath = path.join(SKILLS_DIR, skillName);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }
  
  // 变体匹配（空格/下划线）
  const variants = [
    skillName.replace(/-/g, '_'),
    skillName.replace(/_/g, '-'),
    skillName.replace(/-/g, ' ')
  ];
  
  for (const variant of variants) {
    const variantPath = path.join(SKILLS_DIR, variant);
    if (fs.existsSync(variantPath)) {
      return variantPath;
    }
  }
  
  return null;
}

/**
 * 匹配Skill到任务
 * @param {string} prompt - 任务描述
 * @returns {Object} 匹配结果
 */
function matchSkill(prompt) {
  const promptLower = prompt.toLowerCase();
  const skills = [];
  
  // 收集所有Skills
  for (const dir of fs.readdirSync(SKILLS_DIR)) {
    const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
    
    if (fs.existsSync(skillPath)) {
      try {
        const frontmatter = parseFrontmatter(skillPath);
        if (frontmatter.name && frontmatter.description) {
          skills.push({
            name: frontmatter.name,
            desc: frontmatter.description.toLowerCase(),
            dir: dir
          });
        }
      } catch (err) {
        // 忽略
      }
    }
  }
  
  // 按名称长度降序排序
  skills.sort((a, b) => b.name.length - a.name.length);
  
  // 匹配策略
  const matches = [];
  
  for (const skill of skills) {
    // 名称匹配
    if (skill.name.length > 5 && promptLower.includes(skill.name.toLowerCase())) {
      matches.push({
        skill: skill.name,
        reason: 'name_match',
        confidence: 1.0
      });
      break;  // 最长匹配优先，只返回一个
    }
    
    // 描述关键词匹配
    const descWords = skill.desc.split(' ').slice(0, 10);
    const matchCount = descWords.filter(w => promptLower.includes(w)).length;
    
    if (matchCount >= 3) {
      matches.push({
        skill: skill.name,
        reason: 'desc_match',
        confidence: matchCount / 10
      });
    }
  }
  
  // 选择最佳匹配
  if (matches.length > 0) {
    matches.sort((a, b) => b.confidence - a.confidence);
    return {
      matched: true,
      best: matches[0],
      all: matches
    };
  }
  
  return {
    matched: false,
    all: []
  };
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'catalog') {
    const catalog = buildCatalog();
    console.log(catalog);
    
  } else if (command === 'load') {
    const skillName = args[1];
    
    if (!skillName) {
      console.error('用法: node skill-progressive-disclosure.js load <skill_name>');
      process.exit(1);
    }
    
    const result = loadSkill(skillName);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.found) {
      console.log(`\n✅ Skill加载成功: ${result.name}`);
    }
    
  } else if (command === 'match') {
    const prompt = args[1];
    
    if (!prompt) {
      console.error('用法: node skill-progressive-disclosure.js match <prompt>');
      process.exit(1);
    }
    
    const result = matchSkill(prompt);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.matched) {
      console.log(`\n✅ 最佳匹配: ${result.best.skill}`);
    }
    
  } else if (command === 'test') {
    // 测试目录构建
    const catalog = buildCatalog();
    const skillCount = (catalog.match(/Available Skills \((\d+)/) || [])[1];
    console.log('目录构建测试:', skillCount > 0 ? `✅ (${skillCount} skills)` : '❌');
    
    // 测试加载
    const testSkill = 'anxiety-detection';
    const loadResult = loadSkill(testSkill);
    console.log('Skill加载测试:', loadResult.found ? `✅ (${loadResult.name})` : '❌');
    
    // 测试匹配
    const testPrompt = 'analyze chess position from image';
    const matchResult = matchSkill(testPrompt);
    console.log('Skill匹配测试:', matchResult.matched ? `✅ (${matchResult.best.skill})` : '❌');
    
  } else {
    console.log(`
Skill Progressive Disclosure - 渐进披露

用法:
  node skill-progressive-disclosure.js catalog           构建目录
  node skill-progressive-disclosure.js load <skill_name> 加载Skill
  node skill-progressive-disclosure.js match <prompt>    匹配Skill
  node skill-progressive-disclosure.js test              运行测试

三级加载:
  Level 1: 目录注入（启动时，~2k chars）
  Level 2: Agent自主加载SKILL.md
  Level 3: 引用子文件
`);
  }
}

// 导出函数
module.exports = {
  buildCatalog,
  parseFrontmatter,
  loadSkill,
  findSkillDir,
  matchSkill,
  CONTENT_LIMIT
};

// CLI入口
if (require.main === module) {
  main();
}