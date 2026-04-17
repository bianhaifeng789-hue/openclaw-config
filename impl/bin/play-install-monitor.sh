#!/bin/bash
# Google Play安装状态监控
PACKAGE="com.wordconnect.cash.game"
DEVICE="56101JEBF10414"

while true; do
  RESULT=$(~/.local/bin/adb -s $DEVICE shell "pm list packages | grep $PACKAGE" 2>/dev/null)
  if [ ! -z "$RESULT" ]; then
    echo "✅ 应用已安装: $PACKAGE"
    ~/.local/bin/adb -s $DEVICE shell "monkey -p $PACKAGE -c android.intent.category.LAUNCHER 1"
    exit 0
  fi
  echo "等待安装... ($(date +%H:%M:%S))"
  sleep 30
done

