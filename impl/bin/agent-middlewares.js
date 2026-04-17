#!/usr/bin/env node
/**
 * Middlewares - Agent 中间件
 *
 * 来源：Harness Engineering - middlewares.py
 *
 * 中间件类型：
 * - per_iteration: 每轮迭代开始时执行
 * - pre_exit: Agent 想停止时执行（forced verification）
 * - post_tool: 工具执行后执行（loop detection, tracking）
 *
 * 用法：
 *   const middlewares = [
 *     new LoopDetectionMiddleware(),
 *     new TimeBudgetMiddleware(30 * 60 * 1000),
 *     new TaskTrackingMiddleware(workspace),
 *     new AnxietyDetectionMiddleware(),
 *     new PreExitGateMiddleware()
 *   ];
 */

/**
 * Middleware 基类
 */
class AgentMiddleware {
  per_iteration(iteration, messages) {
    return null; // 不注入消息
  }
  
  pre_exit(messages) {
    return null; // 不注入消息
  }
  
  post_tool(fnName, fnArgs, result, messages) {
    return null; // 不注入消息
  }
}

/**
 * Loop Detection Middleware - 检测循环
 *
 * 来源：middlewares.py LoopDetection
 */
class LoopDetectionMiddleware extends AgentMiddleware {
  constructor(options = {}) {
    super();
    this.maxFileEdits = options.maxFileEdits || 4;
    this.maxCommandRepeats = options.maxCommandRepeats || 3;
    this.maxErrorRepeats = options.maxErrorRepeats || 3;
    
    this.fileEditCounts = new Map(); // path -> count
    this.commandCounts = new Map(); // command -> count
    this.errorCounts = new Map(); // error_type -> count
  }
  
  post_tool(fnName, fnArgs, result, messages) {
    // 检测文件编辑循环
    if (fnName === 'write_file' || fnName === 'edit_file') {
      const filePath = fnArgs.path;
      const count = this.fileEditCounts.get(filePath) || 0;
      this.fileEditCounts.set(filePath, count + 1);
      
      if (count >= this.maxFileEdits) {
        return `[SYSTEM] Loop detected: You've edited ${filePath} ${count + 1} times. STOP editing this file. Consider a different approach or ask for help.`;
      }
    }
    
    // 检测命令重复
    if (fnName === 'run_bash') {
      const command = fnArgs.command;
      const count = this.commandCounts.get(command) || 0;
      this.commandCounts.set(command, count + 1);
      
      if (count >= this.maxCommandRepeats) {
        return `[SYSTEM] Loop detected: You've run "${command.slice(0, 50)}..." ${count + 1} times. STOP repeating this command. It's not working.`;
      }
    }
    
    // 检测错误重复
    if (result && result.includes('[error]')) {
      const errorType = result.slice(0, 100);
      const count = this.errorCounts.get(errorType) || 0;
      this.errorCounts.set(errorType, count + 1);
      
      if (count >= this.maxErrorRepeats) {
        return `[SYSTEM] Loop detected: Same error occurred ${count + 1} times. STOP trying the same approach. The error: "${errorType.slice(0, 60)}..."`;
      }
    }
    
    return null;
  }
}

/**
 * Time Budget Middleware - 时间预算警告
 *
 * 来源：middlewares.py TimeBudget
 */
class TimeBudgetMiddleware extends AgentMiddleware {
  constructor(budgetMs, options = {}) {
    super();
    this.budgetMs = budgetMs;
    this.startTime = Date.now();
    this.warnThreshold = options.warnThreshold || 0.5; // 50% 时警告
    this.criticalThreshold = options.criticalThreshold || 0.85; // 85% 时严重警告
  }
  
  per_iteration(iteration, messages) {
    const elapsed = Date.now() - this.startTime;
    const percent = elapsed / this.budgetMs;
    
    if (percent >= this.criticalThreshold) {
      const remaining = Math.ceil((this.budgetMs - elapsed) / 1000);
      return `[SYSTEM] CRITICAL: Time budget ${Math.ceil(percent * 100)}% used. ${remaining}s remaining. Wrap up NOW.`;
    }
    
    if (percent >= this.warnThreshold) {
      const remaining = Math.ceil((this.budgetMs - elapsed) / 1000);
      return `[SYSTEM] WARNING: Time budget ${Math.ceil(percent * 100)}% used. ${remaining}s remaining. Consider wrapping up soon.`;
    }
    
    return null;
  }
}

/**
 * Task Tracking Middleware - 追踪任务进度
 *
 * 来源：middlewares.py TaskTracking
 */
class TaskTrackingMiddleware extends AgentMiddleware {
  constructor(workspace, options = {}) {
    super();
    this.workspace = workspace;
    this.todoPath = path.join(workspace, '_todo.md');
    this.updateInterval = options.updateInterval || 5; // 每5次工具调用检查
    this.toolCallCount = 0;
    this.lastTodoHash = null;
  }
  
  post_tool(fnName, fnArgs, result, messages) {
    this.toolCallCount++;
    
    if (this.toolCallCount % this.updateInterval !== 0) {
      return null;
    }
    
    // 检查 _todo.md 是否存在
    if (!fs.existsSync(this.todoPath)) {
      return `[SYSTEM] No _todo.md found. Create one to track your progress: write_file("_todo.md", "# Task Progress\\n\\n- [ ] Step 1\\n- [ ] Step 2")`;
    }
    
    // 检查 _todo.md 是否更新
    try {
      const content = fs.readFileSync(this.todoPath, 'utf8');
      const hash = content.length;
      
      if (hash === this.lastTodoHash) {
        return `[SYSTEM] _todo.md not updated since last check. Update it to reflect your current progress.`;
      }
      
      this.lastTodoHash = hash;
    } catch (err) {
      // 忽略错误
    }
    
    return null;
  }
}

/**
 * Anxiety Detection Middleware - 检测焦虑信号
 *
 * 来源：middlewares.py AnxietyDetection
 */
class AnxietyDetectionMiddleware extends AgentMiddleware {
  constructor(options = {}) {
    super();
    this.patterns = [
      /let me wrap up/i,
      /running (low on|out of) (context|space|tokens)/i,
      /that should be (enough|sufficient)/i,
      /wrapping up/i,
      /总结一下/i,
      /最后一步/i
    ];
    this.warned = false;
  }
  
  per_iteration(iteration, messages) {
    if (this.warned) return null;
    
    const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
    if (!lastAssistant || !lastAssistant.content) return null;
    
    const content = lastAssistant.content;
    const detected = this.patterns.some(p => p.test(content));
    
    if (detected) {
      this.warned = true;
      return `[SYSTEM] Anxiety signal detected: You seem to be trying to wrap up prematurely. DO NOT wrap up yet. Continue executing tools until the task is truly complete. If you're hitting context limits, the system will handle it automatically.`;
    }
    
    return null;
  }
}

/**
 * Pre-Exit Gate Middleware - 三级门控
 *
 * 来源：middlewares.py PreExitGate
 */
class PreExitGateMiddleware extends AgentMiddleware {
  constructor(options = {}) {
    super();
    this.level = 0;
    this.maxLevel = 3;
    this.forceStart = options.forceStart || false;
    this.forceVerify = options.forceVerify || false;
  }
  
  pre_exit(messages) {
    this.level++;
    
    if (this.level <= this.maxLevel) {
      const prompts = [
        `[SYSTEM] LEVEL 1 VERIFICATION: Are you sure you're done? List what you've accomplished and what remains.`,
        `[SYSTEM] LEVEL 2 VERIFICATION: You claimed to be done, but let me check. Run_bash "ls -la" to verify files exist.`,
        `[SYSTEM] LEVEL 3 VERIFICATION: Final check. Did you actually test the application? If not, run it and verify it works.`
      ];
      
      return prompts[this.level - 1];
    }
    
    return null; // 通过三级门控，允许退出
  }
}

/**
 * Skeleton Detection Middleware - 检测骨架文件
 *
 * 来源：middlewares.py SkeletonDetection
 */
class SkeletonDetectionMiddleware extends AgentMiddleware {
  constructor(workspace, options = {}) {
    super();
    this.workspace = workspace;
    this.checkInterval = options.checkInterval || 10; // 每10次工具调用检查
    this.toolCallCount = 0;
  }
  
  post_tool(fnName, fnArgs, result, messages) {
    this.toolCallCount++;
    
    if (this.toolCallCount % this.checkInterval !== 0) {
      return null;
    }
    
    // 检查是否有骨架文件（TODO/FIXME/NotImplementedError）
    if (fnName === 'write_file') {
      const content = fnArgs.content;
      const skeletonPatterns = [
        /TODO/i,
        /FIXME/i,
        /NotImplementedError/,
        /pass\s*\n/,
        /raise NotImplementedError/,
        /\/\/ TODO/,
        /# TODO/
      ];
      
      const detected = skeletonPatterns.some(p => p.test(content));
      
      if (detected) {
        return `[SYSTEM] Skeleton file detected: ${fnArgs.path} contains TODO/FIXME/placeholder. Fill in the actual implementation before stopping.`;
      }
    }
    
    return null;
  }
}

/**
 * Error Guidance Middleware - 错误引导
 *
 * 来源：middlewares.py ErrorGuidance
 */
class ErrorGuidanceMiddleware extends AgentMiddleware {
  constructor(options = {}) {
    super();
    this.errorPatterns = {
      'ModuleNotFoundError': 'Install missing module: run_bash "pip install <module_name>"',
      'SyntaxError': 'Check syntax carefully. Look for missing brackets, quotes, or indentation.',
      'ImportError': 'Check import path and module availability.',
      'FileNotFoundError': 'Check file path. Use list_files to see available files.',
      'PermissionError': 'Check file permissions. Use run_bash "chmod" if needed.',
      'TimeoutError': 'Increase timeout or optimize the operation.'
    };
  }
  
  post_tool(fnName, fnArgs, result, messages) {
    if (!result || !result.includes('[error]')) {
      return null;
    }
    
    // 分析错误类型并提供引导
    for (const [errorType, guidance] of Object.entries(this.errorPatterns)) {
      if (result.includes(errorType)) {
        return `[SYSTEM] Error detected: ${errorType}. Guidance: ${guidance}`;
      }
    }
    
    return null;
  }
}

// Export
module.exports = {
  AgentMiddleware,
  LoopDetectionMiddleware,
  TimeBudgetMiddleware,
  TaskTrackingMiddleware,
  AnxietyDetectionMiddleware,
  PreExitGateMiddleware,
  SkeletonDetectionMiddleware,
  ErrorGuidanceMiddleware
};