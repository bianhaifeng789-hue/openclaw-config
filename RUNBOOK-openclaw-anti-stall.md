# RUNBOOK-openclaw-anti-stall.md

目标：尽量避免 OpenClaw 因 Node、Gateway、session 或配置冲突而出现“卡死 / 假掉线 / 长时间无响应”。

## 1. 总原则

### 1.1 稳定性优先于连续对话
- 主会话不是日志桶，也不是排障 worker
- 能分流的长任务就分流
- 能外置到文件的长输出就外置
- 能少一次配置写入就少一次

### 1.2 先保活，再排美观
优先级：
1. Gateway / Node 存活
2. 主 session 不膨胀
3. 配置写入不冲突
4. 展示和提示文案准确

---

## 2. 什么最容易导致“卡死体感”

### A. 主 session 过重
典型来源：
- 长日志直接贴主对话
- 多轮排障都留在同一线程
- 大段代码、诊断、审计结果反复堆在主线程
- 一边聊天一边深挖实现细节

后果：
- 回复越来越慢
- 工具回合变长
- 自动压缩频繁触发
- 用户体感像“卡死”

### B. 配置写入并发
典型来源：
- 多次 `config.patch` / `config.apply` 靠得太近
- 多个线程同时改 Gateway 配置
- 一边调试一边重启一边再改配置

后果：
- `config changed since last load; re-run config.get and retry`
- 被误感知为 Gateway 掉线

### C. 把 heartbeat 当后台修复器
典型来源：
- 在 heartbeat 里做多步排障
- heartbeat 修改配置
- heartbeat 长链路追踪日志

后果：
- 主线程和后台任务相互干扰
- 增加 session 压力和配置冲突概率

---

## 3. 强制分流规则

满足任一条件，必须不要继续堆在主线程：
- 连续 3 步以上命令
- 同时看 status / doctor / logs / config
- 需要改配置并验证
- 长日志超过用户真正需要的摘要
- 需要读多个代码文件才能判断
- 预计会来回试错

优先分流到：
- diagnostics 文件
- 独立会话 / 子会话
- runbook / memory

---

## 4. 配置操作防冲突规则

### 每次配置改动前
1. 先 `config.get`
2. 基于最新快照生成 patch
3. 一轮目标尽量合并为一次 patch
4. 改完立即验证，不要边验证边继续改

### 禁止习惯
- 不要连续碎片化 patch
- 不要多个线程同时 patch
- 不要在长排障线程里顺手穿插多个 config 写入

### 如果看到这类报错
- `config changed since last load; re-run config.get and retry`

统一理解为：
- 配置快照过期
- 先重读再重试
- 不是 Gateway 宕机

---

## 5. Gateway / Node / Session 三层排查优先级

### 第 1 层：先看存活
```bash
openclaw status
openclaw doctor --non-interactive
```

如果：
- Gateway running
- reachable
- channel OK
- session lock stale=no

则优先判断：
- 不是服务真挂
- 更像配置冲突或主 session 过重

### 第 2 层：再看是否是假故障
重点查：
- `config changed since last load`
- `re-run config.get and retry`

如果命中，先按配置冲突处理。

### 第 3 层：最后才看真服务故障
只有 status/logs 明确显示：
- Gateway unreachable
- service failed
- 启动失败 / 端口占用 / 进程退出

才按 Gateway / Node 真故障处理。

---

## 6. 自动修复策略（推荐）

### 允许自动做的
- 轻量健康检查：`openclaw status` / `doctor`
- 判断 stale lock 是否真实 stale
- 识别 config hash conflict 并改成正确结论
- 建议用户开新线程 / 分流长任务
- 将排障结果沉淀到 runbook / diagnostics

### 谨慎自动做的
- 热重启 Gateway
- 清理 lock
- 配置 patch

前提：
- 已确认根因足够明确
- 改动足够小
- 不会把问题扩大

### 不应默认自动做的
- 在根因不明时反复 restart
- 多轮自动 patch 配置
- 在 heartbeat 里做修复闭环

---

## 7. 对“卡死”的处理动作模板

### 用户说：OpenClaw 卡住了
按这个顺序：

1. `openclaw status`
2. `openclaw doctor --non-interactive`
3. 判断是不是 config conflict
4. 判断是不是主 session 膨胀
5. 只有明确服务异常时才进入 restart / deeper repair

### 如果是主 session 过重
执行：
- 结论收口
- 长输出落文件
- 新线程继续
- 若用户或同事还要继续长任务，明确提醒：建议先收口，再用 `/new` 开新线程

### 如果是 config conflict
执行：
- 重新 `config.get`
- 基于最新快照重试一次
- 不把它解释成 Gateway 挂掉

---

## 8. 给未来操作的硬约束

### 8.1 heartbeat 约束
- heartbeat 只做 check / route / notify
- 不做 3 步以上排障
- 不做连续配置修改

### 8.2 主会话约束
- 主会话只保留：结论、判断、下一步
- 长过程写文件
- 排障、实验、比对一律尽快分流
- 当明显进入长线程时，默认提醒一次：建议先收口，再用 `/new` 开新线程

### 8.3 修复约束
- 先最小动作，再验证
- 一次只改一类问题
- 修改后立刻 `status + doctor`

---

## 9. 未来默认执行策略

### 当用户说“不希望再次卡死”
默认策略：
- 稳定性优先
- 能分流就分流
- 能少写配置就少写
- 能先判断是假故障就不走重启
- 真故障才动 Gateway / Node 层

### 当用户说“卡了你自动修”
默认理解为：
- 先自动做健康检查和分类
- 先自动做最小、低风险修复
- 遇到配置写入、重启、可能扩大影响的动作时，再明确说明

---

## 10. 本轮承诺

后续遇到卡顿 / 假掉线 / session 压力时，优先按本 runbook 执行：
- 先分类
- 再最小修复
- 再收口
- 不把主线程拖成故障现场
