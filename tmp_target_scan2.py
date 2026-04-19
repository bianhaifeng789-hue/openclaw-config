import os

roots = [
    '/Users/mar2game/.openclaw/workspace',
    '/opt/homebrew/lib/node_modules/openclaw/docs',
    '/opt/homebrew/lib/node_modules/openclaw/dist',
]
needles = [
    'bootstrapMaxChars',
    'bootstrapTotalMaxChars',
    'reserveTokens',
    'keepRecentTokens',
    'maxHistoryShare',
    'health-monitor',
    'heartbeat',
    'reload',
    'restart',
    'stuck',
]
exts = {'.js', '.ts', '.json', '.md', '.mjs', '.cjs', '.yaml', '.yml'}
skip_dirs = {'.git', '.next', 'coverage', 'node_modules'}

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
                        if any(n in line for n in needles):
                            print(f'{path}:{i}:{line.rstrip()}')
            except Exception:
                pass
