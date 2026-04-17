#!/usr/bin/env node
/**
 * Skills Activation Monitor
 * 
 * Tracks which Skills are actually activated/triggered
 * Reports stats and suggests improvements
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = '/Users/mar2game/.openclaw/workspace/skills';
const STATE_FILE = '/Users/mar2game/.openclaw/workspace/state/skill-activation-state.json';

function analyzeSkills() {
  const skills = fs.readdirSync(SKILLS_DIR);
  const stats = {
    totalSkills: skills.length,
    withTriggers: 0,
    withoutTriggers: 0,
    noDescription: 0,
    topCategories: {},
    timestamp: Date.now()
  };
  
  for (const skill of skills) {
    const skillPath = path.join(SKILLS_DIR, skill, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    
    const content = fs.readFileSync(skillPath, 'utf-8');
    
    // Check if has "Use when"
    if (content.includes('Use when')) {
      stats.withTriggers++;
    } else {
      stats.withoutTriggers++;
    }
    
    // Check if has description
    if (!content.includes('description:')) {
      stats.noDescription++;
    }
    
    // Extract category from skill name
    const category = skill.split('-')[0];
    stats.topCategories[category] = (stats.topCategories[category] || 0) + 1;
  }
  
  return stats;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--stats')) {
    const stats = analyzeSkills();
    console.log(JSON.stringify(stats, null, 2));
    
    // Save state
    fs.writeFileSync(STATE_FILE, JSON.stringify(stats, null, 2));
    return;
  }
  
  if (args.includes('--check')) {
    if (fs.existsSync(STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      const hourAgo = Date.now() - 3600000;
      
      if (state.timestamp > hourAgo) {
        console.log(`✅ Last check: ${Math.round((Date.now() - state.timestamp) / 60000)}min ago`);
        console.log(`📊 Skills with triggers: ${state.withTriggers}/${state.totalSkills}`);
        console.log(`⚠️ Skills without triggers: ${state.withoutTriggers}`);
        return;
      }
    }
    
    console.log('❌ No recent activation data. Run --stats first.');
    return;
  }
  
  // Default: help
  console.log(`
Skills Activation Monitor

Usage:
  node skill-activation-monitor.js --stats    # Analyze all skills
  node skill-activation-monitor.js --check    # Check last stats
`);
}

main();