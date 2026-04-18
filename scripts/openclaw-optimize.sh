#!/usr/bin/env bash
# OpenClaw 系统优化脚本
# 1. 清理重复文件 (impl/bin vs impl/dist)
# 2. 设置日志轮转
# 3. 清理旧 state 文件
# 4. 优化 node_modules

set -e

echo "=== OpenClaw 系统优化 ==="

# 1. 清理重复文件 (保留 bin，删除 dist 中的重复)
echo "[1/4] 清理重复文件..."
BIN_DIR="/Users/mar2game/.openclaw/workspace/impl/bin"
DIST_DIR="/Users/mar2game/.openclaw/workspace/impl/dist"

duplicates=0
for f in "$BIN_DIR"/*.js; do
    name=$(basename "$f")
    if [ -f "$DIST_DIR/$name" ]; then
        # 比较文件大小，如果相同则删除 dist 中的
        bin_size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null)
        dist_size=$(stat -f%z "$DIST_DIR/$name" 2>/dev/null || stat -c%s "$DIST_DIR/$name" 2>/dev/null)
        if [ "$bin_size" = "$dist_size" ]; then
            rm "$DIST_DIR/$name"
            duplicates=$((duplicates + 1))
        fi
    fi
done
echo "  删除了 $duplicates 个重复文件"

# 2. 清理 dist 中的 .map 和 .d.ts 文件
echo "[2/4] 清理 dist 中的 source map 和类型定义..."
map_count=$(find "$DIST_DIR" -name "*.map" | wc -l)
dts_count=$(find "$DIST_DIR" -name "*.d.ts" | wc -l)
find "$DIST_DIR" -name "*.map" -delete
find "$DIST_DIR" -name "*.d.ts" -delete
echo "  删除了 $map_count 个 .map 文件"
echo "  删除了 $dts_count 个 .d.ts 文件"

# 3. 设置日志轮转
echo "[3/4] 设置日志轮转..."
LOGS_DIR="/Users/mar2game/.openclaw/workspace/logs"
# 压缩超过 7 天的日志
find "$LOGS_DIR" -name "*.log" -mtime +7 -exec gzip {} \; 2>/dev/null || true
# 删除超过 30 天的压缩日志
find "$LOGS_DIR" -name "*.gz" -mtime +30 -delete 2>/dev/null || true
echo "  日志轮转完成"

# 4. 清理旧 state 文件
echo "[4/4] 清理旧 state 文件..."
STATE_DIR="/Users/mar2game/.openclaw/workspace/state"
# 备份并清理超过 30 天的 state 文件
find "$STATE_DIR" -name "*.json" -mtime +30 -exec mv {} {}.bak \; 2>/dev/null || true
echo "  旧 state 文件已备份"

echo ""
echo "=== 优化完成 ==="
echo "建议: 运行 'openclaw restart' 重启服务"
