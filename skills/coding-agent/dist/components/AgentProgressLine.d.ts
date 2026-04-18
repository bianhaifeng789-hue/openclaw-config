/**
 * Agent Progress Line Component
 *
 * Displays agent progress in a tree-like structure.
 * Simplified version adapted from Claude Code's AgentProgressLine.tsx
 */
import React from 'react';
type Props = {
    agentType: string;
    description?: string;
    name?: string;
    toolUseCount: number;
    tokens: number | null;
    color?: string;
    isLast: boolean;
    isResolved: boolean;
    isError: boolean;
    isAsync?: boolean;
    lastToolInfo?: string | null;
    hideType?: boolean;
};
export declare function AgentProgressLine({ agentType, description, name, toolUseCount, tokens, color, isLast, isResolved, isError, isAsync, lastToolInfo, hideType, }: Props): React.ReactElement;
export {};
//# sourceMappingURL=AgentProgressLine.d.ts.map