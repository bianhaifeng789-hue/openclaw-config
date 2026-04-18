#!/usr/bin/env python3
"""第五轮清理：优化剩余 1h 和 30m 任务"""
from pathlib import Path

p = Path('/Users/mar2game/.openclaw/workspace/HEARTBEAT.md')
t = p.read_text()

# 第五轮优化
replacements = [
    # 降频 time-based-mc: 1h -> 2h (TimeBasedMC 不需要每小时)
    ('  - name: time-based-mc\n    interval: 1h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js run glm-5 --level=0`',
     '  - name: time-based-mc\n    interval: 2h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js run glm-5 --level=0`'),
    
    # 降频 away-summary: 30m -> 2h (离线检测不需要太频繁)
    ('  - name: away-summary\n    interval: 30m\n    priority: high\n    prompt: "Record user activity',
     '  - name: away-summary\n    interval: 2h\n    priority: medium\n    prompt: "Record user activity'),
    
    # 降频 context-pressure-check: 30m -> 1h (上下文压力检查)
    ('  - name: context-pressure-check\n    interval: 30m\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js auto glm-5`',
     '  - name: context-pressure-check\n    interval: 1h\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js auto glm-5`'),
    
    # 降频 task-visualizer: 30m -> 1h (任务可视化)
    ('  - name: task-visualizer\n    interval: 30m\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js tasks`',
     '  - name: task-visualizer\n    interval: 1h\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js tasks`'),
    
    # 降频 idle-session-compact: 30m -> 1h (空闲会话压缩)
    ('  - name: idle-session-compact\n    interval: 30m\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/idle-session-compact.js check`',
     '  - name: idle-session-compact\n    interval: 1h\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/idle-session-compact.js check`'),
    
    # 降频 heartbeat-check: 30m -> 1h (心跳检查)
    ('  - name: heartbeat-check\n    interval: 30m\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js check`',
     '  - name: heartbeat-check\n    interval: 1h\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js check`'),
    
    # 降频 mcp-oauth-refresh: 30m -> 2h (OAuth 刷新)
    ('  - name: mcp-oauth-refresh\n    interval: 30m\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/mcp-oauth-refresh.js scan`',
     '  - name: mcp-oauth-refresh\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/mcp-oauth-refresh.js scan`'),
    
    # 降频 error-handler-check: 1h -> 6h (错误处理检查)
    ('  - name: error-handler-check\n    interval: 1h\n    priority: high\n    prompt: "Check state/error-handler-state.json',
     '  - name: error-handler-check\n    interval: 6h\n    priority: medium\n    prompt: "Check state/error-handler-state.json'),
]

for old, new in replacements:
    if old in t:
        t = t.replace(old, new)
        print(f'✓ Replaced: {old[:60]}...')
    else:
        print(f'✗ Not found: {old[:60]}...')

p.write_text(t)
print('\nDone. Run git diff to verify.')
