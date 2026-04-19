/**
 * OpenClaw Tracing 追踪系统
 * 集成 Langfuse 或自建追踪，支持 Agent 行为追踪、性能分析
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const TRACING_DIR = path.join(os.homedir(), '.openclaw', 'tracing');
const TRACING_ENABLED = process.env.OPENCLAW_TRACING_ENABLED !== 'false';
const TRACING_RETENTION_DAYS = parseInt(process.env.OPENCLAW_TRACING_RETENTION_DAYS || '30');

// 追踪事件类型
const TRACE_EVENT_TYPES = {
  SESSION_START: 'session.start',
  SESSION_END: 'session.end',
  TOOL_CALL: 'tool.call',
  TOOL_RESULT: 'tool.result',
  MODEL_REQUEST: 'model.request',
  MODEL_RESPONSE: 'model.response',
  COMPACT: 'context.compact',
  ERROR: 'error',
  FALLBACK: 'model.fallback',
  HEARTBEAT: 'heartbeat',
  MEMORY_EXTRACT: 'memory.extract'
};

class TracingSystem {
  constructor() {
    this.enabled = TRACING_ENABLED;
    this.spans = new Map();
    this.sessionId = null;
  }

  init(sessionId) {
    this.sessionId = sessionId;
    
    if (!this.enabled) return;

    // 确保目录存在
    if (!fs.existsSync(TRACING_DIR)) {
      fs.mkdirSync(TRACING_DIR, { recursive: true });
    }

    // 启动会话追踪
    this.startSpan('session', {
      type: TRACE_EVENT_TYPES.SESSION_START,
      sessionId,
      timestamp: Date.now(),
      model: process.env.OPENCLAW_CURRENT_MODEL || 'unknown',
      workspace: process.cwd()
    });
  }

  // 开始一个追踪 span
  startSpan(name, metadata = {}) {
    if (!this.enabled) return null;

    const spanId = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const span = {
      id: spanId,
      name,
      startTime: Date.now(),
      metadata,
      events: []
    };

    this.spans.set(spanId, span);
    return spanId;
  }

  // 结束 span
  endSpan(spanId, metadata = {}) {
    if (!this.enabled) return;

    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.metadata = { ...span.metadata, ...metadata };

    // 保存到文件
    this._saveSpan(span);
    
    // 从内存中移除
    this.spans.delete(spanId);
  }

  // 记录事件
  logEvent(spanId, eventType, data = {}) {
    if (!this.enabled) return;

    const span = this.spans.get(spanId);
    if (!span) return;

    span.events.push({
      type: eventType,
      timestamp: Date.now(),
      data
    });
  }

  // 记录工具调用
  traceToolCall(toolName, params, spanId = null) {
    const id = spanId || this.startSpan(`tool-${toolName}`, { toolName });
    this.logEvent(id, TRACE_EVENT_TYPES.TOOL_CALL, {
      tool: toolName,
      params: this._sanitizeParams(params)
    });
    return id;
  }

  // 记录工具结果
  traceToolResult(spanId, result, duration) {
    this.logEvent(spanId, TRACE_EVENT_TYPES.TOOL_RESULT, {
      duration,
      success: !result?.error,
      resultSize: JSON.stringify(result).length
    });
    this.endSpan(spanId, { duration });
  }

  // 记录模型请求
  traceModelRequest(model, messages, spanId = null) {
    const id = spanId || this.startSpan(`model-${model}`, { model });
    this.logEvent(id, TRACE_EVENT_TYPES.MODEL_REQUEST, {
      model,
      messageCount: messages.length,
      totalTokens: this._estimateTokens(messages)
    });
    return id;
  }

  // 记录模型响应
  traceModelResponse(spanId, response, duration) {
    this.logEvent(spanId, TRACE_EVENT_TYPES.MODEL_RESPONSE, {
      duration,
      responseSize: JSON.stringify(response).length,
      finishReason: response?.finish_reason || 'unknown'
    });
    this.endSpan(spanId, { duration });
  }

  // 记录错误
  traceError(error, context = {}) {
    if (!this.enabled) return;

    const spanId = this.startSpan('error', {
      type: TRACE_EVENT_TYPES.ERROR,
      errorMessage: error.message,
      errorStack: error.stack,
      ...context
    });
    this.endSpan(spanId);
  }

  // 记录模型降级
  traceFallback(fromModel, toModel, reason) {
    if (!this.enabled) return;

    const spanId = this.startSpan('fallback', {
      type: TRACE_EVENT_TYPES.FALLBACK,
      fromModel,
      toModel,
      reason
    });
    this.endSpan(spanId);
  }

  // 记录上下文压缩
  traceCompact(originalSize, compressedSize, method) {
    if (!this.enabled) return;

    const spanId = this.startSpan('compact', {
      type: TRACE_EVENT_TYPES.COMPACT,
      originalSize,
      compressedSize,
      reduction: ((originalSize - compressedSize) / originalSize * 100).toFixed(1) + '%',
      method
    });
    this.endSpan(spanId);
  }

  // 保存 span 到文件
  _saveSpan(span) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(TRACING_DIR, `traces-${date}.jsonl`);
    
    const line = JSON.stringify({
      ...span,
      sessionId: this.sessionId
    }) + '\n';

    fs.appendFileSync(filePath, line);
  }

  // 清理旧追踪数据
  cleanupOldTraces() {
    if (!fs.existsSync(TRACING_DIR)) return { deleted: 0 };

    const cutoff = Date.now() - (TRACING_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const files = fs.readdirSync(TRACING_DIR);
    let deleted = 0;

    for (const file of files) {
      const filePath = path.join(TRACING_DIR, file);
      const stat = fs.statSync(filePath);
      
      if (stat.mtime.getTime() < cutoff) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    }

    return { deleted, retentionDays: TRACING_RETENTION_DAYS };
  }

  // 获取统计
  getStats() {
    if (!fs.existsSync(TRACING_DIR)) {
      return { traceFiles: 0, totalSpans: 0 };
    }

    const files = fs.readdirSync(TRACING_DIR).filter(f => f.startsWith('traces-'));
    let totalSpans = 0;
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(TRACING_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      totalSpans += lines.length;
      totalSize += fs.statSync(filePath).size;
    }

    return {
      traceFiles: files.length,
      totalSpans,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      retentionDays: TRACING_RETENTION_DAYS,
      enabled: this.enabled
    };
  }

  // 查询追踪数据
  queryTraces(options = {}) {
    const { type, startTime, endTime, limit = 100 } = options;
    const results = [];

    if (!fs.existsSync(TRACING_DIR)) return results;

    const files = fs.readdirSync(TRACING_DIR)
      .filter(f => f.startsWith('traces-'))
      .sort()
      .reverse();

    for (const file of files) {
      if (results.length >= limit) break;

      const filePath = path.join(TRACING_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());

      for (const line of lines) {
        if (results.length >= limit) break;

        try {
          const trace = JSON.parse(line);
          
          // 过滤条件
          if (type && trace.metadata?.type !== type) continue;
          if (startTime && trace.startTime < startTime) continue;
          if (endTime && trace.endTime > endTime) continue;

          results.push(trace);
        } catch (e) {}
      }
    }

    return results;
  }

  // 辅助方法：清理敏感参数
  _sanitizeParams(params) {
    const sensitive = ['apiKey', 'password', 'token', 'secret'];
    const sanitized = { ...params };
    
    for (const key of Object.keys(sanitized)) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '***';
      }
    }
    
    return sanitized;
  }

  // 辅助方法：估算 token 数
  _estimateTokens(messages) {
    let total = 0;
    for (const msg of messages) {
      const content = msg.content || '';
      // 简单估算：英文 ~4 字符/token，中文 ~1 字符/token
      total += Math.ceil(content.length / 4);
    }
    return total;
  }
}

// 全局实例
const tracing = new TracingSystem();

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'stats':
      console.log(tracing.getStats());
      break;

    case 'cleanup':
      const result = tracing.cleanupOldTraces();
      console.log(`Cleaned ${result.deleted} old trace files`);
      break;

    case 'query':
      const type = process.argv[3];
      const traces = tracing.queryTraces({ type, limit: 10 });
      console.log(`Found ${traces.length} traces`);
      traces.forEach(t => {
        console.log(`  [${t.metadata?.type || t.name}] ${t.duration}ms - ${new Date(t.startTime).toISOString()}`);
      });
      break;

    case 'test':
      tracing.init('test-session');
      
      // 模拟工具调用
      const toolSpan = tracing.traceToolCall('read', { path: 'test.txt' });
      setTimeout(() => {
        tracing.traceToolResult(toolSpan, { content: 'test' }, 150);
      }, 150);

      // 模拟模型请求
      const modelSpan = tracing.traceModelRequest('gpt-5.4', [{ role: 'user', content: 'hello' }]);
      setTimeout(() => {
        tracing.traceModelResponse(modelSpan, { content: 'hi' }, 500);
      }, 500);

      setTimeout(() => {
        console.log('Test traces:', tracing.getStats());
      }, 1000);
      break;

    default:
      console.log('Usage: node tracing-system.js [stats|cleanup|query|test]');
      console.log('');
      console.log('Environment variables:');
      console.log('  OPENCLAW_TRACING_ENABLED - Enable tracing (default: true)');
      console.log('  OPENCLAW_TRACING_RETENTION_DAYS - Retention period (default: 30)');
  }
}

module.exports = { TracingSystem, tracing, TRACE_EVENT_TYPES };
