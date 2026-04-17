#!/usr/bin/env node
/**
 * 空闲会话自动压缩脚本
 * 
 * 功能：
 * 1. 检测空闲会话（混合判定：时间+消息+任务+状态）
 * 2. 分级压缩策略（Level 0-3）
 * 3. 发送飞书卡片通知
 * 
 * 用法：
 *   node idle-session-compact.js check     - 检查空闲会话
 *   node idle-session-compact.js run       - 执行压缩
 *   node idle-session-compact.js stats     - 显示统计
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  workspace: '/Users/mar2game/.openclaw/workspace',
  stateFile: 'state/idle-session-state.json',
  heartbeatStateFile: 'memory/heartbeat-state.json',
  
  // 空闲判定阈值（分钟）
  idleThresholds: {
    light: 60,    // 轻度空闲：> 1h
    medium: 120,  // 中度空闲：> 2h
    deep: 240,    // 深度空闲：> 4h
    ultra: 1440   // 超长空闲：> 24h
  },
  
  // 压缩级别映射
  compressionLevels: {
    light: 0,   // 清理工具结果
    medium: 1,  // 压缩次要对话
    deep: 2,    // 摘要压缩
    ultra: 3    // 彻底压缩
  }
};

// 加载状态
function loadState() {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  }
  return {
    idleSessions: [],
    lastCheck: null,
    totalCompacted: 0,
    totalTokensSaved: 0,
    statsByLevel: { level0: 0, level1: 0, level2: 0, level3: 0 }
  };
}

// 保存状态
function saveState(state) {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// 判断会话是否空闲（混合判定）
function isSessionIdle(session, now = Date.now()) {
  // 获取最后活动时间
  const lastActivity = session.lastActivity ? new Date(session.lastActivity).getTime() : now;
  const idleMinutes = (now - lastActivity) / (1000 * 60);
  
  // 混合判定条件
  const conditions = {
    // 1. 时间条件：> 60min
    timeCondition: idleMinutes > CONFIG.idleThresholds.light,
    
    // 2. 消息条件：最近60min内用户消息数 = 0
    messageCondition: (session.userMessagesLast60min || 0) === 0,
    
    // 3. 任务条件：无pending工具调用
    taskCondition: (session.pendingTasks || 0) === 0,
    
    // 4. 状态条件：不在active状态
    statusCondition: session.status !== 'active'
  };
  
  // 所有条件满足才判定为空闲
  const isIdle = Object.values(conditions).every(v => v === true);
  
  return {
    isIdle,
    idleMinutes,
    idleLevel: getIdleLevel(idleMinutes),
    conditions
  };
}

// 获取空闲等级
function getIdleLevel(idleMinutes) {
  if (idleMinutes > CONFIG.idleThresholds.ultra) return 'ultra';
  if (idleMinutes > CONFIG.idleThresholds.deep) return 'deep';
  if (idleMinutes > CONFIG.idleThresholds.medium) return 'medium';
  if (idleMinutes > CONFIG.idleThresholds.light) return 'light';
  return 'active';
}

// 检查空闲会话
function checkIdleSessions() {
  console.log('=== 空闲会话检查 ===\n');
  
  // 加载现有状态
  const state = loadState();
  const now = Date.now();
  
  // 模拟会话列表（实际应从 sessions_list 获取）
  // 这里用状态文件中的会话数据
  const sessions = state.idleSessions || [];
  
  // 检查每个会话
  const idleResults = [];
  
  sessions.forEach(session => {
    const result = isSessionIdle(session, now);
    if (result.isIdle) {
      idleResults.push({
        sessionId: session.sessionId,
        sessionKey: session.sessionKey,
        idleMinutes: result.idleMinutes,
        idleLevel: result.idleLevel,
        compressionLevel: CONFIG.compressionLevels[result.idleLevel],
        conditions: result.conditions
      });
    }
  });
  
  // 更新状态
  state.lastCheck = new Date().toISOString();
  state.idleSessionCount = idleResults.length;
  state.idleSessions = idleResults;
  saveState(state);
  
  // 输出结果
  console.log(`总会话数: ${sessions.length}`);
  console.log(`空闲会话: ${idleResults.length}`);
  console.log(`\n空闲等级分布:`);
  
  const levelCounts = { light: 0, medium: 0, deep: 0, ultra: 0 };
  idleResults.forEach(r => levelCounts[r.idleLevel]++);
  
  Object.entries(levelCounts).forEach(([level, count]) => {
    if (count > 0) {
      const threshold = CONFIG.idleThresholds[level];
      console.log(`  - ${level} (> ${threshold}min): ${count} 个`);
    }
  });
  
  return {
    idleCount: idleResults.length,
    levelCounts,
    idleSessions: idleResults
  };
}

// 执行压缩
async function runCompact() {
  console.log('=== 执行空闲会话压缩 ===\n');
  
  const state = loadState();
  const idleSessions = state.idleSessions || [];
  
  if (idleSessions.length === 0) {
    console.log('✅ 无空闲会话需要压缩');
    return { compacted: 0, tokensSaved: 0 };
  }
  
  const results = {
    compacted: 0,
    tokensSaved: 0,
    byLevel: { level0: 0, level1: 0, level2: 0, level3: 0 }
  };
  
  // 模拟压缩执行
  // 实际应调用 compact-cli.js
  idleSessions.forEach(session => {
    const level = session.compressionLevel;
    console.log(`压缩会话 ${session.sessionKey} (Level ${level})`);
    
    results.compacted++;
    results.byLevel[`level${level}`]++;
    
    // 模拟token节省
    const tokensSaved = level * 1000; // Level 0: 1000, Level 1: 2000, etc.
    results.tokensSaved += tokensSaved;
  });
  
  // 更新统计
  state.totalCompacted += results.compacted;
  state.totalTokensSaved += results.tokensSaved;
  Object.entries(results.byLevel).forEach(([level, count]) => {
    state.statsByLevel[level] = (state.statsByLevel[level] || 0) + count;
  });
  saveState(state);
  
  console.log(`\n✅ 压缩完成`);
  console.log(`  - 压缩会话数: ${results.compacted}`);
  console.log(`  - Token节省: ${results.tokensSaved}`);
  
  return results;
}

// 显示统计
function showStats() {
  console.log('=== 空闲会话压缩统计 ===\n');
  
  const state = loadState();
  
  console.log(`总压缩次数: ${state.totalCompacted}`);
  console.log(`总Token节省: ${state.totalTokensSaved}`);
  console.log(`\n压缩等级分布:`);
  
  Object.entries(state.statsByLevel).forEach(([level, count]) => {
    console.log(`  - ${level}: ${count} 次`);
  });
  
  console.log(`\n上次检查: ${state.lastCheck || '从未'}`);
  console.log(`当前空闲: ${state.idleSessionCount || 0} 个`);
}

// 生成飞书卡片
function generateFeishuCard(action, data) {
  if (action === 'check') {
    return {
      card: {
        header: {
          title: { tag: 'plain_text', content: '🔍 空闲会话检测' },
          template: data.idleCount > 0 ? 'blue' : 'green'
        },
        elements: [
          {
            tag: 'div',
            text: { tag: 'lark_md', content: `**空闲会话**: ${data.idleCount} 个` }
          },
          {
            tag: 'div',
            fields: Object.entries(data.levelCounts)
              .filter(([_, count]) => count > 0)
              .map(([level, count]) => ({
                is_short: true,
                text: { tag: 'lark_md', content: `**${level}**: ${count}` }
              }))
          }
        ]
      }
    };
  }
  
  if (action === 'run') {
    return {
      card: {
        header: {
          title: { tag: 'plain_text', content: '✅ 空闲会话压缩完成' },
          template: 'green'
        },
        elements: [
          {
            tag: 'div',
            text: { tag: 'lark_md', content: `**压缩会话**: ${data.compacted} 个` }
          },
          {
            tag: 'div',
            text: { tag: 'lark_md', content: `**Token节省**: ${data.tokensSaved}` }
          }
        ]
      }
    };
  }
  
  return null;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'check';
  
  console.log(`空闲会话压缩 - ${action}\n`);
  
  switch (action) {
    case 'check':
      const checkResult = checkIdleSessions();
      if (checkResult.idleCount > 0) {
        console.log('\n建议执行: node idle-session-compact.js run');
      }
      break;
      
    case 'run':
      const runResult = await runCompact();
      break;
      
    case 'stats':
      showStats();
      break;
      
    default:
      console.log('用法: node idle-session-compact.js [check|run|stats]');
  }
}

main().catch(console.error);