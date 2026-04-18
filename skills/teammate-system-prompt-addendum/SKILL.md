# Teammate System Prompt Addendum Pattern

## Source
Claude Code: `utils/swarm/teammatePromptAddendum.ts`

## Pattern
Append teammate-specific communication instructions to main agent system prompt.

## Code Example
```typescript
export const TEAMMATE_SYSTEM_PROMPT_ADDENDUM = `
# Agent Teammate Communication

IMPORTANT: You are running as an agent in a team. To communicate with anyone on your team:
- Use the SendMessage tool with \`to: "<name>"\` to send messages to specific teammates
- Use the SendMessage tool with \`to: "*"\` sparingly for team-wide broadcasts

Just writing a response in text is not visible to others on your team - you MUST use the SendMessage tool.

The user interacts primarily with the team lead. Your work is coordinated through the task system and teammate messaging.
`
```

## Key Concepts
1. **SendMessage Tool**: to: "<name>" for specific teammate
2. **Broadcast**: to: "*" sparingly for team-wide
3. **Text Not Visible**: Response text alone not seen by teammates
4. **Team Lead Primary**: User interacts with lead, not individual teammates
5. **Task Coordination**: Work via task system + messaging

## Benefits
- Clear teammate communication protocol
- Prevents confusion about visibility
- Emphasizes SendMessage tool importance

## When to Use
- Teammate system prompt construction
- Swarm agent coordination
- Team communication guidance

## Related Patterns
- System Prompt Builder (systemPromptBuilder.ts)
- SendMessage Tool (SendMessageTool.ts)
- Teammate Mailbox (teammateMailbox.ts)