#!/usr/bin/env node
/**
 * Memory Vec Storage - 轻量向量存储（JSON版）
 * 
 * Purpose: 使用 JSON 文件进行记忆向量存储和检索
 * 
 * Features:
 * - 向量化存储记忆片段
 * - 基于相似度的检索
 * - 与现有 TF-IDF 系统互补
 * - 简单稳定，无依赖问题
 * 
 * Usage:
 *   node memory-vec-storage.js init
 *   node memory-vec-storage.js add <text>
 *   node memory-vec-storage.js search <query>
 *   node memory-vec-storage.js status
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const DATA_PATH = path.join(WORKSPACE, 'state', 'memory-vec.json');
const EMBEDDING_DIM = 384;

// 简单的文本向量化（使用字符频率）
function simpleEmbedding(text) {
  const embedding = new Float32Array(EMBEDDING_DIM);
  const chars = text.toLowerCase().split('');
  
  for (let i = 0; i < chars.length; i++) {
    const charCode = chars[i].charCodeAt(0);
    const idx = charCode % EMBEDDING_DIM;
    embedding[idx] += 1;
  }
  
  // 归一化
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm;
    }
  }
  
  return Array.from(embedding);
}

// 计算余弦相似度
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

class VecStorage {
  load() {
    if (fs.existsSync(DATA_PATH)) {
      try {
        return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
      } catch (e) {
        return { memories: [] };
      }
    }
    return { memories: [] };
  }
  
  save(data) {
    const stateDir = path.dirname(DATA_PATH);
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  }
  
  init() {
    this.save({ memories: [], version: 1, embeddingDim: EMBEDDING_DIM });
    return { status: 'initialized', dataPath: DATA_PATH };
  }
  
  add(text) {
    const data = this.load();
    const embedding = simpleEmbedding(text);
    
    const id = data.memories.length + 1;
    data.memories.push({
      id,
      text,
      embedding,
      createdAt: Date.now()
    });
    
    this.save(data);
    return { id, text, embeddingDim: EMBEDDING_DIM };
  }
  
  search(query, limit = 5) {
    const data = this.load();
    if (!data.memories || data.memories.length === 0) return [];
    
    const queryEmbedding = simpleEmbedding(query);
    
    const results = data.memories.map(m => {
      const similarity = m.embedding ? cosineSimilarity(queryEmbedding, m.embedding) : 0;
      return {
        id: m.id,
        text: m.text,
        similarity
      };
    });
    
    results.sort((a, b) => b.similarity - a.similarity);
    return results.filter(r => r.similarity > 0).slice(0, limit);
  }
  
  status() {
    const data = this.load();
    return {
      dataPath: DATA_PATH,
      totalMemories: data.memories.length,
      embeddingDim: EMBEDDING_DIM,
      sampleMemories: data.memories.slice(0, 5).map(m => ({ id: m.id, text: m.text })),
      version: data.version || 1
    };
  }
}

// CLI
const command = process.argv[2] || 'status';
const storage = new VecStorage();

switch (command) {
  case 'init':
    console.log(JSON.stringify(storage.init(), null, 2));
    break;
    
  case 'add':
    const text = process.argv[3] || '';
    if (text) {
      console.log(JSON.stringify(storage.add(text), null, 2));
    } else {
      console.log(JSON.stringify({ error: 'text required' }, null, 2));
    }
    break;
    
  case 'search':
    const query = process.argv[3] || '';
    const limit = parseInt(process.argv[4]) || 5;
    if (query) {
      console.log(JSON.stringify(storage.search(query, limit), null, 2));
    } else {
      console.log(JSON.stringify({ error: 'query required' }, null, 2));
    }
    break;
    
  case 'status':
    console.log(JSON.stringify(storage.status(), null, 2));
    break;
    
  default:
    console.log('Unknown command:', command);
    console.log('');
    console.log('Available commands:');
    console.log('  init            - 初始化向量存储');
    console.log('  add <text>      - 添加记忆');
    console.log('  search <query>  - 搜索相似记忆');
    console.log('  status          - 显示状态');
}