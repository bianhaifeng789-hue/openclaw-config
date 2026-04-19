/**
 * Agent Progress Line Component
 *
 * Displays agent progress in a tree-like structure.
 * Simplified version adapted from Claude Code's AgentProgressLine.tsx
 */
import React from 'react';
import { Box, Text } from 'ink';
function formatNumber(num) {
    if (num >= 1_000_000)
        return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)
        return `${(num / 1_000).toFixed(1)}K`;
    return `${num}`;
}
export function AgentProgressLine({ agentType, description, name, toolUseCount, tokens, color, isLast, isResolved, isError, isAsync = false, lastToolInfo, hideType = false, }) {
    const treeChar = isLast ? '└─' : '├─';
    const isBackgrounded = isAsync && isResolved;
    const getStatusText = () => {
        if (!isResolved) {
            return lastToolInfo || 'Initializing…';
        }
        if (isBackgrounded) {
            return 'Running in the background';
        }
        return 'Done';
    };
    const statusColor = isError ? 'red' : isResolved ? 'green' : undefined;
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { paddingLeft: 3 },
            React.createElement(Text, { dimColor: true },
                treeChar,
                " "),
            React.createElement(Text, { dimColor: !isResolved },
                hideType ? (React.createElement(React.Fragment, null,
                    React.createElement(Text, { bold: true }, name ?? description ?? agentType),
                    name && description && React.createElement(Text, { dimColor: true },
                        ": ",
                        description))) : (React.createElement(React.Fragment, null,
                    React.createElement(Text, { bold: true, backgroundColor: color, color: color ? 'black' : undefined }, agentType),
                    description && (React.createElement(React.Fragment, null,
                        ' (',
                        React.createElement(Text, { bold: false }, description),
                        ')')))),
                !isBackgrounded && (React.createElement(React.Fragment, null,
                    ' · ',
                    toolUseCount,
                    " tool ",
                    toolUseCount === 1 ? 'use' : 'uses',
                    tokens !== null && React.createElement(React.Fragment, null,
                        " \u00B7 ",
                        formatNumber(tokens),
                        " tokens"))))),
        !isBackgrounded && (React.createElement(Box, { paddingLeft: 3, flexDirection: "row" },
            React.createElement(Text, { dimColor: true }, isLast ? '   ⏟  ' : '│  ⏟  '),
            React.createElement(Text, { dimColor: true, color: statusColor }, getStatusText())))));
}
//# sourceMappingURL=AgentProgressLine.js.map