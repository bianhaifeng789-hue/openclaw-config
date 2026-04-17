#!/usr/bin/env node
/**
 * Title Generator - Automatic thread title generation
 *
 * Ported from DeerFlow title_middleware.py
 *
 * Features:
 * - Generate title after first complete exchange
 * - LLM generation or local fallback
 * - Configurable max words/chars
 */

const config = {
  enabled: true,
  max_words: 5,
  max_chars: 50,
  prompt_template: `Generate a concise title (max {max_words} words) for this conversation:

User: {user_msg}
Assistant: {assistant_msg}

Title:`,
  model_name: null  // Use default model
};

function normalizeContent(content) {
  if (typeof content === 'string') return content;
  
  if (Array.isArray(content)) {
    return content.map(normalizeContent).filter(c => c).join('\n');
  }
  
  if (typeof content === 'object') {
    if (content.text) return content.text;
    if (content.content) return normalizeContent(content.content);
  }
  
  return '';
}

function shouldGenerateTitle(state) {
  // Check config enabled
  if (!config.enabled) return false;

  // Already has title
  if (state.title) return false;

  // First exchange complete
  const messages = state.messages || [];
  const userCount = messages.filter(m => m.type === 'human').length;
  const assistantCount = messages.filter(m => m.type === 'ai').length;

  return userCount === 1 && assistantCount >= 1;
}

function buildTitlePrompt(state) {
  const messages = state.messages || [];
  
  const userContent = messages.find(m => m.type === 'human')?.content || '';
  const assistantContent = messages.find(m => m.type === 'ai')?.content || '';
  
  const userMsg = normalizeContent(userContent).slice(0, 500);
  const assistantMsg = normalizeContent(assistantContent).slice(0, 500);
  
  return {
    prompt: config.prompt_template
      .replace('{max_words}', config.max_words)
      .replace('{user_msg}', userMsg)
      .replace('{assistant_msg}', assistantMsg),
    userMsg
  };
}

function parseTitle(content) {
  const titleContent = normalizeContent(content);
  let title = titleContent.trim().replace(/^["']|["']$/g, '');
  
  if (title.length > config.max_chars) {
    title = title.slice(0, config.max_chars);
  }
  
  return title;
}

function fallbackTitle(userMsg) {
  const fallbackChars = Math.min(config.max_chars, 50);
  
  if (userMsg.length > fallbackChars) {
    return userMsg.slice(0, fallbackChars).trim() + '...';
  }
  
  return userMsg || 'New Conversation';
}

/**
 * Generate title (local fallback, no LLM)
 * @param {Object} state - Current state
 * @returns {Object|null} - {title: string} or null
 */
function generateTitleResult(state) {
  if (!shouldGenerateTitle(state)) return null;
  
  const { userMsg } = buildTitlePrompt(state);
  return { title: fallbackTitle(userMsg) };
}

/**
 * Generate title async (with LLM)
 * @param {Object} state - Current state
 * @param {Function} modelInvoker - LLM invocation function
 * @returns {Object|null} - {title: string} or null
 */
async function agenerateTitleResult(state, modelInvoker) {
  if (!shouldGenerateTitle(state)) return null;
  
  const { prompt, userMsg } = buildTitlePrompt(state);
  
  try {
    if (modelInvoker) {
      const response = await modelInvoker(prompt);
      const title = parseTitle(response.content || response);
      if (title) return { title };
    }
  } catch (error) {
    console.debug('Failed to generate async title; falling back to local title');
  }
  
  return { title: fallbackTitle(userMsg) };
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'test':
    // Test title generation
    const testState = {
      messages: [
        { type: 'human', content: 'Generate a report about AI trends in 2026' },
        { type: 'ai', content: 'I will research and generate the report...' }
      ]
    };
    
    console.log('Should generate:', shouldGenerateTitle(testState));
    const result = generateTitleResult(testState);
    console.log('Generated title:', result);
    break;

  case 'config':
    console.log(JSON.stringify(config, null, 2));
    break;

  case 'status':
    console.log(JSON.stringify({
      feature: 'title-generator',
      version: '1.0.0',
      description: 'Automatic thread title generation'
    }, null, 2));
    break;

  default:
    console.log('Usage: title-generator.js [test|config|status]');
}

module.exports = {
  config,
  shouldGenerateTitle,
  buildTitlePrompt,
  parseTitle,
  fallbackTitle,
  generateTitleResult,
  agenerateTitleResult
};