#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import sys

SESSIONS_PATH = Path.home() / '.openclaw/agents/main/sessions/sessions.json'
DEFAULT_SESSION_KEY = 'agent:main:main'
DEFAULT_BYTES_WARN = 600_000
DEFAULT_BYTES_DANGER = 1_500_000
DEFAULT_LINES_WARN = 120
DEFAULT_LINES_DANGER = 260
DEFAULT_COMPACTION_WARN = 3
DEFAULT_COMPACTION_DANGER = 8


def load_sessions(path: Path):
    return json.loads(path.read_text())


def analyze(session_key: str):
    data = load_sessions(SESSIONS_PATH)
    item = data.get(session_key)
    if not item:
        raise KeyError(f'session not found: {session_key}')
    session_file = Path(item['sessionFile']).expanduser()
    text = session_file.read_text(errors='ignore') if session_file.exists() else ''
    lines = text.splitlines()
    size_bytes = session_file.stat().st_size if session_file.exists() else 0
    compaction = int(item.get('compactionCount') or 0)

    score = 0
    reasons = []
    if size_bytes >= DEFAULT_BYTES_DANGER:
        score += 2
        reasons.append(f'session file is very large ({size_bytes} bytes)')
    elif size_bytes >= DEFAULT_BYTES_WARN:
        score += 1
        reasons.append(f'session file is getting large ({size_bytes} bytes)')

    if len(lines) >= DEFAULT_LINES_DANGER:
        score += 2
        reasons.append(f'session line count is very high ({len(lines)} lines)')
    elif len(lines) >= DEFAULT_LINES_WARN:
        score += 1
        reasons.append(f'session line count is elevated ({len(lines)} lines)')

    if compaction >= DEFAULT_COMPACTION_DANGER:
        score += 2
        reasons.append(f'compaction count is very high ({compaction})')
    elif compaction >= DEFAULT_COMPACTION_WARN:
        score += 1
        reasons.append(f'compaction count is elevated ({compaction})')

    if score >= 4:
        level = 'danger'
        recommendation = 'Do not continue heavy diagnostics in main session. Use diag capture or an isolated session.'
    elif score >= 2:
        level = 'warn'
        recommendation = 'Avoid large exec/read outputs in main session. Prefer file capture and concise summaries.'
    else:
        level = 'ok'
        recommendation = 'Session pressure looks acceptable for normal use.'

    return {
        'sessionKey': session_key,
        'sessionId': item.get('sessionId'),
        'sessionFile': str(session_file),
        'exists': session_file.exists(),
        'sizeBytes': size_bytes,
        'lineCount': len(lines),
        'compactionCount': compaction,
        'level': level,
        'reasons': reasons,
        'recommendation': recommendation,
    }


def main():
    parser = argparse.ArgumentParser(description='Lightweight session pressure guard for OpenClaw main session.')
    parser.add_argument('--session-key', default=DEFAULT_SESSION_KEY)
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()

    try:
        result = analyze(args.session_key)
    except Exception as e:
        print(str(e), file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"session: {result['sessionKey']}")
        print(f"sessionId: {result['sessionId']}")
        print(f"file: {result['sessionFile']}")
        print(f"sizeBytes: {result['sizeBytes']}")
        print(f"lineCount: {result['lineCount']}")
        print(f"compactionCount: {result['compactionCount']}")
        print(f"level: {result['level']}")
        if result['reasons']:
            print('reasons:')
            for r in result['reasons']:
                print(f"- {r}")
        print(f"recommendation: {result['recommendation']}")

    return 0 if result['level'] == 'ok' else 1


if __name__ == '__main__':
    raise SystemExit(main())
