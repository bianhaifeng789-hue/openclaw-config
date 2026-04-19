# Session Optimization Notes

Applied on 2026-04-19.

## Goals
- Trigger compaction earlier
- Reduce retained recent context
- Lower history share
- Shorten stuck-session warning time
- Remove stale checkpoint/reset artifacts

## Config changes
- reserveTokens: 18000
- keepRecentTokens: 4000
- maxHistoryShare: 0.25
- recentTurnsPreserve: 2
- timeoutSeconds: 60
- memoryFlush.softThresholdTokens: 4000
- memoryFlush.forceFlushTranscriptBytes: 768kb
- diagnostics.stuckSessionWarnMs: 300000

## Expected effect
- Sessions compact earlier and more predictably
- Less context bloat over long maintenance conversations
- Faster warning when a run appears stuck
- Cleaner session directory with fewer stale artifacts
