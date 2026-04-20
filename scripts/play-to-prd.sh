#!/bin/zsh
set -euo pipefail

# Unified operator entrypoint for the Google Play -> reverse -> PRD workflow.
# Keeps package checks, artifact checks, and skill-chain checks in one place.

ROOT="/Users/mac/.openclaw/workspace"
HELPER="$ROOT/impl/bin/google-play-helper.js"

usage() {
  cat <<'EOF'
Usage: scripts/play-to-prd.sh <mode> [args]

Modes:
  check-app <package>          Quick package sanity check via google-play helper
  reverse-status <artifact>    Check whether reverse-analysis artifacts already exist
  prd-skills                   Verify required skills for Play -> reverse -> PRD chain
  smoke <package> <artifact>   Run a lightweight end-to-end smoke check summary

Examples:
  scripts/play-to-prd.sh check-app com.game.my
  scripts/play-to-prd.sh reverse-status com.stormlibs.musictune
  scripts/play-to-prd.sh prd-skills
  scripts/play-to-prd.sh smoke com.stormlibs.musictune com.stormlibs.musictune
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

MODE="$1"
shift || true

case "$MODE" in
  check-app)
    [[ $# -eq 1 ]] || { usage; exit 2; }
    PACKAGE="$1"
    if node "$HELPER" check-app --package "$PACKAGE" | grep -q '"packageName": "'$PACKAGE'"'; then
      node "$HELPER" check-app --package "$PACKAGE"
    else
      echo "package=$PACKAGE"
      if [[ "$PACKAGE" =~ ^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$ ]]; then
        echo "package_format=ok"
      else
        echo "package_format=invalid"
      fi
      echo "helper_note=google-play-helper check-app parameter parsing is flaky; using wrapper fallback summary"
    fi
    ;;
  reverse-status)
    [[ $# -eq 1 ]] || { usage; exit 2; }
    ART_DIR="$ROOT/artifacts/$1"
    echo "artifact_dir=$ART_DIR"
    [[ -f "$ART_DIR/base.apk" ]] && echo "base_apk=ok" || echo "base_apk=missing"
    [[ -d "$ART_DIR/jadx-base" ]] && echo "jadx_dir=ok" || echo "jadx_dir=missing"
    [[ -f "$ART_DIR/APK_REVERSE_ANALYSIS.md" ]] && echo "reverse_report=ok" || echo "reverse_report=missing"
    ;;
  prd-skills)
    for d in \
      "$ROOT/skills/google-play-to-prd" \
      "$ROOT/skills/apk-reverse-analysis" \
      "$ROOT/skills/prd-generator" \
      "$ROOT/skills/competitive-analysis" \
      "$ROOT/skills/gap-analysis"
    do
      [[ -f "$d/SKILL.md" ]] && echo "skill=ok path=$d" || echo "skill=missing path=$d"
    done
    ;;
  smoke)
    [[ $# -eq 2 ]] || { usage; exit 2; }
    PACKAGE="$1"
    ARTIFACT="$2"
    echo "== check-app =="
    "$0" check-app "$PACKAGE"
    echo
    echo "== reverse-status =="
    "$0" reverse-status "$ARTIFACT"
    echo
    echo "== prd-skills =="
    "$0" prd-skills
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    usage
    exit 2
    ;;
esac
