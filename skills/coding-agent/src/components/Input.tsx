import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface InputProps {
  onSubmit: (input: string) => void;
  isProcessing: boolean;
}

export const Input: React.FC<InputProps> = ({ onSubmit, isProcessing }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (value: string) => {
    if (value.trim() && !isProcessing) {
      onSubmit(value);
      setInput('');
    }
  };

  return (
    <Box padding={1} borderStyle="single" borderColor={isProcessing ? 'gray' : 'cyan'}>
      <Text color={isProcessing ? 'gray' : 'cyan'}>{isProcessing ? '⏳ ' : '❯ '}</Text>
      <TextInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder={isProcessing ? 'Processing...' : 'Type a command or message...'}
      />
    </Box>
  );
};