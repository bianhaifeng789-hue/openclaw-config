#!/usr/bin/env python3
"""第八轮清理：优化剩余 2h 任务"""
from pathlib import Path

p = Path('/Users/mar2game/.openclaw/workspace/HEARTBEAT.md')
t = p.read_text()

# 第八轮：2h -> 6h 或停用
replacements = [
    # ad-analytics-check: 2h -> 6h (广告分析不需要太频繁)
    ('  - name: ad-analytics-check\n    interval: 2h\n    priority: medium\n    prompt: "Check ad-analytics stats',
     '  - name: ad-analytics-check\n    interval: 6h\n    priority: low\n    prompt: "Check ad-analytics stats'),
    
    # async-task-check: 2h -> 6h (async 任务检查)
    ('  - name: async-task-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/async-task.js status`',
     '  - name: async-task-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/async-task.js status`'),
    
    # gateway-api-check: 2h -> 6h (Gateway API 检查)
    ('  - name: gateway-api-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `curl http://localhost:8001/api/health`',
     '  - name: gateway-api-check\n    interval: 6h\n    priority: low\n    prompt: "Run `curl http://localhost:8001/api/health`'),
    
    # mcp-oauth-refresh: 2h -> 6h (OAuth 刷新)
    ('  - name: mcp-oauth-refresh\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/mcp-oauth-refresh.js scan`',
     '  - name: mcp-oauth-refresh\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/mcp-oauth-refresh.js scan`'),
    
    # rate-limit-check: 2h -> 6h (限流检查)
    ('  - name: rate-limit-check\n    interval: 2h\n    priority: medium\n    prompt: "Check rate limit status',
     '  - name: rate-limit-check\n    interval: 6h\n    priority: low\n    prompt: "Check rate limit status'),
    
    # subagent-limit-check: 2h -> 6h (子代理限制)
    ('  - name: subagent-limit-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/subagent-limiter.js status`',
     '  - name: subagent-limit-check\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/subagent-limiter.js status`'),
    
    # task-visualizer: 2h -> 6h (任务可视化)
    ('  - name: task-visualizer\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js tasks`',
     '  - name: task-visualizer\n    interval: 6h\n    priority: low\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js tasks`'),
    
    # away-summary: 2h -> 6h (离线总结)
    ('  - name: away-summary\n    interval: 2h\n    priority: medium\n    prompt: "Record user activity',
     '  - name: away-summary\n    interval: 6h\n    priority: low\n    prompt: "Record user activity'),
]

for old, new in replacements:
    if old in t:
        t = t.replace(old, new)
        print(f'✓ Replaced: {old[:60]}...')
    else:
        print(f'✗ Not found: {old[:60]}...')

p.write_text(t)
print('\nDone.')
