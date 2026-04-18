#!/usr/bin/env bash
set -e

node /Users/mar2game/.openclaw/workspace/scripts/creative-analyzer.js /Users/mar2game/.openclaw/workspace/examples/media-buying/creative-data.json

echo ""
echo "=============================="
echo ""

node /Users/mar2game/.openclaw/workspace/scripts/campaign-diagnoser.js /Users/mar2game/.openclaw/workspace/examples/media-buying/campaign-data.json

echo ""
echo "=============================="
echo ""

node /Users/mar2game/.openclaw/workspace/scripts/ads-report-cli.js /Users/mar2game/.openclaw/workspace/examples/media-buying/report-data.json daily
