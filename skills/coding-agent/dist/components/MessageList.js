import React from 'react';
import { Box, Text } from 'ink';
export const MessageList = ({ messages }) => {
    return (React.createElement(Box, { flexDirection: "column", padding: 1 }, messages.map((message) => (React.createElement(Box, { key: message.id, flexDirection: "column", marginBottom: 1 },
        React.createElement(MessageItem, { message: message }))))));
};
const MessageItem = ({ message }) => {
    const { role, content, type } = message;
    const getRoleColor = () => {
        switch (role) {
            case 'user':
                return 'cyan';
            case 'assistant':
                return 'green';
            case 'system':
                return type === 'error' ? 'red' : 'yellow';
            default:
                return 'white';
        }
    };
    const getRoleLabel = () => {
        switch (role) {
            case 'user':
                return 'You';
            case 'assistant':
                return type === 'tool' ? '🔧 Tool' : '🤖 Assistant';
            case 'system':
                return type === 'error' ? '❌ Error' : 'ℹ️  System';
            default:
                return role;
        }
    };
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Text, { bold: true, color: getRoleColor() },
            getRoleLabel(),
            ":"),
        React.createElement(Box, { marginLeft: 2 },
            React.createElement(Text, { wrap: "wrap" }, content))));
};
//# sourceMappingURL=MessageList.js.map