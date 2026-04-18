#!/usr/bin/env python3
"""第十轮清理：最终检查，优化剩余 1h 和 30m"""
from pathlib import Path

p = Path('/Users/mar2game/.openclaw/workspace/HEARTBEAT.md')
t = p.read_text()

# 第十轮：最终优化
replacements = [
    # 检查剩余的 1h 任务，将非核心的降到 6h
    # 假设还有非核心 1h 任务需要降频
    
    # 30m 任务检查 - 如有非核心可降到 1h 或 6h
    # 目前 30m 只有 3 个，都是核心，保留
    
    # 5m 任务检查 - 如有非核心可降到 30m 或 1h
    # 目前 5m 只有 4 个，都是核心监控，保留
]

# 先检查当前 1h 任务有哪些
import re
tasks_1h = re.findall(r'- name:\s*(\S+)\n\s*interval:\s*1h\n\s*priority:\s*(\S+)', t)
print('当前 1h 任务:')
for name, prio in tasks_1h:
    print(f'  - {name} ({prio})')

# 检查 30m 任务
tasks_30m = re.findall(r'- name:\s*(\S+)\n\s*interval:\s*30m\n\s*priority:\s*(\S+)', t)
print('\n当前 30m 任务:')
for name, prio in tasks_30m:
    print(f'  - {name} ({prio})')

# 检查 5m 任务
tasks_5m = re.findall(r'- name:\s*(\S+)\n\s*interval:\s*5m\n\s*priority:\s*(\S+)', t)
print('\n当前 5m 任务:')
for name, prio in tasks_5m:
    print(f'  - {name} ({prio})')

print('\n分析完成。')
