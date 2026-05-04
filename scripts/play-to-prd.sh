#!/bin/zsh
set -euo pipefail

# Unified operator entrypoint for the Google Play -> reverse -> PRD workflow.
# Keeps package checks, artifact checks, and skill-chain checks in one place.

ROOT="/Users/mac/.openclaw/workspace"
INSTALLER="$ROOT/impl/bin/google-play-installer.js"
PRD_TEMPLATE="$ROOT/PRD-template-advanced.md"
PRD_OUT_DIR="$ROOT/plans/prd"

usage() {
  cat <<'EOF'
Usage: scripts/play-to-prd.sh <mode> [args]

Modes:
  check-app <package>                 Quick package sanity check via google-play helper
  install-play <package> [device]     Open Google Play on device and try auto-install
  device-check <package> [device]     Check whether package is installed on connected device
  pull-apk <package> [artifact] [device]
                                     Pull base/split APKs from connected device
  reverse-status <artifact>           Check whether reverse-analysis artifacts already exist
  ensure-reverse-dirs <artifact>      Create reverse-for-prd directory and expected input files if missing
  prd-skills                          Verify required skills for Play -> reverse -> PRD chain
  prd-template                        Show the default advanced PRD template path
  init-prd <project-name>             Create a new PRD skeleton from the advanced template
  smoke <package> <artifact>          Run a lightweight end-to-end smoke check summary

Examples:
  scripts/play-to-prd.sh check-app com.game.my
  scripts/play-to-prd.sh install-play com.game.my 42170DLJH001W3
  scripts/play-to-prd.sh device-check com.game.my 42170DLJH001W3
  scripts/play-to-prd.sh pull-apk com.game.my com.game.my 42170DLJH001W3
  scripts/play-to-prd.sh reverse-status com.stormlibs.musictune
  scripts/play-to-prd.sh ensure-reverse-dirs com.stormlibs.musictune
  scripts/play-to-prd.sh prd-skills
  scripts/play-to-prd.sh prd-template
  scripts/play-to-prd.sh init-prd file-recovery-v2
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
    echo "package=$PACKAGE"
    if [[ "$PACKAGE" =~ ^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$ ]]; then
      echo "package_format=ok"
    else
      echo "package_format=invalid"
    fi
    ;;
  install-play)
    [[ $# -ge 1 && $# -le 2 ]] || { usage; exit 2; }
    PACKAGE="$1"
    DEVICE_ID="${2:-}"
    if [[ -n "$DEVICE_ID" ]]; then
      node "$INSTALLER" install "$PACKAGE" "$DEVICE_ID"
    else
      node "$INSTALLER" install "$PACKAGE"
    fi
    ;;
  device-check)
    [[ $# -ge 1 && $# -le 2 ]] || { usage; exit 2; }
    PACKAGE="$1"
    DEVICE_ID="${2:-}"
    if [[ -n "$DEVICE_ID" ]]; then
      node "$INSTALLER" check "$PACKAGE" "$DEVICE_ID"
    else
      node "$INSTALLER" check "$PACKAGE"
    fi
    ;;
  pull-apk)
    [[ $# -ge 1 && $# -le 3 ]] || { usage; exit 2; }
    PACKAGE="$1"
    ARTIFACT_NAME="${2:-$PACKAGE}"
    DEVICE_ID="${3:-}"
    OUT_DIR="$ROOT/artifacts/$ARTIFACT_NAME"
    mkdir -p "$OUT_DIR"
    if [[ -n "$DEVICE_ID" ]]; then
      node "$INSTALLER" pull "$PACKAGE" "$OUT_DIR" "$DEVICE_ID"
    else
      node "$INSTALLER" pull "$PACKAGE" "$OUT_DIR"
    fi
    ;;
  reverse-status)
    [[ $# -eq 1 ]] || { usage; exit 2; }
    ART_DIR="$ROOT/artifacts/$1"
    echo "artifact_dir=$ART_DIR"
    [[ -f "$ART_DIR/base.apk" ]] && echo "base_apk=ok" || echo "base_apk=missing"
    set +o nomatch 2>/dev/null || true
    APK_GLOB=("$ART_DIR"/*.apk)
    set -o nomatch 2>/dev/null || true
    if [[ -e "${APK_GLOB[1]:-}" ]]; then
      echo "apk_files=present"
    else
      echo "apk_files=missing"
    fi
    [[ -d "$ART_DIR/jadx-base" ]] && echo "jadx_dir=ok" || echo "jadx_dir=missing"
    [[ -d "$ART_DIR/apktool-out" ]] && echo "apktool_dir=ok" || echo "apktool_dir=missing"
    [[ -d "$ART_DIR/reverse-for-prd" ]] && echo "reverse_prd_dir=ok" || echo "reverse_prd_dir=missing"
    [[ -f "$ART_DIR/APK_REVERSE_ANALYSIS.md" ]] && echo "reverse_report=ok" || echo "reverse_report=missing"
    ;;
  ensure-reverse-dirs)
    [[ $# -eq 1 ]] || { usage; exit 2; }
    ART_DIR="$ROOT/artifacts/$1"
    REV_DIR="$ART_DIR/reverse-for-prd"
    mkdir -p "$REV_DIR"
    for f in \
      product-positioning.md \
      feature-spec-input.md \
      page-spec-input.md \
      api-contracts.md \
      monetization-impl.md \
      permissions-compliance.md \
      technical-architecture.md \
      code-reuse-notes.md \
      reverse-evidence-index.md
    do
      touch "$REV_DIR/$f"
      echo "reverse_input=ready path=$REV_DIR/$f"
    done
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
    echo "template=default path=$ROOT/PRD-template-advanced.md"
    ;;
  prd-template)
    echo "template_path=$PRD_TEMPLATE"
    echo "template_note=for formal project docs, use this advanced template by default after Play -> reverse analysis"
    ;;
  init-prd)
    [[ $# -eq 1 ]] || { usage; exit 2; }
    NAME="$1"
    mkdir -p "$PRD_OUT_DIR"
    SAFE_NAME="$(print -r -- "$NAME" | tr '[:upper:]' '[:lower:]' | tr ' /' '--' | tr -cd 'a-z0-9._-')"
    OUT_PATH="$PRD_OUT_DIR/${SAFE_NAME}.md"
    cp "$PRD_TEMPLATE" "$OUT_PATH"
    echo "created_prd=$OUT_PATH"
    echo "template_source=$PRD_TEMPLATE"
    echo "next_step=fill version info, background, core scope, and attach reverse-analysis findings"
    ;;
  smoke)
    [[ $# -eq 2 ]] || { usage; exit 2; }
    PACKAGE="$1"
    ARTIFACT="$2"
    echo "== check-app =="
    "$0" check-app "$PACKAGE"
    echo
    echo "== device-check =="
    "$0" device-check "$PACKAGE" || true
    echo
    echo "== reverse-status =="
    "$0" reverse-status "$ARTIFACT"
    echo
    echo "== ensure-reverse-dirs =="
    "$0" ensure-reverse-dirs "$ARTIFACT"
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
