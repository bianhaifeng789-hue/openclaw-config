#!/usr/bin/env python3
from pathlib import Path
import re

heartbeat = Path('/Users/mar2game/.openclaw/workspace/HEARTBEAT.md').read_text()
paths = re.findall(r'`node\s+([^`]+)`', heartbeat)
seen = set()
for p in paths:
    script = p.strip().split()[0]
    if script in seen:
        continue
    seen.add(script)
    exists = Path(script).exists()
    print(f'{"OK" if exists else "MISSING"}\t{script}')
