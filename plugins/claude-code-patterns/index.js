/**
 * Claude Code Patterns Plugin for OpenClaw
 *
 * Loads compiled TypeScript modules and registers hooks.
 */

const path = require('path')
const integrationPath = path.join(__dirname, '../../impl/dist/openclaw-integration.js')

// Load compiled modules
let integration = null
try {
  integration = require(integrationPath)
  console.log('[Plugin] Claude Code Patterns loaded:', Object.keys(integration).slice(0, 5))
} catch (e) {
  console.error('[Plugin] Failed to load:', e.message)
}

// Export for OpenClaw plugin system
module.exports = {
  name: 'claude-code-patterns',
  version: '1.0.0',

  // Plugin hooks
  hooks: {
    // Called on gateway start
    onStart: async (context) => {
      console.log('[Plugin] Claude Code Patterns starting...')
      if (integration) {
        integration.initIntegrations?.()
      }
      return { status: 'ok' }
    },

    // Called on heartbeat
    onHeartbeat: async (context) => {
      if (!integration) return { status: 'disabled' }

      try {
        // Run AutoDream check
        await integration.hookAutoDreamCheck?.()

        // Get task visualization
        const cardJson = await integration.hookTaskVisualization?.()

        if (cardJson) {
          // Would send Feishu card via context.message
          console.log('[Plugin] Task visualization:', cardJson)
        }

        return { status: 'ok', card: cardJson }
      } catch (e) {
        console.error('[Plugin] Heartbeat error:', e.message)
        return { status: 'error', error: e.message }
      }
    },

    // Called before compaction
    preCompact: async (messages, context) => {
      if (!integration) return { messages, summary: '' }

      try {
        const result = await integration.hookSessionMemoryCompact?.(messages)
        return result || { messages, summary: '' }
      } catch (e) {
        console.error('[Plugin] Compact error:', e.message)
        return { messages, summary: '' }
      }
    }
  },

  // Export modules for direct access
  modules: integration
}