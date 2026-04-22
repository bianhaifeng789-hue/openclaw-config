#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ok() { printf "${GREEN}OK${NC}  %s\n" "$1"; }
warn() { printf "${YELLOW}WARN${NC} %s\n" "$1"; }
fail() { printf "${RED}FAIL${NC} %s\n" "$1"; }
info() { printf "${BLUE}--${NC}  %s\n" "$1"; }

EXPECTED_VERSION="2026.4.21"
CONFIG_PATH="$HOME/.openclaw/openclaw.json"
MNEMON_DB="$HOME/.mnemon/data/default/mnemon.db"

info "OpenClaw baseline health check"

if command -v openclaw >/dev/null 2>&1; then
  version_raw="$(openclaw --version 2>/dev/null || true)"
  if printf '%s' "$version_raw" | grep -q "$EXPECTED_VERSION"; then
    ok "OpenClaw version is $EXPECTED_VERSION"
  else
    warn "OpenClaw version differs from expected baseline: ${version_raw:-unknown}"
  fi
else
  fail "openclaw command not found"
fi

if [ -f "$CONFIG_PATH" ]; then
  ok "Config file present: $CONFIG_PATH"
else
  fail "Missing config file: $CONFIG_PATH"
fi

if openclaw status >/tmp/openclaw-status.$$ 2>/tmp/openclaw-status.err.$$; then
  if grep -q 'Gateway[[:space:]].*reachable' /tmp/openclaw-status.$$; then
    ok "Gateway reachable"
  else
    warn "Gateway status output did not clearly report reachable"
  fi

  if grep -q 'Feishu[[:space:]].*OK' /tmp/openclaw-status.$$; then
    ok "Feishu channel OK"
  else
    warn "Feishu channel not clearly OK in status output"
  fi

  if grep -q 'Heartbeat[[:space:]].*30m' /tmp/openclaw-status.$$; then
    ok "Heartbeat interval is 30m"
  else
    warn "Heartbeat interval differs from expected baseline"
  fi
else
  fail "openclaw status failed"
  cat /tmp/openclaw-status.err.$$ || true
fi
rm -f /tmp/openclaw-status.$$ /tmp/openclaw-status.err.$$ || true

if openclaw doctor --non-interactive >/tmp/openclaw-doctor.$$ 2>/tmp/openclaw-doctor.err.$$; then
  ok "Doctor completed"
  if grep -q 'No channel security warnings detected' /tmp/openclaw-doctor.$$; then
    ok "No channel security warnings detected"
  else
    warn "Doctor output contains non-baseline warnings worth reviewing"
  fi
else
  fail "Doctor failed"
  cat /tmp/openclaw-doctor.err.$$ || true
fi
rm -f /tmp/openclaw-doctor.$$ /tmp/openclaw-doctor.err.$$ || true

if command -v mnemon >/dev/null 2>&1; then
  if mnemon status >/tmp/mnemon-status.$$ 2>/tmp/mnemon-status.err.$$; then
    ok "mnemon command works"
    if [ -f "$MNEMON_DB" ]; then
      ok "mnemon DB present: $MNEMON_DB"
    else
      warn "mnemon command works but DB file missing at expected path"
    fi
  else
    fail "mnemon status failed"
    cat /tmp/mnemon-status.err.$$ || true
  fi
  rm -f /tmp/mnemon-status.$$ /tmp/mnemon-status.err.$$ || true
else
  warn "mnemon command not found"
fi

python3 - <<'PY'
import json, os, sys
p = os.path.expanduser('~/.openclaw/openclaw.json')
try:
    with open(p, 'r', encoding='utf-8') as f:
        j = json.load(f)
except Exception as e:
    print(f'FAIL config parse: {e}')
    sys.exit(0)

gateway_mode = (((j.get('gateway') or {}).get('mode')) or '')
plugins = j.get('plugins') or {}
entries = plugins.get('entries') or {}
heartbeat = (((j.get('agents') or {}).get('defaults') or {}).get('heartbeat') or {})
memory_search = (((j.get('agents') or {}).get('defaults') or {}).get('memorySearch') or {})
slots = plugins.get('slots') or {}

print('CONFIG gateway.mode=', gateway_mode)
print('CONFIG heartbeat.directPolicy=', heartbeat.get('directPolicy'))
print('CONFIG plugins.allow=', plugins.get('allow'))
print('CONFIG mnemon.enabled=', ((entries.get('mnemon') or {}).get('enabled')))
print('CONFIG feishu.enabled=', ((entries.get('feishu') or {}).get('enabled')))
print('CONFIG memory slot=', slots.get('memory'))
print('CONFIG memorySearch.enabled=', memory_search.get('enabled'))
PY

info "Health check complete"
