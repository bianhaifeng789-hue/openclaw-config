#!/usr/bin/env bash
set -e

REPORT_FILE=$(bash /Users/mar2game/.openclaw/workspace/scripts/media-buying-run-report.sh daily /Users/mar2game/.openclaw/workspace/examples/media-buying/report-data.json)
node /Users/mar2game/.openclaw/workspace/scripts/media-buying-send-payload.js "$REPORT_FILE"
