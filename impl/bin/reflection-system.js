/**
 * OpenClaw Reflection System 反思系统
 * 自我评估、行为改进、质量提升
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const REFLECTION_DIR = path.join(os.homedir(), '.openclaw', 'reflection');
const REFLECTION_ENABLED = process.env.OPENCLAW_REFLECTION_ENABLED !== 'false';

// 反思触发条件
const REFLECTION_TRIGGERS = {
  // 工具调用次数
  toolCallThreshold: 10,
  // 错误次数
  errorThreshold: 3,
  // 模型降级次数
  fallbackThreshold: 2,
  // 时间间隔（毫秒）
  timeInterval: 5 * 60 * 1000  // 5 分钟
};

// 反思维度
const REFLECTION_DIMENSIONS = {
  ACCURACY: 'accuracy',      // 准确性
  EFFICIENCY: 'efficiency',  // 效率
  QUALITY: 'quality',        // 质量
  SAFETY: 'safety'           // 安全性
};

class ReflectionSystem {
  constructor() {
    this.enabled = REFLECTION_ENABLED;
    this.sessionMetrics = {
      toolCalls: 0,
      errors: 0,
      fallbacks: 0,
      startTime: Date.now(),
      lastReflection: 0,
      actions: []
    };
    this.insights = [];
  }

  init(sessionId) {
    this.sessionId = sessionId;
    
    if (!this.enabled) return;

    // 确保目录存在
    if (!fs.existsSync(REFLECTION_DIR)) {
      fs.mkdirSync(REFLECTION_DIR, { recursive: true });
    }

    // 加载历史反思
    this._loadHistoricalInsights();
  }

  // 记录动作
  recordAction(action) {
    if (!this.enabled) return;

    this.sessionMetrics.actions.push({
      ...action,
      timestamp: Date.now()
    });

    // 检查是否需要触发反思
    this._checkReflectionTrigger();
  }

  // 记录工具调用
  recordToolCall(toolName, success, duration) {
    this.sessionMetrics.toolCalls++;
    
    this.recordAction({
      type: 'tool',
      toolName,
      success,
      duration
    });
  }

  // 记录错误
  recordError(error, context = {}) {
    this.sessionMetrics.errors++;
    
    this.recordAction({
      type: 'error',
      error: error.message,
      context
    });
  }

  // 记录模型降级
  recordFallback(fromModel, toModel, reason) {
    this.sessionMetrics.fallbacks++;
    
    this.recordAction({
      type: 'fallback',
      fromModel,
      toModel,
      reason
    });
  }

  // 检查反思触发条件
  _checkReflectionTrigger() {
    const now = Date.now();
    const timeSinceLastReflection = now - this.sessionMetrics.lastReflection;

    // 检查各种触发条件
    const shouldReflect = 
      this.sessionMetrics.toolCalls >= REFLECTION_TRIGGERS.toolCallThreshold ||
      this.sessionMetrics.errors >= REFLECTION_TRIGGERS.errorThreshold ||
      this.sessionMetrics.fallbacks >= REFLECTION_TRIGGERS.fallbackThreshold ||
      timeSinceLastReflection >= REFLECTION_TRIGGERS.timeInterval;

    if (shouldReflect) {
      this.performReflection();
    }
  }

  // 执行反思
  performReflection() {
    if (!this.enabled) return null;

    const reflection = {
      id: `reflection-${Date.now()}`,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metrics: { ...this.sessionMetrics },
      assessment: this._assessPerformance(),
      insights: this._generateInsights(),
      recommendations: this._generateRecommendations(),
      improvements: []
    };

    // 保存反思
    this._saveReflection(reflection);
    
    // 更新最后反思时间
    this.sessionMetrics.lastReflection = Date.now();
    
    // 重置计数器（保留累计数据）
    this.sessionMetrics.toolCalls = 0;
    this.sessionMetrics.errors = 0;
    this.sessionMetrics.fallbacks = 0;

    console.log(`[Reflection] Generated: ${reflection.id}`);
    console.log(`  Accuracy: ${reflection.assessment.accuracy.score}/10`);
    console.log(`  Efficiency: ${reflection.assessment.efficiency.score}/10`);
    console.log(`  Quality: ${reflection.assessment.quality.score}/10`);

    return reflection;
  }

  // 性能评估
  _assessPerformance() {
    const actions = this.sessionMetrics.actions;
    const totalActions = actions.length;
    
    if (totalActions === 0) {
      return {
        accuracy: { score: 0, details: 'No actions recorded' },
        efficiency: { score: 0, details: 'No actions recorded' },
        quality: { score: 0, details: 'No actions recorded' },
        safety: { score: 0, details: 'No actions recorded' }
      };
    }

    // 准确性评估
    const successfulActions = actions.filter(a => a.success !== false).length;
    const accuracyScore = Math.round((successfulActions / totalActions) * 10);

    // 效率评估
    const toolDurations = actions
      .filter(a => a.type === 'tool' && a.duration)
      .map(a => a.duration);
    const avgDuration = toolDurations.length > 0 
      ? toolDurations.reduce((a, b) => a + b, 0) / toolDurations.length 
      : 0;
    const efficiencyScore = avgDuration < 1000 ? 9 : avgDuration < 3000 ? 7 : 5;

    // 质量评估
    const errorRate = this.sessionMetrics.errors / totalActions;
    const fallbackRate = this.sessionMetrics.fallbacks / totalActions;
    const qualityScore = Math.max(0, 10 - Math.round((errorRate + fallbackRate) * 10));

    // 安全性评估
    const riskyActions = actions.filter(a => 
      a.toolName === 'exec' || 
      a.toolName === 'write' && a.params?.path?.includes('.env')
    ).length;
    const safetyScore = riskyActions === 0 ? 10 : riskyActions < 3 ? 7 : 5;

    return {
      accuracy: {
        score: accuracyScore,
        details: `${successfulActions}/${totalActions} successful actions`
      },
      efficiency: {
        score: efficiencyScore,
        details: `Avg tool duration: ${avgDuration.toFixed(0)}ms`
      },
      quality: {
        score: qualityScore,
        details: `${this.sessionMetrics.errors} errors, ${this.sessionMetrics.fallbacks} fallbacks`
      },
      safety: {
        score: safetyScore,
        details: `${riskyActions} potentially risky actions`
      }
    };
  }

  // 生成洞察
  _generateInsights() {
    const insights = [];
    const actions = this.sessionMetrics.actions;

    // 工具使用模式
    const toolUsage = {};
    for (const action of actions.filter(a => a.type === 'tool')) {
      toolUsage[action.toolName] = (toolUsage[action.toolName] || 0) + 1;
    }
    
    const mostUsedTool = Object.entries(toolUsage)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (mostUsedTool) {
      insights.push({
        type: 'pattern',
        message: `Most used tool: ${mostUsedTool[0]} (${mostUsedTool[1]} times)`,
        severity: mostUsedTool[1] > 20 ? 'warning' : 'info'
      });
    }

    // 错误模式
    const errors = actions.filter(a => a.type === 'error');
    if (errors.length > 0) {
      const errorTypes = {};
      for (const error of errors) {
        const type = error.error?.split(':')[0] || 'unknown';
        errorTypes[type] = (errorTypes[type] || 0) + 1;
      }
      
      const mostCommonError = Object.entries(errorTypes)
        .sort((a, b) => b[1] - a[1])[0];
      
      insights.push({
        type: 'error_pattern',
        message: `Common error: ${mostCommonError[0]} (${mostCommonError[1]} times)`,
        severity: mostCommonError[1] > 3 ? 'high' : 'medium'
      });
    }

    // 模型降级模式
    const fallbacks = actions.filter(a => a.type === 'fallback');
    if (fallbacks.length > 0) {
      const fallbackReasons = {};
      for (const fb of fallbacks) {
        fallbackReasons[fb.reason] = (fallbackReasons[fb.reason] || 0) + 1;
      }
      
      insights.push({
        type: 'fallback_pattern',
        message: `Model fallbacks: ${fallbacks.length} times`,
        severity: fallbacks.length > 5 ? 'high' : 'medium'
      });
    }

    return insights;
  }

  // 生成改进建议
  _generateRecommendations() {
    const recommendations = [];
    const assessment = this._assessPerformance();

    // 基于准确性
    if (assessment.accuracy.score < 7) {
      recommendations.push({
        dimension: REFLECTION_DIMENSIONS.ACCURACY,
        priority: 'high',
        suggestion: 'Review failed tool calls and improve error handling'
      });
    }

    // 基于效率
    if (assessment.efficiency.score < 7) {
      recommendations.push({
        dimension: REFLECTION_DIMENSIONS.EFFICIENCY,
        priority: 'medium',
        suggestion: 'Consider batching operations or using more efficient tools'
      });
    }

    // 基于质量
    if (assessment.quality.score < 7) {
      recommendations.push({
        dimension: REFLECTION_DIMENSIONS.QUALITY,
        priority: 'high',
        suggestion: 'Investigate error patterns and improve model selection'
      });
    }

    // 基于安全性
    if (assessment.safety.score < 7) {
      recommendations.push({
        dimension: REFLECTION_DIMENSIONS.SAFETY,
        priority: 'high',
        suggestion: 'Review potentially risky operations and add safeguards'
      });
    }

    return recommendations;
  }

  // 保存反思
  _saveReflection(reflection) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(REFLECTION_DIR, `reflections-${date}.jsonl`);
    
    const line = JSON.stringify(reflection) + '\n';
    fs.appendFileSync(filePath, line);
  }

  // 加载历史洞察
  _loadHistoricalInsights() {
    if (!fs.existsSync(REFLECTION_DIR)) return;

    const files = fs.readdirSync(REFLECTION_DIR)
      .filter(f => f.startsWith('reflections-'))
      .sort()
      .reverse()
      .slice(0, 7);  // 最近 7 天

    for (const file of files) {
      const filePath = path.join(REFLECTION_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const reflection = JSON.parse(line);
          this.insights.push(...reflection.insights);
        } catch (e) {}
      }
    }
  }

  // 获取历史洞察摘要
  getHistoricalInsights() {
    const summary = {
      totalReflections: 0,
      averageScores: {
        accuracy: 0,
        efficiency: 0,
        quality: 0,
        safety: 0
      },
      commonPatterns: [],
      topRecommendations: []
    };

    if (!fs.existsSync(REFLECTION_DIR)) return summary;

    const files = fs.readdirSync(REFLECTION_DIR)
      .filter(f => f.startsWith('reflections-'));

    let totalAccuracy = 0;
    let totalEfficiency = 0;
    let totalQuality = 0;
    let totalSafety = 0;
    const allRecommendations = [];

    for (const file of files) {
      const filePath = path.join(REFLECTION_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const reflection = JSON.parse(line);
          summary.totalReflections++;
          
          totalAccuracy += reflection.assessment?.accuracy?.score || 0;
          totalEfficiency += reflection.assessment?.efficiency?.score || 0;
          totalQuality += reflection.assessment?.quality?.score || 0;
          totalSafety += reflection.assessment?.safety?.score || 0;
          
          allRecommendations.push(...(reflection.recommendations || []));
        } catch (e) {}
      }
    }

    if (summary.totalReflections > 0) {
      summary.averageScores.accuracy = (totalAccuracy / summary.totalReflections).toFixed(1);
      summary.averageScores.efficiency = (totalEfficiency / summary.totalReflections).toFixed(1);
      summary.averageScores.quality = (totalQuality / summary.totalReflections).toFixed(1);
      summary.averageScores.safety = (totalSafety / summary.totalReflections).toFixed(1);
    }

    return summary;
  }

  // 获取统计
  getStats() {
    return {
      enabled: this.enabled,
      sessionMetrics: this.sessionMetrics,
      historicalSummary: this.getHistoricalInsights()
    };
  }
}

// 全局实例
const reflection = new ReflectionSystem();

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'stats':
      console.log(JSON.stringify(reflection.getStats(), null, 2));
      break;

    case 'reflect':
      reflection.init('test-session');
      
      // 模拟一些动作
      reflection.recordToolCall('read', true, 100);
      reflection.recordToolCall('write', true, 200);
      reflection.recordToolCall('exec', false, 500);
      reflection.recordError(new Error('Test error'), { tool: 'exec' });
      reflection.recordFallback('gpt-5.4', 'glm-5', 'rate_limit');
      
      const result = reflection.performReflection();
      console.log('\nReflection result:');
      console.log(JSON.stringify(result, null, 2));
      break;

    case 'history':
      const summary = reflection.getHistoricalInsights();
      console.log('Historical insights summary:');
      console.log(JSON.stringify(summary, null, 2));
      break;

    default:
      console.log('Usage: node reflection-system.js [stats|reflect|history]');
      console.log('');
      console.log('Environment variables:');
      console.log('  OPENCLAW_REFLECTION_ENABLED - Enable reflection (default: true)');
  }
}

module.exports = { ReflectionSystem, reflection, REFLECTION_DIMENSIONS };
