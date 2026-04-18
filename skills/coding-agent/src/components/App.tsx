import React, { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import { MessageList } from './MessageList.js';
import { Input } from './Input.js';
import { GitService } from '../services/GitService.js';
import { FileEditTool } from '../tools/FileEditTool.js';
import { CommitCommand } from '../commands/commit.js';
import { ReviewCommand } from '../commands/review.js';
import { DoctorCommand } from '../commands/doctor.js';
import type { Message } from '../types.js';

interface AppProps {
  gitService: GitService;
  fileEditTool: FileEditTool;
}

export const App: React.FC<AppProps> = ({ gitService, fileEditTool }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: '🤖 Coding Agent initialized. Type /help for commands.',
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    setMessages((prev) => [
      ...prev,
      { ...message, id: Math.random().toString(36).slice(2) },
    ]);
  }, []);

  const handleCommand = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      addMessage({ role: 'user', content: trimmed });
      setIsProcessing(true);

      try {
        if (trimmed.startsWith('/')) {
          const [cmd, ...args] = trimmed.slice(1).split(' ');

          switch (cmd) {
            case 'commit':
              const commitCmd = new CommitCommand(gitService);
              const result = await commitCmd.execute();
              addMessage({ role: 'assistant', content: result, type: 'tool' });
              break;

            case 'review':
              const reviewCmd = new ReviewCommand(gitService);
              const reviewResult = await reviewCmd.execute(args[0]);
              addMessage({ role: 'assistant', content: reviewResult, type: 'tool' });
              break;

            case 'doctor':
              const doctorCmd = new DoctorCommand(gitService);
              const doctorResult = await doctorCmd.execute();
              addMessage({ role: 'assistant', content: doctorResult, type: 'tool' });
              break;

            case 'edit':
              if (args.length < 2) {
                addMessage({ role: 'system', content: 'Usage: /edit <file> <instruction>', type: 'error' });
              } else {
                const [file, ...instructionParts] = args;
                const instruction = instructionParts.join(' ');
                const editResult = await fileEditTool.edit(file, instruction);
                addMessage({ role: 'assistant', content: editResult, type: 'tool' });
              }
              break;

            case 'apply':
              if (args.length < 1) {
                addMessage({ role: 'system', content: 'Usage: /apply <file>', type: 'error' });
              } else {
                const applyResult = await fileEditTool.apply(args[0]);
                addMessage({ role: 'assistant', content: applyResult, type: 'tool' });
              }
              break;

            case 'revert':
              if (args.length < 1) {
                addMessage({ role: 'system', content: 'Usage: /revert <file>', type: 'error' });
              } else {
                const revertResult = await fileEditTool.revert(args[0]);
                addMessage({ role: 'assistant', content: revertResult, type: 'tool' });
              }
              break;

            case 'status':
              const status = gitService.getStatus();
              const statusText = `Branch: ${status.branch}\nStaged: ${status.staged.length}\nUnstaged: ${status.unstaged.length}\nUntracked: ${status.untracked.length}`;
              addMessage({ role: 'assistant', content: statusText, type: 'tool' });
              break;

            case 'help':
              addMessage({
                role: 'system',
                content: `Available commands:
  /commit          - Create AI-generated commit
  /review [pr]     - Review code changes
  /doctor          - Diagnose project issues
  /edit <f> <i>    - Edit file with instruction
  /apply <file>    - Apply pending edit
  /revert <file>   - Revert pending edit
  /status          - Git status
  /help            - Show this help
  /quit            - Exit`,
              });
              break;

            case 'quit':
            case 'exit':
              process.exit(0);

            default:
              addMessage({
                role: 'system',
                content: `Unknown command: /${cmd}. Type /help for available commands.`,
                type: 'error',
              });
          }
        } else {
          addMessage({
            role: 'assistant',
            content: `Received: ${trimmed}\n\n(Note: Full LLM integration would be added here)`,
          });
        }
      } catch (error) {
        addMessage({
          role: 'system',
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
          type: 'error',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [addMessage, gitService, fileEditTool]
  );

  return (
    <Box flexDirection="column">
      <Box flexGrow={1}>
        <MessageList messages={messages} />
      </Box>
      <Input onSubmit={handleCommand} isProcessing={isProcessing} />
    </Box>
  );
};