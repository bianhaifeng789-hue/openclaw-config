#!/usr/bin/env python3
"""第三轮清理：停用高频非核心任务，降频 1h 统计类任务"""
from pathlib import Path

p = Path('/Users/mar2game/.openclaw/workspace/HEARTBEAT.md')
t = p.read_text()

# 1. 停用 5m 超高频任务（注释掉）
replacements = [
    # 停用 task-progress-report
    ('  - name: task-progress-report\n    interval: 5m\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/task-progress-reporter.js check`',
     '  # NOTE: 5m 高频任务已停用，如需实时进度可启用\n  # - name: task-progress-report\n  #   interval: 5m\n  #   priority: high\n  #   prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/task-progress-reporter.js check`'),
    
    # 停用 keepalive-check  
    ('  - name: keepalive-check\n    interval: 5m\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/keepalive-sender.js check`',
     '  # NOTE: 5m 高频任务已停用，如需保活可启用\n  # - name: keepalive-check\n  #   interval: 5m\n  #   priority: medium\n  #   prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/keepalive-sender.js check`'),
    
    # 停用 sse-stream-check
    ('  - name: sse-stream-check\n    interval: 5m\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/sse-stream-bridge.js active`',
     '  # NOTE: 5m 高频任务已停用，如需 SSE 可启用\n  # - name: sse-stream-check\n  #   interval: 5m\n  #   priority: medium\n  #   prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/sse-stream-bridge.js active`'),
    
    # 降频 memory-facts-check: 2h -> 6h, medium -> low
    ('  - name: memory-facts-check\n    interval: 2h\n    priority: medium\n    prompt: "Check state/memory-facts.json',
     '  - name: memory-facts-check\n    interval: 6h\n    priority: low\n    prompt: "Check state/memory-facts.json'),
    
    # 降频 rate-limit-check: 30m -> 2h
    ('  - name: rate-limit-check\n    interval: 30m\n    priority: high\n    prompt: "Check rate limit status',
     '  - name: rate-limit-check\n    interval: 2h\n    priority: medium\n    prompt: "Check rate limit status'),
    
    # 降频 title-generation-check: 30m -> 6h
    ('  - name: title-generation-check\n    interval: 30m\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/title-generator.js status`',
     '  - name: title-generation-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/title-generator.js status`'),
    
    # 降频 subagent-limit-check: 30m -> 2h
    ('  - name: subagent-limit-check\n    interval: 30m\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/subagent-limiter.js status`',
     '  - name: subagent-limit-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/subagent-limiter.js status`'),
    
    # 降频 text-only-nudge-check: 30m -> 6h
    ('  - name: text-only-nudge-check\n    interval: 30m\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/text-only-nudge.js status`',
     '  - name: text-only-nudge-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/text-only-nudge.js status`'),
    
    # 降频 gateway-api-check: 30m -> 2h
    ('  - name: gateway-api-check\n    interval: 30m\n    priority: high\n    prompt: "Run `curl http://localhost:8001/api/health`',
     '  - name: gateway-api-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `curl http://localhost:8001/api/health`'),
]

for old, new in replacements:
    if old in t:
        t = t.replace(old, new)
        print(f'Replaced: {old[:50]}...')
    else:
        print(f'Not found: {old[:50]}...')

p.write_text(t)
print('\nDone. Run git diff to verify.')
