import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
export const Input = ({ onSubmit, isProcessing }) => {
    const [input, setInput] = useState('');
    const handleSubmit = (value) => {
        if (value.trim() && !isProcessing) {
            onSubmit(value);
            setInput('');
        }
    };
    return (React.createElement(Box, { padding: 1, borderStyle: "single", borderColor: isProcessing ? 'gray' : 'cyan' },
        React.createElement(Text, { color: isProcessing ? 'gray' : 'cyan' }, isProcessing ? '⏳ ' : '❯ '),
        React.createElement(TextInput, { value: input, onChange: setInput, onSubmit: handleSubmit, placeholder: isProcessing ? 'Processing...' : 'Type a command or message...' })));
};
//# sourceMappingURL=Input.js.map