---
name: circuit-breaker
description: Circuit breaker for LLM API calls with failure threshold and automatic recovery. Protects against cascading failures and API rate limits. Use when experiencing repeated LLM failures or configuring API resilience.
---

# Circuit Breaker - LLM Failure Protection

借鉴 DeerFlow 2.0 的 CircuitBreakerConfig 熔断器机制。

## Why Circuit Breaker

LLM API 调用可能失败：
- Rate limits（429 Too Many Requests）
- Timeout errors
- Network failures
- Model unavailable

**问题**: 连续失败会导致雪崩效应，影响整个系统。

**解决方案**: Circuit Breaker 熔断器

## How It Works

```
Closed (正常) → failure_threshold → Open (熔断)
                    ↑                      ↓
                    │                      │
                    │                      recovery_timeout_sec
                    │                      │
                    └                      ↓
               Half-Open (尝试恢复) ← ─────┘
                    │
                    │ success → Closed
                    │ failure → Open
```

**状态转换**:
- **Closed** → **Open**: 连续失败达到 `failure_threshold`
- **Open** → **Half-Open**: 等待 `recovery_timeout_sec` 后尝试恢复
- **Half-Open** → **Closed**: 成功调用后恢复正常
- **Half-Open** → **Open**: 再次失败，继续熔断

## Configuration

**gateway-config.yaml**:
```yaml
circuit_breaker:
  enabled: true
  failure_threshold: 5  # 连续失败5次触发熔断
  recovery_timeout_sec: 60  # 60秒后尝试恢复
```

## Implementation

**impl/bin/circuit-breaker.js**:
```javascript
class CircuitBreaker {
  constructor(config) {
    this.enabled = config.enabled;
    this.failureThreshold = config.failure_threshold;
    this.recoveryTimeoutSec = config.recovery_timeout_sec;
    
    this.failures = 0;
    this.state = 'closed';  // closed, open, half-open
    this.lastFailureTime = null;
  }
  
  async call(fn) {
    if (!this.enabled) {
      return await fn();
    }
    
    // Check state
    if (this.state === 'open') {
      const elapsed = (Date.now() - this.lastFailureTime) / 1000;
      if (elapsed < this.recoveryTimeoutSec) {
        throw new Error('Circuit breaker is OPEN (too many failures)');
      }
      this.state = 'half-open';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }
  
  onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      isOpen: this.state === 'open'
    };
  }
}
```

## Usage

**LLM provider 包装**:
```javascript
const circuitBreaker = new CircuitBreaker(config.circuit_breaker);

async function callLLM(prompt) {
  return await circuitBreaker.call(async () => {
    return await llm.invoke(prompt);
  });
}
```

## Metrics

**State tracking**:
```json
{
  "state": "closed",
  "failures": 0,
  "lastFailureTime": null,
  "totalCalls": 100,
  "totalFailures": 5,
  "totalOpenEvents": 1
}
```

## Borrowed From

DeerFlow 2.0 - `backend/packages/harness/deerflow/config/app_config.py`

```python
class CircuitBreakerConfig(BaseModel):
    failure_threshold: int = Field(default=5)
    recovery_timeout_sec: int = Field(default=60)
```

---

_创建时间: 2026-04-15_
_借鉴来源: https://github.com/bytedance/deer-flow_