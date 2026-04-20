/**
 * Tracing & Reflection Middleware
 * 集成追踪和反思系统到 Agent 循环
 */

const { tracing, TRACE_EVENT_TYPES } = require('./tracing-system');
const { reflection, REFLECTION_DIMENSIONS } = require('./reflection-system');

class TracingReflectionMiddleware {
  constructor() {
    this.enabled = process.env.OPENCLAW_TRACING_ENABLED !== 'false' ||
                    process.env.OPENCLAW_REFLECTION_ENABLED !== 'false';
  }

  // 初始化中间件
  init(sessionId) {
    if (!this.enabled) return;

    tracing.init(sessionId);
    reflection.init(sessionId);

    console.log(`[TracingReflection] Initialized for session: ${sessionId}`);
  }

  // 包装工具调用
  async wrapToolCall(toolName, params, executeFn) {
    if (!this.enabled) {
      return await executeFn();
    }

    const spanId = tracing.traceToolCall(toolName, params);
    const startTime = Date.now();

    try {
      const result = await executeFn();
      const duration = Date.now() - startTime;

      // 记录追踪
      tracing.traceToolResult(spanId, result, duration);

      // 记录反思
      reflection.recordToolCall(toolName, true, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 记录错误追踪
      tracing.traceError(error, { tool: toolName, params });
      tracing.endSpan(spanId, { error: error.message, duration });

      // 记录反思
      reflection.recordToolCall(toolName, false, duration);
      reflection.recordError(error, { tool: toolName });

      throw error;
    }
  }

  // 包装模型请求
  async wrapModelRequest(model, messages, executeFn) {
    if (!this.enabled) {
      return await executeFn();
    }

    const spanId = tracing.traceModelRequest(model, messages);
    const startTime = Date.now();

    try {
      const result = await executeFn();
      const duration = Date.now() - startTime;

      // 记录追踪
      tracing.traceModelResponse(spanId, result, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 记录错误追踪
      tracing.traceError(error, { model, type: 'model_request' });
      tracing.endSpan(spanId, { error: error.message, duration });

      // 记录反思
      reflection.recordError(error, { model, type: 'model_request' });

      throw error;
    }
  }

  // 记录模型降级
  recordFallback(fromModel, toModel, reason) {
    if (!this.enabled) return;

    tracing.traceFallback(fromModel, toModel, reason);
    reflection.recordFallback(fromModel, toModel, reason);
  }

  // 记录上下文压缩
  recordCompact(originalSize, compressedSize, method) {
    if (!this.enabled) return;

    tracing.traceCompact(originalSize, compressedSize, method);
  }

  // 执行手动反思
  performReflection() {
    if (!this.enabled) return null;

    return reflection.performReflection();
  }

  // 获取统计
  getStats() {
    return {
      tracing: tracing.getStats(),
      reflection: reflection.getStats()
    };
  }

  // 清理旧数据
  cleanup() {
    const tracingResult = tracing.cleanupOldTraces();
    console.log(`[TracingReflection] Cleaned ${tracingResult.deleted} old trace files`);
  }
}

// 全局实例
const middleware = new TracingReflectionMiddleware();

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    switch (command) {
      case 'stats':
        console.log(JSON.stringify(middleware.getStats(), null, 2));
        break;

      case 'test':
        middleware.init('test-session');

        // 模拟工具调用
        await middleware.wrapToolCall('read', { path: 'test.txt' }, async () => {
          await new Promise(r => setTimeout(r, 100));
          return { content: 'test content' };
        });

        // 模拟失败工具调用
        try {
          await middleware.wrapToolCall('exec', { cmd: 'invalid' }, async () => {
            throw new Error('Command failed');
          });
        } catch (e) {
          // 预期错误
        }

        // 模拟模型降级
        middleware.recordFallback('gpt-5.4', 'glm-5', 'rate_limit');

        // 执行反思
        const reflection = middleware.performReflection();

        console.log('\nTest completed');
        console.log('Stats:', JSON.stringify(middleware.getStats(), null, 2));
        break;

      case 'cleanup':
        middleware.cleanup();
        break;

      default:
        console.log('Usage: node tracing-reflection-middleware.js [stats|test|cleanup]');
    }
  })();
}

module.exports = {
  TracingReflectionMiddleware,
  middleware,
  TRACE_EVENT_TYPES,
  REFLECTION_DIMENSIONS
};
