---
name: kairos-cron-enabled-service
description: "| Use when [kairos cron enabled service] is needed."
  Kairos cron enabled service.
  
  Features:
  - feature('AGENT_TRIGGERS'): Build-time flag
  - 'tengu_kairos_cron': GrowthBook gate
  - KAIROS_CRON_REFRESH_MS: 5 minutes
  - DEFAULT_MAX_AGE_DAYS: Recurring max age
  
  Env:
  - CLAUDE_CODE_DISABLE_CRON: Local override
  - DISABLE_TELEMETRY: Disables GB
  
  Default: true (/loop is GA)
  GB serves as fleet-wide kill switch
  
  Keywords:
  - Service reference - Kairos cron enabled
metadata:
  openclaw:
    emoji: "⏰"
    source: claude-code-tools
    triggers: [kairos-cron-enabled-service]
    priority: P1
---

# Kairos Cron Enabled Service

Kairos cron enabled服务。

---

来源: Claude Code tools/ScheduleCronTool/prompt.ts