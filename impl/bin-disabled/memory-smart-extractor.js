#!/usr/bin/env node
/**
 * Memory Smart Extractor - 记忆智能提取器
 * 
 * 功能：
 * 1. 智能触发策略（关键词/长度/信号/时间）
 * 2. 优先级区分（高/中/低）
 * 3. 自动提取重要决策
 * 
 * 用法：
 *   node memory-smart-extractor.js analyze <session-file>
 *   node memory-smart-extractor.js extract
 *   node memory-smart-extractor.js stats
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 配置
const CONFIG = {
  workspace: '/Users/mar2game/.openclaw/workspace',
  stateFile: 'state/memory-smart-extractor-state.json',
  
  // 智能触发策略
  triggers: {
    // 时间触发（兜底）
    time: { interval: 12 * 60 * 60 * 1000 },  // 12h
    
    // 关键词触发（重要决策）
    keyword: {
      patterns: ['决定', '决策', '选择', '重要', '优化', '关键', '方案', '计划'],
      priority: 'high',
      cooldown: 60 * 60 * 1000  // 1h 冷却
    },
    
    // 会话长度触发（长对话）
    length: {
      threshold: 50,  // 50 条消息
      priority: 'medium',
      cooldown: 2 * 60 * 60 * 1000  // 2h 冷却
    },
    
    // 用户信号触发（纠正/确认）
    signal: {
      corrections: ['不对', '错误', '重试', '不对', '错了'],
      reinforcements: ['对', '正确', '正是', '完美', '好的'],
      priority: 'high',
      cooldown: 30 * 60 * 1000  // 30min 冷却
    }
  }
};

// 加载状态
function loadState() {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  }
  return {
    lastExtraction: null,
    totalExtractions: 0,
    triggerStats: { time: 0, keyword: 0, length: 0, signal: 0 },
    recentExtractions: []
  };
}

// 保存状态
function saveState(state) {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// 分析会话是否应该提取记忆
function shouldExtractMemories(session) {
  const state = loadState();
  const now = Date.now();
  const triggers = [];
  
  // 检查时间触发
  if (!state.lastExtraction || now - state.lastExtraction > CONFIG.triggers.time.interval) {
    triggers.push({ type: 'time', priority: 'low' });
  }
  
  // 检查关键词触发
  if (session.messages) {
    const content = session.messages.map(m => m.content || '').join(' ');
    const hasKeyword = CONFIG.triggers.keyword.patterns.some(p => 
      content.includes(p)
    );
    
    if (hasKeyword) {
      const lastKeywordTrigger = state.recentExtractions
        .filter(e => e.trigger === 'keyword')
        .pop();
      
      if (!lastKeywordTrigger || 
          now - lastKeywordTrigger.timestamp > CONFIG.triggers.keyword.cooldown) {
        triggers.push({ 
          type: 'keyword', 
          priority: CONFIG.triggers.keyword.priority 
        });
      }
    }
  }
  
  // 检查长度触发
  if (session.messages && session.messages.length > CONFIG.triggers.length.threshold) {
    const lastLengthTrigger = state.recentExtractions
      .filter(e => e.trigger === 'length')
      .pop();
    
    if (!lastLengthTrigger || 
        now - lastLengthTrigger.timestamp > CONFIG.triggers.length.cooldown) {
      triggers.push({ 
        type: 'length', 
        priority: CONFIG.triggers.length.priority 
      });
    }
  }
  
  // 检查用户信号
  if (session.hasUserSignal) {
    const lastSignalTrigger = state.recentExtractions
      .filter(e => e.trigger === 'signal')
      .pop();
    
    if (!lastSignalTrigger || 
        now - lastSignalTrigger.timestamp > CONFIG.triggers.signal.cooldown) {
      triggers.push({ 
        type: 'signal', 
        priority: CONFIG.triggers.signal.priority 
      });
    }
  }
  
  // 确定优先级
  const priority = triggers.some(t => t.priority === 'high') ? 'high' : 
                   triggers.some(t => t.priority === 'medium') ? 'medium' : 'low';
  
  return {
    shouldExtract: triggers.length > 0,
    triggers: triggers.map(t => t.type),
    priority,
    reason: triggers.map(t => t.type).join(', ')
  };
}

// 提取关键决策
function extractKeyDecisions(messages) {
  const decisions = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const content = msg.content || '';
    
    // 检测决策关键词
    if (CONFIG.triggers.keyword.patterns.some(p => content.includes(p))) {
      // 提取上下文（前后 3 条消息）
      const context = messages.slice(
        Math.max(0, i - 3),
        Math.min(messages.length, i + 4)
      );
      
      decisions.push({
        timestamp: msg.timestamp || new Date().toISOString(),
        content: content.slice(0, 200),
        context: context.map(m => ({
          role: m.role,
          content: (m.content || '').slice(0, 100)
        }))
      });
    }
  }
  
  return decisions;
}

// 分析会话文件
function analyzeSession(sessionFile) {
  console.log(`=== 分析会话: ${path.basename(sessionFile)} ===\n`);
  
  if (!fs.existsSync(sessionFile)) {
    console.log('会话文件不存在');
    return null;
  }
  
  const content = fs.readFileSync(sessionFile, 'utf8');
  const messages = content.trim().split('\n').map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
  
  const session = { messages };
  const analysis = shouldExtractMemories(session);
  
  console.log(`消息总数: ${messages.length}`);
  console.log(`是否需要提取: ${analysis.shouldExtract ? '是' : '否'}`);
  console.log(`触发原因: ${analysis.reason || '无'}`);
  console.log(`优先级: ${analysis.priority}`);
  
  if (analysis.shouldExtract) {
    const decisions = extractKeyDecisions(messages);
    console.log(`\n检测到 ${decisions.length} 个关键决策`);
    
    decisions.slice(0, 3).forEach((d, i) => {
      console.log(`\n决策 ${i + 1}:`);
      console.log(`  时间: ${d.timestamp}`);
      console.log(`  内容: ${d.content.slice(0, 80)}...`);
    });
  }
  
  return analysis;
}

// 执行智能提取
async function runSmartExtraction() {
  console.log('=== 执行智能记忆提取 ===\n');
  
  const state = loadState();
  const now = Date.now();
  
  // 模拟会话分析（实际应从 sessions 目录读取）
  console.log('扫描会话文件...');
  
  const home = os.homedir();
  const sessionsDir = path.join(home, '.openclaw', 'sessions');
  
  if (!fs.existsSync(sessionsDir)) {
    console.log('会话目录不存在');
    return;
  }
  
  const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
  console.log(`找到 ${files.length} 个会话文件\n`);
  
  let extractedCount = 0;
  let highPriorityCount = 0;
  
  for (const file of files.slice(0, 5)) {  // 只分析前 5 个
    const filePath = path.join(sessionsDir, file);
    const analysis = analyzeSession(filePath);
    
    if (analysis && analysis.shouldExtract) {
      extractedCount++;
      if (analysis.priority === 'high') highPriorityCount++;
      
      // 记录提取
      state.recentExtractions.push({
        timestamp: now,
        sessionFile: file,
        trigger: analysis.triggers[0],
        priority: analysis.priority
      });
      
      // 更新触发统计
      analysis.triggers.forEach(t => {
        state.triggerStats[t] = (state.triggerStats[t] || 0) + 1;
      });
    }
  }
  
  state.lastExtraction = now;
  state.totalExtractions += extractedCount;
  
  // 保留最近 50 次提取记录
  if (state.recentExtractions.length > 50) {
    state.recentExtractions = state.recentExtractions.slice(-50);
  }
  
  saveState(state);
  
  console.log(`\n✅ 提取完成`);
  console.log(`  - 提取会话: ${extractedCount}`);
  console.log(`  - 高优先级: ${highPriorityCount}`);
}

// 显示统计
function showStats() {
  console.log('=== 智能提取统计 ===\n');
  
  const state = loadState();
  
  console.log(`总提取次数: ${state.totalExtractions}`);
  console.log(`上次提取: ${state.lastExtraction ? new Date(state.lastExtraction).toLocaleString() : '从未'}`);
  
  console.log(`\n触发统计:`);
  Object.entries(state.triggerStats).forEach(([trigger, count]) => {
    console.log(`  - ${trigger}: ${count}`);
  });
  
  if (state.recentExtractions.length > 0) {
    console.log(`\n最近 5 次提取:`);
    state.recentExtractions.slice(-5).forEach(e => {
      console.log(`  - ${new Date(e.timestamp).toLocaleTimeString()}: ${e.sessionFile} (${e.trigger}, ${e.priority})`);
    });
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'stats';
  
  switch (action) {
    case 'analyze':
      if (args[1]) {
        analyzeSession(args[1]);
      } else {
        console.log('用法: node memory-smart-extractor.js analyze <session-file>');
      }
      break;
      
    case 'extract':
      await runSmartExtraction();
      break;
      
    case 'stats':
      showStats();
      break;
      
    default:
      console.log('用法: node memory-smart-extractor.js [analyze|extract|stats]');
  }
}

main().catch(console.error);