#!/bin/zsh
set -euo pipefail

ROOT="/Users/mac/.openclaw/workspace"
OUT_DIR="$ROOT/state/diagnostics"
STAMP="$(date +%F-%H%M%S)"
OUT="$OUT_DIR/openclaw-diag-$STAMP.md"
mkdir -p "$OUT_DIR"

MAX_LOG_LINES="${MAX_LOG_LINES:-200}"
MAX_STATUS_LINES="${MAX_STATUS_LINES:-120}"
GATEWAY_LOG="${GATEWAY_LOG:-/tmp/openclaw/openclaw-$(date +%F).log}"

capture_block() {
  local title="$1"
  shift
  {
    echo "## $title"
    echo '```'
    "$@" || true
    echo '```'
    echo
  } >> "$OUT"
}

capture_eval_block() {
  local title="$1"
  local cmd="$2"
  {
    echo "## $title"
    echo '```'
    eval "$cmd" || true
    echo '```'
    echo
  } >> "$OUT"
}

{
  echo "# OpenClaw Diagnostic Capture"
  echo
  echo "- Time: $(date)"
  echo "- Host: $(hostname)"
  echo "- Workspace: $ROOT"
  echo "- Gateway log: $GATEWAY_LOG"
  echo
} > "$OUT"

capture_eval_block "openclaw status (tail $MAX_STATUS_LINES)" "openclaw status 2>&1 | tail -n $MAX_STATUS_LINES"
capture_eval_block "openclaw gateway status (tail $MAX_STATUS_LINES)" "openclaw gateway status 2>&1 | tail -n $MAX_STATUS_LINES"

if [[ -f "$GATEWAY_LOG" ]]; then
  capture_eval_block "gateway log tail ($MAX_LOG_LINES lines)" "tail -n $MAX_LOG_LINES '$GATEWAY_LOG'"
  capture_eval_block "gateway log key signals" "grep -nEi 'context overflow|compaction|too many tokens|session safety|gateway failed|config changed since last load|SIGKILL|killed|heartbeat|dispatch complete|dispatching to agent' '$GATEWAY_LOG' | tail -n 120"
else
  {
    echo "## gateway log"
    echo '```'
    echo "log file not found: $GATEWAY_LOG"
    echo '```'
    echo
  } >> "$OUT"
fi

SUMMARY="$({
  echo "Diagnostic snapshot written to: $OUT"
  echo
  echo "Summary:"
  echo "- Captured openclaw status and gateway status as bounded tails"
  if [[ -f "$GATEWAY_LOG" ]]; then
    echo "- Captured gateway log tail and filtered key signals"
  else
    echo "- Gateway log file missing, skipped log capture"
  fi
  echo "- Full raw material is in the markdown file, not in session history"
} )"

printf '%s\n' "$SUMMARY"
