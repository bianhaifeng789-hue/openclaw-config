/**
 * Agent Progress Line Component
 * 
 * Displays agent progress in a tree-like structure.
 * Simplified version adapted from Claude Code's AgentProgressLine.tsx
 */

import React from 'react'
import { Box, Text } from 'ink'

type Props = {
  agentType: string
  description?: string
  name?: string
  toolUseCount: number
  tokens: number | null
  color?: string
  isLast: boolean
  isResolved: boolean
  isError: boolean
  isAsync?: boolean
  lastToolInfo?: string | null
  hideType?: boolean
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return `${num}`
}

export function AgentProgressLine({
  agentType,
  description,
  name,
  toolUseCount,
  tokens,
  color,
  isLast,
  isResolved,
  isError,
  isAsync = false,
  lastToolInfo,
  hideType = false,
}: Props): React.ReactElement {
  const treeChar = isLast ? '└─' : '├─'
  const isBackgrounded = isAsync && isResolved

  const getStatusText = (): string => {
    if (!isResolved) {
      return lastToolInfo || 'Initializing…'
    }
    if (isBackgrounded) {
      return 'Running in the background'
    }
    return 'Done'
  }

  const statusColor = isError ? 'red' : isResolved ? 'green' : undefined

  return (
    <Box flexDirection="column">
      <Box paddingLeft={3}>
        <Text dimColor>{treeChar} </Text>
        <Text dimColor={!isResolved}>
          {hideType ? (
            <>
              <Text bold>{name ?? description ?? agentType}</Text>
              {name && description && <Text dimColor>: {description}</Text>}
            </>
          ) : (
            <>
              <Text bold backgroundColor={color as any} color={color ? 'black' : undefined}>
                {agentType}
              </Text>
              {description && (
                <>
                  {' ('}
                  <Text bold={false}>{description}</Text>
                  {')'}
                </>
              )}
            </>
          )}
          {!isBackgrounded && (
            <>
              {' · '}
              {toolUseCount} tool {toolUseCount === 1 ? 'use' : 'uses'}
              {tokens !== null && <> · {formatNumber(tokens)} tokens</>}
            </>
          )}
        </Text>
      </Box>
      {!isBackgrounded && (
        <Box paddingLeft={3} flexDirection="row">
          <Text dimColor>{isLast ? '   ⏟  ' : '│  ⏟  '}</Text>
          <Text dimColor color={statusColor as any}>{getStatusText()}</Text>
        </Box>
      )}
    </Box>
  )
}