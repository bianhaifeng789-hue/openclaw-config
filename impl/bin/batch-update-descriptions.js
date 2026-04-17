#!/usr/bin/env node
/**
 * Batch update SKILL.md files to add "Use when" trigger phrases
 * 
 * Usage:
 *   node batch-update-descriptions.js [skill-name]
 *   node batch-update-descriptions.js --all
 *   node batch-update-descriptions.js --priority
 */

const fs = require('fs');
const path = require('path');

// Priority skills to update first
const PRIORITY_SKILLS = [
  { name: 'agent-context-manager', trigger: 'Use when spawning agents, managing concurrent sessions, or needing context isolation.' },
  { name: 'analytics-telemetry', trigger: 'Use when tracking session events, monitoring performance, or reporting usage statistics.' },
  { name: 'auto-dream', trigger: 'Use when sessionCount >= 5, consolidation needed, or reviewing recent sessions.' },
  { name: 'auto-compact-service', trigger: 'Use when context pressure high, needs compaction, or approaching token limits.' },
  { name: 'abort-signal-utils', trigger: 'Use when combining abort signals, adding timeout controls, or managing cleanup.' },
  { name: 'activity-manager', trigger: 'Use when managing user activity, tracking idle time, or handling away/return states.' },
  { name: 'api-limits', trigger: 'Use when checking rate limits, managing API quotas, or preventing throttling.' },
  { name: 'argument-substitution', trigger: 'Use when substituting arguments, binding parameters, or resolving placeholders.' },
  { name: 'away-summary', trigger: 'Use when user returns after absence, generating "while you were away" summary.' },
  { name: 'background-tasks', trigger: 'Use when spawning background work, managing long-running tasks, or checking task status.' },
  { name: 'compact-message-grouping', trigger: 'Use when grouping messages, compacting context, or reducing token usage.' },
  { name: 'context-collapse', trigger: 'Use when collapsing context, summarizing history, or compressing messages.' },
  { name: 'deferred-tool-search', trigger: 'Use when searching deferred tools, loading skills on-demand, or finding missing tools.' },
  { name: 'fast-mode', trigger: 'Use when enabling fast mode, reducing thinking, or optimizing simple queries.' },
  { name: 'file-history', trigger: 'Use when checking file history, checkpointing changes, or rolling back edits.' },
  { name: 'fork-subagent-pattern', trigger: 'Use when spawning forked agents, isolating work, or parallel execution.' },
  { name: 'graceful-shutdown', trigger: 'Use when shutting down, cleaning up resources, or handling SIGTERM/SIGINT.' },
  { name: 'heartbeat-task-visualizer', trigger: 'Use when visualizing heartbeat tasks, showing active work, or monitoring health.' },
  { name: 'memory-maintenance', trigger: 'Use when maintaining memory, extracting from daily notes, or updating MEMORY.md.' },
  { name: 'rate-limit-check', trigger: 'Use when checking rate limits, monitoring API usage, or preventing exhaustion.' },
];

function updateSkill(skillPath, triggerPhrase) {
  const content = fs.readFileSync(skillPath, 'utf-8');
  
  // Check if already has "Use when"
  if (content.includes('Use when')) {
    console.log(`  ⏭️  Already has "Use when": ${skillPath}`);
    return false;
  }
  
  // Find description line
  const lines = content.split('\n');
  let descriptionLineIndex = -1;
  let descriptionContent = '';
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('description:')) {
      descriptionLineIndex = i;
      descriptionContent = lines[i];
      break;
    }
  }
  
  if (descriptionLineIndex === -1) {
    console.log(`  ❌ No description found: ${skillPath}`);
    return false;
  }
  
  // Extract current description
  const currentDesc = descriptionContent.match(/description:\s*"(.+?)"/)?.[1] || 
                      descriptionContent.match(/description:\s*'(.+?)'/)?.[1] ||
                      descriptionContent.replace('description:', '').trim();
  
  // Add "Use when" trigger
  const newDesc = `${currentDesc} ${triggerPhrase}`;
  const newLine = `description: "${newDesc}"`;
  
  // Replace line
  lines[descriptionLineIndex] = newLine;
  
  // Write back
  fs.writeFileSync(skillPath, lines.join('\n'), 'utf-8');
  console.log(`  ✅ Updated: ${skillPath}`);
  return true;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--all')) {
    console.log('⚠️  --all mode: Updating ALL skills missing "Use when"');
    const skillsDir = '/Users/mar2game/.openclaw/workspace/skills';
    const allSkills = fs.readdirSync(skillsDir).filter(d => 
      fs.existsSync(path.join(skillsDir, d, 'SKILL.md'))
    );
    
    let updated = 0;
    for (const skill of allSkills) {
      const skillPath = path.join(skillsDir, skill, 'SKILL.md');
      // Generic trigger for unknown skills
      const trigger = `Use when [${skill.replace(/-/g, ' ')}] is needed.`;
      if (updateSkill(skillPath, trigger)) updated++;
    }
    console.log(`\n📊 Total updated: ${updated}/${allSkills.length}`);
    return;
  }
  
  if (args.includes('--priority')) {
    console.log('🎯 Updating priority skills...');
    const skillsDir = '/Users/mar2game/.openclaw/workspace/skills';
    let updated = 0;
    
    for (const { name, trigger } of PRIORITY_SKILLS) {
      const skillPath = path.join(skillsDir, name, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        if (updateSkill(skillPath, trigger)) updated++;
      } else {
        console.log(`  ⚠️  Not found: ${name}`);
      }
    }
    
    console.log(`\n📊 Total updated: ${updated}/${PRIORITY_SKILLS.length}`);
    return;
  }
  
  // Single skill update
  if (args[0]) {
    const skillName = args[0];
    const trigger = args[1] || `Use when [${skillName.replace(/-/g, ' ')}] is needed.`;
    const skillPath = `/Users/mar2game/.openclaw/workspace/skills/${skillName}/SKILL.md`;
    
    if (fs.existsSync(skillPath)) {
      updateSkill(skillPath, trigger);
    } else {
      console.log(`❌ Skill not found: ${skillName}`);
    }
    return;
  }
  
  // Default: show help
  console.log(`
Usage:
  node batch-update-descriptions.js --priority    # Update 20 priority skills
  node batch-update-descriptions.js --all         # Update ALL skills (504+)
  node batch-update-descriptions.js <skill-name>  # Update single skill
  
Examples:
  node batch-update-descriptions.js --priority
  node batch-update-descriptions.js agent-context-manager
`);
}

main();