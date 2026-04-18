import React from 'react';
import { Box, Text } from 'ink';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'tool' | 'error';
}

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <Box flexDirection="column" padding={1}>
      {messages.map((message) => (
        <Box key={message.id} flexDirection="column" marginBottom={1}>
          <MessageItem message={message} />
        </Box>
      ))}
    </Box>
  );
};

const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
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

  return (
    <Box flexDirection="column">
      <Text bold color={getRoleColor()}>
        {getRoleLabel()}:
      </Text>
      <Box marginLeft={2}>
        <Text wrap="wrap">{content}</Text>
      </Box>
    </Box>
  );
};