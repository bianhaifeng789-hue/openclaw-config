#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import sys

DEFAULT_OPENCLAW_ROOT = Path.home() / '.npm-global/lib/node_modules/openclaw'


def iter_targets(root: Path, patterns: list[str]):
    seen = set()
    for pattern in patterns:
        for path in root.glob(pattern):
            if path.is_file() and path not in seen:
                seen.add(path)
                yield path


def load_spec(spec_path: Path):
    return json.loads(spec_path.read_text())


def apply_spec(root: Path, spec_path: Path, dry_run: bool = False):
    spec = load_spec(spec_path)
    matched = []
    changed = []
    already = []
    failed = []
    for path in iter_targets(root, spec['targetFileGlobs']):
        text = path.read_text(errors='ignore')
        must = spec['match'].get('mustInclude', [])
        if not all(s in text for s in must):
            continue
        matched.append(path)
        already_markers = spec['match'].get('alreadyPatched', [])
        if all(s in text for s in already_markers):
            already.append(path)
            continue
        old = spec['replace']['oldText']
        new = spec['replace']['newText']
        if old not in text:
            failed.append((path, 'expected oldText not found in matched file'))
            continue
        updated = text.replace(old, new, 1)
        if updated == text:
            failed.append((path, 'replacement made no changes'))
            continue
        if not dry_run:
            path.write_text(updated)
        changed.append(path)
    return {
        'specId': spec['id'],
        'root': str(root),
        'matched': [str(p) for p in matched],
        'changed': [str(p) for p in changed],
        'alreadyPatched': [str(p) for p in already],
        'failed': [{'path': str(p), 'reason': reason} for p, reason in failed],
        'ok': bool(changed or already) and not failed
    }


def main():
    parser = argparse.ArgumentParser(description='Apply durable local patches to installed OpenClaw dist files.')
    parser.add_argument('--root', default=str(DEFAULT_OPENCLAW_ROOT), help='Installed openclaw package root')
    parser.add_argument('--spec', action='append', dest='specs', help='Patch spec JSON path (repeatable)')
    parser.add_argument('--all', action='store_true', help='Apply all specs under scripts/openclaw-patches')
    parser.add_argument('--dry-run', action='store_true', help='Do not modify files')
    parser.add_argument('--json', action='store_true', help='Emit JSON summary')
    args = parser.parse_args()

    root = Path(args.root).expanduser()
    if not root.exists():
        print(f'openclaw root not found: {root}', file=sys.stderr)
        return 2

    base_dir = Path(__file__).resolve().parent / 'openclaw-patches'
    spec_paths = []
    if args.all:
        spec_paths.extend(sorted(base_dir.glob('*.patchspec.json')))
    if args.specs:
        spec_paths.extend(Path(s).expanduser().resolve() for s in args.specs)
    if not spec_paths:
        parser.error('provide --all or at least one --spec')

    results = [apply_spec(root, spec_path, dry_run=args.dry_run) for spec_path in spec_paths]
    ok = all(r['ok'] for r in results)

    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        for r in results:
            print(f"[{r['specId']}] matched={len(r['matched'])} changed={len(r['changed'])} already={len(r['alreadyPatched'])} failed={len(r['failed'])}")
            for path in r['changed']:
                print(f'  changed: {path}')
            for path in r['alreadyPatched']:
                print(f'  already: {path}')
            for item in r['failed']:
                print(f"  failed: {item['path']} ({item['reason']})", file=sys.stderr)

    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
