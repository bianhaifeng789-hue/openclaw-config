#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path('/Users/mac/.openclaw/workspace')
GUARD = ROOT / 'scripts/session-pressure-guard.py'
SMART_DIAG = ROOT / 'scripts/session-safe-diag-entry.py'

HEAVY_KEYWORDS = [
    '排障', '诊断', '日志', 'log', 'status', 'context overflow', 'session',
    'debug', 'trace', 'stack', 'grep', 'tail', '源码', 'read file', 'openclaw'
]


def run_json(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode not in (0, 1):
        sys.stderr.write(p.stderr)
        raise SystemExit(p.returncode)
    return json.loads(p.stdout)


def is_heavy_task(text: str) -> bool:
    t = text.lower()
    return any(k.lower() in t for k in HEAVY_KEYWORDS)


def main():
    parser = argparse.ArgumentParser(description='Recommend routing for heavy OpenClaw work before it pollutes main session.')
    parser.add_argument('task', nargs='*', help='Task description to classify')
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()

    task_text = ' '.join(args.task).strip()
    guard = run_json([sys.executable, str(GUARD), '--json'])
    heavy = is_heavy_task(task_text) if task_text else False

    action = 'stay-main'
    why = []
    if heavy:
        why.append('task looks like heavy diagnostics or code/log inspection')
    if guard['level'] in ('warn', 'danger'):
        why.append(f"session guard is {guard['level']}")

    if heavy and guard['level'] in ('warn', 'danger'):
        action = 'route-file-backed'
    elif heavy:
        action = 'consider-isolated'
    elif guard['level'] in ('warn', 'danger'):
        action = 'avoid-large-output'

    result = {
        'task': task_text,
        'taskIsHeavy': heavy,
        'guardLevel': guard['level'],
        'action': action,
        'why': why,
        'next': {
            'route-file-backed': 'Run npm run diag:smart or move work to isolated/sub-agent session.',
            'consider-isolated': 'Prefer isolated/sub-agent session for this task before it grows.',
            'avoid-large-output': 'Stay in main session only for concise summaries, not raw outputs.',
            'stay-main': 'Normal work can stay in main session.'
        }[action]
    }

    if action == 'route-file-backed':
        diag = subprocess.run([sys.executable, str(SMART_DIAG)], capture_output=True, text=True)
        if diag.returncode != 0:
            sys.stderr.write(diag.stderr or diag.stdout)
            raise SystemExit(diag.returncode)
        result['diagTriggered'] = True
        result['diagSummary'] = diag.stdout.strip()
    else:
        result['diagTriggered'] = False

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"action: {result['action']}")
        print(f"guardLevel: {result['guardLevel']}")
        print(f"taskIsHeavy: {result['taskIsHeavy']}")
        if result['why']:
            print('why:')
            for item in result['why']:
                print(f'- {item}')
        print(f"next: {result['next']}")
        if result['diagTriggered']:
            print('\nAutomatic file-backed diagnostic flow triggered:\n')
            print(result['diagSummary'])


if __name__ == '__main__':
    main()
