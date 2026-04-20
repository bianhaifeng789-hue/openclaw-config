# RUNBOOK-openclaw-gateway-false-failure.md

OpenClaw 中“Gateway 掉线/卡死”与配置冲突、主会话膨胀之间的区分与排查方法。

## 目标

用于快速判断用户感知到的：
- `⚠️ 🔌 Gateway failed`
- “Gateway 掉线”
- “OpenClaw 卡死”

到底属于：
- 真实 Gateway daemon 故障
- `config.patch / config.apply` 的可恢复配置基线冲突
- 主 session 过重导致的超慢 / 假卡死
- 展示层误报

---

## 1. 这类问题的常见混淆

### A. 假挂
典型特征：
- 用户看到 `Gateway failed` 或以为网关掉了
- 真实错误是：
  - `config changed since last load; re-run config.get and retry`
  - `config base hash required; re-run config.get and retry`
- 本质：配置快照过期，写入前被别的操作改过
- 含义：需要重新 `config.get` 再重试，不是 Gateway 宕机

### B. 真卡
典型特征：
- Gateway service 还活着
- channel 还正常
- 但主会话回复极慢、看起来挂住
- 常伴随长线程、长日志、反复诊断、超大工具输出
- 本质：`agent:main:main` 上下文膨胀，造成高延迟或 context overflow 体感

### C. 真故障
典型特征：
- `openclaw status` 显示 Gateway unreachable / service failed
- `openclaw logs` 有明确启动失败、端口占用、进程退出等痕迹
- 这才是真正的 Gateway 故障

---

## 2. 先做的最小检查

```bash
openclaw status
openclaw doctor --non-interactive
```

重点看：
- Gateway service 是否 running
- Gateway 是否 reachable
- Feishu/当前 channel 是否 OK
- session lock 是否 stale

### 解释模板

如果看到：
- Gateway running
- reachable
- channel OK
- session lock alive / stale=no

那么优先判断为：
- 不是 Gateway daemon 真挂
- 更像配置冲突误报或主会话过重

---

## 3. 本机已确认的关键机制

### 3.1 配置冲突不是 Gateway 宕机
运行时会在 `config.patch / config.apply` 里做 base hash 校验。

如果配置在读取后被其他操作更新，服务端会返回：

- `config changed since last load; re-run config.get and retry`

这表示：
- 当前写入基于旧快照
- 需要重新读取最新配置再重试
- 不是 Gateway daemon 掉线

### 3.2 运行时已对这类错误做两层修正
本机运行时代码已确认存在两层保护：

1. `openclaw-tools-*.js`
   - 将这类错误改写成人话
   - 明确说明“这是配置被其他操作改过，不是 Gateway 宕掉”

2. `pi-embedded-runner-*.js`
   - 将这类错误识别为 recoverable gateway config conflict
   - 对用户可见 warning 做抑制，避免再补发 `⚠️ 🔌 Gateway failed`

### 3.3 session lock 不像无限死锁
本机 `session-write-lock` 机制包含：
- stale 检查
- pid / starttime 校验
- orphan self lock 识别
- watchdog 自动释放超时持有的锁

因此 session lock 不是当前最可疑主因。

---

## 4. 这台机器当前最像的根因链

### 高概率链路
1. 某次 `gateway config.patch` 或相关配置写入发生并发冲突
2. 返回：`config changed since last load; re-run config.get and retry`
3. 旧表现层把它误感知为 `Gateway failed`
4. 同时主线程在等待 / 状态未及时刷新 / 会话已很重
5. 用户体感变成：Gateway 掉线 + OpenClaw 卡死

### 当前判断优先级
1. **最高概率**：配置并发冲突被误显示成 Gateway 故障
2. **次高概率**：主 session 过重，放大“像卡死”的体感
3. **较低概率**：Gateway daemon 真崩是主因

---

## 5. 现在谁最可能制造 config 冲突

截至本次排查：

### 已发现的高相关来源
- 人工诊断线程里连续执行 `gateway config.patch` / `config.apply` / `gateway.restart`
- 本地运行时代码补丁后，为验证生效做过多次重启和配置读写
- 诊断记录文件中明确出现上述调用链

### 当前较低相关来源
- heartbeat 任务本身
  - 当前定义只有 3 个：`context-pressure-check` / `memory-maintenance` / `doctor-check`
  - 它们设计上偏只读 check，不是高频配置写入任务
- cron
  - 当前 jobs 为 0

### 当前结论
本机更像是：
- **人工排障与运行时补丁验证阶段的配置写入重叠**
- 而不是 heartbeat / cron 在后台疯狂改配置

---

## 6. 防复发原则

### 6.1 降低配置写入并发
- 同一轮修复尽量合并成更少次 `config.patch`
- 每次写配置前先重新 `config.get`
- 避免多个线程/多个会话同时改 Gateway 配置

### 6.2 把长排障从主会话分流
符合以下任一条件就不要继续堆在主线程：
- 连续 3 步以上排障
- 同时看 status / doctor / logs / config
- 多轮修改配置并验证
- 需要大量日志和长输出

优先：
- 独立线程
- 子会话
- 外置到 runbook / diagnostics 文件

### 6.3 减少“假挂”传播
- 对 `config changed since last load` 一律按“配置冲突”理解
- 不把这类错误解释成 Gateway daemon 掉线
- 用户侧文案优先写清：
  - 配置基线变了
  - 需要重读配置再重试
  - 不是网关崩溃

---

## 7. 快速判别模板

### 如果用户说“Gateway 又挂了”
按这个顺序判：

1. `openclaw status`
2. `openclaw doctor --non-interactive`
3. 若 Gateway running + reachable：
   - 去查是否存在 `config changed since last load`
   - 再判断是否是主 session 过重
4. 只有在 status/logs 直接显示服务失败时，才按真 Gateway 故障处理

---

## 8. 本轮 closeout

### 现象
用户感知为“之前 Gateway 掉线，OpenClaw 卡死”。

### 判断
更像可恢复配置冲突被误显示成 Gateway 故障，再叠加主会话过重造成卡死体感。

### 已执行动作
- 检查 `openclaw status` / `doctor`
- 核对 heartbeat / cron 当前状态
- 检查运行时代码对 config hash conflict 的处理
- 确认 session write lock 有 watchdog 与 stale reclaim 机制
- 识别本机当前最可能的配置冲突来源

### 验证结果
- 当前 Gateway running + reachable
- 当前 channel OK
- 当前 cron jobs = 0
- heartbeat 任务是轻量检查型
- 运行时代码已将该类冲突从“Gateway failed”语义中分离

### 剩余尾巴
- 仍需持续避免在同一时间窗内多次配置写入
- 仍需控制主 session 膨胀

### 下一步
- 后续涉及配置改动时，先 `config.get` 再 patch
- 长排障统一分流到独立线程 / diagnostics / runbook
