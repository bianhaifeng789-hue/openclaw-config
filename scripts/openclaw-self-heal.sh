#!/bin/zsh
set -euo pipefail

# Background guarded self-heal wrapper for launchd.
# Use this for low-frequency unattended recovery attempts.

ROOT="/Users/mac/.openclaw/workspace"
AUTO_RECOVER="$ROOT/scripts/openclaw-auto-recover.sh"
GUARD_LOG_DIR="$ROOT/state/guard"
STAMP="$(date +%F-%H%M%S)"
LOG_FILE="$GUARD_LOG_DIR/openclaw-self-heal-$STAMP.log"
mkdir -p "$GUARD_LOG_DIR"

if [[ ! -x "$AUTO_RECOVER" ]]; then
  echo "openclaw-self-heal: missing executable $AUTO_RECOVER" | tee "$LOG_FILE"
  exit 1
fi

{
  echo "# OpenClaw Self Heal Run"
  echo "time=$(date)"
  echo "host=$(hostname)"
  echo "mode=guarded"
  echo
  "$AUTO_RECOVER" --restart-if-down --fix-stale-lock --notify --feishu-summary
} | tee "$LOG_FILE"
