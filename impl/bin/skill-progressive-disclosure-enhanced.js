#!/usr/bin/env node
/**
 * Skill Progressive Disclosure Enhanced - 增强版渐进披露
 * 
 * 完善匹配算法，支持多种匹配策略：
 * 1. 名称精确匹配（最长优先）
 * 2. 名称变体匹配（空格/下划线/连字符）
 * 3. 描述关键词匹配（TF-IDF权重）
 * 4. 任务类型匹配（分类匹配）
 * 5. 多策略融合评分
 * 
 * 来源：Harness Engineering + OpenClaw优化
 * 
 * 用法：
 * node skill-progressive-disclosure-enhanced.js catalog
 * node skill-progressive-disclosure-enhanced.js match <prompt> [--verbose]
 * node skill-progressive-disclosure-enhanced.js load <skill_name>
 * node skill-progressive-disclosure-enhanced.js test
 */

const fs = require('fs');
const path = require('path');

// Skills目录
const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');

// 备用Skills目录（绝对路径）
const SKILLS_DIR_ALT = '/Users/mar2game/.openclaw/workspace/skills';

// 截断阈值
const CONTENT_LIMIT = 12000;

// 任务类型分类
const TASK_CATEGORIES = {
  'security': ['xss', 'password', 'crack', 'vulnerable', 'encrypt', 'decrypt', 'hack', 'security'],
  'ml': ['train', 'model', 'neural', 'machine learning', 'deep learning', 'ai', 'gpt', 'bert', 'transformer'],
  'data': ['database', 'sql', 'query', 'data', 'analyze', 'statistics', 'distribution', 'optimize'],
  'system': ['vm', 'qemu', 'docker', 'terminal', 'ssh', 'server', 'service', 'process'],
  'image': ['image', 'render', 'ray', 'path-tracing', 'visual', 'graph', 'ocr', 'video'],
  'science': ['raman', 'spectrum', 'peak', 'fitting', 'circuit', 'physics', 'chemistry'],
  'game': ['chess', 'game', 'board', 'move', 'strategy', 'win'],
  'build': ['compile', 'build', 'install', 'depend', 'make', 'cmake', 'gcc'],
  'git': ['git', 'repo', 'branch', 'commit', 'merge', 'pull', 'push'],
  'web': ['html', 'javascript', 'css', 'frontend', 'web', 'browser', 'dom']
};

/**
 * 构建Skills目录（带分类）
 * @returns {Object} 目录对象
 */
function buildEnhancedCatalog() {
  const skills = [];
  
  // 确定Skills目录
  let skillsDir = null;
  if (fs.existsSync(SKILLS_DIR)) {
    skillsDir = SKILLS_DIR;
  } else if (fs.existsSync(SKILLS_DIR_ALT)) {
    skillsDir = SKILLS_DIR_ALT;
  } else {
    console.error('Skills目录不存在:', SKILLS_DIR, '或', SKILLS_DIR_ALT);
    return {skills: [], catalog: 'No skills directory found.', count: 0, categories: {}};
  }
  
  console.log('使用Skills目录:', skillsDir);
  
  for (const dir of fs.readdirSync(skillsDir)) {
    const skillPath = path.join(skillsDir, dir, 'SKILL.md');
    
    if (fs.existsSync(skillPath)) {
      try {
        const content = fs.readFileSync(skillPath, 'utf8');
        const frontmatter = parseFrontmatter(skillPath);
        if (frontmatter.name && frontmatter.description) {
          // 提取关键词
          const keywords = extractKeywords(frontmatter.name + ' ' + frontmatter.description);
          
          // 分类任务类型
          const category = categorizeTask(frontmatter.name + ' ' + frontmatter.description);
          
          skills.push({
            name: frontmatter.name,
            desc: frontmatter.description.slice(0, 200),
            dir: dir,
            keywords: keywords,
            category: category,
            weight: calculateSkillWeight(frontmatter.name, frontmatter.description)
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
  const catalogText = formatCatalog(skills);
  
  return {
    skills: skills,
    catalog: catalogText,
    count: skills.length,
    categories: countByCategory(skills)
  };
}

/**
 * 提取关键词（TF-IDF候选）
 * @param {string} text - 文本
 * @returns {Array} 关键词列表
 */
function extractKeywords(text) {
  // 移除停用词
  const stopwords = ['the', 'a', 'an', 'is', 'are', 'for', 'to', 'of', 'and', 'in', 'on', 'with', 'that', 'this', 'it', 'as', 'be', 'by', 'from', 'or'];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.includes(w));
  
  // 去重并返回
  return [...new Set(words)].slice(0, 20);
}

/**
 * 分类任务类型
 * @param {string} text - 文本
 * @returns {string} 任务类型
 */
function categorizeTask(text) {
  const textLower = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(TASK_CATEGORIES)) {
    if (keywords.some(k => textLower.includes(k))) {
      return category;
    }
  }
  
  return 'general';
}

/**
 * 计算Skill权重（基于重要性）
 * @param {string} name - Skill名称
 * @param {string} desc - Skill描述
 * @returns {number} 权重值
 */
function calculateSkillWeight(name, desc) {
  let weight = 1.0;
  
  // P0 Skills加权
  const p0Skills = ['anxiety-detection', 'pre-exit-gate', 'smart-truncate'];
  if (p0Skills.includes(name)) {
    weight += 0.5;
  }
  
  // 描述长度加权（更详细的Skill可能更重要）
  if (desc.length > 200) {
    weight += 0.2;
  }
  
  // 关键词数量加权
  const keywords = extractKeywords(name + ' ' + desc);
  if (keywords.length > 10) {
    weight += 0.1;
  }
  
  return weight;
}

/**
 * 按分类统计
 * @param {Array} skills - Skills列表
 * @returns {Object} 分类统计
 */
function countByCategory(skills) {
  const counts = {};
  
  for (const skill of skills) {
    counts[skill.category] = (counts[skill.category] || 0) + 1;
  }
  
  return counts;
}

/**
 * 格式化目录
 * @param {Array} skills - Skills列表
 * @returns {string} 目录文本
 */
function formatCatalog(skills) {
  const lines = skills.map(s => `${s.name}: ${s.desc} [${s.category}]`);
  
  return `# Available Skills (${skills.length} skills)

${lines.join('\n')}

---
Use read_skill_file("skills/{name}/SKILL.md") to load detailed guidance when task matches skill description.
`;
}

/**
 * 智能匹配Skill（多策略融合）
 * @param {string} prompt - 任务描述
 * @returns {Object} 匹配结果
 */
function matchSkillEnhanced(prompt) {
  const catalog = buildEnhancedCatalog();
  const promptLower = prompt.toLowerCase();
  
  // 提取prompt关键词和分类
  const promptKeywords = extractKeywords(prompt);
  const promptCategory = categorizeTask(prompt);
  
  // 多策略匹配
  const matches = [];
  
  for (const skill of catalog.skills) {
    const scores = {
      nameMatch: 0,
      variantMatch: 0,
      keywordMatch: 0,
      categoryMatch: 0,
      total: 0
    };
    
    // 策略1: 名称精确匹配
    if (skill.name.length > 5 && promptLower.includes(skill.name.toLowerCase())) {
      scores.nameMatch = 1.0;
    }
    
    // 策略2: 名称变体匹配
    const variants = generateVariants(skill.name);
    for (const variant of variants) {
      if (promptLower.includes(variant.toLowerCase())) {
        scores.variantMatch = 0.8;
        break;
      }
    }
    
    // 策略3: 关键词匹配（Jaccard相似度）
    const intersection = promptKeywords.filter(k => skill.keywords.includes(k));
    const union = [...new Set([...promptKeywords, ...skill.keywords])];
    scores.keywordMatch = intersection.length / union.length;
    
    // 策略4: 分类匹配
    if (skill.category === promptCategory) {
      scores.categoryMatch = 0.6;
    }
    
    // 策略5: 描述关键词匹配
    const descWords = skill.desc.toLowerCase().split(/\s+/);
    const descMatchCount = descWords.filter(w => promptLower.includes(w)).length;
    if (descMatchCount >= 3) {
      scores.keywordMatch += descMatchCount / descWords.length * 0.5;
    }
    
    // 计算总分（加权融合）
    scores.total = (
      scores.nameMatch * 1.0 +
      scores.variantMatch * 0.8 +
      scores.keywordMatch * 0.7 +
      scores.categoryMatch * 0.5
    ) * skill.weight;
    
    // 记录匹配结果（总分>0.3）
    if (scores.total > 0.3) {
      matches.push({
        skill: skill.name,
        scores: scores,
        confidence: scores.total,
        reason: getMatchReason(scores),
        keywordsMatched: intersection
      });
    }
  }
  
  // 按置信度排序
  matches.sort((a, b) => b.confidence - a.confidence);
  
  // 返回结果
  if (matches.length > 0) {
    return {
      matched: true,
      best: matches[0],
      top5: matches.slice(0, 5),
      all: matches,
      promptAnalysis: {
        keywords: promptKeywords,
        category: promptCategory
      }
    };
  }
  
  return {
    matched: false,
    all: [],
    promptAnalysis: {
      keywords: promptKeywords,
      category: promptCategory
    },
    suggestion: 'No skill matches found. Try using general problem-solving approach.'
  };
}

/**
 * 生成名称变体
 * @param {string} name - Skill名称
 * @returns {Array} 变体列表
 */
function generateVariants(name) {
  return [
    name,
    name.replace(/-/g, '_'),
    name.replace(/-/g, ' '),
    name.replace(/_/g, '-'),
    name.replace(/_/g, ' '),
    name.split('-').join(''),
    name.split('_').join('')
  ];
}

/**
 * 获取匹配原因
 * @param {Object} scores - 分数对象
 * @returns {string} 匹配原因
 */
function getMatchReason(scores) {
  const reasons = [];
  
  if (scores.nameMatch > 0) reasons.push('exact_name');
  if (scores.variantMatch > 0) reasons.push('name_variant');
  if (scores.keywordMatch > 0.3) reasons.push('keywords');
  if (scores.categoryMatch > 0) reasons.push('category');
  
  return reasons.join('+') || 'partial_match';
}

/**
 * 解析YAML frontmatter
 * @param {string} filePath - 文件路径
 * @returns {Object} frontmatter对象
 */
function parseFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 提取frontmatter
    const match = content.match(/^---\s*\n(.*?)\n---\s*\n/s);
    
    if (!match) {
      // 没有frontmatter，尝试从文件名推断
      const dirName = path.basename(path.dirname(filePath));
      return {
        name: dirName,
        description: dirName
      };
    }
    
    const frontmatterText = match[1];
    const frontmatter = {};
    
    // 解析YAML（简化版）
    for (const line of frontmatterText.split('\n')) {
      const keyValue = line.match(/^(\w+):\s*(.+)$/);
      if (keyValue) {
        frontmatter[keyValue[1]] = keyValue[2].trim().replace(/^['"]|['"]$/g, '');
      }
    }
    
    return frontmatter;
  } catch (err) {
    console.error('解析失败:', filePath, err.message);
    return {};
  }
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
  
  // 变体匹配
  const variants = generateVariants(skillName);
  
  for (const variant of variants) {
    const variantPath = path.join(SKILLS_DIR, variant);
    if (fs.existsSync(variantPath)) {
      return variantPath;
    }
  }
  
  return null;
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'catalog') {
    const result = buildEnhancedCatalog();
    console.log(result.catalog);
    console.log('\n=== 分类统计 ===');
    console.log(JSON.stringify(result.categories, null, 2));
    
  } else if (command === 'match') {
    const prompt = args[1];
    const verbose = args.includes('--verbose');
    
    if (!prompt) {
      console.error('用法: node skill-progressive-disclosure-enhanced.js match <prompt> [--verbose]');
      process.exit(1);
    }
    
    const result = matchSkillEnhanced(prompt);
    
    if (verbose) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.matched) {
        console.log(`✅ 最佳匹配: ${result.best.skill} (confidence: ${result.best.confidence.toFixed(2)})`);
        console.log(`匹配原因: ${result.best.reason}`);
        console.log(`关键词匹配: ${result.best.keywordsMatched.join(', ')}`);
        
        if (result.top5.length > 1) {
          console.log('\n其他候选:');
          result.top5.slice(1, 5).forEach(m => {
            console.log(`  - ${m.skill} (${m.confidence.toFixed(2)})`);
          });
        }
      } else {
        console.log('❌ 未找到匹配Skill');
        console.log(`Prompt分类: ${result.promptAnalysis.category}`);
        console.log(`提取关键词: ${result.promptAnalysis.keywords.join(', ')}`);
      }
    }
    
  } else if (command === 'load') {
    const skillName = args[1];
    
    if (!skillName) {
      console.error('用法: node skill-progressive-disclosure-enhanced.js load <skill_name>');
      process.exit(1);
    }
    
    const result = loadSkill(skillName);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.found) {
      console.log(`\n✅ Skill加载成功: ${result.name}`);
    }
    
  } else if (command === 'test') {
    // 测试目录构建
    const catalog = buildEnhancedCatalog();
    console.log('目录构建测试:', catalog.count > 0 ? `✅ (${catalog.count} skills)` : '❌');
    console.log('分类统计测试:', Object.keys(catalog.categories).length > 0 ? '✅' : '❌');
    
    // 测试加载
    const testSkill = 'anxiety-detection';
    const loadResult = loadSkill(testSkill);
    console.log('Skill加载测试:', loadResult.found ? `✅ (${loadResult.name})` : '❌');
    
    // 测试匹配 - security类
    const prompt1 = 'analyze chess position from image';
    const match1 = matchSkillEnhanced(prompt1);
    console.log('Chess匹配测试:', match1.matched ? `✅ (${match1.best.skill})` : '❌');
    
    // 测试匹配 - ML类
    const prompt2 = 'train machine learning model with tensorflow';
    const match2 = matchSkillEnhanced(prompt2);
    console.log('ML匹配测试:', match2.matched ? `✅ (${match2.best.skill})` : '❌');
    
    // 测试匹配 - security类
    const prompt3 = 'crack password hash from encrypted file';
    const match3 = matchSkillEnhanced(prompt3);
    console.log('Security匹配测试:', match3.matched ? `✅ (${match3.best.skill})` : '❌');
    
    // 测试匹配 - 焦虑检测
    const prompt4 = 'detect anxiety signals and trigger reset';
    const match4 = matchSkillEnhanced(prompt4);
    console.log('焦虑检测匹配测试:', match4.matched && match4.best.skill === 'anxiety-detection' ? '✅' : '❌');
    
  } else {
    console.log(`
Skill Progressive Disclosure Enhanced - 增强版渐进披露

用法:
  node skill-progressive-disclosure-enhanced.js catalog           构建增强目录
  node skill-progressive-disclosure-enhanced.js match <prompt> [--verbose]  智能匹配
  node skill-progressive-disclosure-enhanced.js load <skill_name> 加载Skill
  node skill-progressive-disclosure-enhanced.js test              运行测试

匹配策略:
  1. 名称精确匹配（权重: 1.0）
  2. 名称变体匹配（权重: 0.8）
  3. 关键词匹配（权重: 0.7, Jaccard相似度）
  4. 分类匹配（权重: 0.5）
  5. 多策略融合评分

任务分类:
  security, ml, data, system, image, science, game, build, git, web, general
`);
  }
}

// 导出函数
module.exports = {
  buildEnhancedCatalog,
  matchSkillEnhanced,
  extractKeywords,
  categorizeTask,
  generateVariants,
  loadSkill,
  findSkillDir,
  parseFrontmatter,
  TASK_CATEGORIES,
  CONTENT_LIMIT
};

// CLI入口
if (require.main === module) {
  main();
}