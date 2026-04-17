#!/usr/bin/env node
/**
 * Summarization - Automatic conversation summarization
 *
 * Purpose: Summarize old messages when approaching token limits
 *
 * Borrowed from: DeerFlow Summarization Middleware
 *
 * Key concepts:
 * - Token-based triggers (4000 tokens)
 * - Message-based triggers (50 messages)
 * - Keep recent 20 messages
 * - Use lightweight model for summaries
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const SUMMARIZATION_CONFIG = path.join(WORKSPACE, 'state', 'summarization-config.json');

class SummarizationMiddleware {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(SUMMARIZATION_CONFIG)) {
        return JSON.parse(fs.readFileSync(SUMMARIZATION_CONFIG, 'utf8'));
      }
    } catch {
      // ignore
    }
    return {
      enabled: true,
      trigger_tokens: 4000,
      trigger_messages: 50,
      keep_messages: 20,
      trim_tokens_to_summarize: 4000,
      model: 'lightweight', // Use lightweight model for summaries
      summary_prompt: 'Summarize the following conversation, preserving key information, decisions, and context:'
    };
  }

  saveConfig() {
    fs.mkdirSync(path.dirname(SUMMARIZATION_CONFIG), { recursive: true });
    fs.writeFileSync(SUMMARIZATION_CONFIG, JSON.stringify(this.config, null, 2));
  }

  /**
   * Estimate tokens (rough: 4 chars per token)
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if summarization needed
   */
  needsSummarization(messages, currentTokens) {
    if (!this.config.enabled) return false;

    // Token trigger
    if (currentTokens >= this.config.trigger_tokens) {
      return { needed: true, reason: 'tokens', value: currentTokens };
    }

    // Message trigger
    if (messages.length >= this.config.trigger_messages) {
      return { needed: true, reason: 'messages', value: messages.length };
    }

    return { needed: false };
  }

  /**
   * Generate summary from messages
   */
  generateSummary(messages) {
    if (messages.length <= this.config.keep_messages) {
      return null;
    }

    // Keep last N messages
    const recentMessages = messages.slice(-this.config.keep_messages);
    const oldMessages = messages.slice(0, -this.config.keep_messages);

    // Format old messages for summarization
    const conversationText = oldMessages.map(msg => {
      const role = msg.role || 'user';
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      return `${role}: ${content}`;
    }).join('\n\n');

    // Trim to limit
    const trimmedText = conversationText.slice(0, this.config.trim_tokens_to_summarize * 4);

    // Generate summary prompt
    const summaryPrompt = `${this.config.summary_prompt}\n\n${trimmedText}`;

    return {
      summaryPrompt,
      recentMessages,
      oldMessagesCount: oldMessages.length,
      estimatedTokens: this.estimateTokens(trimmedText)
    };
  }

  /**
   * Apply summary to messages
   */
  applySummary(messages, summary) {
    if (!summary) return messages;

    // Insert summary as first message
    const summaryMessage = {
      role: 'system',
      content: `📋 Conversation Summary:\n${summary}`,
      isSummary: true
    };

    // Keep recent messages
    const recentMessages = messages.slice(-this.config.keep_messages);

    return [summaryMessage, ...recentMessages];
  }

  /**
   * Calculate token savings
   */
  calculateSavings(oldMessages, summaryText) {
    const oldTokens = oldMessages.reduce((sum, msg) => {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      return sum + this.estimateTokens(content);
    }, 0);

    const summaryTokens = this.estimateTokens(summaryText);

    return {
      oldTokens,
      summaryTokens,
      saved: oldTokens - summaryTokens,
      compressionRatio: (oldTokens - summaryTokens) / oldTokens
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    return this.config;
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const middleware = new SummarizationMiddleware();

switch (command) {
  case 'check':
    const checkMessages = JSON.parse(args[1] || '[]');
    const checkTokens = parseInt(args[2]) || 0;
    const checkResult = middleware.needsSummarization(checkMessages, checkTokens);
    console.log(JSON.stringify(checkResult, null, 2));
    break;

  case 'config':
    console.log(JSON.stringify(middleware.config, null, 2));
    break;

  case 'enable':
    middleware.updateConfig({ enabled: true });
    console.log(JSON.stringify({ enabled: true }, null, 2));
    break;

  case 'disable':
    middleware.updateConfig({ enabled: false });
    console.log(JSON.stringify({ enabled: false }, null, 2));
    break;

  case 'set-trigger':
    const triggerType = args[1]; // 'tokens' or 'messages'
    const triggerValue = parseInt(args[2]);
    if (triggerType === 'tokens') {
      middleware.updateConfig({ trigger_tokens: triggerValue });
    } else if (triggerType === 'messages') {
      middleware.updateConfig({ trigger_messages: triggerValue });
    }
    console.log(JSON.stringify({ set: `${triggerType}=${triggerValue}` }, null, 2));
    break;

  case 'test':
    // Test summarization
    console.log('Testing Summarization:');
    console.log('');

    // Test 1: Check needs summarization
    const testMessages = Array(60).fill(null).map((_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}: This is a test message with some content.`
    }));
    const testTokens = testMessages.reduce((sum, msg) => sum + middleware.estimateTokens(msg.content), 0);

    const needsCheck = middleware.needsSummarization(testMessages, testTokens);
    console.log('Test 1: Check needs summarization');
    console.log('Messages:', testMessages.length);
    console.log('Tokens:', testTokens);
    console.log('Needs summarization:', needsCheck);

    // Test 2: Generate summary
    const summaryResult = middleware.generateSummary(testMessages);
    if (summaryResult) {
      console.log('\nTest 2: Generate summary');
      console.log('Old messages to summarize:', summaryResult.oldMessagesCount);
      console.log('Recent messages to keep:', summaryResult.recentMessages.length);
      console.log('Estimated tokens:', summaryResult.estimatedTokens);
      console.log('Summary prompt length:', summaryResult.summaryPrompt.length);

      // Test 3: Calculate savings
      const oldMessages = testMessages.slice(0, -middleware.config.keep_messages);
      const savings = middleware.calculateSavings(oldMessages, 'Generated summary text...');
      console.log('\nTest 3: Calculate token savings');
      console.log('Old tokens:', savings.oldTokens);
      console.log('Summary tokens:', savings.summaryTokens);
      console.log('Saved:', savings.saved);
      console.log('Compression ratio:', savings.compressionRatio.toFixed(2));
    }
    break;

  default:
    console.log('Usage: summarization-middleware.js [check|config|enable|disable|set-trigger|test]');
    console.log('');
    console.log('Commands:');
    console.log('  check <messagesJson> <currentTokens> - Check if needs summarization');
    console.log('  config - Show current configuration');
    console.log('  enable - Enable summarization');
    console.log('  disable - Disable summarization');
    console.log('  set-trigger <tokens|messages> <value> - Set trigger threshold');
    console.log('  test - Test summarization');
}

module.exports = { SummarizationMiddleware };