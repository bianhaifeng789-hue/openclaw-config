#!/usr/bin/env node
/**
 * Bundled Skill Files Extractor - 基于 Claude Code bundledSkills.ts
 * 
 * 内置技能文件提取：
 *   - 技能首次调用时提取参考文件到磁盘
 *   - files 字段: Record<string, string> (路径 -> 内容)
 *   - 提取目录: ~/.claude/bundled-skills/<skillName>/
 * 
 * Example files field:
 *   files: {
 *     'README.md': '# Skill docs...',
 *     'examples/basic.ts': '// Example code...'
 *   }
 * 
 * Usage:
 *   node bundled-skill-files.js extract <skillName>
 *   node bundled-skill-files.js list-extracted
 *   node bundled-skill-files.js check <skillName>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const BUNDLED_SKILLS_DIR = process.env.OPENCLAW_BUNDLED_SKILLS_DIR 
  || path.join(os.homedir(), '.openclaw', 'bundled-skills');

/**
 * Get extract directory for a bundled skill
 */
function getBundledSkillExtractDir(skillName) {
  return path.join(BUNDLED_SKILLS_DIR, skillName.replace(/:/g, '-'));
}

/**
 * Extract bundled skill files to disk
 */
async function extractBundledSkillFiles(skillName, files) {
  const extractDir = getBundledSkillExtractDir(skillName);
  
  // Check if already extracted
  if (fs.existsSync(extractDir)) {
    const markerFile = path.join(extractDir, '.extracted');
    if (fs.existsSync(markerFile)) {
      return {
        extracted: false,
        reason: 'already extracted',
        dir: extractDir
      };
    }
  }
  
  // Create directory
  fs.mkdirSync(extractDir, { recursive: true });
  
  // Extract each file
  const results = {
    extracted: true,
    dir: extractDir,
    files: [],
    errors: []
  };
  
  for (const [relativePath, content] of Object.entries(files)) {
    // Validate path (no .. segments, forward slashes only)
    const sanitizedPath = relativePath
      .split('/')
      .filter(segment => segment && segment !== '..')
      .join('/');
    
    if (!sanitizedPath || sanitizedPath.startsWith('..')) {
      results.errors.push({ path: relativePath, error: 'invalid path' });
      continue;
    }
    
    const filePath = path.join(extractDir, sanitizedPath);
    const fileDir = path.dirname(filePath);
    
    try {
      fs.mkdirSync(fileDir, { recursive: true });
      fs.writeFileSync(filePath, content);
      results.files.push({
        path: sanitizedPath,
        absolutePath: filePath,
        size: content.length
      });
    } catch (error) {
      results.errors.push({ path: sanitizedPath, error: error.message });
    }
  }
  
  // Mark as extracted
  const markerFile = path.join(extractDir, '.extracted');
  fs.writeFileSync(markerFile, JSON.stringify({
    skillName,
    extractedAt: Date.now(),
    filesCount: results.files.length
  }, null, 2));
  
  return results;
}

/**
 * Check if skill files are already extracted
 */
function checkBundledSkillExtracted(skillName) {
  const extractDir = getBundledSkillExtractDir(skillName);
  const markerFile = path.join(extractDir, '.extracted');
  
  if (!fs.existsSync(markerFile)) {
    return {
      extracted: false,
      dir: extractDir
    };
  }
  
  try {
    const marker = JSON.parse(fs.readFileSync(markerFile, 'utf8'));
    const files = fs.readdirSync(extractDir).filter(f => f !== '.extracted');
    
    return {
      extracted: true,
      dir: extractDir,
      skillName: marker.skillName,
      extractedAt: marker.extractedAt,
      filesCount: files.length,
      files: files
    };
  } catch {
    return {
      extracted: false,
      dir: extractDir,
      error: 'marker read failed'
    };
  }
}

/**
 * List all extracted bundled skills
 */
function listExtractedSkills() {
  if (!fs.existsSync(BUNDLED_SKILLS_DIR)) {
    return { skills: [], dir: BUNDLED_SKILLS_DIR };
  }
  
  const dirs = fs.readdirSync(BUNDLED_SKILLS_DIR);
  const skills = dirs.map(dir => {
    const check = checkBundledSkillExtracted(dir);
    return {
      name: dir,
      extracted: check.extracted,
      filesCount: check.filesCount || 0,
      extractedAt: check.extractedAt || null
    };
  });
  
  return {
    skills,
    count: skills.length,
    dir: BUNDLED_SKILLS_DIR
  };
}

/**
 * Clear extracted files for a skill
 */
function clearBundledSkillExtract(skillName) {
  const extractDir = getBundledSkillExtractDir(skillName);
  
  if (fs.existsSync(extractDir)) {
    fs.rmSync(extractDir, { recursive: true });
    return { cleared: true, dir: extractDir };
  }
  
  return { cleared: false, reason: 'not found', dir: extractDir };
}

// Example bundled skill definition
const EXAMPLE_SKILL = {
  name: 'example-skill',
  description: 'Example bundled skill with reference files',
  files: {
    'README.md': '# Example Skill\n\nThis is an example bundled skill.\n',
    'examples/basic.js': '// Example usage\nconsole.log("Hello from bundled skill!");\n'
  }
};

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list-extracted';
  
  switch (command) {
    case 'extract':
      const skillName = args[1] || 'example-skill';
      // Use example skill if no real skill provided
      const files = args[2] ? JSON.parse(args[2]) : EXAMPLE_SKILL.files;
      extractBundledSkillFiles(skillName, files).then(result => {
        console.log(JSON.stringify(result, null, 2));
      });
      break;
    case 'check':
      const checkName = args[1];
      if (!checkName) {
        console.log('Usage: node bundled-skill-files.js check <skillName>');
        process.exit(1);
      }
      console.log(JSON.stringify(checkBundledSkillExtracted(checkName), null, 2));
      break;
    case 'list-extracted':
      console.log(JSON.stringify(listExtractedSkills(), null, 2));
      break;
    case 'clear':
      const clearName = args[1];
      if (!clearName) {
        console.log('Usage: node bundled-skill-files.js clear <skillName>');
        process.exit(1);
      }
      console.log(JSON.stringify(clearBundledSkillExtract(clearName), null, 2));
      break;
    default:
      console.log('Usage: node bundled-skill-files.js [extract|check|list-extracted|clear]');
      process.exit(1);
  }
}

main();

module.exports = { 
  extractBundledSkillFiles, 
  checkBundledSkillExtracted, 
  listExtractedSkills,
  getBundledSkillExtractDir
};