#!/usr/bin/env node
/**
 * LLM Error Handler - Retry/backoff and user-facing fallbacks
 *
 * Ported from DeerFlow llm_error_handling_middleware.py
 * 
 * Features:
 * - Retry transient errors (408, 429, 500, 502, 503, 504)
 * - Exponential backoff (1s, 2s, 4s, capped at 8s)
 * - Retry-After header support
 * - User-friendly error messages for quota/auth failures
 */

const RETRIABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const BUSY_PATTERNS = [
  'server busy', 'temporarily unavailable', 'try again later',
  'please retry', 'please try again', 'overloaded', 'high demand',
  'rate limit', '负载较高', '服务繁忙', '稍后重试', '请稍后重试'
];

const QUOTA_PATTERNS = [
  'insufficient_quota', 'quota', 'billing', 'credit', 'payment',
  '余额不足', '超出限额', '额度不足', '欠费'
];

const AUTH_PATTERNS = [
  'authentication', 'unauthorized', 'invalid api key', 'invalid_api_key',
  'permission', 'forbidden', 'access denied', '无权', '未授权'
];

const config = {
  retry_max_attempts: 3,
  retry_base_delay_ms: 1000,
  retry_cap_delay_ms: 8000
};

function matchesAny(detail, patterns) {
  const lowered = detail.toLowerCase();
  return patterns.some(p => lowered.includes(p.toLowerCase()));
}

function extractStatusCode(error) {
  return error.status_code || error.status || error.response?.status_code || null;
}

function extractRetryAfterMs(error) {
  const headers = error.response?.headers;
  if (!headers) return null;

  for (const key of ['retry-after-ms', 'Retry-After-Ms', 'retry-after', 'Retry-After']) {
    const raw = headers[key] || headers[key.toLowerCase()];
    if (raw) {
      const multiplier = key.toLowerCase().includes('ms') ? 1 : 1000;
      try {
        return Math.max(0, parseInt(parseFloat(raw) * multiplier));
      } catch {
        // Try date parsing for Retry-After
        try {
          const target = new Date(raw).getTime();
          return Math.max(0, target - Date.now());
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function classifyError(error) {
  const detail = (error.message || error.toString() || error.constructor.name).toLowerCase();
  const statusCode = extractStatusCode(error);

  // Quota errors - not retriable
  if (matchesAny(detail, QUOTA_PATTERNS)) {
    return { retriable: false, reason: 'quota' };
  }

  // Auth errors - not retriable
  if (matchesAny(detail, AUTH_PATTERNS)) {
    return { retriable: false, reason: 'auth' };
  }

  // Transient errors - retriable
  const errorName = error.constructor.name;
  if (['APITimeoutError', 'APIConnectionError', 'InternalServerError'].includes(errorName)) {
    return { retriable: true, reason: 'transient' };
  }

  if (statusCode && RETRIABLE_STATUS_CODES.has(statusCode)) {
    return { retriable: true, reason: 'transient' };
  }

  // Busy patterns - retriable
  if (matchesAny(detail, BUSY_PATTERNS)) {
    return { retriable: true, reason: 'busy' };
  }

  return { retriable: false, reason: 'generic' };
}

function buildRetryDelayMs(attempt, error) {
  const retryAfter = extractRetryAfterMs(error);
  if (retryAfter !== null) return retryAfter;

  const backoff = config.retry_base_delay_ms * Math.pow(2, Math.max(0, attempt - 1));
  return Math.min(backoff, config.retry_cap_delay_ms);
}

function buildUserMessage(error, reason) {
  const detail = error.message || error.toString() || error.constructor.name;

  switch (reason) {
    case 'quota':
      return 'The configured LLM provider rejected the request because the account is out of quota, billing is unavailable, or usage is restricted. Please fix the provider account and try again.';
    case 'auth':
      return 'The configured LLM provider rejected the request because authentication or access is invalid. Please check the provider credentials and try again.';
    case 'busy':
    case 'transient':
      return 'The configured LLM provider is temporarily unavailable after multiple retries. Please wait a moment and continue the conversation.';
    default:
      return `LLM request failed: ${detail.slice(0, 200)}`;
  }
}

function buildRetryMessage(attempt, waitMs, reason) {
  const seconds = Math.max(1, Math.round(waitMs / 1000));
  const reasonText = reason === 'busy' ? 'provider is busy' : 'provider request failed temporarily';
  return `LLM request retry ${attempt}/${config.retry_max_attempts}: ${reasonText}. Retrying in ${seconds}s.`;
}

/**
 * Wrap LLM call with retry logic
 * @param {Function} handler - The LLM call handler
 * @param {Object} request - The request object
 * @returns {Object} - Response or error message
 */
async function wrapModelCall(handler, request) {
  let attempt = 1;

  while (true) {
    try {
      return await handler(request);
    } catch (error) {
      const { retriable, reason } = classifyError(error);

      if (retriable && attempt < config.retry_max_attempts) {
        const waitMs = buildRetryDelayMs(attempt, error);
        
        console.warn(`Transient LLM error on attempt ${attempt}/${config.retry_max_attempts}; retrying in ${waitMs}ms: ${error.message}`);
        
        // Emit retry event (for stream writer)
        if (global.streamWriter) {
          global.streamWriter({
            type: 'llm_retry',
            attempt,
            max_attempts: config.retry_max_attempts,
            wait_ms: waitMs,
            reason,
            message: buildRetryMessage(attempt, waitMs, reason)
          });
        }

        await new Promise(resolve => setTimeout(resolve, waitMs));
        attempt++;
        continue;
      }

      console.warn(`LLM call failed after ${attempt} attempt(s): ${error.message}`);
      
      // Return AIMessage with error
      return {
        type: 'ai',
        content: buildUserMessage(error, reason),
        error: true,
        reason
      };
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'test':
    // Test error classification
    const testErrors = [
      { message: 'Rate limit exceeded', status_code: 429 },
      { message: 'Insufficient quota', constructor: { name: 'QuotaError' } },
      { message: 'Server busy, try again later' },
      { message: 'Unauthorized: invalid API key' }
    ];
    
    testErrors.forEach(e => {
      const result = classifyError(e);
      console.log(`Error: "${e.message}" => Retriable: ${result.retriable}, Reason: ${result.reason}`);
    });
    break;

  case 'status':
    console.log(JSON.stringify({
      config,
      patterns: {
        busy: BUSY_PATTERNS.length,
        quota: QUOTA_PATTERNS.length,
        auth: AUTH_PATTERNS.length
      }
    }, null, 2));
    break;

  default:
    console.log('Usage: llm-error-handler.js [test|status]');
}

module.exports = {
  classifyError,
  buildRetryDelayMs,
  buildUserMessage,
  wrapModelCall,
  config
};