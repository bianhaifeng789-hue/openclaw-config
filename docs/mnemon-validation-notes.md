# Mnemon Validation Notes

_Last updated: 2026-04-20_

## Validation status

Mnemon 在当前 OpenClaw 主环境中的验证结果可分成两层：

### 1. Integration layer
已确认：
- binary 正常
- global setup 正常
- prompt 注入正常
- gateway 重启后生效

### 2. Functional layer
已确认：
- `remember` 可写入
- `recall` 可召回
- `search` 可命中

其中测试写入样本：
- `f798e76c-e8ee-47a0-900a-ba91b2ba4cf2`

## Caveat

当前仍存在偶发 SQLite 锁告警，例如：
- `database is locked (261)`
- `oplog insert: database is locked (5)`
- `oplog trim: database is locked (5)`

这说明：
- 功能已经不是“不可用”
- 但工程稳定性仍需观察
- 特别是在 OpenClaw hook 并发触发场景下，可能有轻微锁竞争

## Current practical conclusion

Mnemon 当前状态可定义为：

**可用，但带轻微并发锁毛刺。**

因此当前最合理策略仍是：
- 保守启用
- 观察 1-2 天
- 不急于开启 `nudge` / `compact`
