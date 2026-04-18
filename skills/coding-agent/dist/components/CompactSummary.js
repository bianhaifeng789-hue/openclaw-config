/**
 * Compact Summary Component
 *
 * Displays a compact summary of conversation history.
 * Simplified version adapted from Claude Code's CompactSummary.tsx
 */
import React from 'react';
import { Box, Text } from 'ink';
const BLACK_CIRCLE = '●';
export function CompactSummary({ textContent, metadata, isTranscriptMode = false, }) {
    if (metadata) {
        return (React.createElement(Box, { flexDirection: "column", marginTop: 1 },
            React.createElement(Box, { flexDirection: "row" },
                React.createElement(Box, { minWidth: 2 },
                    React.createElement(Text, { color: "cyan" }, BLACK_CIRCLE)),
                React.createElement(Box, { flexDirection: "column" },
                    React.createElement(Text, { bold: true }, "Summarized conversation"),
                    !isTranscriptMode && (React.createElement(Box, { flexDirection: "column" },
                        React.createElement(Text, { dimColor: true },
                            "Summarized ",
                            metadata.messagesSummarized,
                            " messages",
                            ' ',
                            metadata.direction === 'up_to' ? 'up to this point' : 'from this point'),
                        metadata.userContext && (React.createElement(Text, { dimColor: true },
                            "Context: \"",
                            metadata.userContext,
                            "\"")),
                        React.createElement(Text, { dimColor: true }, "(ctrl+o to expand history)"))),
                    isTranscriptMode && (React.createElement(Text, { dimColor: true }, textContent))))));
    }
    // Default compact summary (auto-compact)
    return (React.createElement(Box, { flexDirection: "column", marginTop: 1 },
        React.createElement(Box, { flexDirection: "row" },
            React.createElement(Box, { minWidth: 2 },
                React.createElement(Text, { color: "cyan" }, BLACK_CIRCLE)),
            React.createElement(Box, { flexDirection: "column" },
                React.createElement(Text, { bold: true },
                    "Compact summary",
                    !isTranscriptMode && (React.createElement(Text, { dimColor: true }, " (ctrl+o to expand)"))))),
        isTranscriptMode && (React.createElement(Text, { dimColor: true }, textContent))));
}
//# sourceMappingURL=CompactSummary.js.map