#!/usr/bin/env node
/**
 * Skills Registry - 渐进式披露（直接翻译自 skills.py）
 *
 * 实现 Anthropic 的三层渐进式披露：
 * Level 1: 启动时扫描 skills/ 目录，只加载 name + description（注入 system prompt）
 * Level 2: Agent 判断需要 → 通过 read_file 工具读取 SKILL.md
 * Level 3: SKILL.md 引用子文件 → Agent 按需读取
 *
 * 关键：AGENT 自己决定何时加载 skill，不是外部代码替它决定。
 */

const fs = require('fs');
const path = require('path');

// 动态路径
const HOME = process.env.HOME || '/Users/mac';
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');
const SKILLS_DIR = path.join(WORKSPACE, 'skills');

/**
 * Skill Registry 类
 */
class SkillRegistry {
  constructor(skillsDir = null) {
    this.skillsDir = skillsDir || SKILLS_DIR;
    this.catalog = [];
    this._discover();
  }

  /**
   * 扫描 skills 目录，只加载元数据（name + description）
   */
  _discover() {
    if (!fs.existsSync(this.skillsDir)) {
      console.log(`[SkillRegistry] No skills directory found at ${this.skillsDir}`);
      return;
    }

    // 递归查找所有 SKILL.md 文件
    const skillFiles = this._findSkillFiles(this.skillsDir);

    for (const skillFile of skillFiles.sort()) {
      const meta = this._parseFrontmatter(skillFile);
      if (meta) {
        const name = meta.name || path.dirname(skillFile).split('/').pop();
        const desc = meta.description || '';
        const relPath = path.relative(this.skillsDir, skillFile);

        this.catalog.push({
          name,
          description: desc,
          path: relPath
        });

        console.log(`[SkillRegistry] Discovered skill: ${name} — ${desc.slice(0, 80)}`);
      }
    }
  }

  /**
   * 递归查找 SKILL.md 文件
   */
  _findSkillFiles(dir) {
    const files = [];
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        // 递归子目录
        files.push(...this._findSkillFiles(fullPath));
      } else if (item.name === 'SKILL.md') {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * 解析 YAML frontmatter
   */
  _parseFrontmatter(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    
    // YAML frontmatter: --- 开始和结束
    const match = text.match(/^---\s*\n(.*?)\n---/);
    if (!match) {
      return null;
    }

    const meta = {};
    for (const line of match[1].split('\n')) {
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        meta[key.trim()] = value;
      }
    }

    return meta;
  }

  /**
   * 构建目录字符串，注入 system prompt
   * 这是 Level 1 渐进式披露 — 只有元数据
   * Agent 看到有什么 skill，可以选择加载
   */
  buildCatalogPrompt() {
    if (this.catalog.length === 0) {
      return '';
    }

    const lines = [
      '\n## Available Skills',
      'The following skills are available. If a skill is relevant to your current task, ',
      'load it by reading its SKILL.md file with the read_file tool. ',
      'Only load skills you actually need — don\'t load them all.\n'
    ];

    for (const skill of this.catalog) {
      lines.push(
        `- **${skill.name}**: ${skill.description}\n  Path: \`skills/${skill.path}\``
      );
    }

    return lines.join('\n') + '\n';
  }

  /**
   * 获取 skill 详情（Level 2）
   */
  getSkillContent(skillPath) {
    const fullPath = path.join(this.skillsDir, skillPath);
    
    if (!fs.existsSync(fullPath)) {
      return `[error] Skill file not found: ${skillPath}`;
    }

    return fs.readFileSync(fullPath, 'utf8');
  }

  /**
   * 列出所有 skills
   */
  listSkills() {
    return this.catalog;
  }

  /**
   * 按 name 搜索 skill
   */
  findSkill(name) {
    return this.catalog.find(s => s.name === name || s.name.toLowerCase().includes(name.toLowerCase()));
  }

  /**
   * 统计信息
   */
  stats() {
    return {
      totalSkills: this.catalog.length,
      skillsDir: this.skillsDir,
      skills: this.catalog.map(s => s.name)
    };
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
Skills Registry - 渐进式披露

用法:
  node skills-registry.js list              列出所有 skills
  node skills-registry.js catalog           生成 catalog prompt
  node skills-registry.js get <path>        获取 skill 内容
  node skills-registry.js find <name>       搜索 skill
  node skills-registry.js stats             统计信息
  node skills-registry.js parse <file>      解析 frontmatter

示例:
  node skills-registry.js list
  node skills-registry.js catalog
  node skills-registry.js get frontend-design/SKILL.md
`);
    process.exit(0);
  }

  const registry = new SkillRegistry();

  if (command === 'list') {
    const skills = registry.listSkills();
    
    console.log(`\n📋 Skills 目录 (${skills.length} 个):\n`);
    for (const skill of skills) {
      console.log(`  ${skill.name.padEnd(30)} ${skill.description.slice(0, 50)}`);
    }
    process.exit(0);
  }

  if (command === 'catalog') {
    const prompt = registry.buildCatalogPrompt();
    
    if (prompt) {
      console.log('\n📋 Catalog Prompt:\n');
      console.log(prompt);
    } else {
      console.log('\n⚠️ 无 skills 目录');
    }
    process.exit(0);
  }

  if (command === 'get') {
    const skillPath = args[1];
    
    if (!skillPath) {
      console.log('Error: 需要 skill 路径');
      process.exit(1);
    }

    const content = registry.getSkillContent(skillPath);
    console.log('\n' + content);
    process.exit(0);
  }

  if (command === 'find') {
    const name = args[1];
    
    if (!name) {
      console.log('Error: 需要 skill 名称');
      process.exit(1);
    }

    const skill = registry.findSkill(name);
    
    if (skill) {
      console.log('\n✅ 找到 Skill:');
      console.log(`  Name: ${skill.name}`);
      console.log(`  Description: ${skill.description}`);
      console.log(`  Path: skills/${skill.path}`);
    } else {
      console.log(`\n❌ 未找到 Skill: ${name}`);
      process.exit(1);
    }
    process.exit(0);
  }

  if (command === 'stats') {
    const stats = registry.stats();
    
    console.log('\n📊 Skills 统计:');
    console.log(`  总数: ${stats.totalSkills}`);
    console.log(`  目录: ${stats.skillsDir}`);
    console.log(`  Skills: ${stats.skills.slice(0, 10).join(', ')}${stats.skills.length > 10 ? '...' : ''}`);
    process.exit(0);
  }

  if (command === 'parse') {
    const filePath = args[1];
    
    if (!filePath) {
      console.log('Error: 需要 SKILL.md 文件路径');
      process.exit(1);
    }

    const meta = registry._parseFrontmatter(filePath);
    
    if (meta) {
      console.log('\n📊 Frontmatter:');
      for (const [key, value] of Object.entries(meta)) {
        console.log(`  ${key}: ${value}`);
      }
    } else {
      console.log('\n⚠️ 无 frontmatter');
    }
    process.exit(0);
  }

  console.log(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// Export
module.exports = { SkillRegistry };

// CLI Entry
if (require.main === module) {
  main();
}