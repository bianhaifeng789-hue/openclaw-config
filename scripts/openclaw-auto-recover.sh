#!/bin/zsh
set -euo pipefail

ROOT="/Users/mac/.openclaw/workspace"
OUT_DIR="$ROOT/state/diagnostics"
STAMP="$(date +%F-%H%M%S)"
OUT="$OUT_DIR/openclaw-auto-recover-$STAMP.md"
mkdir -p "$OUT_DIR"

MAX_STATUS_LINES="${MAX_STATUS_LINES:-120}"
MAX_DOCTOR_LINES="${MAX_DOCTOR_LINES:-160}"
MAX_LOG_LINES="${MAX_LOG_LINES:-200}"
GATEWAY_LOG="${GATEWAY_LOG:-/tmp/openclaw/openclaw-$(date +%F).log}"

STATUS_RAW="$(openclaw status 2>&1 || true)"
DOCTOR_RAW="$(openclaw doctor --non-interactive 2>&1 || true)"
LOG_TAIL=""
LOG_SIGNALS=""

if [[ -f "$GATEWAY_LOG" ]]; then
  LOG_TAIL="$(tail -n "$MAX_LOG_LINES" "$GATEWAY_LOG" 2>&1 || true)"
  LOG_SIGNALS="$(grep -nEi 'config changed since last load|re-run config.get|gateway failed|context overflow|compaction|too many tokens|session safety|session lock|stale|dispatch complete|dispatching to agent|SIGKILL|killed|timeout|unreachable|failed to start' "$GATEWAY_LOG" | tail -n 120 || true)"
fi

gateway_running="unknown"
gateway_reachable="unknown"
channel_ok="unknown"
stale_lock="unknown"
config_conflict="no"
context_pressure="no"
real_gateway_failure="no"
classification="unclear"
action="observe"

if print -r -- "$STATUS_RAW" | grep -qi 'Gateway service.*running'; then
  gateway_running="yes"
fi
if print -r -- "$STATUS_RAW" | grep -qi 'Gateway[[:space:]].*reachable'; then
  gateway_reachable="yes"
fi
if print -r -- "$STATUS_RAW" | grep -qi 'Feishu[[:space:]].*OK'; then
  channel_ok="yes"
fi
if print -r -- "$DOCTOR_RAW" | grep -qi 'stale=no'; then
  stale_lock="no"
elif print -r -- "$DOCTOR_RAW" | grep -qi 'stale=yes'; then
  stale_lock="yes"
fi
if print -r -- "$DOCTOR_RAW\n$LOG_SIGNALS" | grep -qEi 'config changed since last load|re-run config.get'; then
  config_conflict="yes"
fi
if print -r -- "$LOG_SIGNALS" | grep -qEi 'context overflow|compaction|too many tokens|session safety'; then
  context_pressure="yes"
fi
if [[ "$gateway_running" != "yes" ]] && print -r -- "$STATUS_RAW" | grep -qEi 'Gateway service.*(failed|inactive)'; then
  real_gateway_failure="yes"
elif [[ "$gateway_reachable" != "yes" ]] && print -r -- "$STATUS_RAW" | grep -qEi 'Gateway[[:space:]].*unreachable'; then
  real_gateway_failure="yes"
fi

if [[ "$real_gateway_failure" == "yes" ]]; then
  classification="real_gateway_failure"
  action="consider_single_restart_after_review"
elif [[ "$config_conflict" == "yes" ]]; then
  classification="config_conflict_false_failure"
  action="re-read_config_once_before_retry"
elif [[ "$gateway_running" == "yes" && "$gateway_reachable" == "yes" && "$channel_ok" == "yes" && "$context_pressure" == "yes" ]]; then
  classification="session_context_pressure"
  action="externalize_output_and_split_work"
elif [[ "$gateway_running" == "yes" && "$gateway_reachable" == "yes" && "$channel_ok" == "yes" && "$stale_lock" == "no" ]]; then
  classification="service_alive_observe_session_weight"
  action="do_not_restart_use_session_hygiene"
fi

{
  echo "# OpenClaw Auto Recovery Snapshot"
  echo
  echo "- Time: $(date)"
  echo "- Host: $(hostname)"
  echo "- Workspace: $ROOT"
  echo "- Gateway log: $GATEWAY_LOG"
  echo
  echo "## Classification"
  echo
  echo "- gateway_running: $gateway_running"
  echo "- gateway_reachable: $gateway_reachable"
  echo "- channel_ok: $channel_ok"
  echo "- stale_lock: $stale_lock"
  echo "- config_conflict: $config_conflict"
  echo "- context_pressure: $context_pressure"
  echo "- real_gateway_failure: $real_gateway_failure"
  echo "- classification: $classification"
  echo "- recommended_action: $action"
  echo
  echo "## openclaw status (tail $MAX_STATUS_LINES)"
  echo '```'
  print -r -- "$STATUS_RAW" | tail -n "$MAX_STATUS_LINES"
  echo '```'
  echo
  echo "## openclaw doctor --non-interactive (tail $MAX_DOCTOR_LINES)"
  echo '```'
  print -r -- "$DOCTOR_RAW" | tail -n "$MAX_DOCTOR_LINES"
  echo '```'
  echo
  if [[ -f "$GATEWAY_LOG" ]]; then
    echo "## gateway log key signals"
    echo '```'
    print -r -- "$LOG_SIGNALS"
    echo '```'
    echo
    echo "## gateway log tail ($MAX_LOG_LINES lines)"
    echo '```'
    print -r -- "$LOG_TAIL"
    echo '```'
    echo
  else
    echo "## gateway log"
    echo '```'
    echo "log file not found: $GATEWAY_LOG"
    echo '```'
    echo
  fi
} > "$OUT"

printf 'Auto-recovery snapshot written to: %s\n' "$OUT"
printf 'classification=%s\n' "$classification"
printf 'recommended_action=%s\n' "$action"
