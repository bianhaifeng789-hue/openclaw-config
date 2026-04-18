# HEARTBEAT.md - 心跳任务清单

每隔一段时间（约 30 分钟）**自动**检查以下任务，智能执行。

**自动化机制**: 
- OpenClaw 配置 `agents.defaults.heartbeat.enabled: true`
- 每 30 分钟自动触发轮询
- SmartHeartbeatScheduler 自动选择执行
- 无需手动触发

**手动调试**: 
```bash
node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js [status|check|run|tasks]
```

---

## tasks:

  - name: idle-session-compact
    interval: 1h
    priority: high
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/idle-session-compact.js check` to check idle sessions. If idleSessionCount > 0, run idle-session-compact.js run to execute graded compression (Level 0-3). Update heartbeat-state.json idleSessionCount. Send Feishu card with compression stats."

  - name: heartbeat-check
    interval: 2h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js check` first. If services not enabled, run `node /Users/mar2game/.openclaw/workspace/impl/bin/auto-trigger-cli.js init` to enable all services (Notifier, Bridge, Analytics). Then run heartbeat-cli.js run for tasks. Send Feishu card for any completed tasks."

  - name: task-visualizer
    interval: 2h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js tasks` to get active tasks. If has running tasks, send Feishu card via message tool with task summary. If tasks completed recently (< 5min), send completion card."

  - name: memory-compact
    interval: 24h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js memory` to check if MEMORY.md needs compaction. If needsCompact=true, run compact-cli.js auto glm-5. Send Feishu card with compression stats."

  - name: context-pressure-check
    interval: 2h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js auto glm-5` to check context pressure. If needsAction=true, execute appropriate level compact (Level 0-3). Send Feishu warning card if urgency >= 2."

  - name: time-based-mc
    interval: 2h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js run glm-5 --level=0` to execute TimeBasedMC (clear old tool results). Update heartbeat-state.json lastTimeBasedMC. Send Feishu card if tokens saved > 5000."

  - name: auto-dream
    interval: 24h
    priority: high
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js auto-dream` to check dream state. If consolidation needed AND sessionCount >= 5, spawn forked agent to review sessions, update MEMORY.md, send Feishu card notification."

  - name: memory-maintenance
    interval: 2h
    priority: medium
    prompt: "Check memory/heartbeat-state.json lastMemoryReview. If > 2h since last review, read memory/YYYY-MM-DD.md (today+yesterday), extract key info (decisions, progress, preferences), update MEMORY.md AUTO_UPDATE blocks, update heartbeat-state.json lastMemoryReview"

  - name: insights-analysis
    interval: 6h
    priority: low
    prompt: "Check memory/heartbeat-state.json lastInsightsAnalysis. If > 6h since last analysis, read last 10 daily notes and MEMORY.md, analyze user patterns/work style/preferences, generate insights report, update MEMORY.md User Profile block, update heartbeat-state.json"

  - name: magic-docs-scan
    interval: 6h
    priority: medium
    prompt: "Check memory/magic-docs-state.json lastScanAt. If > 6h since last scan, scan workspace for # MAGIC DOC: markers, update markersFound in magic-docs-state.json. If markers found, send Feishu card with updated files list"

  # NOTE: 非核心统计已停用
  # - name: phase1-8-stats-check
  #   interval: 1h
  #   priority: medium
  #   prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js status` to get module stats. If notable achievements (high hitRate, saved tokens), send Feishu card showing progress."

  # 新接入的 5 个服务
  # NOTE: 非核心功能已停用
  # - name: buddy-companion
  #   interval: 1h
  #   priority: medium
  #   prompt: "Check buddy stats and notification thresholds. If Buddy milestone or idle threshold reached, send Feishu card with Buddy status."

  - name: away-summary
    interval: 2h
    priority: medium
    prompt: "Record user activity. If user away > 30min and returns, generate 'while you were away' summary, send Feishu card."

  - name: side-query-stats
    interval: 2h
    priority: low
    prompt: "Check side query stats. Report query counts, success rates, cache performance."

  - name: argument-stats
    interval: 6h
    priority: low
    prompt: "Check argument substitution stats. Report substitution counts, binding sources."

  # NOTE: 非核心功能已停用
  # - name: mailbox-check
  #   interval: 1h
  #   priority: medium
  #   prompt: "Check teammate mailbox. If pending messages, report counts and priorities."

  # 新增服务 (2026-04-13)
  - name: diagnostic-tracking
    interval: 6h
    priority: low
    prompt: "Check diagnostic tracking stats. If new errors/warnings found, send Feishu diagnostic card."

  - name: internal-logging
    interval: 6h
    priority: low
    prompt: "Check internal logging stats. Export logs if needed, send Feishu log card."

  - name: rate-limit-check
    interval: 2h
    priority: medium
    prompt: "Check rate limit status. If approaching limits or exhausted, send Feishu warning card."

  - name: mcp-approval-poll
    interval: 6h
    priority: low
    prompt: "Check MCP server approval pending list. If pending approvals, send Feishu approval card."

  - name: extract-memories
    interval: 2h
    priority: medium
    prompt: "Extract memories from recent sessions. First run `node /Users/mar2game/.openclaw/workspace/impl/bin/memory-signals.js analyze <messages_json>` to detect correction/reinforcement signals. Update MEMORY.md with high-importance memories and signal summary. Send Feishu memory card with signals detected.

  # NOTE: 非核心统计已停用
  # - name: tool-use-summary
  #   interval: 1h
  #   priority: medium
  #   prompt: "Generate tool use summary. If notable progress, send Feishu summary card."

  # 新增服务 (2026-04-14) - 健康监控（渐进式频率）
  - name: health-monitor
    interval: 5m
    priority: critical
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/health-monitor.js check` to check Gateway/Node health. If issues detected, auto-recover and send Feishu card. If ongoing issues, increase check frequency to 1m for 5 minutes."

  # 新增服务 (2026-04-15) - DeerFlow 功能集成
  - name: loop-detection-check
    interval: 2h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/loop-detector.js status` to check loop detection stats. If high-risk loops detected (>3 hard stops), send Feishu alert card with loop patterns."

  - name: loop-detection-enhanced-check
    interval: 2h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/loop-detector-enhanced.js status` to check enhanced loop detection stats. If loops detected (fileEdit ≥4 or commandRepeat ≥3 or errorRepeat ≥3), send Feishu warning card with loop types and suggestions."

  - name: time-budget-check
    interval: 2h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/time-budget.js status` to check time budget stats. If tasks approaching critical threshold (>85%), send Feishu warning card with budget usage and remaining time."

  - name: task-tracking-check
    interval: 6h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/task-tracking.js status` to check task tracking stats. If _todo.md missing in active workspace, suggest Agent create it. Report todoCreated and todoUpdates counts."

  - name: error-guidance-check
    interval: 6h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/error-guidance.js status` to check error guidance stats. If guidance sent > 10 in last hour, analyze top error patterns and send Feishu summary card with recommendations."

  # 新增服务 (2026-04-17) - Harness Engineering 移植
  - name: anxiety-detection-check
    interval: 2h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/anxiety-detector.js status` to check anxiety detection stats. If anxiety triggered (>2 resets in last hour), send Feishu warning card with anxiety patterns and checkpoint info."

  - name: pre-exit-gate-check
    interval: 2h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/pre-exit-gate.js status` to check gate stats. If forced starts > 5 or forced verifies > 10 in last hour, send Feishu card with gate enforcement stats."

  - name: memory-signals-check
    interval: 2h
    priority: medium
    prompt: "Check memory/heartbeat-state.json lastMemorySignalsCheck. If > 2h since last check, analyze recent user messages with `node /Users/mar2game/.openclaw/workspace/impl/bin/memory-signals.js analyze`. Update heartbeat-state.json with correction/reinforcement counts. Send Feishu card if significant signals detected (>5 corrections or >10 reinforcements)."

  # 新增服务 (2026-04-17) - Harness Engineering 移植 P3
  - name: skeleton-detection-check
    interval: 2h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/skeleton-detector.js check` to detect skeleton files. If skeletons found, send Feishu warning card with skeleton list and action required."

  - name: trace-stats-check
    interval: 6h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/trace-writer.js stats` to check trace stats. Report event counts, duration, and agent activity."

  # 新增服务 (2026-04-15) - OpenClaw Setup Wizard
  - name: setup-verification
    interval: 24h
    priority: low
    prompt: "Check if gateway-config.yaml exists. If not, suggest user run `node /Users/mar2game/.openclaw/workspace/impl/bin/setup-wizard.js run` to generate config. Send Feishu card with setup guide."

  - name: sandbox-audit-check
    interval: 6h
    priority: low
    prompt: "Check sandbox audit logs in state/sandbox-audit.jsonl. If exists, summarize high-risk operations in last 6h. Send Feishu security summary card if high-risk count > 10."

  # 新增服务 (2026-04-15) - MCP OAuth Auto-Refresh
  - name: mcp-oauth-refresh
    interval: 2h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/mcp-oauth-refresh.js scan` to check all OAuth tokens. If tokens expiring within 60s, auto-refresh. Send Feishu warning card if refresh failed or tokens expired.
    interval: 1h
    priority: high
    prompt: "Check state/error-handler-state.json. If errors.length > 5 in last hour, analyze error patterns and send Feishu alert card with top error types and recommendations."

  - name: title-generation-check
    interval: 6h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/title-generator.js status` to check title generation status. If pending titles exist, generate and send Feishu card."

  - name: subagent-limit-check
    interval: 2h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/subagent-limiter.js status` to check active subagents. If at limit (>3), send Feishu warning card with eviction recommendations."

  # 新增服务 (2026-04-15) - 任务进度反馈
  # NOTE: 5m 高频，如不需要实时进度可启用
  # - name: task-progress-report
  #   interval: 5m
  #   priority: high
  #   prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/task-progress-reporter.js check` to check if progress card needed. If shouldSend=true, send Feishu progress card and update lastProgressCard timestamp."

  # 新增服务 (2026-04-15) - 心跳保活
  # NOTE: 5m 高频，如不需要实时保活可启用
  # - name: keepalive-check
  #   interval: 5m
  #   priority: medium
  #   prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/keepalive-sender.js check` to check if keepalive needed. If shouldSend=true AND active=true, run keepalive-sender.js message to get message, send brief Feishu message (not card). If timeout=true, send warning card. This prevents user thinking agent offline."

  # 新增服务 (2026-04-15) - Memory TF-IDF + SSE Streaming
  - name: memory-facts-check
    interval: 6h
    priority: low
    prompt: "Check state/memory-facts.json. If facts.length > 10, analyze and extract high-confidence facts (>=0.8) to MEMORY.md. Send Feishu card with facts summary."

  # NOTE: SSE streaming 检查 5m 较频繁，如需可启用
  # - name: sse-stream-check
  #   interval: 5m
  #   priority: medium
  #   prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/sse-stream-bridge.js active` to check active streams. If active streams, check shouldSendUpdate for each. If shouldSend=true, generate Feishu update message."

  # 新增服务 (2026-04-15) - Guardrails + Summarization
  - name: guardrails-check
    interval: 6h
    priority: medium
    prompt: "Check state/guardrails-config.json. If blocked_patterns updated, send Feishu security alert card with blocked patterns list."

  # 新增服务 (2026-04-15) - Skills激活监测
  - name: skill-activation-monitor
    interval: 6h
    priority: low
    prompt: "Check skills activation stats in last hour. Count which Skills were triggered by user requests. If low activation (<5 skills), analyze top inactive Skills and suggest description improvements. Send Feishu card with activation stats."

  # 新增服务 (2026-04-15) - Doctor 系统诊断
  - name: doctor-check
    interval: 6h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/doctor.js check` to check system status. If errors detected, send Feishu diagnostic card with fix suggestions."

  # 新增服务 (2026-04-15) - Config Version Check
  - name: config-version-check
    interval: 24h
    priority: low
    prompt: "Check gateway-config.yaml config_version vs gateway-config.example.yaml. If outdated, suggest user run `make config-upgrade` or `scripts/config-upgrade.sh`. Send Feishu card if upgrade needed."

  # 新增服务 (2026-04-15) - Circuit Breaker Status
  - name: circuit-breaker-check
    interval: 6h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/circuit-breaker.js status` to check circuit breaker state. If OPEN, send Feishu alert card with recovery time. If HALF-OPEN, send recovery test card."

  # 新增服务 (2026-04-15) - Token Usage Monitoring
  - name: token-usage-check
    interval: 6h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/token-usage.js summary` to check token usage stats. If totalCost > budget (optional), send Feishu warning card. Report top models by usage."

  # 新增服务 (2026-04-15) - Gateway API Status
  - name: gateway-api-check
    interval: 2h
    priority: medium
    prompt: "Run `curl http://localhost:8001/api/health` to check Gateway API health. If not responding, suggest user run `node /Users/mar2game/.openclaw/workspace/impl/bin/gateway-api.js start`. Send Feishu card with API status."

  # 新增服务 (2026-04-15) - Async Task Monitor
  - name: async-task-check
    interval: 2h
    priority: medium
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/async-task.js status` to check async tasks. If running tasks exist, report progress. If failed tasks, analyze errors and send Feishu alert."

  # 新增服务 (2026-04-15) - 运营数据分析
  - name: ad-analytics-check
    interval: 2h
    priority: medium
    prompt: "Check ad-analytics stats from recent campaigns. Run roi-calculator.js metrics with latest data. If ROI > 200%, send Feishu performance card."

  - name: ltv-analysis-check
    interval: 24h
    priority: low
    prompt: "Run ltv-calculator.js decay with retention data. Update user LTV profile. Send Feishu LTV card if significant changes."

  # 新增服务 (2026-04-17) - Harness Engineering 补充移植
  - name: text-only-nudge-check
    interval: 6h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/text-only-nudge.js status` to check text-only nudge stats. If nudgesSent > 5 in last hour, analyze weak model patterns and send Feishu summary card with recommendations."

  - name: safe-split-check
    interval: 6h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js safe-split` to test safe split functionality. Report adjustment count and success rate."

  - name: role-based-compact-check
    interval: 6h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js role-config default` to check role-based compact configuration. Report retention percentages for evaluator/builder/default."

  # 新增服务 (2026-04-17) - Harness Engineering 深度对比补充
  - name: tool-auto-fix-check
    interval: 6h
    priority: low
    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/tool-auto-fix.js status` to check auto-fix stats. If blockedCount > 10 in last hour, analyze common error patterns and send Feishu summary card with recommendations."

  # 新增服务 (2026-04-17) - Harness Engineering 完整移植
  # NOTE: 以下 5 个任务引用的脚本当前不存在，已停用
  # - name: harness-planner-check
  #   interval: 1h
  #   priority: medium
  #   prompt: "Check if spec.md exists in harness-projects/. If not and new task pending, run `node /Users/mar2game/.openclaw/workspace/impl/bin/planner.js` to generate spec. Send Feishu card with spec outline."

  # - name: harness-builder-check
  #   interval: 1h
  #   priority: high
  #   prompt: "Check if source files exist in harness-projects/. If spec.md exists but no code, run `node /Users/mar2game/.openclaw/workspace/impl/bin/builder.js --round 1`. Send Feishu card with files created."

  # - name: harness-evaluator-check
  #   interval: 30m
  #   priority: high
  #   prompt: "Check if feedback.md exists in harness-projects/. If code exists but no evaluation, run `node /Users/mar2game/.openclaw/workspace/impl/bin/evaluator.js --round 1`. Send Feishu card with QA scores."

  # - name: harness-browser-test-check
  #   interval: 30m
  #   priority: high
  #   prompt: "Check if _screenshot.png exists in harness-projects/. If not, run `node /Users/mar2game/.openclaw/workspace/impl/bin/browser-test.js` for active project. Send Feishu card with test results."

  # - name: harness-score-trend-check
  #   interval: 30m
  #   priority: high
  #   prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/score-analyzer.js status` to check score history. If scores declining or PIVOT recommended, send Feishu warning card with strategy change recommendation."
---

## 执行规则

- 每次心跳只检查 1-2 个任务（避免超时）
- **必须先运行 `heartbeat-cli.js check`** 确认哪些任务需处理
- 如果有重要发现，主动通知用户
- 如果一切正常，返回 HEARTBEAT_OK
- **任务可视化优先级最高**：先检查活动任务，有任务就发送卡片