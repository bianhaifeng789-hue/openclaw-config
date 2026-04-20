#!/usr/bin/env bash
set -euo pipefail

# Conservative Mnemon + OpenClaw installer for another Mac.
# - Installs mnemon via Homebrew if missing
# - Sets up Mnemon into ~/.openclaw (global)
# - Forces conservative config: remind=true, nudge=false, compact=false
# - Restarts OpenClaw gateway

if ! command -v brew >/dev/null 2>&1; then
  echo "[ERROR] Homebrew not found. Install Homebrew first." >&2
  exit 1
fi

if ! command -v mnemon >/dev/null 2>&1; then
  echo "[INFO] Installing mnemon via Homebrew..."
  brew install mnemon-dev/tap/mnemon
else
  echo "[INFO] mnemon already installed: $(command -v mnemon)"
fi

echo "[INFO] mnemon version: $(mnemon --version)"

echo "[INFO] Setting up Mnemon into ~/.openclaw ..."
mnemon setup --target openclaw --global --yes

echo "[INFO] Applying conservative Mnemon config ..."
python3 - <<'PY'
import json, os
p=os.path.expanduser('~/.openclaw/openclaw.json')
with open(p) as f:
    data=json.load(f)
entries=data.setdefault('plugins',{}).setdefault('entries',{})
mn=entries.setdefault('mnemon',{})
mn['enabled']=True
cfg=mn.setdefault('config',{})
cfg['remind']=True
cfg['nudge']=False
cfg['compact']=False
with open(p,'w') as f:
    json.dump(data,f,ensure_ascii=False,indent=2)
    f.write('\n')
print('[INFO] Updated ~/.openclaw/openclaw.json')
PY

echo "[INFO] Restarting OpenClaw gateway ..."
openclaw gateway restart

echo "[INFO] Validation ..."
mnemon status || true
openclaw status || true

echo "[DONE] Mnemon installed in conservative mode."
