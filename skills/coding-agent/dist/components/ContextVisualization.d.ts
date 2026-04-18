/**
 * Context Visualization Component
 *
 * Displays context token usage breakdown.
 * Simplified version adapted from Claude Code's ContextVisualization.tsx
 */
import React from 'react';
type ContextItem = {
    name: string;
    tokens: number;
    source?: string;
};
type ContextCategory = {
    name: string;
    items: ContextItem[];
    totalTokens: number;
    isDeferred?: boolean;
};
type Props = {
    categories: ContextCategory[];
    totalTokens: number;
    maxTokens: number;
    percentage: number;
    model?: string;
};
export declare function ContextVisualization({ categories, totalTokens, maxTokens, percentage, model, }: Props): React.ReactElement;
export {};
//# sourceMappingURL=ContextVisualization.d.ts.map