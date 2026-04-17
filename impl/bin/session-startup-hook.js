#!/usr/bin/env node
/**
 * Session Startup Hook - Initialize session with title and context
 *
 * Integrates with OpenClaw session lifecycle
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const TITLES_FILE = path.join(WORKSPACE, 'state', 'session-titles.json');

// Load titles
function loadTitles() {
  try {
    if (fs.existsSync(TITLES_FILE)) {
      return JSON.parse(fs.readFileSync(TITLES_FILE, 'utf8'));
    }
  } catch {
    // ignore
  }
  return { sessions: {} };
}

// Save titles
function saveTitles(titles) {
  fs.mkdirSync(path.dirname(TITLES_FILE), { recursive: true });
  fs.writeFileSync(TITLES_FILE, JSON.stringify(titles, null, 2));
}

// Generate title for session
function generateTitle(sessionId, messages) {
  const titles = loadTitles();
  
  // Check if already has title
  if (titles.sessions[sessionId]?.title) {
    return { status: 'exists', title: titles.sessions[sessionId].title };
  }
  
  // Extract first user message
  const userMsg = messages.find(m => m.type === 'human');
  if (!userMsg) {
    return { status: 'no_user_message' };
  }
  
  const content = userMsg.content || '';
  const maxChars = 50;
  
  // Fallback title (truncate user message)
  let title;
  if (content.length > maxChars) {
    title = content.slice(0, maxChars).trim() + '...';
  } else {
    title = content || 'New Conversation';
  }
  
  // Save
  titles.sessions[sessionId] = {
    title,
    generatedAt: new Date().toISOString(),
    method: 'fallback',
    firstUserMsg: content.slice(0, 200)
  };
  
  saveTitles(titles);
  
  return { status: 'generated', title, method: 'fallback' };
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'status':
    const titles = loadTitles();
    console.log(JSON.stringify({
      totalSessions: Object.keys(titles.sessions).length,
      sessions: Object.keys(titles.sessions).slice(0, 5)
    }, null, 2));
    break;

  case 'run':
    // Get session info from environment
    const sessionId = process.env.HOOK_SESSION_ID || args[1] || 'unknown';
    const messagesJson = process.env.HOOK_MESSAGES || args[2] || '[]';
    
    try {
      const messages = JSON.parse(messagesJson);
      const result = generateTitle(sessionId, messages);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error('Error parsing messages:', e.message);
    }
    break;

  case 'test':
    // Test with sample messages
    const testMessages = [
      { type: 'human', content: '移植 DeerFlow 高价值功能到 OpenClaw' },
      { type: 'ai', content: '开始移植...' }
    ];
    const testResult = generateTitle('test-session', testMessages);
    console.log('Test result:', JSON.stringify(testResult, null, 2));
    break;

  default:
    console.log('Usage: session-startup-hook.js [status|run|test]');
}

module.exports = {
  loadTitles,
  saveTitles,
  generateTitle
};