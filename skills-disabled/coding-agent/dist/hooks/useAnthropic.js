use;
client;
";;
import { useState, useCallback } from 'react';
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
const SYSTEM_PROMPT = `You are Coding Agent, an expert software development assistant integrated into a terminal-based TUI.

Your capabilities:
- Help with code review, debugging, and refactoring
- Explain code and suggest improvements
- Assist with git operations and project structure
- Answer programming questions across all languages

Guidelines:
- Be concise but thorough
- Use code blocks for code examples
- When suggesting changes, explain the reasoning
- If unsure, ask clarifying questions

Current working directory context is automatically provided when relevant.`;
export function useAnthropic() {
    const [isLoading, setIsLoading] = useState(false);
    const sendMessage = useCallback(async (message) => {
        setIsLoading(true);
        try {
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                system: SYSTEM_PROMPT,
                messages: [
                    { role: 'user', content: message }
                ],
            });
            const content = response.content[0];
            return content.type === 'text' ? content.text : 'Received non-text response';
        }
        catch (error) {
            if (error instanceof Error) {
                return `Error: ${error.message}`;
            }
            return 'An unknown error occurred';
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    return { sendMessage, isLoading };
}
//# sourceMappingURL=useAnthropic.js.map