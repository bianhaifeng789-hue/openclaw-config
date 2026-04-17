#!/usr/bin/env node
/**
 * Time Based MC Config - 基于 Claude Code timeBasedMCConfig.ts
 * 
 * 基于时间的微压缩配置：
 *   - 当距离上次 assistant message 超过阈值时触发
 *   - Gap threshold: 60 分钟（对应 server cache TTL）
 *   - Keep recent: 5 个最近的 tool results
 * 
 * 原理：
 *   - Server prompt cache 1h 后过期
 *   - 清理旧 tool results 可以减少重写内容
 *   - 在 API call 前执行，减少实际发送的 tokens
 * 
 * Usage:
 *   node time-based-mc-config.js get
 *   node time-based-mc-config.js check <lastAssistantTimestamp>
 *   node time-based-mc-config.js run <messagesJson>
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const CONFIG_DIR = path.join(WORKSPACE, 'state', 'microcompact');

// Default config
const TIME_BASED_MC_CONFIG_DEFAULTS = {
  enabled: false,
  gapThresholdMinutes: 60,
  keepRecent: 5
};

let config = { ...TIME_BASED_MC_CONFIG_DEFAULTS };

function getTimeBasedMCConfig() {
  // Load from config file if exists
  const configFile = path.join(CONFIG_DIR, 'time-based-mc.json');
  if (fs.existsSync(configFile)) {
    try {
      const loaded = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      config = { ...TIME_BASED_MC_CONFIG_DEFAULTS, ...loaded };
    } catch {
      // Use defaults
    }
  }
  
  return config;
}

function setTimeBasedMCConfig(newConfig) {
  config = { ...config, ...newConfig };
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(CONFIG_DIR, 'time-based-mc.json'),
    JSON.stringify(config, null, 2)
  );
  return config;
}

function shouldTriggerTimeBasedMC(lastAssistantTimestamp) {
  const cfg = getTimeBasedMCConfig();
  
  if (!cfg.enabled) {
    return {
      shouldTrigger: false,
      reason: 'disabled',
      config: cfg
    };
  }
  
  const now = Date.now();
  const gapMs = now - lastAssistantTimestamp;
  const gapMinutes = gapMs / 60000;
  
  return {
    shouldTrigger: gapMinutes >= cfg.gapThresholdMinutes,
    gapMinutes: gapMinutes.toFixed(2),
    thresholdMinutes: cfg.gapThresholdMinutes,
    keepRecent: cfg.keepRecent,
    config: cfg,
    reason: gapMinutes >= cfg.gapThresholdMinutes 
      ? 'gap exceeds threshold, cache likely expired'
      : 'gap within threshold'
  };
}

function estimateMessageTokens(message) {
  // Rough estimation
  let tokens = 0;
  
  if (message.content) {
    if (typeof message.content === 'string') {
      tokens += message.content.length / 4; // ~4 chars per token
    } else if (Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.text) {
          tokens += block.text.length / 4;
        }
        if (block.tool_use) {
          tokens += 50; // overhead
        }
      }
    }
  }
  
  return Math.ceil(tokens);
}

function microcompactMessages(messages, keepRecent) {
  const cfg = getTimeBasedMCConfig();
  
  if (!cfg.enabled) {
    return { compacted: false, reason: 'disabled', messages };
  }
  
  // Find compactable tool results (old enough)
  const now = Date.now();
  const thresholdMs = cfg.gapThresholdMinutes * 60 * 1000;
  
  let toolResultCount = 0;
  const compactedMessages = [];
  const removed = [];
  
  for (const msg of messages) {
    // Count tool results
    if (msg.type === 'user' && msg.content) {
      const blocks = Array.isArray(msg.content) ? msg.content : [msg.content];
      const hasToolResult = blocks.some(b => b.type === 'tool_result');
      if (hasToolResult) {
        toolResultCount++;
        
        // Keep recent ones
        if (toolResultCount <= keepRecent) {
          compactedMessages.push(msg);
        } else {
          removed.push({
            index: messages.indexOf(msg),
            reason: 'old tool result'
          });
        }
        continue;
      }
    }
    
    compactedMessages.push(msg);
  }
  
  const tokensBefore = messages.reduce((sum, m) => sum + estimateMessageTokens(m), 0);
  const tokensAfter = compactedMessages.reduce((sum, m) => sum + estimateMessageTokens(m), 0);
  
  return {
    compacted: removed.length > 0,
    messagesRemoved: removed.length,
    tokensBefore,
    tokensAfter,
    tokensSaved: tokensBefore - tokensAfter,
    keepRecent,
    removed,
    messages: compactedMessages
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'get';
  
  switch (command) {
    case 'get':
      console.log(JSON.stringify(getTimeBasedMCConfig(), null, 2));
      break;
    case 'set':
      const enabled = args[1] === 'true';
      const threshold = parseInt(args[2], 10) || 60;
      const keep = parseInt(args[3], 10) || 5;
      console.log(JSON.stringify(setTimeBasedMCConfig({
        enabled,
        gapThresholdMinutes: threshold,
        keepRecent: keep
      }), null, 2));
      break;
    case 'check':
      const timestamp = parseInt(args[1], 10);
      if (!timestamp) {
        console.log('Usage: node time-based-mc-config.js check <lastAssistantTimestamp>');
        process.exit(1);
      }
      console.log(JSON.stringify(shouldTriggerTimeBasedMC(timestamp), null, 2));
      break;
    case 'run':
      // Placeholder: would need actual messages JSON
      const cfg = getTimeBasedMCConfig();
      console.log(JSON.stringify({
        message: 'Time-based microcompact would run here',
        config: cfg,
        note: 'Provide messages JSON to run actual compact'
      }, null, 2));
      break;
    default:
      console.log('Usage: node time-based-mc-config.js [get|set|check|run]');
      process.exit(1);
  }
}

main();

module.exports = {
  getTimeBasedMCConfig,
  setTimeBasedMCConfig,
  shouldTriggerTimeBasedMC,
  microcompactMessages
};