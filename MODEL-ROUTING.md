# MODEL-ROUTING.md

这台 OpenClaw main 的当前模型路由说明。

更新时间：2026-04-19

## 当前路由

### Primary
- `lucen/gpt-5.4`

### Fallbacks
1. `openai_balance/gpt-5.4`
2. `bailian/glm-5`

## 当前设计意图

- `lucen/gpt-5.4`：主用
- `openai_balance/gpt-5.4`：当主用侧不可用或余额/路由异常时的第一备援
- `bailian/glm-5`：第二备援，优先保证可用性

## 当前已知事实

- 当前 active config 中已配置上述 fallback chain
- 本轮基础设施收尾后，系统可正常运行
- 不为了测试而额外扩大 `plugins.allow`
- 不为“看起来更全”而增加无必要 provider 复杂度

## 使用原则

- 主目标是稳定可用，不是 provider 数量最多
- 新增 provider 前先确认：
  1. 是否真的需要
  2. 是否会增加 secret / 排障面 / 配置漂移风险
  3. 是否值得进入 fallback 主链

## 变更规则

当模型路由变化时，至少同步更新：
- `openclaw.json`
- `OPENCLAW-BASELINE.md`
- 本文件 `MODEL-ROUTING.md`

## 最小验证

每次改动模型路由后，至少复查：
```bash
openclaw status
openclaw doctor --non-interactive
```

如需进一步留档，可运行：
```bash
scripts/openclaw-healthcheck.sh
```
