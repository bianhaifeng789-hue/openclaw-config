#!/usr/bin/env bash
set -e

REPORT_FILE=/tmp/media-buying-report-$$.md

node /Users/mar2game/.openclaw/workspace/scripts/ads-report-cli.js /Users/mar2game/.openclaw/workspace/examples/media-buying/report-data.json daily > "$REPORT_FILE"
node /Users/mar2game/.openclaw/workspace/scripts/media-buying-feishu-card.js "$REPORT_FILE"
