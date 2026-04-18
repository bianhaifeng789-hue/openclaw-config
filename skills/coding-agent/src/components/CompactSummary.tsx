/**
 * Compact Summary Component
 * 
 * Displays a compact summary of conversation history.
 * Simplified version adapted from Claude Code's CompactSummary.tsx
 */

import React from 'react'
import { Box, Text } from 'ink'

const BLACK_CIRCLE = '●'

type SummarizeMetadata = {
  messagesSummarized: number
  direction: 'up_to' | 'from'
  userContext?: string
}

type Props = {
  textContent: string
  metadata?: SummarizeMetadata | null
  isTranscriptMode?: boolean
}

export function CompactSummary({
  textContent,
  metadata,
  isTranscriptMode = false,
}: Props): React.ReactElement {
  if (metadata) {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Box flexDirection="row">
          <Box minWidth={2}>
            <Text color="cyan">{BLACK_CIRCLE}</Text>
          </Box>
          <Box flexDirection="column">
            <Text bold>Summarized conversation</Text>
            {!isTranscriptMode && (
              <Box flexDirection="column">
                <Text dimColor>
                  Summarized {metadata.messagesSummarized} messages{' '}
                  {metadata.direction === 'up_to' ? 'up to this point' : 'from this point'}
                </Text>
                {metadata.userContext && (
                  <Text dimColor>
                    Context: "{metadata.userContext}"
                  </Text>
                )}
                <Text dimColor>(ctrl+o to expand history)</Text>
              </Box>
            )}
            {isTranscriptMode && (
              <Text dimColor>{textContent}</Text>
            )}
          </Box>
        </Box>
      </Box>
    )
  }

  // Default compact summary (auto-compact)
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box flexDirection="row">
        <Box minWidth={2}>
          <Text color="cyan">{BLACK_CIRCLE}</Text>
        </Box>
        <Box flexDirection="column">
          <Text bold>
            Compact summary
            {!isTranscriptMode && (
              <Text dimColor> (ctrl+o to expand)</Text>
            )}
          </Text>
        </Box>
      </Box>
      {isTranscriptMode && (
        <Text dimColor>{textContent}</Text>
      )}
    </Box>
  )
}