# RUNBOOK-openclaw-health.md

OpenClaw 基础健康检查与轻量收尾 runbook。

## 目标

用于快速判断当前问题属于：
- 配置问题
- 渠道安全/暴露面问题
- 运行态问题
- 仅展示层噪音

默认原则：
- 先只读，再最小改动
- 一次只改一类问题
- 每次改动后立刻复查
- 长日志不要堆在主会话里

---

## 1. 首选检查顺序

### 1) 状态总览
```bash
openclaw status
```

重点看：
- Gateway bind / Dashboard 地址
- Channel state
- Memory / Plugins / Tasks
- Security audit 摘要

### 2) 轻量诊断
```bash
openclaw doctor --non-interactive
```

重点看：
- channel security warnings
- session locks 是否 stale
- memory search 是否 disabled / unavailable
- plugins errors

### 3) 深度安全检查
```bash
openclaw security audit --deep
```

重点看：
- dmPolicy / allowFrom
- sandbox / runtime / fs 暴露面
- 不必要工具或插件暴露

---

## 2. 常见问题优先级

### P0：先处理
- `gateway.bind = lan` 或 `0.0.0.0`
- `dmPolicy = open` 但实际是单人使用
- 任何 channel security warnings
- 真实运行错误 / 插件 errors

### P1：再处理
- 半开能力：插件开着，但 feature disabled
- heartbeat 过重
- 长主线程导致上下文压力大

### P2：最后处理
- 仅 status 展示层噪音
- 非阻塞提醒（如 trustedProxies、doc tool 提示）

---

## 3. 推荐最小修复策略

### Gateway 暴露面
优先：
- `bind: loopback`
- 远程访问用 tunnel / tailscale，而不是直接 LAN 暴露

### 渠道访问控制
单人/私用默认：
- `dmPolicy: allowlist`
- `allowFrom`: 明确 owner id

### Memory 能力
规则：
- 不用就彻底关
- 要用就完整启用并验证
- 不要让 `plugin enabled` 和 `feature disabled` 长期并存

---

## 4. 修改后的复查模板

每次改动后至少复查：
```bash
openclaw status
openclaw doctor --non-interactive
```

必要时补：
```bash
openclaw security audit --deep
```

复查时只回答四个问题：
1. 改动是否真正生效
2. warning 是否收敛
3. 是否引入新问题
4. 剩余问题是运行问题、配置问题，还是展示噪音

---

## 5. 会话与上下文规则

- 主线程只保留：结论、决策、下一步
- 长日志 / 多轮试错：独立线程或外置到文件
- heartbeat 只做：check / route / notify
- heartbeat 遇到连续 3 步以上排查，立即停止并转独立处理

---

## 6. 这台机器当前已验证的基线（2026-04-19）

- `gateway.bind = loopback`
- `channels.feishu.dmPolicy = allowlist`
- `channels.feishu.allowFrom` 限制到 owner
- `doctor` 无 channel security warnings
- `memory-core unavailable` 更像 status 展示/能力语义尾巴，不是主故障

---

## 7. 何时收线

满足以下条件就收线：
- 主要风险项已收敛
- 主链路正常
- 剩余项是非阻塞提醒或展示层噪音
- 结论已外置到 runbook / memory
