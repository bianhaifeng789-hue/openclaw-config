#!/usr/bin/env node
/**
 * Tool Error Handler - Convert tool exceptions into error ToolMessages
 *
 * Ported from DeerFlow tool_error_handling_middleware.py
 *
 * Features:
 * - Catch tool execution exceptions
 * - Return structured error ToolMessage
 * - Guide agent to use alternatives
 */

const MISSING_TOOL_CALL_ID = 'missing_tool_call_id';

function buildErrorMessage(request, error) {
  const toolName = request.tool_call?.name || 'unknown_tool';
  const toolCallId = request.tool_call?.id || MISSING_TOOL_CALL_ID;
  
  let detail = (error.message || error.toString() || error.constructor.name).trim();
  if (detail.length > 500) {
    detail = detail.slice(0, 497) + '...';
  }

  const content = `Error: Tool '${toolName}' failed with ${error.constructor.name}: ${detail}. Continue with available context, or choose an alternative tool.`;

  return {
    type: 'tool',
    content,
    tool_call_id: toolCallId,
    name: toolName,
    status: 'error'
  };
}

/**
 * Wrap tool call with error handling
 * @param {Function} handler - The tool execution handler
 * @param {Object} request - Tool call request
 * @returns {Object} - ToolMessage or Command
 */
function wrapToolCall(handler, request) {
  try {
    return handler(request);
  } catch (error) {
    // Preserve GraphBubbleUp (LangGraph control signals)
    if (error.name === 'GraphBubbleUp') {
      throw error;
    }

    console.error(`Tool execution failed: name=${request.tool_call?.name}, id=${request.tool_call?.id}`);
    console.error(error);

    return buildErrorMessage(request, error);
  }
}

async function awrapToolCall(handler, request) {
  try {
    return await handler(request);
  } catch (error) {
    // Preserve GraphBubbleUp (LangGraph control signals)
    if (error.name === 'GraphBubbleUp') {
      throw error;
    }

    console.error(`Tool execution failed (async): name=${request.tool_call?.name}, id=${request.tool_call?.id}`);
    console.error(error);

    return buildErrorMessage(request, error);
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'test':
    // Test error message building
    const testRequest = {
      tool_call: { name: 'read_file', id: 'tc123' }
    };
    const testError = new Error('File not found: /path/to/file');
    
    const msg = buildErrorMessage(testRequest, testError);
    console.log('Error ToolMessage:', JSON.stringify(msg, null, 2));
    break;

  case 'status':
    console.log(JSON.stringify({
      feature: 'tool-error-handler',
      version: '1.0.0',
      description: 'Convert tool exceptions into error ToolMessages'
    }, null, 2));
    break;

  default:
    console.log('Usage: tool-error-handler.js [test|status]');
}

module.exports = {
  buildErrorMessage,
  wrapToolCall,
  awrapToolCall
};