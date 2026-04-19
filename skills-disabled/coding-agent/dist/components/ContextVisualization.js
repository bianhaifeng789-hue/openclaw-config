/**
 * Context Visualization Component
 *
 * Displays context token usage breakdown.
 * Simplified version adapted from Claude Code's ContextVisualization.tsx
 */
import React from 'react';
import { Box, Text } from 'ink';
function formatTokens(tokens) {
    if (tokens >= 1_000_000)
        return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000)
        return `${(tokens / 1_000).toFixed(1)}K`;
    return `${tokens}`;
}
function plural(n, word) {
    return n === 1 ? word : `${word}s`;
}
const BAR_WIDTH = 40;
const CATEGORY_COLORS = ['cyan', 'magenta', 'yellow', 'green', 'blue', 'red'];
export function ContextVisualization({ categories, totalTokens, maxTokens, percentage, model, }) {
    const barSegments = [];
    let remainingWidth = BAR_WIDTH;
    const totalForBar = categories.reduce((sum, c) => sum + c.totalTokens, 0);
    categories.forEach((category, i) => {
        const ratio = category.totalTokens / totalForBar;
        const width = Math.round(ratio * BAR_WIDTH);
        const clampedWidth = Math.min(width, remainingWidth);
        if (clampedWidth > 0) {
            barSegments.push({
                width: clampedWidth,
                color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                name: category.name,
            });
            remainingWidth -= clampedWidth;
        }
    });
    // Fill remaining with gray (unused)
    if (remainingWidth > 0) {
        barSegments.push({
            width: remainingWidth,
            color: 'gray',
            name: 'unused',
        });
    }
    return (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
        React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { bold: true, color: "cyan" }, "Context:"),
            React.createElement(Text, null,
                " ",
                formatTokens(totalTokens),
                " / ",
                formatTokens(maxTokens),
                " tokens (",
                percentage.toFixed(1),
                "%)"),
            model && React.createElement(Text, { dimColor: true },
                " [",
                model,
                "]")),
        React.createElement(Box, { flexDirection: "row" },
            React.createElement(Text, { dimColor: true }, "\u2502"),
            barSegments.map((seg, i) => (React.createElement(Text, { key: i, backgroundColor: seg.color }, '█'.repeat(seg.width)))),
            React.createElement(Text, { dimColor: true }, "\u2502")),
        categories.map((category, i) => (React.createElement(Box, { key: category.name, flexDirection: "column", marginTop: i === 0 ? 0 : 1 },
            React.createElement(Box, { flexDirection: "row" },
                React.createElement(Text, { bold: true, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }, category.name),
                React.createElement(Text, { dimColor: true },
                    ' ',
                    "(",
                    formatTokens(category.totalTokens),
                    " tokens, ",
                    plural(category.items.length, 'item'),
                    ")")),
            category.items.slice(0, 5).map((item, j) => (React.createElement(Box, { key: j, flexDirection: "row", paddingLeft: 2 },
                React.createElement(Text, { dimColor: true },
                    "\u2022 ",
                    item.name),
                React.createElement(Text, { dimColor: true },
                    " (",
                    formatTokens(item.tokens),
                    ")")))),
            category.items.length > 5 && (React.createElement(Box, { paddingLeft: 2 },
                React.createElement(Text, { dimColor: true },
                    "  \u2026 and ",
                    category.items.length - 5,
                    " more")))))),
        percentage > 80 && (React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: "yellow" },
                "\u26A0 Context is ",
                percentage > 95 ? 'nearly full' : 'high',
                " (",
                percentage.toFixed(0),
                "% used)")))));
}
//# sourceMappingURL=ContextVisualization.js.map