#!/usr/bin/env python3
"""第九轮清理：最终优化 1h 和 30m 任务"""
from pathlib import Path

p = Path('/Users/mar2game/.openclaw/workspace/HEARTBEAT.md')
t = p.read_text()

# 第九轮：最终微调
replacements = [
    # idle-session-compact: 1h -> 2h (压缩任务不需要每小时)
    ('  - name: idle-session-compact\n    interval: 1h\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/idle-session-compact.js check`',
     '  - name: idle-session-compact\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/idle-session-compact.js check`'),
    
    # memory-maintenance: 2h -> 6h (内存维护)
    ('  - name: memory-maintenance\n    interval: 2h\n    priority: medium\n    prompt: "Check memory/heartbeat-state.json lastMemoryReview',
     '  - name: memory-maintenance\n    interval: 6h\n    priority: low\n    prompt: "Check memory/heartbeat-state.json lastMemoryReview'),
    
    # extract-memories: 2h -> 6h (记忆提取)
    ('  - name: extract-memories\n    interval: 2h\n    priority: medium\n    prompt: "Extract memories from recent sessions',
     '  - name: extract-memories\n    interval: 6h\n    priority: low\n    prompt: "Extract memories from recent sessions'),
    
    # context-pressure-check: 2h -> 6h (上下文压力)
    ('  - name: context-pressure-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js auto glm-5`',
     '  - name: context-pressure-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js auto glm-5`'),
    
    # heartbeat-check: 2h -> 6h (心跳检查)
    ('  - name: heartbeat-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js check`',
     '  - name: heartbeat-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js check`'),
]

for old, new in replacements:
    if old in t:
        t = t.replace(old, new)
        print(f'✓ Replaced: {old[:60]}...')
    else:
        print(f'✗ Not found: {old[:60]}...')

p.write_text(t)
print('\nDone.')
