#!/usr/bin/env node
/**
 * Logger CLI - Rich 日志系统（直接翻译自 logger.py）
 *
 * 特性:
 * - ANSI 颜色编码
 * - Agent 风格映射（颜色 + emoji）
 * - 自定义格式化器
 * - 阶段横幅美化
 */

// ---------------------------------------------------------------------------
// ANSI Colors
// ---------------------------------------------------------------------------

class C {
  static RESET   = "\x1b[0m";
  static BOLD    = "\x1b[1m";
  static DIM     = "\x1b[2m";
  
  // Agent colors
  static PLANNER   = "\x1b[38;5;141m";   // purple
  static BUILDER   = "\x1b[38;5;39m";    // blue
  static EVALUATOR = "\x1b[38;5;208m";   // orange
  static CONTRACT  = "\x1b[38;5;249m";   // gray
  static SUB       = "\x1b[38;5;245m";   // dim gray
  
  // Status Colors
  static GREEN  = "\x1b[38;5;78m";
  static RED    = "\x1b[38;5;196m";
  static YELLOW = "\x1b[38;5;220m";
  static CYAN   = "\x1b[38;5;87m";
  static WHITE  = "\x1b[38;5;255m";
}

// Agent name → (color, emoji)
const AGENT_STYLES = {
  planner:           [C.PLANNER,   '📋'],
  builder:           [C.BUILDER,   '🔨'],
  evaluator:         [C.EVALUATOR, '🔍'],
  contract_proposer: [C.CONTRACT,  '📝'],
  contract_reviewer: [C.CONTRACT,  '✅']
};

/**
 * 获取 Agent 样式
 */
function getAgentStyle(name) {
  for (const [key, style] of Object.entries(AGENT_STYLES)) {
    if (name.includes(key)) {
      return style;
    }
  }
  if (name.startsWith('sub_')) {
    return [C.SUB, '🔧'];
  }
  return [C.WHITE, '⚙️'];
}

// ---------------------------------------------------------------------------
// Custom Formatter
// ---------------------------------------------------------------------------

class HarnessFormatter {
  /**
   * 格式化日志消息
   */
  format(level, msg) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    // --- Phase banners ---
    if (msg.startsWith('='.repeat(10))) {
      return `\n${C.BOLD}${C.CYAN}${msg}${C.RESET}`;
    }
    
    // --- Agent messages: [agent_name] ... ---
    if (msg.startsWith('[')) {
      const bracketEnd = msg.indexOf(']');
      if (bracketEnd > 0) {
        const agentName = msg.slice(1, bracketEnd);
        const rest = msg.slice(bracketEnd + 1).trim();
        const [color, emoji] = getAgentStyle(agentName);
        
        // 分类消息
        if (rest.startsWith('iteration=')) {
          // 迭代头部 — dim
          return `${C.DIM}${ts}${C.RESET} ${emoji} ${color}${agentName}${C.RESET} ${C.DIM}${rest}${C.RESET}`;
        } else if (rest.startsWith('tool:')) {
          // 工具调用 — 高亮工具名
          return `${C.DIM}${ts}${C.RESET} ${emoji} ${color}${agentName}${C.RESET} 🛠️  ${C.CYAN}${rest}${C.RESET}`;
        } else if (rest.startsWith('assistant:')) {
          // LLM 响应 — 显示第一行
          const text = rest.slice('assistant:'.length).trim();
          const preview = text.slice(0, 150).replace(/\n/g, ' ');
          return `${C.DIM}${ts}${C.RESET} ${emoji} ${color}${agentName}${C.RESET} 💬 ${preview}${C.DIM}...${C.RESET}`;
        } else if (rest.startsWith('Finished')) {
          return `${C.DIM}${ts}${C.RESET} ${emoji} ${color}${agentName}${C.RESET} ${C.GREEN}✓ ${rest}${C.RESET}`;
        } else if (rest.startsWith('Compacting')) {
          return `${C.DIM}${ts}${C.RESET} ${emoji} ${color}${agentName}${C.RESET} ${C.YELLOW}📦 ${rest}${C.RESET}`;
        } else if (rest.toLowerCase().includes('reset') || rest.toLowerCase().includes('checkpoint')) {
          return `${C.DIM}${ts}${C.RESET} ${emoji} ${color}${agentName}${C.RESET} ${C.RED}🔄 ${rest}${C.RESET}`;
        } else if (rest.toLowerCase().includes('anxiety')) {
          return `${C.DIM}${ts}${C.RESET} ${emoji} ${color}${agentName}${C.RESET} ${C.RED}😰 ${rest}${C.RESET}`;
        } else if (rest.toLowerCase().includes('error')) {
          return `${C.DIM}${ts}${C.RESET} ${emoji} ${color}${agentName}${C.RESET} ${C.RED}❌ ${rest}${C.RESET}`;
        } else {
          return `${C.DIM}${ts}${C.RESET} ${emoji} ${color}${agentName}${C.RESET} ${rest}`;
        }
      }
    }
    
    // --- Harness-level messages ---
    if (msg.includes('PHASE') || msg.includes('ROUND')) {
      return `\n${C.BOLD}${C.CYAN}${ts} ${msg}${C.RESET}`;
    }
    if (msg.includes('PASSED')) {
      return `${C.BOLD}${C.GREEN}${ts} 🎉 ${msg}${C.RESET}`;
    }
    if (msg.includes('Did not pass')) {
      return `${C.BOLD}${C.RED}${ts} 😞 ${msg}${C.RESET}`;
    }
    if (msg.includes('HARNESS COMPLETE')) {
      return `\n${C.BOLD}${C.GREEN}${ts} 🏁 ${msg}${C.RESET}`;
    }
    if (msg.toLowerCase().includes('score')) {
      return `${ts} 📊 ${C.YELLOW}${msg}${C.RESET}`;
    }
    if (msg.toLowerCase().includes('contract')) {
      return `${ts} 📝 ${msg}`;
    }
    if (msg.includes('API OK')) {
      return `${ts} ${C.GREEN}✓ ${msg}${C.RESET}`;
    }
    if (msg.includes('Verifying')) {
      return `${ts} 🔌 ${msg}`;
    }
    if (msg.includes('Project directory')) {
      return `${ts} 📁 ${C.CYAN}${msg}${C.RESET}`;
    }
    if (msg.includes('completed in')) {
      return `${ts} ⏱️  ${msg}`;
    }
    
    // --- Warnings and errors ---
    if (level === 'ERROR') {
      return `${C.RED}${ts} ❌ ${msg}${C.RESET}`;
    }
    if (level === 'WARNING') {
      return `${C.YELLOW}${ts} ⚠️  ${msg}${C.RESET}`;
    }
    
    // --- Default ---
    return `${C.DIM}${ts}${C.RESET} ${msg}`;
  }
}

// ---------------------------------------------------------------------------
// Logger Class
// ---------------------------------------------------------------------------

class Logger {
  constructor(verbose = false) {
    this.verbose = verbose;
    this.formatter = new HarnessFormatter();
  }

  info(msg) {
    console.log(this.formatter.format('INFO', msg));
  }

  debug(msg) {
    if (this.verbose) {
      console.log(this.formatter.format('DEBUG', msg));
    }
  }

  warning(msg) {
    console.log(this.formatter.format('WARNING', msg));
  }

  error(msg) {
    console.log(this.formatter.format('ERROR', msg));
  }

  // Convenience methods
  phase(msg) {
    console.log(this.formatter.format('INFO', '='.repeat(60)));
    console.log(this.formatter.format('INFO', msg));
    console.log(this.formatter.format('INFO', '='.repeat(60)));
  }

  agent(name, msg) {
    console.log(this.formatter.format('INFO', `[${name}] ${msg}`));
  }

  success(msg) {
    console.log(this.formatter.format('INFO', `✅ ${msg}`));
  }

  fail(msg) {
    console.log(this.formatter.format('ERROR', `❌ ${msg}`));
  }
}

// ---------------------------------------------------------------------------
// Setup Logging
// ---------------------------------------------------------------------------

function setupLogging(verbose = false) {
  return new Logger(verbose);
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Logger CLI - Rich 日志系统

用法:
  node logger-cli.js demo           演示日志样式
  node logger-cli.js test           测试各种消息类型
  node logger-cli.js colors         显示 ANSI 颜色表

示例:
  node logger-cli.js demo
`);
    process.exit(0);
  }

  const logger = setupLogging(args.includes('--verbose'));

  if (command === 'demo') {
    console.log('\n📋 Harness 日志演示:\n');
    
    // Phase banners
    logger.phase('PHASE 1: PLANNING');
    
    // Agent messages
    logger.agent('planner', 'iteration=1  tokens≈15000');
    logger.agent('planner', 'tool: read_file(spec.md)');
    logger.agent('planner', 'assistant: I will create a comprehensive spec...');
    logger.agent('planner', 'Finished (no more tool calls)');
    
    // Harness messages
    logger.info('PHASE 2: BUILD → EVALUATE');
    logger.info('Round 1/5 average score: 6.5/10');
    logger.warning('Compacting context (role=builder)...');
    logger.error('API error: rate limit exceeded');
    
    logger.info('PASSED at round 3');
    logger.info('HARNESS COMPLETE — total time: 15.3 minutes');
    
    process.exit(0);
  }

  if (command === 'test') {
    console.log('\n🧪 测试各种消息类型:\n');
    
    // Test all agent types
    for (const [agent, [color, emoji]] of Object.entries(AGENT_STYLES)) {
      logger.agent(agent, 'iteration=1  tokens≈10000');
      logger.agent(agent, 'tool: write_file(app.js)');
      logger.agent(agent, 'Finished (stop)');
    }
    
    // Test sub-agent
    logger.agent('sub_explorer', 'Searching files...');
    
    // Test phases
    logger.phase('ROUND 1/5: BUILD');
    
    // Test status
    logger.success('File written: app.js');
    logger.fail('Command failed: npm test');
    
    // Test special messages
    logger.agent('builder', 'Compacting context...');
    logger.agent('builder', 'Context reset triggered (tokens > 150000)');
    logger.agent('builder', 'Anxiety detected (2 signals)');
    
    process.exit(0);
  }

  if (command === 'colors') {
    console.log('\n🎨 ANSI 颜色表:\n');
    
    console.log(`${C.PLANNER}Planner (purple)${C.RESET}`);
    console.log(`${C.BUILDER}Builder (blue)${C.RESET}`);
    console.log(`${C.EVALUATOR}Evaluator (orange)${C.RESET}`);
    console.log(`${C.CONTRACT}Contract (gray)${C.RESET}`);
    console.log(`${C.SUB}Sub-agent (dim gray)${C.RESET}`);
    
    console.log(`${C.GREEN}Success (green)${C.RESET}`);
    console.log(`${C.RED}Error (red)${C.RESET}`);
    console.log(`${C.YELLOW}Warning (yellow)${C.RESET}`);
    console.log(`${C.CYAN}Highlight (cyan)${C.RESET}`);
    console.log(`${C.WHITE}Default (white)${C.RESET}`);
    
    console.log(`${C.BOLD}Bold${C.RESET}`);
    console.log(`${C.DIM}Dim${C.RESET}`);
    
    process.exit(0);
  }

  console.log(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// Export
module.exports = { Logger, HarnessFormatter, C, setupLogging, AGENT_STYLES };

// CLI Entry
if (require.main === module) {
  main();
}