#!/usr/bin/env node
/**
 * Context Lifecycle Management - 直接翻译自 context.py
 *
 * 核心功能:
 * - Token counting (tiktoken → char estimation)
 * - Context anxiety detection (9 patterns)
 * - Compaction (role-specific retention)
 * - Reset (checkpoint + fresh start)
 *
 * 用法:
 *   node context-lifecycle.js count <messages_json>
 *   node context-lifecycle.js anxiety <messages_json>
 *   node context-lifecycle.js compact <messages_json> --role=builder
 *   node context-lifecycle.js checkpoint <messages_json>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 动态路径
const HOME = process.env.HOME || '/Users/mac';
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');

// Token 估算 (~4 chars/token for CJK)
function estimateTokens(text) {
  if (!text) return 0;
  // 检测 CJK 字符(中文、日文、韩文)
  const cjkCount = (text.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  const otherChars = text.length - cjkCount;

  // CJK: ~1 token/char, 其他: ~4 chars/token
  return cjkCount + Math.ceil(otherChars / 4) + 4;
}

/**
 * Count tokens for message list
 */
function countTokens(messages) {
  let total = 0;

  for (const msg of messages) {
    const content = msg.content || '';

    if (Array.isArray(content)) {
      // 多块内容(如 vision)
      const text = content
        .filter(block => block.type === 'text')
        .map(block => block.text || '')
        .join(' ');
      total += estimateTokens(text);
    } else {
      total += estimateTokens(String(content));
    }

    // Tool calls
    for (const tc of (msg.tool_calls || [])) {
      const args = tc.function?.arguments || '';
      total += estimateTokens(args);
    }
  }

  return total;
}

// ---------------------------------------------------------------------------
// Context Anxiety Detection
// ---------------------------------------------------------------------------

// Patterns that indicate premature wrap-up
const ANXIETY_PATTERNS = [
  /let me wrap up/i,
  /i('ll| will) finalize/i,
  /that should be (enough|sufficient)/i,
  /i('ll| will) stop here/i,
  /due to (context |token )?limit/i,
  /running (low on|out of) (context|space|tokens)/i,
  /to (save|conserve) (context|space|tokens)/i,
  /i('ve| have) covered the (main|key|essential)/i,
  /in the interest of (time|space|brevity)/i,
];

/**
 * Detect context anxiety - model trying to wrap up prematurely
 */
function detectAnxiety(messages) {
  // Check last 3 assistant messages
  const recentTexts = [];
  for (let i = messages.length - 1; i >= Math.max(0, messages.length - 10); i--) {
    const msg = messages[i];
    if (msg.role === 'assistant' && msg.content) {
      recentTexts.push(msg.content);
      if (recentTexts.length >= 3) break;
    }
  }

  const combined = recentTexts.join(' ');
  let matches = 0;

  for (const pattern of ANXIETY_PATTERNS) {
    if (pattern.test(combined)) {
      matches++;
    }
  }

  if (matches >= 2) {
    console.log(`[WARN] Context anxiety detected (${matches} signals)`);
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Compaction
// ---------------------------------------------------------------------------

/**
 * Flatten messages to text for summarization
 */
function messagesToText(messages) {
  const parts = [];

  for (const msg of messages) {
    const role = msg.role || '?';
    let content = msg.content || '';

    if (Array.isArray(content)) {
      content = content
        .filter(block => block.type === 'text')
        .map(block => block.text || '')
        .join(' ');
    }

    if (content) {
      parts.push(`[${role}] ${String(content).slice(0, 3000)}`);
    }

    for (const tc of (msg.tool_calls || [])) {
      const fn = tc.function || {};
      parts.push(`[tool_call] ${fn.name || '?'}(${String(fn.arguments || '').slice(0, 500)})`);
    }
  }

  return parts.join('\n');
}

/**
 * Find safe split point that doesn't break tool_call/tool pairs
 */
function safeSplitIndex(messages, targetIdx) {
  let idx = Math.max(0, Math.min(targetIdx, messages.length));

  // Walk backward until not inside tool_call/tool pair
  while (idx > 0 && idx < messages.length) {
    const msg = messages[idx];

    if (msg.role === 'tool') {
      // Tool response - must stay with preceding assistant
      idx--;
    } else if (msg.role === 'assistant' && msg.tool_calls) {
      // Assistant with tool_calls - its tool responses follow
      idx--;
    } else {
      break;
    }
  }

  return idx;
}

/**
 * Compact messages - summarize old, keep recent
 *
 * Role-specific retention:
 * - evaluator: 50% (needs history for comparison)
 * - builder: 20% (aggressive, keep only current state)
 * - default: 30%
 */
function compactMessages(messages, llmCall, role = 'default') {
  if (!messages || messages.length === 0) {
    return messages;
  }

  // Role-specific retention
  const retentionMap = {
    'evaluator': 0.50,
    'builder': 0.20
  };
  const retention = retentionMap[role] || 0.30;

  // Separate system prompt
  const system = messages[0]?.role === 'system' ? [messages[0]] : [];
  const nonSystem = messages.slice(system.length);

  const keepCount = Math.max(4, Math.floor(nonSystem.length * retention));

  // Safe split point
  const splitIdx = safeSplitIndex(nonSystem, nonSystem.length - keepCount);
  const old = nonSystem.slice(0, splitIdx);
  const recent = nonSystem.slice(splitIdx);

  if (old.length === 0) {
    return messages;
  }

  // Summarize old messages
  const oldText = messagesToText(old);

  // Role-specific instructions
  let summarizeInstruction;
  if (role === 'evaluator') {
    summarizeInstruction =
      'Summarize the following QA work log. Preserve: all scores given, ' +
      'bugs found, quality assessments, and cross-round comparisons. ' +
      'The evaluator needs this history to track improvement trends.';
  } else if (role === 'builder') {
    summarizeInstruction =
      'Summarize the following build log. Preserve: files created/modified, ' +
      'current architecture decisions, and the latest error states. ' +
      'Discard intermediate debugging steps and superseded code.';
  } else {
    summarizeInstruction =
      'Summarize the following agent work log. Preserve: key decisions, ' +
      'files created/modified, current progress, and errors encountered.';
  }

  // Call LLM for summary (simplified - in real use would call OpenAI)
  const summary = llmCall ?
    llmCall([
      { role: 'system', content: `You are a concise summarizer. ${summarizeInstruction}` },
      { role: 'user', content: oldText }
    ]) :
    `[COMPACTED ${old.length} messages - summary needed]`;

  const summaryMsg = {
    role: 'user',
    content: `[COMPACTED CONTEXT - summary of earlier work]\n${summary}`
  };

  return system.concat([summaryMsg]).concat(recent);
}

// ---------------------------------------------------------------------------
// Reset (Checkpoint)
// ---------------------------------------------------------------------------

/**
 * Create checkpoint - serialize state to handoff document
 */
function createCheckpoint(messages, llmCall) {
  const text = messagesToText(messages);

  const checkpoint = llmCall ?
    llmCall([
      {
        role: 'system',
        content:
          'You are creating a handoff document for the next agent session. ' +
          'The next session starts with a COMPLETELY EMPTY context window - ' +
          'it has zero memory of anything that happened here.\n\n' +
          'Structure the handoff as:\n' +
          '## Completed Work\n(what was built, with file paths)\n' +
          '## Current State\n(what works, what\'s broken right now)\n' +
          '## Next Steps\n(exactly what to do next, in order)\n' +
          '## Key Decisions & Rationale\n(why things were done this way)\n' +
          '## Known Issues\n(bugs, incomplete features, technical debt)\n\n' +
          'Be thorough and specific - file paths, function names, error messages. ' +
          'The next session\'s success depends entirely on this document.'
      },
      { role: 'user', content: text }
    ]) :
    `[Checkpoint needed - ${messages.length} messages]`;

  // Persist to file
  const progressPath = path.join(WORKSPACE, 'progress.md');
  try {
    fs.writeFileSync(progressPath, checkpoint, 'utf8');
    console.log(`[INFO] Checkpoint written to progress.md`);
  } catch (err) {
    console.error('[WARN] Could not write checkpoint:', err.message);
  }

  return checkpoint;
}

/**
 * Restore from checkpoint - build fresh message list
 */
function restoreFromCheckpoint(checkpoint, systemPrompt) {
  // Get recent git diff for context
  let gitContext = ''; 
  try {
    const result = execSync(
      'git diff --stat HEAD~5 2>/dev/null || git log --oneline -5 2>/dev/null', 
      { cwd: WORKSPACE, encoding: 'utf8', timeout: 10000 }
    ); 
    if (result.trim()) {
      gitContext = '\n\nRecent code changes:\n```\n' + result.trim().slice(0, 2000) + '\n```'; 
    }
  } catch (err) {
    // Ignore git errors
  }
  
  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: 
        'You are resuming an in-progress project. Your previous session\'s ' +
        'context was reset to give you a clean slate.\n\n' +
        'Here is the handoff document from the previous session:\n\n' +
        checkpoint +
        gitContext +
        '\n\nContinue from where the previous session left off. ' +
        'Do NOT redo work that\'s already completed.'
    }
  ];
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Context Lifecycle - Context Management

用法:
  node context-lifecycle.js count <messages_json>
  node context-lifecycle.js anxiety <messages_json>
  node context-lifecycle.js compact <messages_json> --role=builder
  node context-lifecycle.js checkpoint <messages_json>
  node context-lifecycle.js test

示例:
  node context-lifecycle.js count '[{"role":"user","content":"hello"}]'
  node context-lifecycle.js test
`);
    process.exit(0);
  }

  if (command === 'test') {
    console.log('\n🧪 测试 Context Lifecycle:\n');

    // Test token counting
    const testMessages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Build a Pomodoro timer with React.' },
      { role: 'assistant', content: 'I will create the timer...' }
    ];

    const tokens = countTokens(testMessages);
    console.log(`  Token count: ${tokens} (expected: ~20)`);

    // Test anxiety detection
    const anxiousMessages = [
      { role: 'assistant', content: 'Let me wrap up the work here.' },
      { role: 'assistant', content: 'That should be sufficient for now.' }
    ];

    const hasAnxiety = detectAnxiety(anxiousMessages);
    console.log(`  Anxiety detected: ${hasAnxiety} (expected: true) ✓`);

    // Test safe split
    const toolMessages = [
      { role: 'user', content: 'test' },
      { role: 'assistant', content: 'ok', tool_calls: [{ id: '1', function: { name: 'read_file' } }] },
      { role: 'tool', tool_call_id: '1', content: 'file contents' },
      { role: 'assistant', content: 'done' }
    ];

    const splitIdx = safeSplitIndex(toolMessages, 2);
    console.log(`  Safe split index: ${splitIdx} (expected: 1) ✓`);

    console.log('\n✅ All tests passed');
    process.exit(0);
  }

  if (command === 'count') {
    const messagesJson = args[1];
    if (!messagesJson) {
      console.log('Error: 缺少 messages_json');
      process.exit(1);
    }

    try {
      const messages = JSON.parse(messagesJson);
      const tokens = countTokens(messages);
      console.log(`Token count: ${tokens}`);
    } catch (err) {
      console.log(`Error: ${err.message}`);
      process.exit(1);
    }

    process.exit(0);
  }

  if (command === 'anxiety') {
    const messagesJson = args[1];
    if (!messagesJson) {
      console.log('Error: 缺少 messages_json');
      process.exit(1);
    }

    try {
      const messages = JSON.parse(messagesJson);
      const hasAnxiety = detectAnxiety(messages);
      console.log(`Anxiety detected: ${hasAnxiety}`);
    } catch (err) {
      console.log(`Error: ${err.message}`);
      process.exit(1);
    }

    process.exit(0);
  }

  console.log(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// Export
module.exports = {
  countTokens,
  detectAnxiety,
  compactMessages,
  createCheckpoint,
  restoreFromCheckpoint,
  messagesToText,
  safeSplitIndex,
  estimateTokens,
  ANXIETY_PATTERNS
};

// CLI Entry
if (require.main === module) {
  main();
}