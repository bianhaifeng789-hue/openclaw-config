#!/usr/bin/env python3
from pathlib import Path
import sys

TARGET = Path('/Users/mac/.npm-global/lib/node_modules/openclaw/dist/model-context-tokens-z5hvDVkk.js')

OLD = '''const HIGH_RISK_LARGE_TEXT_TOOL_NAMES = new Set(["exec", "read"]);
function isHighRiskLargeTextToolResult(msg) {
\tif (!isToolResultMessage(msg)) return false;
\tconst toolName = normalizeOptionalLowercaseString(msg.toolName) ?? "";
\treturn HIGH_RISK_LARGE_TEXT_TOOL_NAMES.has(toolName);
}
function truncateToolResultToChars(msg, maxChars, cache) {
\tif (!isToolResultMessage(msg)) return msg;
\tconst estimatedChars = estimateMessageCharsCached(msg, cache);
\tif (estimatedChars <= maxChars) return msg;
\tconst rawText = getToolResultText(msg);
\tif (!rawText) return replaceToolResultText(msg, formatContextLimitTruncationNotice(Math.max(1, estimateBudgetToTextBudget(Math.max(estimatedChars - maxChars, 1)))));
\tif (isHighRiskLargeTextToolResult(msg)) {
\t\tconst compactBudget = Math.max(400, Math.min(4000, Math.floor(estimateBudgetToTextBudget(maxChars) * 0.25)));
\t\tconst prefixBudget = Math.max(120, Math.floor(compactBudget * 0.6));
\t\tconst suffixBudget = Math.max(80, compactBudget - prefixBudget);
\t\tif (rawText.length <= compactBudget) return replaceToolResultText(msg, rawText);
\t\tconst head = rawText.slice(0, prefixBudget).trimEnd();
\t\tconst tail = rawText.slice(-suffixBudget).trimStart();
\t\tconst omitted = Math.max(1, rawText.length - head.length - tail.length);
\t\treturn replaceToolResultText(msg, `${head}\n[... ${omitted} chars omitted from persisted ${msg.toolName || "tool"} output ...]\n${tail}`);
\t}
\tconst textBudget = estimateBudgetToTextBudget(maxChars);
\tif (textBudget <= 0) return replaceToolResultText(msg, formatContextLimitTruncationNotice(rawText.length));
\tif (rawText.length <= textBudget) return replaceToolResultText(msg, rawText);
\treturn replaceToolResultText(msg, truncateTextToBudget(rawText, textBudget));
}'''

NEW = '''const HIGH_RISK_LARGE_TEXT_TOOL_NAMES = new Set(["exec", "read"]);
const HIGH_RISK_PERSISTED_TEXT_HARD_CAP = 1200;
function isHighRiskLargeTextToolResult(msg) {
\tif (!isToolResultMessage(msg)) return false;
\tconst toolName = normalizeOptionalLowercaseString(msg.toolName) ?? "";
\treturn HIGH_RISK_LARGE_TEXT_TOOL_NAMES.has(toolName);
}
function aggressivelyCompactHighRiskPersistedToolResult(msg, rawText) {
\tconst hardCap = HIGH_RISK_PERSISTED_TEXT_HARD_CAP;
\tif (rawText.length <= hardCap) return replaceToolResultText(msg, rawText);
\tconst prefixBudget = 700;
\tconst suffixBudget = 300;
\tconst head = rawText.slice(0, prefixBudget).trimEnd();
\tconst tail = rawText.slice(-suffixBudget).trimStart();
\tconst omitted = Math.max(1, rawText.length - head.length - tail.length);
\tconst lines = rawText.split(/\\r?\\n/);
\tconst lineCount = lines.length;
\tconst summary = `[persisted ${msg.toolName || "tool"} output compacted for session safety, originalChars=${rawText.length}, originalLines=${lineCount}, keptHeadChars=${head.length}, keptTailChars=${tail.length}, omittedChars=${omitted}]`;
\treturn replaceToolResultText(msg, `${summary}\n\n${head}\n\n[... ${omitted} chars omitted from persisted ${msg.toolName || "tool"} output ...]\n\n${tail}`);
}
function truncateToolResultToChars(msg, maxChars, cache) {
\tif (!isToolResultMessage(msg)) return msg;
\tconst estimatedChars = estimateMessageCharsCached(msg, cache);
\tif (estimatedChars <= maxChars) return msg;
\tconst rawText = getToolResultText(msg);
\tif (!rawText) return replaceToolResultText(msg, formatContextLimitTruncationNotice(Math.max(1, estimateBudgetToTextBudget(Math.max(estimatedChars - maxChars, 1)))));
\tif (isHighRiskLargeTextToolResult(msg)) {
\t\treturn aggressivelyCompactHighRiskPersistedToolResult(msg, rawText);
\t}
\tconst textBudget = estimateBudgetToTextBudget(maxChars);
\tif (textBudget <= 0) return replaceToolResultText(msg, formatContextLimitTruncationNotice(rawText.length));
\tif (rawText.length <= textBudget) return replaceToolResultText(msg, rawText);
\treturn replaceToolResultText(msg, truncateTextToBudget(rawText, textBudget));
}'''

if not TARGET.exists():
    print(f'target not found: {TARGET}', file=sys.stderr)
    sys.exit(1)

text = TARGET.read_text(errors='ignore')
if NEW in text:
    print('patch already present')
    sys.exit(0)
if OLD in text:
    TARGET.write_text(text.replace(OLD, NEW, 1))
    print('patch applied:', TARGET)
    sys.exit(0)

marker = 'const HIGH_RISK_LARGE_TEXT_TOOL_NAMES = new Set(["exec", "read"]);'
if marker in text and 'function truncateToolResultToChars(msg, maxChars, cache) {' in text:
    print('expected original block not found, but target area exists. openclaw version likely changed; inspect before patching.', file=sys.stderr)
    sys.exit(3)

print('target pattern not found, openclaw version may have changed substantially', file=sys.stderr)
sys.exit(2)
