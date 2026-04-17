#!/usr/bin/env node
/**
 * Token Estimation Service - 基于 Claude Code tokenEstimation.ts
 * 
 * Token 估算：
 *   - CJK 字符特殊处理
 *   - 代码 token 估算
 *   - 消息大小预测
 * 
 * Usage:
 *   node token-estimation.js estimate <text>
 *   node token-estimation.js cjk <text>
 *   node token-estimation.js message <messageJson>
 */

const TOKEN_ESTIMATION_TOOL_NAME = 'TokenEstimation';

// CJK Unicode ranges
const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;

function estimateCJKTokens(text) {
  // CJK characters are typically 1-2 tokens each
  // Most CJK: ~1 token per character
  // Some CJK (rare): ~2 tokens
  
  const cjkChars = (text.match(CJK_REGEX) || []).length;
  
  return {
    cjkChars,
    estimatedTokens: Math.ceil(cjkChars * 1.2),
    note: 'CJK characters estimated at ~1-1.2 tokens each'
  };
}

function estimateEnglishTokens(text) {
  // English: ~4 characters per token
  // This is a rough approximation
  
  const englishChars = text.length - (text.match(CJK_REGEX) || []).length;
  
  return {
    englishChars,
    estimatedTokens: Math.ceil(englishChars / 4),
    note: 'English text estimated at ~4 chars per token'
  };
}

function estimateTokens(text) {
  if (!text) {
    return {
      text: '',
      chars: 0,
      estimatedTokens: 0,
      breakdown: { cjk: 0, english: 0 }
    };
  }
  
  const cjkEstimate = estimateCJKTokens(text);
  const englishEstimate = estimateEnglishTokens(text);
  
  const totalTokens = cjkEstimate.estimatedTokens + englishEstimate.estimatedTokens;
  
  return {
    text: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
    chars: text.length,
    estimatedTokens: totalTokens,
    breakdown: {
      cjk: cjkEstimate.estimatedTokens,
      english: englishEstimate.estimatedTokens,
      cjkChars: cjkEstimate.cjkChars,
      englishChars: englishEstimate.englishChars
    },
    ratio: (text.length / totalTokens).toFixed(2) + ' chars/token'
  };
}

function estimateMessageTokens(message) {
  // Estimate tokens for a message object
  
  let totalTokens = 0;
  
  // Role overhead (~4 tokens)
  totalTokens += 4;
  
  // Content
  if (typeof message.content === 'string') {
    totalTokens += estimateTokens(message.content).estimatedTokens;
  } else if (Array.isArray(message.content)) {
    for (const block of message.content) {
      if (block.text) {
        totalTokens += estimateTokens(block.text).estimatedTokens;
      }
      if (block.type === 'tool_use') {
        totalTokens += 10; // Tool name overhead
        if (block.input) {
          totalTokens += estimateTokens(JSON.stringify(block.input)).estimatedTokens;
        }
      }
      if (block.type === 'tool_result') {
        totalTokens += 5; // Result marker overhead
        if (block.content) {
          totalTokens += estimateTokens(block.content).estimatedTokens;
        }
      }
    }
  }
  
  // Metadata overhead
  totalTokens += 5;
  
  return {
    role: message.role,
    estimatedTokens: totalTokens,
    contentLength: typeof message.content === 'string' 
      ? message.content.length 
      : JSON.stringify(message.content).length
  };
}

function estimateConversationTokens(messages) {
  let totalTokens = 0;
  const messageEstimates = [];
  
  for (const message of messages) {
    const estimate = estimateMessageTokens(message);
    totalTokens += estimate.estimatedTokens;
    messageEstimates.push(estimate);
  }
  
  // Add conversation overhead (~10 tokens)
  totalTokens += 10;
  
  return {
    messageCount: messages.length,
    totalTokens,
    messageEstimates,
    avgTokensPerMessage: messages.length > 0
      ? Math.round(totalTokens / messages.length)
      : 0
  };
}

function estimateCodeTokens(code, language = 'javascript') {
  // Code has higher token density
  // Rough estimate: ~2.5 chars per token for code
  
  const baseEstimate = estimateTokens(code);
  
  // Code has overhead for syntax
  const codeOverhead = Math.ceil(code.length / 10);
  
  // Language-specific adjustments
  const languageMultiplier = {
    'javascript': 1.0,
    'typescript': 1.1,
    'python': 1.0,
    'java': 1.2,
    'go': 1.0,
    'rust': 1.1
  };
  
  const multiplier = languageMultiplier[language] || 1.0;
  
  const adjustedTokens = Math.ceil((baseEstimate.estimatedTokens + codeOverhead) * multiplier);
  
  return {
    code: code.slice(0, 50) + '...',
    language,
    lines: code.split('\n').length,
    chars: code.length,
    estimatedTokens: adjustedTokens,
    breakdown: {
      base: baseEstimate.estimatedTokens,
      overhead: codeOverhead,
      multiplier
    }
  };
}

function estimateFileSize(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      error: 'file not found',
      path: filePath
    };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  return {
    path: filePath,
    sizeBytes: content.length,
    estimatedTokens: estimateTokens(content).estimatedTokens,
    lines: content.split('\n').length
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'estimate';
  
  switch (command) {
    case 'estimate':
      const text = args[1] || '';
      console.log(JSON.stringify(estimateTokens(text), null, 2));
      break;
    case 'cjk':
      const cjkText = args[1] || '';
      console.log(JSON.stringify(estimateCJKTokens(cjkText), null, 2));
      break;
    case 'message':
      const msgJson = args[1] ? JSON.parse(args[1]) : { role: 'user', content: 'test' };
      console.log(JSON.stringify(estimateMessageTokens(msgJson), null, 2));
      break;
    case 'conversation':
      const convJson = args[1] ? JSON.parse(args[1]) : [];
      console.log(JSON.stringify(estimateConversationTokens(convJson), null, 2));
      break;
    case 'code':
      const codeText = args[1] || '';
      const codeLang = args[2] || 'javascript';
      console.log(JSON.stringify(estimateCodeTokens(codeText, codeLang), null, 2));
      break;
    case 'file':
      const file = args[1];
      if (!file) {
        console.log('Usage: node token-estimation.js file <path>');
        process.exit(1);
      }
      const fs = require('fs');
      console.log(JSON.stringify(estimateFileSize(file), null, 2));
      break;
    default:
      console.log('Usage: node token-estimation.js [estimate|cjk|message|conversation|code|file]');
      process.exit(1);
  }
}

main();

module.exports = {
  estimateTokens,
  estimateCJKTokens,
  estimateEnglishTokens,
  estimateMessageTokens,
  estimateConversationTokens,
  estimateCodeTokens,
  CJK_REGEX
};