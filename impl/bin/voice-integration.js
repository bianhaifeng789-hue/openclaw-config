#!/usr/bin/env node
/**
 * Voice Integration Service - 基于 Claude Code voice.ts
 * 
 * 语音集成：
 *   - TTS 配置
 *   - 语音命令处理
 *   - 语音状态管理
 * 
 * Usage:
 *   node voice-integration.js config
 *   node voice-integration.js speak <text>
 *   node voice-integration.js status
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'voice');
const STATE_FILE = path.join(STATE_DIR, 'voice-state.json');

const DEFAULT_VOICE_CONFIG = {
  enabled: false,
  provider: 'elevenlabs',
  voiceId: 'nova',
  model: 'eleven_monolingual_v1',
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  useSpeakerBoost: true,
  outputFormat: 'mp3_44100_128',
  language: 'zh'
};

function loadVoiceState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      enabled: DEFAULT_VOICE_CONFIG.enabled,
      config: DEFAULT_VOICE_CONFIG,
      stats: {
        totalSpeaks: 0,
        totalChars: 0,
        avgDurationMs: 0
      },
      history: []
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {
      enabled: DEFAULT_VOICE_CONFIG.enabled,
      config: DEFAULT_VOICE_CONFIG,
      stats: {
        totalSpeaks: 0,
        totalChars: 0,
        avgDurationMs: 0
      },
      history: []
    };
  }
}

function saveVoiceState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getVoiceConfig() {
  const state = loadVoiceState();
  
  return {
    enabled: state.enabled,
    config: state.config,
    provider: state.config.provider,
    voiceId: state.config.voiceId
  };
}

function setVoiceConfig(config) {
  const state = loadVoiceState();
  
  state.config = { ...DEFAULT_VOICE_CONFIG, ...config };
  
  saveVoiceState(state);
  
  return {
    set: true,
    config: state.config
  };
}

function enableVoice() {
  const state = loadVoiceState();
  state.enabled = true;
  
  saveVoiceState(state);
  
  return {
    enabled: true,
    config: state.config
  };
}

function disableVoice() {
  const state = loadVoiceState();
  state.enabled = false;
  
  saveVoiceState(state);
  
  return {
    enabled: false
  };
}

function speakText(text, options = {}) {
  const state = loadVoiceState();
  
  if (!state.enabled) {
    return {
      spoken: false,
      reason: 'voice disabled',
      text
    };
  }
  
  // In real implementation, would call ElevenLabs API or other TTS
  const speakRecord = {
    text,
    voiceId: state.config.voiceId,
    provider: state.config.provider,
    options,
    timestamp: Date.now(),
    estimatedDurationMs: text.length * 50, // Rough estimate
    simulated: true
  };
  
  // Update stats
  state.stats.totalSpeaks++;
  state.stats.totalChars += text.length;
  state.history.push(speakRecord);
  
  // Keep only last 50
  if (state.history.length > 50) {
    state.history = state.history.slice(-50);
  }
  
  const totalDuration = state.history.reduce((sum, h) => sum + h.estimatedDurationMs, 0);
  state.stats.avgDurationMs = totalDuration / state.stats.totalSpeaks;
  
  saveVoiceState(state);
  
  return {
    spoken: true,
    record: speakRecord,
    stats: state.stats,
    note: 'In real implementation, would call TTS API and output audio'
  };
}

function getVoiceHistory(limit = 20) {
  const state = loadVoiceState();
  
  return {
    history: state.history.slice(-limit),
    total: state.history.length,
    stats: state.stats
  };
}

function getVoiceStatus() {
  const state = loadVoiceState();
  
  return {
    enabled: state.enabled,
    provider: state.config.provider,
    voiceId: state.config.voiceId,
    language: state.config.language,
    stats: state.stats,
    lastSpoken: state.history.length > 0 
      ? state.history[state.history.length - 1].timestamp 
      : null
  };
}

function getVoiceStats() {
  const state = loadVoiceState();
  
  return {
    totalSpeaks: state.stats.totalSpeaks,
    totalChars: state.stats.totalChars,
    avgDurationMs: Math.round(state.stats.avgDurationMs),
    avgCharsPerSpeak: state.stats.totalSpeaks > 0
      ? Math.round(state.stats.totalChars / state.stats.totalSpeaks)
      : 0,
    historyCount: state.history.length
  };
}

function clearVoiceHistory() {
  const state = loadVoiceState();
  
  state.history = [];
  state.stats = {
    totalSpeaks: 0,
    totalChars: 0,
    avgDurationMs: 0
  };
  
  saveVoiceState(state);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'config':
      const configAction = args[1];
      if (configAction === 'get') {
        console.log(JSON.stringify(getVoiceConfig(), null, 2));
      } else if (configAction === 'set') {
        const voiceId = args[2] || 'nova';
        const provider = args[3] || 'elevenlabs';
        console.log(JSON.stringify(setVoiceConfig({
          voiceId,
          provider
        }), null, 2));
      } else {
        console.log(JSON.stringify(getVoiceConfig(), null, 2));
      }
      break;
    case 'enable':
      console.log(JSON.stringify(enableVoice(), null, 2));
      break;
    case 'disable':
      console.log(JSON.stringify(disableVoice(), null, 2));
      break;
    case 'speak':
      const speakText = args[1];
      if (!speakText) {
        console.log('Usage: node voice-integration.js speak <text>');
        process.exit(1);
      }
      console.log(JSON.stringify(speakText(speakText), null, 2));
      break;
    case 'history':
      const histLimit = parseInt(args[1], 10) || 20;
      console.log(JSON.stringify(getVoiceHistory(histLimit), null, 2));
      break;
    case 'status':
      console.log(JSON.stringify(getVoiceStatus(), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getVoiceStats(), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearVoiceHistory(), null, 2));
      break;
    default:
      console.log('Usage: node voice-integration.js [config|enable|disable|speak|history|status|stats|clear]');
      process.exit(1);
  }
}

main();

module.exports = {
  getVoiceConfig,
  setVoiceConfig,
  enableVoice,
  disableVoice,
  speakText,
  getVoiceHistory,
  getVoiceStatus,
  DEFAULT_VOICE_CONFIG
};