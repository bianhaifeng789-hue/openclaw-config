#!/bin/zsh
set -euo pipefail

ROOT="/Users/mac/.openclaw/workspace"
AUTO_RECOVER="$ROOT/scripts/openclaw-auto-recover.sh"

if [[ ! -x "$AUTO_RECOVER" ]]; then
  echo "OpenClaw stability guard: auto-recovery script missing or not executable"
  echo "Action: fix scripts/openclaw-auto-recover.sh first"
  exit 1
fi

RAW_OUTPUT="$($AUTO_RECOVER --capture-only --notify 2>&1 || true)"
CLASSIFICATION="$(print -r -- "$RAW_OUTPUT" | awk -F= '/^classification=/{print $2; exit}')"
ACTION="$(print -r -- "$RAW_OUTPUT" | awk -F= '/^recommended_action=/{print $2; exit}')"
SUMMARY="$(print -r -- "$RAW_OUTPUT" | sed -n 's/^notify_summary=//p' | head -n 1)"
SNAPSHOT="$(print -r -- "$RAW_OUTPUT" | sed -n 's/^Auto-recovery snapshot written to: //p' | head -n 1)"

if [[ -z "$CLASSIFICATION" ]]; then
  echo "OpenClaw stability guard: unable to classify current state"
  echo "Action: inspect auto-recovery output manually"
  [[ -n "$SNAPSHOT" ]] && echo "Diagnostics: $SNAPSHOT"
  exit 2
fi

if [[ "$CLASSIFICATION" == "service_alive_observe_session_weight" ]]; then
  echo "OpenClaw stability: healthy enough, no restart needed"
  echo "Classification: $CLASSIFICATION"
  echo "Action: $ACTION"
  echo "Hint: close out and use /new for long follow-up work"
  [[ -n "$SNAPSHOT" ]] && echo "Diagnostics: $SNAPSHOT"
  exit 0
fi

if [[ -n "$SUMMARY" ]]; then
  echo "OpenClaw stability: attention needed"
  echo "Classification: $CLASSIFICATION"
  echo "Action: $ACTION"
  echo "Hint: if work continues, close out and use /new"
  echo "Summary: $SUMMARY"
  [[ -n "$SNAPSHOT" ]] && echo "Diagnostics: $SNAPSHOT"
  exit 0
fi

echo "OpenClaw stability: attention needed"
echo "Classification: $CLASSIFICATION"
echo "Action: $ACTION"
[[ -n "$SNAPSHOT" ]] && echo "Diagnostics: $SNAPSHOT"
exit 0
