# 问题记录：plugins.allow 已生效，但 doctor 误报 empty

日期：2026-04-21

现象：
- `~/.openclaw/openclaw.json` 中 `plugins.allow` 已明确设置为 `["feishu", "mnemon"]`
- `openclaw help` 会因为 "help" 不在 allowlist 中而被拦截，证明 allowlist 实际生效
- 但 `openclaw doctor --non-interactive` 仍然输出 `plugins.allow is empty`

判断：
- 实际运行时 allowlist 已生效
- doctor 对 `plugins.allow` 的诊断结果不可信，属于诊断层 bug

验证方式：
- 配置文件内容检查
- CLI 命令行为检查（如 `openclaw help`）
- 不再依赖 doctor 这条特定提示判断 allowlist 是否生效

后续：
- 建议向 OpenClaw 官方反馈 doctor 对 `plugins.allow` 的判断逻辑
- 暂时不作为配置问题继续处理，而是作为已知诊断异常记在这里