#!/usr/bin/env python3
"""第六轮清理：最终微调优化"""
from pathlib import Path

p = Path('/Users/mar2game/.openclaw/workspace/HEARTBEAT.md')
t = p.read_text()

# 第六轮微调
replacements = [
    # 合并优化：context-pressure-check 和 idle-session-compact 都是压缩相关
    # 保留 idle-session-compact 1h，context-pressure-check 降到 2h
    ('  - name: context-pressure-check\n    interval: 1h\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js auto glm-5` to check context pressure',
     '  - name: context-pressure-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/compact-cli.js auto glm-5` to check context pressure'),
    
    # 降频 task-visualizer: 1h -> 2h (任务可视化不需要每小时)
    ('  - name: task-visualizer\n    interval: 1h\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js tasks` to get active tasks',
     '  - name: task-visualizer\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js tasks` to get active tasks'),
    
    # 降频 heartbeat-check: 1h -> 2h (心跳检查)
    ('  - name: heartbeat-check\n    interval: 1h\n    priority: high\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js check` first',
     '  - name: heartbeat-check\n    interval: 2h\n    priority: medium\n    prompt: "Run `node /Users/mar2game/.openclaw/workspace/impl/bin/heartbeat-cli.js check` first'),
    
    # 给缺少 priority 的 memory-maintenance 添加 priority: medium
    ('  - name: memory-maintenance\n    interval: 2h\n    prompt: "Check memory/heartbeat-state.json lastMemoryReview',
     '  - name: memory-maintenance\n    interval: 2h\n    priority: medium\n    prompt: "Check memory/heartbeat-state.json lastMemoryReview'),
    
    # 给缺少 priority 的 insights-analysis 添加 priority: low
    ('  - name: insights-analysis\n    interval: 6h\n    prompt: "Check memory/heartbeat-state.json lastInsightsAnalysis',
     '  - name: insights-analysis\n    interval: 6h\n    priority: low\n    prompt: "Check memory/heartbeat-state.json lastInsightsAnalysis'),
]

for old, new in replacements:
    if old in t:
        t = t.replace(old, new)
        print(f'✓ Replaced: {old[:60]}...')
    else:
        print(f'✗ Not found: {old[:60]}...')

p.write_text(t)
print('\nDone. Run git diff to verify.')
