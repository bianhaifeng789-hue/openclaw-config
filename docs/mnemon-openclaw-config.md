# Mnemon OpenClaw Config

_Last updated: 2026-04-20_

## Current production-like trial config

Mnemon 当前在主 OpenClaw 环境中采用保守观察态配置：

```json
{
  "plugins": {
    "entries": {
      "mnemon": {
        "enabled": true,
        "config": {
          "remind": true,
          "nudge": false,
          "compact": false
        }
      }
    }
  }
}
```

## Why this config

### `remind: true`
保留 recall / remember 的轻提醒，确保 Mnemon 在每轮对话中仍然参与判断。

### `nudge: false`
关闭额外的 remember sub-agent 催促，降低 prompt 噪音和打断感。

### `compact: false`
暂不在 context compaction 前加入额外记忆提炼动作，避免与现有记忆/压缩流程叠加复杂度。

## Practical conclusion

这是一个适合首轮试装观察的低噪音配置：
- 保留核心能力提醒
- 不额外催促
- 不主动扩大行为面

## Notes

当前 Mnemon 已验证：
- global setup 生效
- remember / recall / search 主链路可用
- 存在轻微 SQLite 锁毛刺，仍需观察

相关文档：
- `docs/mnemon-openclaw-assessment.md`
- `docs/mnemon-trial-rollout-plan.md`
- `docs/mnemon-trial-result.md`
- `docs/mnemon-validation-notes.md`
