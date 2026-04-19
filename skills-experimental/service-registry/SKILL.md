---
name: service-registry
description: "服务注册表。管理所有服务的注册和发现，提供服务查询功能。Use when registering and discovering services."
---

# Service Registry

## 功能

管理服务注册。

### 服务类型

- health-monitor - 健康监控服务
- heartbeat-guardian - 心跳守护服务
- auto-dream - 自动整理服务
- compact-service - 压缩服务
- circuit-breaker - 熔断器服务

### 使用示例

```javascript
// 注册服务
registerService({
  name: 'my-service',
  type: 'monitor',
  priority: 'high',
  interval: '5m'
});

// 发现服务
const services = discoverServices('monitor');

// 查询服务状态
const status = getServiceStatus('health-monitor');
```

### 注册信息

- 服务名称
- 服务类型
- 运行优先级
- 执行间隔
- 当前状态

---

来源: Claude Code services/registry.ts