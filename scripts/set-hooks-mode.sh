#!/bin/bash
set -euo pipefail

MODE="${1:-}"
WORKSPACE="/Users/mac/.openclaw/workspace"

if [[ -z "$MODE" ]]; then
  echo "Usage: $0 {quiet|dev|strict}"
  exit 1
fi

SRC="$WORKSPACE/hooks-config.$MODE.json"
DST="$WORKSPACE/hooks-config.json"
STATE="$WORKSPACE/hooks-mode.json"

if [[ ! -f "$SRC" ]]; then
  echo "Unknown mode: $MODE"
  exit 1
fi

cp "$SRC" "$DST"
printf '{\n  "mode": "%s"\n}\n' "$MODE" > "$STATE"

echo "Switched hooks mode to: $MODE"
echo "Applied: $SRC -> $DST"
