#!/usr/bin/env node
/**
 * Diagnostic Tracking - 基于 Claude Code diagnosticTracking.ts
 * 
 * 诊断追踪：
 *   - 记录错误和警告
 *   - 分析问题模式
 *   - 生成诊断报告
 * 
 * Usage:
 *   node diagnostic-tracking.js record <type> <message> [details]
 *   node diagnostic-tracking.js report
 *   node diagnostic-tracking.js clear
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const DIAG_DIR = path.join(WORKSPACE, 'state', 'diagnostics');
const DIAG_FILE = path.join(DIAG_DIR, 'tracking.json');

function loadDiagnostics() {
  if (!fs.existsSync(DIAG_FILE)) {
    return {
      errors: [],
      warnings: [],
      info: [],
      stats: {
        totalErrors: 0,
        totalWarnings: 0,
        lastErrorTime: null
      }
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(DIAG_FILE, 'utf8'));
  } catch {
    return {
      errors: [],
      warnings: [],
      info: [],
      stats: {
        totalErrors: 0,
        totalWarnings: 0,
        lastErrorTime: null
      }
    };
  }
}

function saveDiagnostics(diag) {
  fs.mkdirSync(DIAG_DIR, { recursive: true });
  fs.writeFileSync(DIAG_FILE, JSON.stringify(diag, null, 2));
}

function recordDiagnostic(type, message, details = {}) {
  const diag = loadDiagnostics();
  const timestamp = Date.now();
  
  const entry = {
    type,
    message,
    details,
    timestamp,
    id: `${type}_${timestamp}`
  };
  
  switch (type) {
    case 'error':
      diag.errors.push(entry);
      diag.stats.totalErrors++;
      diag.stats.lastErrorTime = timestamp;
      // Keep only last 100 errors
      if (diag.errors.length > 100) {
        diag.errors = diag.errors.slice(-100);
      }
      break;
    case 'warning':
      diag.warnings.push(entry);
      diag.stats.totalWarnings++;
      // Keep only last 200 warnings
      if (diag.warnings.length > 200) {
        diag.warnings = diag.warnings.slice(-200);
      }
      break;
    case 'info':
      diag.info.push(entry);
      // Keep only last 50 info
      if (diag.info.length > 50) {
        diag.info = diag.info.slice(-50);
      }
      break;
  }
  
  saveDiagnostics(diag);
  
  return {
    success: true,
    entry,
    stats: diag.stats
  };
}

function generateDiagnosticReport() {
  const diag = loadDiagnostics();
  
  // Analyze patterns
  const errorPatterns = {};
  for (const err of diag.errors) {
    const key = err.message.slice(0, 50);
    errorPatterns[key] = (errorPatterns[key] || 0) + 1;
  }
  
  const warningPatterns = {};
  for (const warn of diag.warnings) {
    const key = warn.message.slice(0, 50);
    warningPatterns[key] = (warningPatterns[key] || 0) + 1;
  }
  
  // Recent issues (last hour)
  const oneHourAgo = Date.now() - 3600000;
  const recentErrors = diag.errors.filter(e => e.timestamp > oneHourAgo);
  const recentWarnings = diag.warnings.filter(w => w.timestamp > oneHourAgo);
  
  return {
    stats: diag.stats,
    patterns: {
      topErrors: Object.entries(errorPatterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      topWarnings: Object.entries(warningPatterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    },
    recent: {
      errors: recentErrors.length,
      warnings: recentWarnings.length,
      lastHour: recentErrors.length + recentWarnings.length
    },
    recommendations: generateRecommendations(diag, errorPatterns)
  };
}

function generateRecommendations(diag, patterns) {
  const recommendations = [];
  
  // Check for frequent errors
  for (const [pattern, count] of Object.entries(patterns)) {
    if (count >= 5) {
      recommendations.push({
        type: 'frequent_error',
        pattern,
        count,
        suggestion: 'Consider investigating this recurring error pattern'
      });
    }
  }
  
  // Check for recent spike
  const oneHourAgo = Date.now() - 3600000;
  const recentErrors = diag.errors.filter(e => e.timestamp > oneHourAgo);
  if (recentErrors.length >= 10) {
    recommendations.push({
      type: 'error_spike',
      count: recentErrors.length,
      suggestion: 'Error rate spiked in the last hour, check system health'
    });
  }
  
  return recommendations;
}

function clearDiagnostics() {
  const diag = {
    errors: [],
    warnings: [],
    info: [],
    stats: {
      totalErrors: 0,
      totalWarnings: 0,
      lastErrorTime: null,
      clearedAt: Date.now()
    }
  };
  
  saveDiagnostics(diag);
  
  return {
    success: true,
    action: 'cleared',
    timestamp: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'report';
  
  switch (command) {
    case 'record':
      const type = args[1] || 'info';
      const message = args[2] || '';
      const details = args[3] ? JSON.parse(args[3]) : {};
      console.log(JSON.stringify(recordDiagnostic(type, message, details), null, 2));
      break;
    case 'report':
      console.log(JSON.stringify(generateDiagnosticReport(), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearDiagnostics(), null, 2));
      break;
    case 'list':
      const diag = loadDiagnostics();
      console.log(JSON.stringify({
        recentErrors: diag.errors.slice(-10),
        recentWarnings: diag.warnings.slice(-10),
        stats: diag.stats
      }, null, 2));
      break;
    default:
      console.log('Usage: node diagnostic-tracking.js [record|report|clear|list]');
      process.exit(1);
  }
}

main();

module.exports = {
  recordDiagnostic,
  generateDiagnosticReport,
  clearDiagnostics,
  loadDiagnostics
};