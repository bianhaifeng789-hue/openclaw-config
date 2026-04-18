import { useCallback } from 'react';
import { commitCommand } from '../commands/commit.js';
import { reviewCommand } from '../commands/review.js';
import { doctorCommand } from '../commands/doctor.js';
const commands = {
    commit: commitCommand,
    review: reviewCommand,
    doctor: doctorCommand,
    help: async () => `
Available commands:
  /commit - Create git commit with AI-generated message
  /review [pr-number] - Review pull request or current changes
  /doctor - Diagnose environment and project issues
  /help - Show this help message
  
You can also type regular messages to chat with the AI assistant.
`,
};
export function useCommandHandler() {
    const handleCommand = useCallback(async (input) => {
        const trimmed = input.trim();
        if (!trimmed.startsWith('/')) {
            return 'Not a command';
        }
        const parts = trimmed.slice(1).split(' ');
        const commandName = parts[0];
        const args = parts.slice(1).join(' ');
        const command = commands[commandName];
        if (!command) {
            return `Unknown command: /${commandName}. Type /help for available commands.`;
        }
        return await command(args);
    }, []);
    return { handleCommand };
}
//# sourceMappingURL=useCommandHandler.js.map