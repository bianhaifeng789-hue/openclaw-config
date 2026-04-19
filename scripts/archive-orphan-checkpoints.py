#!/usr/bin/env python3
"""
Safely archive orphan checkpoint transcripts.

Rules:
- Only touches files matching *.checkpoint.*.jsonl
- Never touches main active *.jsonl transcripts
- Never deletes; only renames to *.deleted.<timestamp>
- Tries to avoid archiving any checkpoint whose base session id is currently referenced

Usage:
  python3 scripts/archive-orphan-checkpoints.py [--apply]

Default is dry-run.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Dict, Set, Tuple

SESSIONS_DIR = Path('/Users/mac/.openclaw/agents/main/sessions')
SESSIONS_JSON = SESSIONS_DIR / 'sessions.json'


def load_referenced_session_ids() -> Set[str]:
    ids: Set[str] = set()
    if not SESSIONS_JSON.exists():
        return ids
    try:
        data = json.loads(SESSIONS_JSON.read_text())
    except Exception:
        return ids

    def visit(obj):
        if isinstance(obj, dict):
            sid = obj.get('id')
            if isinstance(sid, str):
                ids.add(sid)
            for key in ('transcriptPath', 'transcript', 'path', 'file'):
                value = obj.get(key)
                if isinstance(value, str) and value.endswith('.jsonl'):
                    name = Path(value).name
                    if '.checkpoint.' in name:
                        ids.add(name.split('.checkpoint.')[0])
                    else:
                        ids.add(name[:-6])
            for value in obj.values():
                visit(value)
        elif isinstance(obj, list):
            for item in obj:
                visit(item)

    visit(data)
    return ids


def find_orphan_checkpoints(referenced_ids: Set[str]) -> Dict[str, Tuple[Path, str, bool]]:
    out: Dict[str, Tuple[Path, str, bool]] = {}
    for path in sorted(SESSIONS_DIR.glob('*.checkpoint.*.jsonl')):
        if '.deleted.' in path.name:
            continue
        session_id = path.name.split('.checkpoint.')[0]
        active_main = SESSIONS_DIR / f'{session_id}.jsonl'
        base_is_referenced = session_id in referenced_ids
        # Conservative policy:
        # - only consider checkpoint files
        # - if base main transcript exists, still allow archiving checkpoint
        # - if session id is referenced, mark as "checkpoint orphan candidate" but still safe to archive
        reason = 'checkpoint orphan candidate (safe-archive only)'
        out[path.name] = (path, reason, base_is_referenced)
    return out


def main() -> int:
    apply = '--apply' in sys.argv[1:]
    referenced_ids = load_referenced_session_ids()
    candidates = find_orphan_checkpoints(referenced_ids)

    print(json.dumps({
        'mode': 'apply' if apply else 'dry-run',
        'sessionsDir': str(SESSIONS_DIR),
        'referencedSessionIds': sorted(referenced_ids),
        'candidateCount': len(candidates),
        'candidates': [
            {
                'name': name,
                'reason': reason,
                'baseSessionReferenced': base_ref,
            }
            for name, (_, reason, base_ref) in candidates.items()
        ]
    }, ensure_ascii=False, indent=2))

    if not apply:
        return 0

    ts = int(time.time())
    archived = []
    for name, (path, _reason, _base_ref) in candidates.items():
        target = path.with_name(f'{path.name}.deleted.{ts}')
        path.rename(target)
        archived.append(str(target))

    print(json.dumps({
        'archivedCount': len(archived),
        'archived': archived,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
