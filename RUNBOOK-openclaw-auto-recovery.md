# RUNBOOK-openclaw-auto-recovery.md

目标：当 OpenClaw 出现“卡住 / 掉线 / 很慢 / 不响应”体感时，按固定顺序自动完成最小诊断、最小修复、最小通知，避免临场乱修。

## 1. 自动处置目标

优先做到：
1. 先判断是真故障还是假故障
2. 先做低风险动作
3. 只在证据明确时做重动作
4. 把主会话从故障现场里解放出来

---

## 2. 自动处置分级

### Level 0: 轻量分类
默认先做：
```bash
openclaw status
openclaw doctor --non-interactive
```

判断四类：
- A. Gateway / Node 真故障
- B. config hash conflict 假故障
- C. session 过重 / context 压力
- D. lock 异常

### Level 1: 最小修复
只做低风险动作：
- 结论分类
- 建议分流长线程
- 外置长输出到文件
- 若是 config conflict，则先按“重读配置再重试”解释

### Level 2: 条件性修复
只有证据充分时才做：
- 清理 stale lock
- 单次 Gateway restart
- 基于最新快照的一次 config 重试

### Level 3: 停止自动展开
满足任一条件立即收手，不继续在主线程自动修：
- 需要连续 3 步以上排障
- 需要多次配置写入
- 需要反复 restart
- 需要大量日志比对
- 根因仍不明确

此时应：
- 转 diagnostics / runbook
- 或转独立线程 / 子会话

---

## 3. 自动判断规则

### 3.1 判断 Gateway 真故障
若 `openclaw status` 显示：
- Gateway unreachable
- Gateway service failed / inactive
- channel 明确异常

则按真故障处理。

### 3.2 判断 config 冲突假故障
若出现：
- `config changed since last load; re-run config.get and retry`
- `config base hash required; re-run config.get and retry`

则归类为：
- 配置快照过期
- 不是 Gateway 宕机

默认动作：
- 重新 `config.get`
- 基于最新快照只重试一次
- 若仍冲突，则停止自动展开

### 3.3 判断 session 过重
若：
- Gateway running + reachable
- channel OK
- session lock 正常
- 但体感明显卡顿/无响应

优先判断：
- 主 session 过重
- context 压力过高

默认动作：
- 收口当前线程
- 长输出写 diagnostics / runbook
- 后续改走独立线程

### 3.4 判断 lock 异常
若 doctor / lock 信息显示 stale lock：
- 仅在确认 stale 时清理
- 不把正常活锁当故障处理

---

## 4. 自动修复动作白名单

### 白名单动作
- `openclaw status`
- `openclaw doctor --non-interactive`
- 读取 heartbeat / diagnostics / runbook
- session 压力轻量检查
- 把结论写入 runbook / diagnostics
- 建议新线程继续

### 灰名单动作
仅在分类明确时做一次：
- 清理 stale lock
- `gateway.restart`
- `config.get` 后一次 `config.patch`

### 黑名单动作
默认不自动做：
- 未分类就反复 restart
- 多轮连续 config patch
- 在 heartbeat 中展开修复闭环
- 把长排障一直留在主会话

---

## 5. 心跳与自动恢复边界

heartbeat 只允许：
- check
- classify
- notify

heartbeat 不允许：
- 3 步以上排障
- 连续 restart
- 多次配置写入
- 长链路日志深挖

如果 heartbeat 发现异常：
- 只给出简短高价值通知
- 或落盘 diagnostics
- 不在 heartbeat 内做完整修复链

---

## 6. 用户通知模板

### 假故障
- 不是 Gateway 真挂
- 是配置基线变化，需要重读配置后再试

### session 过重
- 服务还活着
- 更像主 session 太重，我会先收口并分流

### 真 Gateway 故障
- 我确认到 Gateway / service 异常
- 现在开始做最小修复动作

---

## 7. 自动恢复的默认承诺

当用户允许“卡死时帮我自动修复”时，默认执行顺序：
1. 先检查
2. 先分类
3. 先最小修复
4. 不明根因不乱重启
5. 长问题不拖主线程

---

## 8. 本机当前推荐做法

结合本机已知情况：
- config hash conflict 曾被误显示成 `Gateway failed`
- 主 session 膨胀也曾造成“像卡死”的体感

因此默认优先级是：
1. 先排 config conflict
2. 再排主 session 压力
3. 最后才怀疑 Gateway / Node 真挂
