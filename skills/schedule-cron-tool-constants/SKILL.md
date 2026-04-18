---
name: schedule-cron-tool-constants
description: "| Use when [schedule cron tool constants] is needed."
  Schedule cron tool constants.
  
  Constants:
  - DEFAULT_CRON_JITTER_CONFIG
  - DEFAULT_MAX_AGE_DAYS
  - KAIROS_CRON_REFRESH_MS: 5*60*1000
  
  Functions:
  - isKairosCronEnabled()
  - isDurableCronKillSwitchEnabled()
  
  Keywords:
  - Constants reference - schedule cron
metadata:
  openclaw:
    emoji: "⏰"
    source: claude-code-tools
    triggers: [schedule-cron-tool-constants]
    priority: P2
---

# Schedule Cron Tool Constants

Schedule cron工具常量。

---

来源: Claude Code tools/ScheduleCronTool/prompt.ts