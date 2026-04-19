#!/usr/bin/env python3
"""
Validate and optionally normalize heartbeat-state.json to the current minimal schema.

Allowed top-level keys:
- lastChecks
- lastNotices
- notes

Usage:
  python3 scripts/heartbeat-state-guard.py [--apply]

Default is dry-run.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict

STATE_PATH = Path('/Users/mac/.openclaw/workspace/memory/heartbeat-state.json')

DEFAULT_STATE = {
    'lastChecks': {
        'heartbeat': None,
        'tasks': None,
        'contextPressure': None,
        'doctor': None,
        'memoryReview': None,
    },
    'lastNotices': {
        'heartbeat': None,
        'tasks': None,
        'contextPressure': None,
        'doctor': None,
        'memoryReview': None,
    },
    'notes': {
        'comment': 'Minimal heartbeat state schema. Keep small and stable.',
    },
}

ALLOWED_TOP = {'lastChecks', 'lastNotices', 'notes'}
ALLOWED_LAST = {'heartbeat', 'tasks', 'contextPressure', 'doctor', 'memoryReview'}


def load_state() -> Dict[str, Any]:
    if not STATE_PATH.exists():
        return json.loads(json.dumps(DEFAULT_STATE))
    try:
        return json.loads(STATE_PATH.read_text())
    except Exception:
        return json.loads(json.dumps(DEFAULT_STATE))


def normalize(state: Dict[str, Any]) -> Dict[str, Any]:
    out = json.loads(json.dumps(DEFAULT_STATE))

    last_checks = state.get('lastChecks', {}) if isinstance(state.get('lastChecks'), dict) else {}
    for k, v in last_checks.items():
        if k in ALLOWED_LAST:
            out['lastChecks'][k] = v

    last_notices = state.get('lastNotices', {}) if isinstance(state.get('lastNotices'), dict) else {}
    for k, v in last_notices.items():
        if k in ALLOWED_LAST:
            out['lastNotices'][k] = v

    notes = state.get('notes', {}) if isinstance(state.get('notes'), dict) else {}
    out['notes'].update(notes)
    return out


def main() -> int:
    apply = '--apply' in sys.argv[1:]
    state = load_state()
    normalized = normalize(state)

    top_keys = set(state.keys()) if isinstance(state, dict) else set()
    unexpected_top = sorted(top_keys - ALLOWED_TOP)

    last_checks = state.get('lastChecks', {}) if isinstance(state, dict) and isinstance(state.get('lastChecks'), dict) else {}
    unexpected_last_checks = sorted(set(last_checks.keys()) - ALLOWED_LAST)

    last_notices = state.get('lastNotices', {}) if isinstance(state, dict) and isinstance(state.get('lastNotices'), dict) else {}
    unexpected_last_notices = sorted(set(last_notices.keys()) - ALLOWED_LAST)

    report = {
        'mode': 'apply' if apply else 'dry-run',
        'path': str(STATE_PATH),
        'unexpectedTopLevelKeys': unexpected_top,
        'unexpectedLastChecksKeys': unexpected_last_checks,
        'unexpectedLastNoticesKeys': unexpected_last_notices,
        'wouldChange': state != normalized,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))

    if apply and state != normalized:
        STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
        STATE_PATH.write_text(json.dumps(normalized, ensure_ascii=False, indent=2))
        print(json.dumps({'normalized': True}, ensure_ascii=False, indent=2))

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
