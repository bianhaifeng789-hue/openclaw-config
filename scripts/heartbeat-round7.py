#!/usr/bin/env python3
"""第七轮清理：将 2h 非核心任务降到 6h"""
from pathlib import Path

p = Path('/Users/mar2game/.openclaw/workspace/HEARTBEAT.md')
t = p.read_text()

# 第七轮：2h -> 6h 降频
replacements = [
    # side-query-stats: 2h -> 6h (已是 low)
    ('  - name: side-query-stats\n    interval: 2h\n    priority: low\n    prompt: "Check side query stats',
     '  - name: side-query-stats\n    interval: 6h\n    priority: low\n    prompt: "Check side query stats'),
    
    # skeleton-detection-check: 2h -> 6h (已是 low)
    ('  - name: skeleton-detection-check\n    interval: 2h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/skeleton-detector.js check`',
     '  - name: skeleton-detection-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/skeleton-detector.js check`'),
    
    # time-based-mc: 2h -> 6h (已是 low)
    ('  - name: time-based-mc\n    interval: 2h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js run glm-5 --level=0`',
     '  - name: time-based-mc\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js run glm-5 --level=0`'),
    
    # anxiety-detection-check: 2h -> 6h
    ('  - name: anxiety-detection-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/anxiety-detector.js status`',
     '  - name: anxiety-detection-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/anxiety-detector.js status`'),
    
    # pre-exit-gate-check: 2h -> 6h
    ('  - name: pre-exit-gate-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/pre-exit-gate.js status`',
     '  - name: pre-exit-gate-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/pre-exit-gate.js status`'),
    
    # loop-detection-check: 2h -> 6h
    ('  - name: loop-detection-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/loop-detector.js status`',
     '  - name: loop-detection-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/loop-detector.js status`'),
    
    # loop-detection-enhanced-check: 2h -> 6h
    ('  - name: loop-detection-enhanced-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/loop-detector-enhanced.js status`',
     '  - name: loop-detection-enhanced-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/loop-detector-enhanced.js status`'),
    
    # memory-signals-check: 2h -> 6h
    ('  - name: memory-signals-check\n    interval: 2h\n    priority: medium\n    prompt: "Check memory/heartbeat-state.json lastMemorySignalsCheck',
     '  - name: memory-signals-check\n    interval: 6h\n    priority: low\n    prompt: "Check memory/heartbeat-state.json lastMemorySignalsCheck'),
    
    # time-budget-check: 2h -> 6h
    ('  - name: time-budget-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/time-budget.js status`',
     '  - name: time-budget-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/time-budget.js status`'),
]

for old, new in replacements:
    if old in t:
        t = t.replace(old, new)
        print(f'✓ Replaced: {old[:60]}...')
    else:
        print(f'✗ Not found: {old[:60]}...')

p.write_text(t)
print('\nDone.')
