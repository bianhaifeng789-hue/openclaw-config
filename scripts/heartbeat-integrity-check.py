#!/usr/bin/env python3
"""
Heartbeat integrity check.

Checks:
- task surface in heartbeat-cli / executor / scheduler stays on the 4 lightweight tasks
- no obvious legacy heavy task names in key heartbeat entrypoints
- heartbeat-state.json matches the minimal schema

Usage:
  python3 scripts/heartbeat-integrity-check.py
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

WORKSPACE = Path('/Users/mac/.openclaw/workspace')
STATE_PATH = WORKSPACE / 'memory' / 'heartbeat-state.json'

FILES = {
    'heartbeat_cli': {
        'path': WORKSPACE / 'impl' / 'bin' / 'heartbeat-cli.js',
        'require_expected_tasks': True,
    },
    'executor_ts': {
        'path': WORKSPACE / 'impl' / 'utils' / 'heartbeat-executor.ts',
        'require_expected_tasks': True,
    },
    'executor_js': {
        'path': WORKSPACE / 'impl' / 'dist' / 'heartbeat-executor.js',
        'require_expected_tasks': True,
    },
    'scheduler_ts': {
        'path': WORKSPACE / 'impl' / 'utils' / 'smart-heartbeat-scheduler.ts',
        'require_expected_tasks': True,
    },
    'scheduler_js': {
        'path': WORKSPACE / 'impl' / 'dist' / 'smart-heartbeat-scheduler.js',
        'require_expected_tasks': True,
    },
    'integration_ts': {
        'path': WORKSPACE / 'impl' / 'utils' / 'openclaw-integration.ts',
        'require_expected_tasks': False,
    },
    'integration_js': {
        'path': WORKSPACE / 'impl' / 'dist' / 'openclaw-integration.js',
        'require_expected_tasks': False,
    },
}

EXPECTED_TASKS = [
    'task-visualizer',
    'context-pressure-check',
    'memory-maintenance',
    'doctor-check',
]

LEGACY_PATTERNS = [
    'health-monitor',
    'extract-memories',
    'away-summary',
    'buddy-companion',
    'mailbox-check',
    'tool-use-summary',
    'servicesEnabled',
    'tasks: {}',
]

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


def load_text(path: Path) -> str:
    try:
        return path.read_text()
    except Exception:
        return ''


def check_file(path: Path, require_expected_tasks: bool) -> Dict:
    txt = load_text(path)
    present_expected = [task for task in EXPECTED_TASKS if task in txt]
    legacy_hits = [pat for pat in LEGACY_PATTERNS if pat in txt]
    missing = [t for t in EXPECTED_TASKS if t not in txt] if require_expected_tasks else []
    return {
        'path': str(path),
        'exists': path.exists(),
        'requireExpectedTasks': require_expected_tasks,
        'expectedTasksFound': present_expected,
        'missingExpectedTasks': missing,
        'legacyHits': legacy_hits,
    }


def check_state() -> Dict:
    if not STATE_PATH.exists():
        state = json.loads(json.dumps(DEFAULT_STATE))
    else:
        try:
            state = json.loads(STATE_PATH.read_text())
        except Exception:
            state = json.loads(json.dumps(DEFAULT_STATE))

    top_keys = set(state.keys()) if isinstance(state, dict) else set()
    unexpected_top = sorted(top_keys - ALLOWED_TOP)

    last_checks = state.get('lastChecks', {}) if isinstance(state, dict) and isinstance(state.get('lastChecks'), dict) else {}
    last_notices = state.get('lastNotices', {}) if isinstance(state, dict) and isinstance(state.get('lastNotices'), dict) else {}

    return {
        'path': str(STATE_PATH),
        'unexpectedTopLevelKeys': unexpected_top,
        'unexpectedLastChecksKeys': sorted(set(last_checks.keys()) - ALLOWED_LAST),
        'unexpectedLastNoticesKeys': sorted(set(last_notices.keys()) - ALLOWED_LAST),
    }


def main() -> int:
    files_report = {
        name: check_file(cfg['path'], cfg['require_expected_tasks'])
        for name, cfg in FILES.items()
    }
    state_report = check_state()

    ok = True
    for report in files_report.values():
        if report['missingExpectedTasks'] or report['legacyHits']:
            ok = False
    if state_report['unexpectedTopLevelKeys'] or state_report['unexpectedLastChecksKeys'] or state_report['unexpectedLastNoticesKeys']:
        ok = False

    print(json.dumps({
        'ok': ok,
        'expectedTasks': EXPECTED_TASKS,
        'files': files_report,
        'state': state_report,
    }, ensure_ascii=False, indent=2))
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
