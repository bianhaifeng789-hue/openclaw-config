---
name: sandbox-audit
description: Audit sandbox operations for security and safety. Use when tracking file system operations (read/write/delete/execute) for audit logging, detecting suspicious patterns, and enforcing safe boundaries. Implements DeerFlow's SandboxAuditMiddleware pattern.
---

# Sandbox Audit

审计沙箱操作，记录文件系统访问并检测可疑模式。

## 审计范围

| 操作类型 | 审计内容 | 风险等级 |
|----------|----------|----------|
| read | 文件路径、大小 | 低 |
| write | 文件路径、内容长度 | 中 |
| delete | 文件路径 | 高 |
| execute | 命令、参数 | 高 |
| ls | 目录路径 | 低 |

## 审计记录格式

```javascript
const auditLog = {
  timestamp: Date.now(),
  thread_id: 'xxx',
  operation: 'write',
  path: '/Users/mac/.ssh/id_rsa',
  details: {
    content_length: 3245,
    checksum: 'sha256:abc123'
  },
  risk_level: 'high',
  user_id: 'ou_xxx',
  agent_name: 'dispatcher'
};
```

## 风险检测模式

### 高风险操作

```javascript
const HIGH_RISK_PATTERNS = [
  // 敏感文件访问
  /\.ssh\//i,            // SSH 密钥
  /\.env$/i,             // 环境变量
  /credentials/i,        // 凭证文件
  /\.pem$/i,             // 证书文件
  
  // 系统文件
  /^\/etc\//i,           // 系统配置
  /^\/var\//i,           // 系统数据
  
  // 命令风险
  /rm\s+-rf/i,           // 强制删除
  /chmod\s+777/i,        // 过度权限
  /sudo/i,               // 提权
  /curl.*\|.*sh/i,       // 远程执行
];
```

### 中风险操作

```javascript
const MEDIUM_RISK_PATTERNS = [
  // 配置文件修改
  /\.yaml$/i,
  /\.json$/i,
  /\.conf$/i,
  
  // 数据库文件
  /\.db$/i,
  /\.sqlite$/i,
  
  // 大规模操作
  /find.*-delete/i,
];
```

## 审计中间件

```javascript
class SandboxAuditMiddleware {
  constructor(config = {}) {
    this.logPath = config.logPath || './logs/sandbox-audit.jsonl';
    this.maxLogSize = config.maxLogSize || 10 * 1024 * 1024;  // 10MB
    this.alertThreshold = config.alertThreshold || 3;  // 连续高风险阈值
  }
  
  async afterTool(state, toolCall, result) {
    const auditEntry = {
      timestamp: Date.now(),
      thread_id: state.thread_id,
      operation: toolCall.name,
      path: toolCall.args?.path || toolCall.args?.command,
      details: this.extractDetails(toolCall, result),
      risk_level: this.assessRisk(toolCall),
      user_id: state.user_id,
      agent_name: state.agent_name
    };
    
    // 写入审计日志
    await this.writeLog(auditEntry);
    
    // 高风险检测
    if (auditEntry.risk_level === 'high') {
      this.checkAlertThreshold(state.thread_id);
    }
    
    return null;  // 不修改状态
  }
  
  assessRisk(toolCall) {
    const target = toolCall.args?.path || toolCall.args?.command || '';
    
    for (const pattern of HIGH_RISK_PATTERNS) {
      if (pattern.test(target)) return 'high';
    }
    
    for (const pattern of MEDIUM_RISK_PATTERNS) {
      if (pattern.test(target)) return 'medium';
    }
    
    return 'low';
  }
  
  extractDetails(toolCall, result) {
    const details = {};
    
    if (toolCall.name === 'write_file') {
      details.content_length = toolCall.args?.content?.length || 0;
      details.checksum = this.hashContent(toolCall.args?.content);
    }
    
    if (toolCall.name === 'execute_command') {
      details.command = toolCall.args?.command;
      details.exit_code = result?.exit_code;
    }
    
    if (toolCall.name === 'read_file') {
      details.lines_read = result?.content?.split('\n').length || 0;
    }
    
    return details;
  }
  
  async writeLog(entry) {
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(this.logPath, line);
    
    // 检查日志大小
    const stats = await fs.stat(this.logPath);
    if (stats.size > this.maxLogSize) {
      await this.rotateLog();
    }
  }
}
```

## 警报机制

```javascript
// 连续高风险操作警报
function checkAlertThreshold(threadId) {
  const recentOps = this.getRecentOps(threadId, 5);  // 最近 5 次操作
  const highRiskCount = recentOps.filter(op => op.risk_level === 'high').length;
  
  if (highRiskCount >= this.alertThreshold) {
    // 发送警报
    this.sendAlert({
      thread_id: threadId,
      message: `连续 ${highRiskCount} 次高风险操作`,
      operations: recentOps
    });
  }
}
```

## 日志轮转

```javascript
async rotateLog() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archivePath = `${this.logPath}.${timestamp}`;
  
  await fs.rename(this.logPath, archivePath);
  await fs.writeFile(this.logPath, '');
  
  // 清理旧日志（保留 7 天）
  await this.cleanOldLogs(7);
}
```

## 安全边界

```javascript
// 允许的路径白名单
const ALLOWED_PATHS = [
  /^\.\/workspace\//i,      // 工作目录
  /^\.\/\.openclaw\//i,     // OpenClaw 配置
  /^\/tmp\//i,              // 临时文件
];

// 禁止的路径黑名单
const BLOCKED_PATHS = [
  /^\/etc\//i,              // 系统配置
  /^\/var\//i,              // 系统数据
  /\.ssh\//i,               // SSH 密钥
];

function checkPathBoundary(path) {
  // 检查黑名单
  for (const pattern of BLOCKED_PATHS) {
    if (pattern.test(path)) {
      return { allowed: false, reason: 'blocked_path' };
    }
  }
  
  // 检查白名单
  for (const pattern of ALLOWED_PATHS) {
    if (pattern.test(path)) {
      return { allowed: true };
    }
  }
  
  return { allowed: false, reason: 'not_in_whitelist' };
}
```

## 应用场景

- **安全审计** - 记录所有文件操作
- **异常检测** - 识别可疑行为模式
- **合规要求** - 满足审计日志要求
- **调试追踪** - 定位操作问题

---

**来源**: DeerFlow `sandbox_audit_middleware.py` (345 行)
**移植时间**: 2026-04-15