#!/usr/bin/env node
/**
 * Guardrails - Pre-tool-call authorization
 *
 * Purpose: Evaluate tool calls against policy before execution
 *
 * Borrowed from: DeerFlow Guardrails Middleware
 *
 * Key concepts:
 * - Policy-driven authorization (ALLOW/DENY)
 * - Blocked patterns (rm -rf, sudo, chmod 777)
 * - Allowed tools whitelist
 * - Deny returns error message to agent
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const GUARDRAILS_CONFIG = path.join(WORKSPACE, 'state', 'guardrails-config.json');

class GuardrailsProvider {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(GUARDRAILS_CONFIG)) {
        return JSON.parse(fs.readFileSync(GUARDRAILS_CONFIG, 'utf8'));
      }
    } catch {
      // ignore
    }
    return {
      enabled: true,
      denied_tools: [], // Block these tools
      allowed_tools: [], // Only allow these tools (if non-empty)
      blocked_patterns: [
        'rm -rf',
        'sudo',
        'chmod 777',
        'curl | sh',
        'mkfs',
        'dd if='
      ]
    };
  }

  saveConfig() {
    fs.mkdirSync(path.dirname(GUARDRAILS_CONFIG), { recursive: true });
    fs.writeFileSync(GUARDRAILS_CONFIG, JSON.stringify(this.config, null, 2));
  }

  /**
   * Evaluate a tool call request
   */
  evaluate(toolName, toolInput) {
    if (!this.config.enabled) {
      return { allow: true };
    }

    // Check denied tools
    if (this.config.denied_tools.includes(toolName)) {
      return {
        allow: false,
        reason: `Tool '${toolName}' was blocked by guardrails`,
        code: 'guardrails.tool_denied'
      };
    }

    // Check allowed tools (whitelist mode)
    if (this.config.allowed_tools.length > 0 && !this.config.allowed_tools.includes(toolName)) {
      return {
        allow: false,
        reason: `Tool '${toolName}' not in allowed list`,
        code: 'guardrails.tool_not_allowed'
      };
    }

    // Check blocked patterns for bash/exec
    if (toolName === 'exec' || toolName === 'bash') {
      const command = typeof toolInput === 'string' ? toolInput : toolInput.command || '';
      for (const pattern of this.config.blocked_patterns) {
        if (command.includes(pattern)) {
          return {
            allow: false,
            reason: `Command contains blocked pattern: '${pattern}'`,
            code: 'guardrails.blocked_pattern'
          };
        }
      }
    }

    // Check file operations for dangerous paths
    if (toolName === 'write' || toolName === 'edit') {
      const filePath = typeof toolInput === 'object' ? toolInput.path : '';
      const dangerousPaths = ['/etc/', '/var/', '/usr/', '/bin/', '/sbin/', '.ssh/', '.env'];
      for (const dangerous of dangerousPaths) {
        if (filePath.includes(dangerous)) {
          return {
            allow: false,
            reason: `File path '${filePath}' is restricted`,
            code: 'guardrails.path_denied'
          };
        }
      }
    }

    return { allow: true };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    return this.config;
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const provider = new GuardrailsProvider();

switch (command) {
  case 'evaluate':
    const evalToolName = args[1];
    const evalToolInput = args[2] || '';
    const evalResult = provider.evaluate(evalToolName, evalToolInput);
    console.log(JSON.stringify(evalResult, null, 2));
    break;

  case 'config':
    console.log(JSON.stringify(provider.config, null, 2));
    break;

  case 'enable':
    provider.updateConfig({ enabled: true });
    console.log(JSON.stringify({ enabled: true }, null, 2));
    break;

  case 'disable':
    provider.updateConfig({ enabled: false });
    console.log(JSON.stringify({ enabled: false }, null, 2));
    break;

  case 'deny-tool':
    const denyTool = args[1];
    const denied = [...provider.config.denied_tools, denyTool];
    provider.updateConfig({ denied_tools: denied });
    console.log(JSON.stringify({ denied: denyTool }, null, 2));
    break;

  case 'allow-tool':
    const allowTool = args[1];
    const allowed = [...provider.config.allowed_tools, allowTool];
    provider.updateConfig({ allowed_tools: allowed });
    console.log(JSON.stringify({ allowed: allowTool }, null, 2));
    break;

  case 'add-pattern':
    const newPattern = args[1];
    const patterns = [...provider.config.blocked_patterns, newPattern];
    provider.updateConfig({ blocked_patterns: patterns });
    console.log(JSON.stringify({ added: newPattern }, null, 2));
    break;

  case 'test':
    // Test guardrails
    console.log('Testing Guardrails:');
    console.log('');

    // Test blocked pattern
    const test1 = provider.evaluate('exec', 'rm -rf /');
    console.log('Test 1: exec "rm -rf /"');
    console.log('Result:', test1);

    // Test denied tool
    provider.updateConfig({ denied_tools: ['bash'] });
    const test2 = provider.evaluate('bash', 'ls');
    console.log('\nTest 2: bash "ls" (bash denied)');
    console.log('Result:', test2);

    // Test allowed
    const test3 = provider.evaluate('read', { path: '/tmp/test.txt' });
    console.log('\nTest 3: read "/tmp/test.txt"');
    console.log('Result:', test3);

    // Test dangerous path
    const test4 = provider.evaluate('write', { path: '/etc/passwd' });
    console.log('\nTest 4: write "/etc/passwd" (dangerous path)');
    console.log('Result:', test4);

    // Reset
    provider.updateConfig({ denied_tools: [] });
    break;

  default:
    console.log('Usage: guardrails-provider.js [evaluate|config|enable|disable|deny-tool|allow-tool|add-pattern|test]');
    console.log('');
    console.log('Commands:');
    console.log('  evaluate <toolName> <toolInput> - Evaluate tool call');
    console.log('  config - Show current configuration');
    console.log('  enable - Enable guardrails');
    console.log('  disable - Disable guardrails');
    console.log('  deny-tool <toolName> - Deny a tool');
    console.log('  allow-tool <toolName> - Add to allowed list');
    console.log('  add-pattern <pattern> - Add blocked pattern');
    console.log('  test - Test guardrails');
}

module.exports = { GuardrailsProvider };