---
name: error-guidance
description: ErrorGuidance错误指导，12个预置错误模式（command not found/permission denied/timeout等），提供具体修复建议，防止重复相同指导。适用所有命令执行失败场景。
---

# Error Guidance - 错误指导

## 概述

检测常见错误模式，提供具体修复建议。

来源：Harness Engineering - ErrorGuidanceMiddleware

## 12个错误模式

### 1. missing_command（命令不存在）

**模式**：`command not found`

**建议**：
```markdown
❌ Command not found: {cmd}

💡 Fix suggestions:
1. Install missing command: apt-get install {pkg}
2. Check if command is in PATH: echo $PATH
3. Use alternative: which {alt_cmd}
```

---

### 2. permission（权限不足）

**模式**：`permission denied`

**建议**：
```markdown
❌ Permission denied: {path}

💡 Fix suggestions:
1. Add execute permission: chmod +x {path}
2. Run with elevated permissions: sudo {cmd}
3. Check file ownership: ls -la {path}
```

---

### 3. timeout（超时）

**模式**：`timeout exceeded`

**建议**：
```markdown
❌ Command timed out after {timeout}s

💡 Fix suggestions:
1. Increase timeout: timeout {new_timeout}s {cmd}
2. Run in background: {cmd} &
3. Optimize command for faster execution
```

---

### 4. file_missing（文件不存在）

**模式**：`file not found`

**建议**：
```markdown
❌ File not found: {path}

💡 Fix suggestions:
1. Check path exists: ls -la {path}
2. Create file if needed: touch {path}
3. Search for similar files: find . -name "*{name}*"
```

---

### 5. connection（连接失败）

**模式**：`connection refused`

**建议**：
```markdown
❌ Connection refused to {host}:{port}

💡 Fix suggestions:
1. Start service: systemctl start {service}
2. Check if service running: systemctl status {service}
3. Verify port is open: netstat -tulpn | grep {port}
```

---

### 6. memory（内存不足）

**模式**：`out of memory`

**建议**：
```markdown
❌ Out of memory

💡 Fix suggestions:
1. Reduce parallel execution
2. Free memory: sync && echo 3 > /proc/sys/vm/drop_caches
3. Increase swap: swapon /swapfile
```

---

### 7. syntax（语法错误）

**模式**：`syntax error`

**建议**：
```markdown
❌ Syntax error in {file}

💡 Fix suggestions:
1. Check syntax: {linter} {file}
2. Validate format: cat -A {file} (show special chars)
3. Use syntax highlighter to spot errors
```

---

### 8. import（模块导入失败）

**模式**：`module not found` / `import error`

**建议**：
```markdown
❌ Module not found: {module}

💡 Fix suggestions:
1. Install module: pip install {module}
2. Check installed: pip list | grep {module}
3. Use correct import path
```

---

### 9. ssl（SSL错误）

**模式**：`ssl error` / `certificate verify failed`

**建议**：
```markdown
❌ SSL certificate error

💡 Fix suggestions:
1. Update certificates: update-ca-certificates
2. Use insecure flag (dev only): --insecure
3. Check certificate chain: openssl s_client -connect {host}
```

---

### 10. disk（磁盘空间不足）

**模式**：`disk full` / `no space left`

**建议**：
```markdown
❌ Disk full

💡 Fix suggestions:
1. Check disk usage: df -h
2. Clean up: rm -rf /tmp/*, apt-get clean
3. Find large files: du -sh * | sort -rh | head
```

---

### 11. port（端口占用）

**模式**：`port in use` / `address already in use`

**建议**：
```markdown
❌ Port {port} already in use

💡 Fix suggestions:
1. Find process: lsof -i :{port}
2. Kill process: kill -9 {pid}
3. Use different port
```

---

### 12. git（Git错误）

**模式**：`git error` / `merge conflict`

**建议**：
```markdown
❌ Git error: {error}

💡 Fix suggestions:
1. Check status: git status
2. Resolve conflicts manually
3. Reset if needed: git reset --hard HEAD
```

---

## 防重复机制

### 同一指导不重复发送

```javascript
const GUIDANCE_HISTORY = [];

function shouldSendGuidance(type, toolCall) {
  const recent = GUIDANCE_HISTORY.filter(h => 
    h.type === type && 
    h.toolCall === toolCall &&
    Date.now() - h.timestamp < 60000  // 1分钟内
  );
  
  if (recent.length > 0) {
    console.log('Skip duplicate guidance');
    return false;
  }
  
  GUIDANCE_HISTORY.push({
    type: type,
    toolCall: toolCall,
    timestamp: Date.now()
  });
  
  return true;
}
```

---

## 与OpenClaw集成

### Post-tool检查

```javascript
// Tool执行后
for (const result of toolResults) {
  if (result.error || result.status === 'error') {
    // 错误指导
    const guidance = errorGuidance.detect(result.error);
    
    if (guidance && shouldSendGuidance(guidance.type, result.toolCall)) {
      injectNudge({
        type: 'error_guidance',
        pattern: guidance.pattern,
        message: guidance.message,
        suggestions: guidance.suggestions
      });
      
      guidanceStats.guidanceSent++;
    }
  }
}
```

---

## 状态追踪

### heartbeat-state.json字段

```json
{
  "guidanceStats": {
    "guidanceSent": 0,
    "patternsDetected": {},
    "lastGuidance": null
  }
}
```

---

创建时间：2026-04-17 12:34
版本：1.0.0
状态：已集成到OpenClaw post-tool检查