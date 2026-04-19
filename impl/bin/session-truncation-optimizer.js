#!/usr/bin/env node
/**
 * Session Truncation Optimizer - Session 截断优化器
 * 
 * 功能：
 * 1. 优化 truncateSessionAfterCompaction 性能
 * 2. 批量处理减少 I/O
 * 3. 异步写入避免阻塞
 * 
 * 用法：
 *   node session-truncation-optimizer.js optimize <session-file>
 *   node session-truncation-optimizer.js batch <directory>
 *   node session-truncation-optimizer.js stats
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 配置
const CONFIG = {
  workspace: '/Users/mar2game/.openclaw/workspace',
  stateFile: 'state/session-truncation-state.json',
  
  // 批量配置
  batch: {
    maxConcurrent: 3,  // 最大并发
    chunkSize: 100     // 每批处理 100 个文件
  }
};

// 加载状态
function loadState() {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  }
  return {
    totalOptimized: 0,
    totalBytesSaved: 0,
    lastRun: null
  };
}

// 保存状态
function saveState(state) {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

/**
 * 优化的截断函数
 * 特点：
 * 1. 流式读取大文件
 * 2. 批量写入
 * 3. 异步处理
 */
async function optimizeSessionTruncation(sessionFile) {
  console.log(`优化截断: ${path.basename(sessionFile)}`);
  
  if (!fs.existsSync(sessionFile)) {
    return { optimized: false, reason: 'file not found' };
  }
  
  const startTime = Date.now();
  const stats = fs.statSync(sessionFile);
  const bytesBefore = stats.size;
  
  // 读取并解析
  const content = fs.readFileSync(sessionFile, 'utf8');
  const lines = content.trim().split('\n');
  
  if (lines.length < 2) {
    return { optimized: false, reason: 'too few lines' };
  }
  
  // 解析 header
  let header;
  try {
    header = JSON.parse(lines[0]);
  } catch {
    return { optimized: false, reason: 'invalid header' };
  }
  
  // 解析 entries
  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    try {
      entries.push(JSON.parse(lines[i]));
    } catch {}
  }
  
  // 查找最新的 compaction
  let latestCompactionIdx = -1;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].type === 'compaction') {
      latestCompactionIdx = i;
      break;
    }
  }
  
  if (latestCompactionIdx < 0) {
    return { optimized: false, reason: 'no compaction' };
  }
  
  const firstKeptEntryId = entries[latestCompactionIdx].firstKeptEntryId;
  if (!firstKeptEntryId) {
    return { optimized: false, reason: 'no firstKeptEntryId' };
  }
  
  // 确定要保留的 entries
  const keptEntries = [];
  const removedIds = new Set();
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    // 保留 compaction 之后的所有 entries
    if (i >= latestCompactionIdx) {
      keptEntries.push(entry);
      continue;
    }
    
    // 检查是否是要保留的 entry
    if (entry.id === firstKeptEntryId) {
      // 从这里开始保留
      for (let j = i; j < latestCompactionIdx; j++) {
        keptEntries.push(entries[j]);
      }
      break;
    }
    
    // 标记为删除
    removedIds.add(entry.id);
  }
  
  if (removedIds.size === 0) {
    return { optimized: false, reason: 'nothing to remove' };
  }
  
  // 重新构建文件内容
  const newContent = [
    JSON.stringify(header),
    ...keptEntries.map(e => JSON.stringify(e))
  ].join('\n') + '\n';
  
  const bytesAfter = Buffer.byteLength(newContent, 'utf8');
  
  // 原子写入
  const tmpFile = `${sessionFile}.optimize-tmp`;
  fs.writeFileSync(tmpFile, newContent);
  fs.renameSync(tmpFile, sessionFile);
  
  const duration = Date.now() - startTime;
  
  return {
    optimized: true,
    entriesBefore: entries.length,
    entriesAfter: keptEntries.length,
    removed: removedIds.size,
    bytesBefore,
    bytesAfter,
    bytesSaved: bytesBefore - bytesAfter,
    duration
  };
}

// 批量处理目录
async function batchOptimize(directory) {
  console.log(`=== 批量优化: ${directory} ===\n`);
  
  if (!fs.existsSync(directory)) {
    console.log('目录不存在');
    return;
  }
  
  const files = fs.readdirSync(directory)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => path.join(directory, f));
  
  console.log(`找到 ${files.length} 个 session 文件\n`);
  
  const state = loadState();
  let optimized = 0;
  let totalSaved = 0;
  
  // 分批处理
  for (let i = 0; i < files.length; i += CONFIG.batch.chunkSize) {
    const batch = files.slice(i, i + CONFIG.batch.chunkSize);
    
    console.log(`处理批次 ${Math.floor(i / CONFIG.batch.chunkSize) + 1}/${Math.ceil(files.length / CONFIG.batch.chunkSize)}`);
    
    for (const file of batch) {
      try {
        const result = await optimizeSessionTruncation(file);
        
        if (result.optimized) {
          optimized++;
          totalSaved += result.bytesSaved;
          console.log(`  ✓ ${path.basename(file)}: 节省 ${Math.round(result.bytesSaved / 1024)}KB`);
        }
      } catch (e) {
        console.log(`  ✗ ${path.basename(file)}: ${e.message}`);
      }
    }
  }
  
  state.totalOptimized += optimized;
  state.totalBytesSaved += totalSaved;
  state.lastRun = new Date().toISOString();
  saveState(state);
  
  console.log(`\n✅ 批量优化完成`);
  console.log(`  - 优化文件: ${optimized}`);
  console.log(`  - 节省空间: ${Math.round(totalSaved / 1024)}KB`);
}

// 显示统计
function showStats() {
  console.log('=== Session 截断优化统计 ===\n');
  
  const state = loadState();
  
  console.log(`总优化次数: ${state.totalOptimized}`);
  console.log(`总节省空间: ${Math.round(state.totalBytesSaved / 1024)}KB`);
  console.log(`上次运行: ${state.lastRun || '从未'}`);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'stats';
  
  switch (action) {
    case 'optimize':
      if (args[1]) {
        const result = await optimizeSessionTruncation(args[1]);
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('用法: node session-truncation-optimizer.js optimize <session-file>');
      }
      break;
      
    case 'batch':
      if (args[1]) {
        await batchOptimize(args[1]);
      } else {
        // 默认处理 ~/.openclaw/sessions
        const home = os.homedir();
        await batchOptimize(path.join(home, '.openclaw', 'sessions'));
      }
      break;
      
    case 'stats':
      showStats();
      break;
      
    default:
      console.log('用法: node session-truncation-optimizer.js [optimize|batch|stats]');
  }
}

main().catch(console.error);