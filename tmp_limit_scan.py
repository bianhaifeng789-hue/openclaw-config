import os, re

roots = [
    '/Users/mar2game/.openclaw/workspace',
    '/opt/homebrew/lib/node_modules/openclaw',
]
patterns = [
    re.compile(r'bootstrapMaxChars'),
    re.compile(r'bootstrapTotalMaxChars'),
    re.compile(r'reserveTokens'),
    re.compile(r'keepRecentTokens'),
    re.compile(r'maxHistoryShare'),
    re.compile(r'health-monitor'),
    re.compile(r'Heartbeat'),
    re.compile(r'heartbeat'),
    re.compile(r'compaction'),
    re.compile(r'compact'),
    re.compile(r'reload'),
    re.compile(r'restart'),
    re.compile(r'stuck'),
]
exts = {'.js', '.ts', '.json', '.md', '.mjs', '.cjs', '.yaml', '.yml'}
skip_dirs = {'.git', '.next', 'coverage'}

for root in roots:
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in skip_dirs]
        for fn in fns:
            if os.path.splitext(fn)[1].lower() not in exts:
                continue
            path = os.path.join(dp, fn)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    for i, line in enumerate(f, 1):
                        if any(p.search(line) for p in patterns):
                            print(f'{path}:{i}:{line.rstrip()}')
            except Exception:
                pass
