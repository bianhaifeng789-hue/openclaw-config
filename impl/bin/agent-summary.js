#!/usr/bin/env node
/**
 * Agent Summary Service - 基于 Claude Code AgentSummary
 * 
 * Agent 摘要生成：
 *   - Agent 活动总结
 *   - 里程碑记录
 *   - 性能指标
 * 
 * Usage:
 *   node agent-summary.js generate <agentId>
 *   node agent-summary.js history <agentId>
 *   node agent-summary.js stats
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'agent-summary');
const SUMMARIES_DIR = path.join(STATE_DIR, 'summaries');

function loadAgentSummary(agentId) {
  const summaryFile = path.join(SUMMARIES_DIR, `${agentId}.json`);
  
  if (!fs.existsSync(summaryFile)) {
    return {
      agentId,
      summaries: [],
      milestones: [],
      stats: {
        totalSessions: 0,
        totalToolCalls: 0,
        avgSessionDuration: 0
      }
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  } catch {
    return {
      agentId,
      summaries: [],
      milestones: [],
      stats: {
        totalSessions: 0,
        totalToolCalls: 0,
        avgSessionDuration: 0
      }
    };
  }
}

function saveAgentSummary(agentId, summary) {
  fs.mkdirSync(SUMMARIES_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(SUMMARIES_DIR, `${agentId}.json`),
    JSON.stringify(summary, null, 2)
  );
}

function generateAgentSummary(agentId, sessionData = {}) {
  const agentSummary = loadAgentSummary(agentId);
  
  const summary = {
    id: `summary_${Date.now()}`,
    agentId,
    timestamp: Date.now(),
    sessionData,
    toolCalls: sessionData.toolCalls || 0,
    duration: sessionData.duration || 0,
    tasksCompleted: sessionData.tasksCompleted || 0,
    errors: sessionData.errors || 0,
    highlights: sessionData.highlights || []
  };
  
  agentSummary.summaries.push(summary);
  
  // Update stats
  agentSummary.stats.totalSessions++;
  agentSummary.stats.totalToolCalls += summary.toolCalls;
  
  const totalDuration = agentSummary.summaries.reduce((sum, s) => sum + s.duration, 0);
  agentSummary.stats.avgSessionDuration = totalDuration / agentSummary.stats.totalSessions;
  
  // Keep only last 50 summaries
  if (agentSummary.summaries.length > 50) {
    agentSummary.summaries = agentSummary.summaries.slice(-50);
  }
  
  saveAgentSummary(agentId, agentSummary);
  
  return {
    generated: true,
    summary,
    stats: agentSummary.stats
  };
}

function addMilestone(agentId, milestone) {
  const agentSummary = loadAgentSummary(agentId);
  
  const milestoneEntry = {
    id: `milestone_${Date.now()}`,
    agentId,
    timestamp: Date.now(),
    milestone,
    category: milestone.category || 'general'
  };
  
  agentSummary.milestones.push(milestoneEntry);
  
  // Keep only last 20 milestones
  if (agentSummary.milestones.length > 20) {
    agentSummary.milestones = agentSummary.milestones.slice(-20);
  }
  
  saveAgentSummary(agentId, agentSummary);
  
  return {
    added: true,
    milestone: milestoneEntry,
    totalMilestones: agentSummary.milestones.length
  };
}

function getAgentHistory(agentId, limit = 20) {
  const agentSummary = loadAgentSummary(agentId);
  
  return {
    agentId,
    summaries: agentSummary.summaries.slice(-limit),
    milestones: agentSummary.milestones,
    stats: agentSummary.stats
  };
}

function getAgentStats(agentId) {
  const agentSummary = loadAgentSummary(agentId);
  
  const successRate = agentSummary.stats.totalSessions > 0
    ? (agentSummary.summaries.filter(s => s.errors === 0).length / agentSummary.stats.totalSessions * 100)
    : 0;
  
  return {
    agentId,
    stats: agentSummary.stats,
    successRate: successRate.toFixed(1) + '%',
    milestonesCount: agentSummary.milestones.length,
    summariesCount: agentSummary.summaries.length,
    lastActivity: agentSummary.summaries.length > 0
      ? agentSummary.summaries[agentSummary.summaries.length - 1].timestamp
      : null
  };
}

function getAllAgentStats() {
  if (!fs.existsSync(SUMMARIES_DIR)) {
    return { agents: [], count: 0 };
  }
  
  const agents = fs.readdirSync(SUMMARIES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const agentId = f.replace('.json', '');
      try {
        const summary = JSON.parse(fs.readFileSync(path.join(SUMMARIES_DIR, f), 'utf8'));
        return {
          agentId,
          stats: summary.stats,
          summariesCount: summary.summaries.length
        };
      } catch {
        return null;
      }
    })
    .filter(a => a !== null);
  
  return {
    agents,
    count: agents.length,
    totalSessions: agents.reduce((sum, a) => sum + a.stats.totalSessions, 0),
    totalToolCalls: agents.reduce((sum, a) => sum + a.stats.totalToolCalls, 0)
  };
}

function clearAgentSummary(agentId) {
  const agentSummary = {
    agentId,
    summaries: [],
    milestones: [],
    stats: {
      totalSessions: 0,
      totalToolCalls: 0,
      avgSessionDuration: 0
    },
    clearedAt: Date.now()
  };
  
  saveAgentSummary(agentId, agentSummary);
  
  return {
    cleared: true,
    agentId
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'stats';
  
  switch (command) {
    case 'generate':
      const genAgentId = args[1] || 'dispatcher';
      const sessionDataJson = args[2] ? JSON.parse(args[2]) : {};
      console.log(JSON.stringify(generateAgentSummary(genAgentId, sessionDataJson), null, 2));
      break;
    case 'milestone':
      const mileAgentId = args[1] || 'dispatcher';
      const mileJson = args[2] ? JSON.parse(args[2]) : { milestone: 'Achieved goal' };
      console.log(JSON.stringify(addMilestone(mileAgentId, mileJson), null, 2));
      break;
    case 'history':
      const histAgentId = args[1] || 'dispatcher';
      const histLimit = parseInt(args[2], 10) || 20;
      console.log(JSON.stringify(getAgentHistory(histAgentId, histLimit), null, 2));
      break;
    case 'stats':
      const statsAgentId = args[1];
      if (statsAgentId) {
        console.log(JSON.stringify(getAgentStats(statsAgentId), null, 2));
      } else {
        console.log(JSON.stringify(getAllAgentStats(), null, 2));
      }
      break;
    case 'clear':
      const clearAgentId = args[1] || 'dispatcher';
      console.log(JSON.stringify(clearAgentSummary(clearAgentId), null, 2));
      break;
    default:
      console.log('Usage: node agent-summary.js [generate|milestone|history|stats|clear]');
      process.exit(1);
  }
}

main();

module.exports = {
  generateAgentSummary,
  addMilestone,
  getAgentHistory,
  getAgentStats,
  getAllAgentStats
};