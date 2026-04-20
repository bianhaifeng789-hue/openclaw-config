#!/usr/bin/env bash
set -euo pipefail

# Conservative Mnemon + OpenClaw installer for another Mac.
# - Installs mnemon via Homebrew if available, otherwise falls back to GitHub release
# - Ensures ~/.local/bin is available when using fallback install
# - Sets up Mnemon into ~/.openclaw (global)
# - Forces conservative config: remind=true, nudge=false, compact=false
# - Restarts OpenClaw gateway

install_mnemon_fallback() {
  local version arch url tmpdir shell_rc
  version="${MNEMON_VERSION:-0.1.2}"
  arch="$(uname -m)"

  case "$arch" in
    arm64|aarch64) arch="arm64" ;;
    x86_64|amd64) arch="amd64" ;;
    *)
      echo "[ERROR] Unsupported macOS architecture: $arch" >&2
      exit 1
      ;;
  esac

  url="https://github.com/mnemon-dev/mnemon/releases/download/v${version}/mnemon_${version}_darwin_${arch}.tar.gz"
  tmpdir="$(mktemp -d)"
  mkdir -p "$HOME/.local/bin"

  echo "[INFO] Homebrew not found. Falling back to GitHub release install..."
  echo "[INFO] Downloading: $url"
  curl -L "$url" -o "$tmpdir/mnemon.tar.gz"
  tar -xzf "$tmpdir/mnemon.tar.gz" -C "$tmpdir"
  install -m 755 "$tmpdir/mnemon" "$HOME/.local/bin/mnemon"
  export PATH="$HOME/.local/bin:$PATH"

  shell_rc="$HOME/.zshrc"
  if [ -n "${SHELL:-}" ] && echo "$SHELL" | grep -q 'bash'; then
    shell_rc="$HOME/.bashrc"
  fi
  if ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' "$shell_rc" 2>/dev/null; then
    printf '\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$shell_rc"
    echo "[INFO] Added ~/.local/bin to PATH in $shell_rc"
  fi

  rm -rf "$tmpdir"
}

if ! command -v mnemon >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "[INFO] Installing mnemon via Homebrew..."
    brew install mnemon-dev/tap/mnemon
  else
    install_mnemon_fallback
  fi
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
