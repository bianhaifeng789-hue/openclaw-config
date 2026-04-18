/**
 * Compact Summary Component
 *
 * Displays a compact summary of conversation history.
 * Simplified version adapted from Claude Code's CompactSummary.tsx
 */
import React from 'react';
type SummarizeMetadata = {
    messagesSummarized: number;
    direction: 'up_to' | 'from';
    userContext?: string;
};
type Props = {
    textContent: string;
    metadata?: SummarizeMetadata | null;
    isTranscriptMode?: boolean;
};
export declare function CompactSummary({ textContent, metadata, isTranscriptMode, }: Props): React.ReactElement;
export {};
//# sourceMappingURL=CompactSummary.d.ts.map