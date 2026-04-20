#!/usr/bin/env python3
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path('/Users/mac/.openclaw/workspace')
GUARD = ROOT / 'scripts/session-pressure-guard.py'
DIAG = ROOT / 'scripts/openclaw-diag-capture.sh'


def run_json(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode not in (0, 1):
        sys.stderr.write(p.stderr)
        raise SystemExit(p.returncode)
    return json.loads(p.stdout)


def run_diag():
    p = subprocess.run([str(DIAG)], capture_output=True, text=True)
    if p.returncode != 0:
        sys.stderr.write(p.stderr or p.stdout)
        raise SystemExit(p.returncode)
    return p.stdout.strip()


def main():
    guard = run_json([sys.executable, str(GUARD), '--json'])
    level = guard['level']
    print(f"session guard level: {level}")
    if guard['reasons']:
        for r in guard['reasons']:
            print(f"- {r}")
    print(f"recommendation: {guard['recommendation']}")
    print()

    if level in ('warn', 'danger'):
        print('Guard is elevated, switching to file-backed diagnostic capture...')
        print(run_diag())
    else:
        print('Guard is ok, no automatic diagnostic capture triggered.')
        print('Use npm run diag:openclaw when you explicitly need a diagnostic snapshot.')


if __name__ == '__main__':
    main()
