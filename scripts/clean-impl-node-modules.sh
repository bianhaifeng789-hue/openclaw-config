#!/usr/bin/env bash
# 清理 impl/node_modules 开发依赖
set -e

IMPL_DIR="/Users/mar2game/.openclaw/workspace/impl"
NODE_MODULES="$IMPL_DIR/node_modules"

echo "=== 清理 impl/node_modules 开发依赖 ==="
echo ""

# 检查是否有 package.json
if [ ! -f "$IMPL_DIR/package.json" ]; then
    echo "错误: 未找到 package.json"
    exit 1
fi

echo "原始大小:"
du -sh "$NODE_MODULES" 2>/dev/null || echo "N/A"

# 安全清理: 删除已知的开发依赖大文件
echo ""
echo "[1/4] 清理 typescript (开发依赖)..."
if [ -d "$NODE_MODULES/typescript" ]; then
    rm -rf "$NODE_MODULES/typescript"
    echo "  ✓ 已删除 typescript (22.5MB)"
fi

echo "[2/4] 清理 @types (类型定义)..."
if [ -d "$NODE_MODULES/@types" ]; then
    rm -rf "$NODE_MODULES/@types"
    echo "  ✓ 已删除 @types (2.5MB)"
fi

echo "[3/4] 清理 vitest (测试框架)..."
if [ -d "$NODE_MODULES/vitest" ]; then
    rm -rf "$NODE_MODULES/vitest"
    echo "  ✓ 已删除 vitest (1.6MB)"
fi

echo "[4/4] 清理测试相关依赖..."
for pkg in chai @vitest/coverage-v8; do
    if [ -d "$NODE_MODULES/$pkg" ]; then
        rm -rf "$NODE_MODULES/$pkg"
        echo "  ✓ 已删除 $pkg"
    fi
done

echo ""
echo "清理后大小:"
du -sh "$NODE_MODULES" 2>/dev/null || echo "N/A"

echo ""
echo "=== 清理完成 ==="
echo "注意: 如需恢复开发依赖，运行 npm install"
