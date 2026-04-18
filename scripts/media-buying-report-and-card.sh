#!/usr/bin/env bash
set -e

MODE=${1:-daily}
DATA_FILE=${2:-/Users/mar2game/.openclaw/workspace/examples/media-buying/report-data.json}
OUT_FILE=${3:-/tmp/media-buying-report-card-$$.md}

node /Users/mar2game/.openclaw/workspace/scripts/ads-report-cli.js "$DATA_FILE" "$MODE" > "$OUT_FILE"
node /Users/mar2game/.openclaw/workspace/scripts/media-buying-feishu-send.js "$OUT_FILE"
