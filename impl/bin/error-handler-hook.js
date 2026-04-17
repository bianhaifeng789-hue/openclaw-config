#!/usr/bin/env node
/**
 * Error Handler Hook - OpenClaw hooks integration
 *
 * This script is called by OpenClaw hooks system at PreToolUse/PostToolUse events
 * to handle errors and dangling tool calls.
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const STATE_FILE = path.join(WORKSPACE, 'state', 'error-handler-state.json');

// Load state
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {
    // ignore
  }
  return {
    toolCalls: [],
    errors: [],
    lastCheck: null
  };
}

// Save state
function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Process hook input from environment
function getHookInput() {
  return {
    event: process.env.HOOK_EVENT || 'unknown',
    toolName: process.env.HOOK_TOOL_NAME || 'unknown',
    sessionId: process.env.HOOK_SESSION_ID || 'unknown',
    toolInput: process.env.HOOK_INPUT ? JSON.parse(process.env.HOOK_INPUT) : {},
    timestamp: new Date().toISOString()
  };
}

// Handle PreToolUse
function handlePreToolUse(input) {
  const state = loadState();
  
  // Record tool call
  state.toolCalls.push({
    toolName: input.toolName,
    timestamp: input.timestamp,
    sessionId: input.sessionId
  });
  
  // Keep last 100 calls
  if (state.toolCalls.length > 100) {
    state.toolCalls = state.toolCalls.slice(-100);
  }
  
  state.lastCheck = Date.now();
  saveState(state);
  
  return {
    status: 'success',
    message: `Tool call recorded: ${input.toolName}`
  };
}

// Handle PostToolUse
function handlePostToolUse(input) {
  const state = loadState();
  
  // Check for error in result (if provided)
  const toolResult = process.env.HOOK_RESULT ? JSON.parse(process.env.HOOK_RESULT) : null;
  
  if (toolResult && toolResult.error) {
    state.errors.push({
      toolName: input.toolName,
      error: toolResult.error,
      timestamp: input.timestamp,
      sessionId: input.sessionId
    });
    
    // Keep last 50 errors
    if (state.errors.length > 50) {
      state.errors = state.errors.slice(-50);
    }
    
    saveState(state);
    
    return {
      status: 'error',
      message: `Tool error recorded: ${input.toolName} - ${toolResult.error}`
    };
  }
  
  state.lastCheck = Date.now();
  saveState(state);
  
  return {
    status: 'success',
    message: `Tool execution completed: ${input.toolName}`
  };
}

// Handle Stop
function handleStop(input) {
  const state = loadState();
  
  // Summary
  const summary = {
    totalCalls: state.toolCalls.length,
    totalErrors: state.errors.length,
    errorRate: state.toolCalls.length > 0 ? (state.errors.length / state.toolCalls.length * 100).toFixed(2) : 0,
    lastSession: input.sessionId,
    timestamp: input.timestamp
  };
  
  saveState(state);
  
  return {
    status: 'success',
    message: `Session summary: ${summary.totalCalls} calls, ${summary.totalErrors} errors (${summary.errorRate}% error rate)`,
    summary
  };
}

// Main
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'status':
    const state = loadState();
    console.log(JSON.stringify({
      toolCalls: state.toolCalls.length,
      errors: state.errors.length,
      lastCheck: state.lastCheck ? new Date(state.lastCheck).toISOString() : 'never'
    }, null, 2));
    break;

  case 'run':
    const input = getHookInput();
    let result;
    
    switch (input.event) {
      case 'PreToolUse':
        result = handlePreToolUse(input);
        break;
      case 'PostToolUse':
        result = handlePostToolUse(input);
        break;
      case 'Stop':
        result = handleStop(input);
        break;
      default:
        result = { status: 'error', message: `Unknown event: ${input.event}` };
    }
    
    console.log(JSON.stringify(result));
    break;

  default:
    console.log('Usage: error-handler-hook.js [status|run]');
    console.log('Environment variables:');
    console.log('  HOOK_EVENT - Event type (PreToolUse/PostToolUse/Stop)');
    console.log('  HOOK_TOOL_NAME - Tool name');
    console.log('  HOOK_SESSION_ID - Session ID');
    console.log('  HOOK_INPUT - Tool input (JSON)');
    console.log('  HOOK_RESULT - Tool result (JSON)');
}

module.exports = {
  loadState,
  saveState,
  handlePreToolUse,
  handlePostToolUse,
  handleStop
};