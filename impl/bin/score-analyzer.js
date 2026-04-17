#!/usr/bin/env node
/**
 * Score Analyzer - 分数趋势分析
 * 
 * 来源：Harness Engineering - harness.py score_history 分析
 * 
 * 功能：
 * - 分析分数趋势（IMPROVING/STAGNANT/DECLINING）
 * - 推荐策略（REFINE/PIVOT）
 * - 计算平均值、最高分、最低分
 * - 预测下一步分数
 * 
 * 用法：
 *   node score-analyzer.js analyze 7.5 8.0 7.8
 *   node score-analyzer.js status
 *   node score-analyzer.js recommend 7.5 8.0 7.8
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/Users/mar2game';
const STATE_FILE = `${HOME}/.openclaw/workspace/state/score-history.json`;

/**
 * 分数趋势分析
 */
function analyzeTrend(scores) {
  if (scores.length === 0) {
    return {
      trend: 'NO_DATA',
      recommendation: 'NEED_MORE_DATA',
      stats: null
    };
  }

  const stats = {
    count: scores.length,
    average: scores.reduce((a, b) => a + b, 0) / scores.length,
    max: Math.max(...scores),
    min: Math.min(...scores),
    latest: scores[scores.length - 1],
    previous: scores.length > 1 ? scores[scores.length - 2] : null
  };

  // 趋势判断
  let trend = 'STAGNANT';
  let recommendation = 'REFINE';
  let delta = 0;

  if (scores.length >= 2) {
    delta = stats.latest - stats.previous;
    
    if (delta > 0.5) {
      trend = 'IMPROVING';
      recommendation = 'REFINE';
    } else if (delta < -0.5) {
      trend = 'DECLINING';
      recommendation = 'PIVOT';
    } else if (delta > 0) {
      trend = 'SLOW_IMPROVING';
      recommendation = 'REFINE';
    } else if (delta < 0) {
      trend = 'SLOW_DECLINING';
      recommendation = 'MONITOR';
    } else {
      trend = 'STAGNANT';
      recommendation = 'REFINE';
    }
  }

  // 预测（简单线性回归）
  let prediction = null;
  if (scores.length >= 3) {
    const n = scores.length;
    const xMean = (n - 1) / 2;
    const yMean = stats.average;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (scores[i] - yMean);
      denominator += (i - xMean) ** 2;
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;
    
    prediction = slope * n + intercept;
    prediction = Math.max(0, Math.min(10, prediction)); // 限制在 0-10 范围
  }

  return {
    trend,
    recommendation,
    delta,
    stats,
    prediction,
    confidence: scores.length >= 3 ? 'HIGH' : scores.length >= 2 ? 'MEDIUM' : 'LOW'
  };
}

/**
 * 获取策略建议
 */
function getRecommendation(scores, threshold = 7.0) {
  const analysis = analyzeTrend(scores);
  
  const reasons = [];
  
  if (analysis.stats && analysis.stats.latest >= threshold) {
    return {
      strategy: 'DONE',
      reason: `Latest score ${analysis.stats.latest} >= threshold ${threshold}`,
      nextAction: 'STOP'
    };
  }

  if (analysis.trend === 'IMPROVING') {
    reasons.push('Scores are improving');
    reasons.push(`Delta: +${analysis.delta.toFixed(2)}`);
    return {
      strategy: 'REFINE',
      reason: reasons.join('\n'),
      nextAction: 'Continue refining current approach'
    };
  }

  if (analysis.trend === 'DECLINING') {
    reasons.push('Scores are declining');
    reasons.push(`Delta: ${analysis.delta.toFixed(2)}`);
    reasons.push('Consider different approach');
    return {
      strategy: 'PIVOT',
      reason: reasons.join('\n'),
      nextAction: 'Try a different implementation strategy'
    };
  }

  if (analysis.trend === 'STAGNANT') {
    if (analysis.stats && analysis.stats.average < threshold * 0.8) {
      return {
        strategy: 'PIVOT',
        reason: 'Scores stagnant and below threshold',
        nextAction: 'Major rewrite needed'
      };
    }
    return {
      strategy: 'REFINE',
      reason: 'Scores stagnant but close to threshold',
      nextAction: 'Focus on specific improvements from feedback'
    };
  }

  return {
    strategy: 'REFINE',
    reason: 'Continue building',
    nextAction: 'Default refinement'
  };
}

/**
 * 加载历史分数
 */
function loadScoreHistory() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return {
    scores: [],
    rounds: [],
    timestamps: []
  };
}

/**
 * 保存分数
 */
function saveScore(score, roundNum) {
  const history = loadScoreHistory();
  
  history.scores.push(score);
  history.rounds.push(roundNum);
  history.timestamps.push(Date.now());
  
  fs.writeFileSync(STATE_FILE, JSON.stringify(history, null, 2));
  
  return history;
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'analyze') {
    const scores = args.slice(1).map(parseFloat).filter(s => !isNaN(s));
    const analysis = analyzeTrend(scores);
    
    console.log(JSON.stringify(analysis, null, 2));
    return;
  }

  if (command === 'recommend') {
    const scores = args.slice(1).map(parseFloat).filter(s => !isNaN(s));
    const threshold = parseFloat(process.env.PASS_THRESHOLD || '7.0');
    const recommendation = getRecommendation(scores, threshold);
    
    console.log(JSON.stringify(recommendation, null, 2));
    return;
  }

  if (command === 'status') {
    const history = loadScoreHistory();
    const analysis = analyzeTrend(history.scores);
    
    console.log('================================');
    console.log('📊 Score History Status');
    console.log('================================');
    console.log('');
    console.log(`Total rounds: ${history.scores.length}`);
    console.log(`Latest score: ${analysis.stats?.latest || 'N/A'}`);
    console.log(`Average: ${analysis.stats?.average?.toFixed(2) || 'N/A'}`);
    console.log(`Max: ${analysis.stats?.max || 'N/A'}`);
    console.log(`Min: ${analysis.stats?.min || 'N/A'}`);
    console.log(`Trend: ${analysis.trend}`);
    console.log(`Recommendation: ${analysis.recommendation}`);
    
    if (history.scores.length > 0) {
      console.log('');
      console.log('Score history:');
      for (let i = 0; i < history.scores.length; i++) {
        console.log(`  Round ${history.rounds[i]}: ${history.scores[i]}/10`);
      }
    }
    return;
  }

  if (command === 'save') {
    const score = parseFloat(args[1]);
    const roundNum = parseInt(args[2]) || 1;
    
    if (isNaN(score)) {
      console.log('Usage: node score-analyzer.js save <score> <round>');
      return;
    }
    
    const history = saveScore(score, roundNum);
    console.log(`Saved score ${score}/10 for round ${roundNum}`);
    console.log(`History: ${history.scores.join(', ')}`);
    return;
  }

  // 默认帮助
  console.log('Usage:');
  console.log('  node score-analyzer.js analyze <scores...>');
  console.log('  node score-analyzer.js recommend <scores...>');
  console.log('  node score-analyzer.js status');
  console.log('  node score-analyzer.js save <score> <round>');
  console.log('');
  console.log('Examples:');
  console.log('  node score-analyzer.js analyze 7.5 8.0 7.8');
  console.log('  node score-analyzer.js recommend 7.5 8.0 7.8');
  console.log('  node score-analyzer.js save 8.0 3');
}

// 导出函数
module.exports = {
  analyzeTrend,
  getRecommendation,
  loadScoreHistory,
  saveScore
};

main();