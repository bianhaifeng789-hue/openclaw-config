#!/usr/bin/env node
/**
 * Dangling Tool Call Patcher - Fix incomplete tool call sequences
 *
 * Ported from DeerFlow dangling_tool_call_middleware.py
 *
 * Features:
 * - Detect AIMessages with tool_calls lacking ToolMessages
 * - Insert synthetic error ToolMessages after dangling AIMessage
 * - Ensure correct message ordering for LLM
 */

function detectDangling(messages) {
  // Collect existing ToolMessage IDs
  const existingToolIds = new Set();
  for (const msg of messages) {
    if (msg.type === 'tool' && msg.tool_call_id) {
      existingToolIds.add(msg.tool_call_id);
    }
  }

  // Find dangling tool calls
  const dangling = [];
  for (const msg of messages) {
    if (msg.type === 'ai' && msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        const tcId = tc.id || tc.tool_call_id;
        if (tcId && !existingToolIds.has(tcId)) {
          dangling.push({
            id: tcId,
            name: tc.name || 'unknown',
            messageIndex: messages.indexOf(msg)
          });
        }
      }
    }
  }

  return dangling;
}

function buildPatchedMessages(messages) {
  const dangling = detectDangling(messages);
  
  if (dangling.length === 0) {
    return null;  // No patch needed
  }

  // Build patched list with synthetic ToolMessages inserted
  const patched = [];
  const patchedIds = new Set();

  for (const msg of messages) {
    patched.push(msg);

    if (msg.type === 'ai' && msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        const tcId = tc.id || tc.tool_call_id;
        if (tcId && !patchedIds.has(tcId) && dangling.some(d => d.id === tcId)) {
          // Insert synthetic ToolMessage
          patched.push({
            type: 'tool',
            content: '[Tool call was interrupted and did not return a result.]',
            tool_call_id: tcId,
            name: tc.name || 'unknown',
            status: 'error'
          });
          patchedIds.add(tcId);
        }
      }
    }
  }

  console.warn(`Injecting ${dangling.length} placeholder ToolMessage(s) for dangling tool calls`);
  
  return patched;
}

/**
 * Wrap model call to patch dangling tool calls
 * @param {Function} handler - The model call handler
 * @param {Object} request - Request with messages
 * @returns {Object} - Response
 */
function wrapModelCall(handler, request) {
  const patched = buildPatchedMessages(request.messages);
  
  if (patched !== null) {
    request = { ...request, messages: patched };
  }
  
  return handler(request);
}

async function awrapModelCall(handler, request) {
  const patched = buildPatchedMessages(request.messages);
  
  if (patched !== null) {
    request = { ...request, messages: patched };
  }
  
  return await handler(request);
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'test':
    // Test with sample messages
    const testMessages = [
      { type: 'human', content: 'Generate report' },
      { type: 'ai', tool_calls: [
        { id: 'tc1', name: 'read_file' },
        { id: 'tc2', name: 'grep' }
      ] },
      // Missing ToolMessages for tc1, tc2!
      { type: 'human', content: 'Continue' }
    ];
    
    const dangling = detectDangling(testMessages);
    console.log('Dangling tool calls:', dangling);
    
    const patched = buildPatchedMessages(testMessages);
    console.log('Patched messages:', JSON.stringify(patched, null, 2));
    break;

  case 'status':
    console.log(JSON.stringify({
      feature: 'dangling-tool-call-patcher',
      version: '1.0.0',
      description: 'Fix incomplete tool call sequences'
    }, null, 2));
    break;

  default:
    console.log('Usage: dangling-tool-patcher.js [test|status]');
}

module.exports = {
  detectDangling,
  buildPatchedMessages,
  wrapModelCall,
  awrapModelCall
};