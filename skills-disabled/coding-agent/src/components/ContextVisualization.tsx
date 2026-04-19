/**
 * Context Visualization Component
 * 
 * Displays context token usage breakdown.
 * Simplified version adapted from Claude Code's ContextVisualization.tsx
 */

import React from 'react'
import { Box, Text } from 'ink'

type ContextItem = {
  name: string
  tokens: number
  source?: string
}

type ContextCategory = {
  name: string
  items: ContextItem[]
  totalTokens: number
  isDeferred?: boolean
}

type Props = {
  categories: ContextCategory[]
  totalTokens: number
  maxTokens: number
  percentage: number
  model?: string
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return `${tokens}`
}

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`
}

const BAR_WIDTH = 40
const CATEGORY_COLORS = ['cyan', 'magenta', 'yellow', 'green', 'blue', 'red']

export function ContextVisualization({
  categories,
  totalTokens,
  maxTokens,
  percentage,
  model,
}: Props): React.ReactElement {
  const barSegments: Array<{ width: number; color: string; name: string }> = []
  let remainingWidth = BAR_WIDTH
  const totalForBar = categories.reduce((sum, c) => sum + c.totalTokens, 0)

  categories.forEach((category, i) => {
    const ratio = category.totalTokens / totalForBar
    const width = Math.round(ratio * BAR_WIDTH)
    const clampedWidth = Math.min(width, remainingWidth)
    if (clampedWidth > 0) {
      barSegments.push({
        width: clampedWidth,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        name: category.name,
      })
      remainingWidth -= clampedWidth
    }
  })

  // Fill remaining with gray (unused)
  if (remainingWidth > 0) {
    barSegments.push({
      width: remainingWidth,
      color: 'gray',
      name: 'unused',
    })
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Header */}
      <Box flexDirection="row">
        <Text bold color="cyan">Context:</Text>
        <Text> {formatTokens(totalTokens)} / {formatTokens(maxTokens)} tokens ({percentage.toFixed(1)}%)</Text>
        {model && <Text dimColor> [{model}]</Text>}
      </Box>

      {/* Token bar */}
      <Box flexDirection="row">
        <Text dimColor>│</Text>
        {barSegments.map((seg, i) => (
          <Text key={i} backgroundColor={seg.color as any}>
            {'█'.repeat(seg.width)}
          </Text>
        ))}
        <Text dimColor>│</Text>
      </Box>

      {/* Category breakdown */}
      {categories.map((category, i) => (
        <Box key={category.name} flexDirection="column" marginTop={i === 0 ? 0 : 1}>
          <Box flexDirection="row">
            <Text bold color={CATEGORY_COLORS[i % CATEGORY_COLORS.length] as any}>
              {category.name}
            </Text>
            <Text dimColor>
              {' '}
              ({formatTokens(category.totalTokens)} tokens, {plural(category.items.length, 'item')})
            </Text>
          </Box>

          {/* Top items in category */}
          {category.items.slice(0, 5).map((item, j) => (
            <Box key={j} flexDirection="row" paddingLeft={2}>
              <Text dimColor>• {item.name}</Text>
              <Text dimColor> ({formatTokens(item.tokens)})</Text>
            </Box>
          ))}
          {category.items.length > 5 && (
            <Box paddingLeft={2}>
              <Text dimColor>  … and {category.items.length - 5} more</Text>
            </Box>
          )}
        </Box>
      ))}

      {/* Usage indicator */}
      {percentage > 80 && (
        <Box marginTop={1}>
          <Text color="yellow">
            ⚠ Context is {percentage > 95 ? 'nearly full' : 'high'} ({percentage.toFixed(0)}% used)
          </Text>
        </Box>
      )}
    </Box>
  )
}