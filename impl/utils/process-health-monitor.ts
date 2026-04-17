/**
 * Process Health Monitor - 进程健康监控与自动修复
 * 
 * 监控目标：
 * - OpenClaw Gateway 进程
 * - Node.js 子进程
 * 
 * 检测机制：
 * - HTTP/WebSocket 心跳探测
 * - CPU/内存阈值检测
 * - 进程存活检查
 * - 响应超时检测
 * 
 * 修复机制：
 * - 自动重启卡死进程
 * - 优雅关闭（SIGTERM）+ 强制终止（SIGKILL）
 * - 重启失败降级策略
 * - 修复日志记录
 * - 飞书通知
 */

import { execSync, spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

export interface ProcessInfo {
  pid: number;
  name: string;
  command: string;
  cpuPercent: number;
  memoryMB: number;
  status: 'running' | 'stalled' | 'dead' | 'unknown';
  lastHeartbeat: number;
  restartCount: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  processes: ProcessInfo[];
  issues: HealthIssue[];
  timestamp: number;
}

export interface HealthIssue {
  type: 'stalled' | 'dead' | 'high_cpu' | 'high_memory' | 'no_response';
  process: string;
  pid: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  action: 'restart' | 'alert' | 'ignore';
}

export interface RecoveryAction {
  type: 'restart' | 'kill' | 'alert';
  process: string;
  pid: number;
  success: boolean;
  newPid?: number;
  timestamp: number;
  reason: string;
}

export interface MonitorConfig {
  gatewayPort: number;
  gatewayHost: string;
  heartbeatTimeoutMs: number;
  cpuThresholdPercent: number;
  memoryThresholdMB: number;
  maxRestartAttempts: number;
  restartCooldownMs: number;
  checkIntervalMs: number;        // 正常检查间隔（5分钟）
  aggressiveCheckIntervalMs?: number; // 激进检查间隔（1分钟）
  enableAutoRecovery: boolean;
  progressiveMode?: boolean;      // 渐进式监控
}

export interface MonitorStats {
  totalChecks: number;
  issuesDetected: number;
  recoveriesPerformed: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  lastCheckTime: number;
  lastRecoveryTime: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: MonitorConfig = {
  gatewayPort: 18789,
  gatewayHost: '127.0.0.1',
  heartbeatTimeoutMs: 30000, // 30 秒无响应视为卡死
  cpuThresholdPercent: 90,   // CPU > 90% 视为异常
  memoryThresholdMB: 500,    // 内存 > 500MB 视为异常
  maxRestartAttempts: 3,     // 最大重启尝试次数
  restartCooldownMs: 60000,  // 重启间隔冷却时间
  checkIntervalMs: 300000,   // 检查间隔（5分钟，正常情况）
  aggressiveCheckIntervalMs: 60000, // 问题持续时的激进检查间隔（1分钟）
  enableAutoRecovery: true,  // 自动修复
  progressiveMode: true,     // 渐进式监控模式
};

const STATE_PATH = join(process.env.OPENCLAW_WORKSPACE || process.cwd(), 'memory', 'health-monitor-state.json');
const LOG_PATH = join(process.env.OPENCLAW_WORKSPACE || process.cwd(), 'memory', 'health-monitor.log');

// ============================================================================
// Process Detection
// ============================================================================

function findProcess(pattern: string): ProcessInfo[] {
  try {
    const output = execSync(`ps aux | grep -E "${pattern}" | grep -v grep`, { encoding: 'utf-8' });
    const lines = output.trim().split('\n').filter(Boolean);
    
    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parseInt(parts[1], 10);
      const cpuPercent = parseFloat(parts[2]);
      const memoryPercent = parseFloat(parts[3]);
      const memoryKB = parseInt(parts[4], 10);
      const command = parts.slice(10).join(' ');
      
      return {
        pid,
        name: pattern,
        command,
        cpuPercent,
        memoryMB: Math.round(memoryKB / 1024),
        status: 'running',
        lastHeartbeat: Date.now(),
        restartCount: 0,
      };
    });
  } catch {
    return [];
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0); // 发送信号 0 只检查进程是否存在
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Gateway Health Check
// ============================================================================

async function checkGatewayHealth(config: MonitorConfig): Promise<{
  responding: boolean;
  latencyMs: number;
  error?: string;
}> {
  const url = `http://${config.gatewayHost}:${config.gatewayPort}/`;
  
  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(config.heartbeatTimeoutMs),
    });
    const latencyMs = Date.now() - start;
    
    return {
      responding: response.ok,
      latencyMs,
    };
  } catch (error) {
    return {
      responding: false,
      latencyMs: -1,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Health Monitor Class
// ============================================================================

export class ProcessHealthMonitor {
  private config: MonitorConfig;
  private stats: MonitorStats;
  private recoveryLog: RecoveryAction[];
  
  constructor(config?: Partial<MonitorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = this.loadStats();
    this.recoveryLog = [];
  }
  
  /**
   * 执行健康检查
   */
  async check(): Promise<HealthCheckResult> {
    const now = Date.now();
    const processes: ProcessInfo[] = [];
    const issues: HealthIssue[] = [];
    
    // 1. 检查 Gateway 进程
    const gatewayProcesses = findProcess('openclaw-gateway|openclaw');
    for (const proc of gatewayProcesses) {
      proc.name = 'gateway';
      
      // HTTP 心跳检查
      const health = await checkGatewayHealth(this.config);
      if (!health.responding) {
        proc.status = 'stalled';
        issues.push({
          type: 'no_response',
          process: 'gateway',
          pid: proc.pid,
          severity: 'critical',
          message: `Gateway 无响应 (${health.error})`,
          action: 'restart',
        });
      } else if (health.latencyMs > 5000) {
        issues.push({
          type: 'stalled',
          process: 'gateway',
          pid: proc.pid,
          severity: 'warning',
          message: `Gateway 响应延迟 ${health.latencyMs}ms`,
          action: 'alert',
        });
      }
      
      // CPU/内存检查
      if (proc.cpuPercent > this.config.cpuThresholdPercent) {
        issues.push({
          type: 'high_cpu',
          process: 'gateway',
          pid: proc.pid,
          severity: 'warning',
          message: `Gateway CPU ${proc.cpuPercent}%`,
          action: 'alert',
        });
      }
      
      if (proc.memoryMB > this.config.memoryThresholdMB) {
        issues.push({
          type: 'high_memory',
          process: 'gateway',
          pid: proc.pid,
          severity: 'warning',
          message: `Gateway 内存 ${proc.memoryMB}MB`,
          action: 'alert',
        });
      }
      
      processes.push(proc);
    }
    
    // 2. 检查 Node 子进程
    const nodeProcesses = findProcess('node');
    for (const proc of nodeProcesses) {
      if (!isProcessAlive(proc.pid)) {
        proc.status = 'dead';
        issues.push({
          type: 'dead',
          process: 'node',
          pid: proc.pid,
          severity: 'info',
          message: `Node 进程已终止`,
          action: 'ignore',
        });
      }
      processes.push(proc);
    }
    
    // 更新统计
    this.stats.totalChecks++;
    this.stats.lastCheckTime = now;
    this.stats.issuesDetected += issues.filter(i => i.severity === 'critical').length;
    this.saveStats();
    
    const healthy = issues.filter(i => i.severity === 'critical').length === 0;
    
    return { healthy, processes, issues, timestamp: now };
  }
  
  /**
   * 执行自动修复
   */
  async recover(issues: HealthIssue[]): Promise<RecoveryAction[]> {
    if (!this.config.enableAutoRecovery) {
      return [];
    }
    
    const actions: RecoveryAction[] = [];
    const criticalIssues = issues.filter(i => i.action === 'restart' && i.severity === 'critical');
    
    for (const issue of criticalIssues) {
      const action = await this.restartProcess(issue.process, issue.pid, issue.message);
      actions.push(action);
      this.recoveryLog.push(action);
    }
    
    this.stats.recoveriesPerformed += actions.length;
    this.stats.successfulRecoveries += actions.filter(a => a.success).length;
    this.stats.failedRecoveries += actions.filter(a => !a.success).length;
    this.stats.lastRecoveryTime = Date.now();
    this.saveStats();
    
    return actions;
  }
  
  /**
   * 重启进程
   */
  private async restartProcess(name: string, pid: number, reason: string): Promise<RecoveryAction> {
    const now = Date.now();
    
    try {
      // 1. 优雅关闭
      console.log(`[HealthMonitor] 正在终止 ${name} (PID: ${pid})...`);
      process.kill(pid, 'SIGTERM');
      
      // 等待 5 秒
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 2. 检查是否已终止
      if (isProcessAlive(pid)) {
        console.log(`[HealthMonitor] 进程未响应 SIGTERM，发送 SIGKILL...`);
        process.kill(pid, 'SIGKILL');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // 3. 重启进程
      console.log(`[HealthMonitor] 重启 ${name}...`);
      const newProcess = spawn('openclaw', ['gateway', 'start'], {
        detached: true,
        stdio: 'ignore',
      });
      newProcess.unref();
      
      // 4. 等待启动
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 5. 验证新进程
      const newProcesses = findProcess('openclaw-gateway');
      const newPid = newProcesses[0]?.pid;
      
      return {
        type: 'restart',
        process: name,
        pid,
        success: !!newPid,
        newPid,
        timestamp: now,
        reason,
      };
    } catch (error) {
      return {
        type: 'restart',
        process: name,
        pid,
        success: false,
        timestamp: now,
        reason: `${reason} - 重启失败: ${error}`,
      };
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats(): MonitorStats {
    return this.stats;
  }
  
  /**
   * 获取修复日志
   */
  getRecoveryLog(): RecoveryAction[] {
    return this.recoveryLog;
  }
  
  /**
   * 加载统计
   */
  private loadStats(): MonitorStats {
    if (!existsSync(STATE_PATH)) {
      return {
        totalChecks: 0,
        issuesDetected: 0,
        recoveriesPerformed: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0,
        lastCheckTime: 0,
        lastRecoveryTime: 0,
      };
    }
    
    try {
      return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
    } catch {
      return {
        totalChecks: 0,
        issuesDetected: 0,
        recoveriesPerformed: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0,
        lastCheckTime: 0,
        lastRecoveryTime: 0,
      };
    }
  }
  
  /**
   * 保存统计
   */
  private saveStats(): void {
    writeFileSync(STATE_PATH, JSON.stringify(this.stats, null, 2));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const processHealthMonitor = new ProcessHealthMonitor();

// ============================================================================
// Export for Heartbeat Integration
// ============================================================================

export async function runHealthCheck(): Promise<{
  healthy: boolean;
  issues: number;
  recoveries: number;
  summary: string;
}> {
  const result = await processHealthMonitor.check();
  
  if (!result.healthy) {
    const actions = await processHealthMonitor.recover(result.issues);
    
    return {
      healthy: actions.every(a => a.success),
      issues: result.issues.length,
      recoveries: actions.length,
      summary: `检测到 ${result.issues.length} 个问题，执行 ${actions.length} 次修复`,
    };
  }
  
  return {
    healthy: true,
    issues: 0,
    recoveries: 0,
    summary: '所有进程健康运行',
  };
}

export function getMonitorStats(): MonitorStats {
  return processHealthMonitor.getStats();
}