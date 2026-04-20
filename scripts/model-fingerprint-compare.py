import json
from pathlib import Path

for path in [
    Path('/Users/mac/.openclaw/workspace/state/model-fingerprint-gpt54.json'),
    Path('/Users/mac/.openclaw/workspace/state/model-fingerprint-glm5.json'),
]:
    if not path.exists():
        print(f'MISSING {path}')
        continue
    obj = json.loads(path.read_text())
    print(f"FILE {path.name}")
    print(f"TOTAL {obj['totalScore']} / {obj['maxScore']}")
    for r in obj['results']:
        if r.get('score', -1) < 2:
            output = r.get('output', 'ERR').replace('\n', ' | ')[:200]
            print(f"#{r['id']:02d} {r['name']} score={r['score']} output={output}")
    print()
