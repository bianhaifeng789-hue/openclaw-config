#!/usr/bin/env python3
"""第四轮清理：精简 1h 统计类任务"""
from pathlib import Path

p = Path('/Users/mar2game/.openclaw/workspace/HEARTBEAT.md')
t = p.read_text()

# 停用或降频非核心 1h 任务
replacements = [
    # 停用 buddy-companion (非核心社交功能)
    ('  - name: buddy-companion\n    interval: 1h\n    priority: medium\n    prompt: "Check buddy stats',
     '  # NOTE: 非核心功能已停用\n  # - name: buddy-companion\n  #   interval: 1h\n  #   priority: medium\n  #   prompt: "Check buddy stats'),
    
    # 停用 mailbox-check (如不需要团队消息)
    ('  - name: mailbox-check\n    interval: 1h\n    priority: medium\n    prompt: "Check teammate mailbox',
     '  # NOTE: 非核心功能已停用\n  # - name: mailbox-check\n  #   interval: 1h\n  #   priority: medium\n  #   prompt: "Check teammate mailbox'),
    
    # 降频 diagnostic-tracking: 1h -> 6h
    ('  - name: diagnostic-tracking\n    interval: 1h\n    priority: medium\n    prompt: "Check diagnostic tracking stats',
     '  - name: diagnostic-tracking\n    interval: 6h\n    priority: low\n    prompt: "Check diagnostic tracking stats'),
    
    # 停用 tool-use-summary (非核心统计)
    ('  - name: tool-use-summary\n    interval: 1h\n    priority: medium\n    prompt: "Generate tool use summary',
     '  # NOTE: 非核心统计已停用\n  # - name: tool-use-summary\n  #   interval: 1h\n  #   priority: medium\n  #   prompt: "Generate tool use summary'),
    
    # 停用 phase1-8-stats-check (非核心进度展示)
    ('  - name: phase1-8-stats-check\n    interval: 1h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js status` to get module stats',
     '  # NOTE: 非核心统计已停用\n  # - name: phase1-8-stats-check\n  #   interval: 1h\n  #   priority: medium\n  #   prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js status` to get module stats'),
    
    # 降频 skill-activation-monitor: 1h -> 6h
    ('  - name: skill-activation-monitor\n    interval: 1h\n    priority: medium\n    prompt: "Check skills activation stats',
     '  - name: skill-activation-monitor\n    interval: 6h\n    priority: low\n    prompt: "Check skills activation stats'),
    
    # 降频 setup-verification: 1h -> 24h (一次性配置检查)
    ('  - name: setup-verification\n    interval: 1h\n    priority: medium\n    prompt: "Check if gateway-config.yaml exists',
     '  - name: setup-verification\n    interval: 24h\n    priority: low\n    prompt: "Check if gateway-config.yaml exists'),
    
    # 降频 trace-stats-check: 1h -> 6h
    ('  - name: trace-stats-check\n    interval: 1h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/trace-writer.js stats`',
     '  - name: trace-stats-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/trace-writer.js stats`'),
    
    # 降频 task-tracking-check: 1h -> 6h
    ('  - name: task-tracking-check\n    interval: 1h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/task-tracking.js status`',
     '  - name: task-tracking-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/task-tracking.js status`'),
    
    # 降频 error-guidance-check: 1h -> 6h
    ('  - name: error-guidance-check\n    interval: 1h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/error-guidance.js status`',
     '  - name: error-guidance-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/error-guidance.js status`'),
    
    # 降频 safe-split-check: 1h -> 6h
    ('  - name: safe-split-check\n    interval: 1h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js safe-split`',
     '  - name: safe-split-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js safe-split`'),
    
    # 降频 role-based-compact-check: 1h -> 6h
    ('  - name: role-based-compact-check\n    interval: 1h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js role-config default`',
     '  - name: role-based-compact-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js role-config default`'),
    
    # 降频 tool-auto-fix-check: 1h -> 6h
    ('  - name: tool-auto-fix-check\n    interval: 1h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/tool-auto-fix.js status`',
     '  - name: tool-auto-fix-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/tool-auto-fix.js status`'),
    
    # 降频 mcp-approval-poll: 1h -> 6h (MCP 审批不频繁)
    ('  - name: mcp-approval-poll\n    interval: 1h\n    priority: medium\n    prompt: "Check MCP server approval pending list',
     '  - name: mcp-approval-poll\n    interval: 6h\n    priority: low\n    prompt: "Check MCP server approval pending list'),
    
    # 降频 circuit-breaker-check: 1h -> 6h
    ('  - name: circuit-breaker-check\n    interval: 1h\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/circuit-breaker.js status`',
     '  - name: circuit-breaker-check\n    interval: 6h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/circuit-breaker.js status`'),
    
    # 降频 guardrails-check: 1h -> 6h
    ('  - name: guardrails-check\n    interval: 1h\n    priority: high\n    prompt: "Check state/guardrails-config.json',
     '  - name: guardrails-check\n    interval: 6h\n    priority: medium\n    prompt: "Check state/guardrails-config.json'),
    
    # 降频 async-task-check: 1h -> 2h (async 任务不需要太频繁)
    ('  - name: async-task-check\n    interval: 1h\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/async-task.js status`',
     '  - name: async-task-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/async-task.js status`'),
]

for old, new in replacements:
    if old in t:
        t = t.replace(old, new)
        print(f'✓ Replaced: {old[:50]}...')
    else:
        print(f'✗ Not found: {old[:50]}...')

p.write_text(t)
print('\nDone. Run git diff to verify.')
