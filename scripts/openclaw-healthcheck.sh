#!/bin/zsh
set -euo pipefail

ROOT="/Users/mac/.openclaw/workspace"
OUT_DIR="$ROOT/state/health"
STAMP="$(date +%F-%H%M%S)"
OUT="$OUT_DIR/check-$STAMP.md"
mkdir -p "$OUT_DIR"

{
  echo "# OpenClaw Health Check"
  echo
  echo "- Time: $(date)"
  echo "- Host: $(hostname)"
  echo
  echo "## openclaw status"
  echo '```'
  openclaw status || true
  echo '```'
  echo
  echo "## openclaw doctor --non-interactive"
  echo '```'
  openclaw doctor --non-interactive || true
  echo '```'
  echo
  echo "## openclaw security audit --deep"
  echo '```'
  openclaw security audit --deep || true
  echo '```'
} > "$OUT"

echo "$OUT"
