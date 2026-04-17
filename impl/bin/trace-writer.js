#!/usr/bin/env node
/**
 * Trace Writer - Agent事件追踪记录器
 * 
 * 借鉴 Harness Engineering 的 TraceWriter
 * 记录Agent事件到JSONL文件
 * 用于调试、性能分析、复现问题
 * 
 * 来源: https://github.com/lazyFrogLOL/Harness_Engineering
 * 参考: agents.py TraceWriter
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.env.WORKSPACE || process.cwd();

/**
 * Trace Writer
 */
class TraceWriter {
  constructor(agentName, workspaceDir = WORKSPACE) {
    this.agentName = agentName;
    this.startTime = Date.now();
    
    // 确定trace文件路径
    const traceDir = path.join(workspaceDir, 'traces');
    
    try {
      if (!fs.existsSync(traceDir)) {
        fs.mkdirSync(traceDir, { recursive: true });
      }
      
      // 测试写入权限
      const testFile = path.join(traceDir, `_trace_test_${agentName}`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      this.tracePath = path.join(traceDir, `_trace_${agentName}.jsonl`);
    } catch (err) {
      // workspace不可写，使用备用目录
      this.tracePath = path.join(__dirname, '..', '..', 'traces', `_trace_${agentName}.jsonl`);
      
      const fallbackDir = path.dirname(this.tracePath);
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
    }
    
    this.eventCount = 0;
    this.lastEvent = null;
  }

  /**
   * 写入事件到JSONL文件
   */
  write(eventType, data) {
    try {
      const entry = {
        t: this.getElapsedTime(),
        agent: this.agentName,
        event: eventType,
        ...data
      };
      
      // 截断过长的字符串
      const truncated = JSON.stringify(entry, (key, value) => {
        if (typeof value === 'string' && value.length > 10000) {
          return value.slice(0, 10000) + '...[truncated]';
        }
        return value;
      });
      
      // 写入文件
      fs.appendFileSync(this.tracePath, truncated + '\n', 'utf8');
      
      // 同时输出到stderr（方便Harbor捕获）
      console.error(`[TRACE] ${truncated}`);
      
      this.eventCount++;
      this.lastEvent = { type: eventType, timestamp: Date.now() };
      
    } catch (err) {
      // 不让追踪破坏Agent执行
      console.error('Trace write error:', err.message);
    }
  }

  /**
   * 获取相对时间（秒）
   */
  getElapsedTime() {
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  /**
   * 记录iteration事件
   */
  iteration(n, tokens) {
    this.write('iteration', { n, tokens });
  }

  /**
   * 记录LLM响应事件
   */
  llmResponse(content, toolCalls, finishReason) {
    this.write('llm_response', {
      content: (content || '').slice(0, 500),
      tool_calls: (toolCalls || []).map(tc => tc.function?.name || tc.name || 'unknown'),
      finish_reason: finishReason
    });
  }

  /**
   * 记录tool调用事件
   */
  toolCall(name, args, result) {
    this.write('tool_call', {
      tool: name,
      args: this.truncateString(JSON.stringify(args), 300),
      result: this.truncateString(result, 500)
    });
  }

  /**
   * 记录checkpoint事件
   */
  checkpoint(data) {
    this.write('checkpoint', data);
  }

  /**
   * 记录reset事件
   */
  reset(reason, tokensBefore, tokensAfter) {
    this.write('reset', {
      reason,
      tokens_before: tokensBefore,
      tokens_after: tokensAfter
    });
  }

  /**
   * 记录compaction事件
   */
  compaction(level, tokensBefore, tokensAfter) {
    this.write('compaction', {
      level,
      tokens_before: tokensBefore,
      tokens_after: tokensAfter,
      tokens_saved: tokensBefore - tokensAfter
    });
  }

  /**
   * 记录error事件
   */
  error(errorType, message, stack) {
    this.write('error', {
      error_type: errorType,
      message: message.slice(0, 500),
      stack: stack ? stack.slice(0, 1000) : null
    });
  }

  /**
   * 记录warning事件
   */
  warning(warningType, message) {
    this.write('warning', {
      warning_type: warningType,
      message: message.slice(0, 500)
    });
  }

  /**
   * 记录custom事件
   */
  custom(eventType, data) {
    this.write(eventType, data);
  }

  /**
   * 截断字符串
   */
  truncateString(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      agentName: this.agentName,
      tracePath: this.tracePath,
      eventCount: this.eventCount,
      elapsedTime: this.getElapsedTime(),
      lastEvent: this.lastEvent
    };
  }

  /**
   * 读取trace文件内容
   */
  readTrace() {
    try {
      if (!fs.existsSync(this.tracePath)) {
        return [];
      }
      
      const content = fs.readFileSync(this.tracePath, 'utf8');
      const lines = content.trim().split('\n');
      
      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (err) {
          return null;
        }
      }).filter(entry => entry !== null);
      
    } catch (err) {
      console.error('Read trace error:', err.message);
      return [];
    }
  }

  /**
   * 清理trace文件
   */
  clearTrace() {
    try {
      if (fs.existsSync(this.tracePath)) {
        fs.unlinkSync(this.tracePath);
      }
      this.eventCount = 0;
      this.lastEvent = null;
      this.startTime = Date.now();
    } catch (err) {
      console.error('Clear trace error:', err.message);
    }
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'stats';
  
  if (command === 'stats') {
    // 显示所有trace文件统计
    const traceDir = path.join(WORKSPACE, 'traces');
    
    if (!fs.existsSync(traceDir)) {
      console.log('No traces directory found');
      process.exit(0);
    }
    
    const traceFiles = fs.readdirSync(traceDir)
      .filter(f => f.startsWith('_trace_') && f.endsWith('.jsonl'));
    
    if (traceFiles.length === 0) {
      console.log('No trace files found');
      process.exit(0);
    }
    
    console.log('Trace Files Statistics:');
    console.log('');
    
    for (const file of traceFiles) {
      const filePath = path.join(traceDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n');
      const events = lines.filter(l => l.trim()).length;
      
      // 提取agent名称
      const agentName = file.replace('_trace_', '').replace('.jsonl', '');
      
      // 计算时间跨度
      let minTime = Infinity;
      let maxTime = 0;
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.t < minTime) minTime = entry.t;
          if (entry.t > maxTime) maxTime = entry.t;
        } catch (err) {
          // ignore
        }
      }
      
      const duration = maxTime - minTime;
      
      console.log(`${agentName}:`);
      console.log(`  Events: ${events}`);
      console.log(`  Duration: ${duration}s`);
      console.log(`  File: ${filePath}`);
      console.log('');
    }
    
  } else if (command === 'read') {
    const agentName = args[1] || 'main';
    const writer = new TraceWriter(agentName);
    const trace = writer.readTrace();
    
    console.log(`Trace for ${agentName}:`);
    console.log(`Events: ${trace.length}`);
    console.log('');
    
    for (const entry of trace.slice(0, 20)) {
      console.log(`[${entry.t}s] ${entry.event}`);
      console.log(JSON.stringify(entry, null, 2).slice(0, 500));
      console.log('');
    }
    
    if (trace.length > 20) {
      console.log(`... and ${trace.length - 20} more events`);
    }
    
  } else if (command === 'clear') {
    const agentName = args[1];
    
    if (agentName) {
      const writer = new TraceWriter(agentName);
      writer.clearTrace();
      console.log(`✅ Trace cleared for ${agentName}`);
    } else {
      // 清理所有trace文件
      const traceDir = path.join(WORKSPACE, 'traces');
      
      if (fs.existsSync(traceDir)) {
        const traceFiles = fs.readdirSync(traceDir)
          .filter(f => f.startsWith('_trace_') && f.endsWith('.jsonl'));
        
        for (const file of traceFiles) {
          fs.unlinkSync(path.join(traceDir, file));
        }
        
        console.log(`✅ Cleared ${traceFiles.length} trace files`);
      } else {
        console.log('No traces directory found');
      }
    }
    
  } else if (command === 'demo') {
    // 演示trace写入
    const writer = new TraceWriter('demo-agent');
    
    console.log('Writing demo trace events...');
    
    writer.iteration(1, 50000);
    writer.llmResponse('Hello, I will help you...', ['read_file', 'write_file'], 'stop');
    writer.toolCall('read_file', { path: 'test.js' }, 'file content...');
    writer.iteration(2, 60000);
    writer.compaction(0, 60000, 30000);
    writer.warning('context_pressure', 'Tokens > 80% threshold');
    
    console.log('✅ Demo trace written');
    console.log(writer.getStats());
    
  } else {
    console.log('Usage: trace-writer.js [stats|read|clear|demo]');
    console.log('  stats    - Show statistics for all trace files');
    console.log('  read     - Read trace for specific agent');
    console.log('  clear    - Clear trace files');
    console.log('  demo     - Write demo trace events');
  }
}

module.exports = { TraceWriter };