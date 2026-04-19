#!/bin/bash
# 安装 Session Store 架构优化依赖

echo "=== OpenClaw Session Store 依赖安装 ==="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# 创建 package.json（如果不存在）
if [ ! -f package.json ]; then
    echo "Creating package.json..."
    cat > package.json << 'EOF'
{
  "name": "openclaw-session-store",
  "version": "1.0.0",
  "description": "OpenClaw Session Store backends",
  "dependencies": {}
}
EOF
fi

# 安装 SQLite3
echo "📦 Installing sqlite3..."
npm install sqlite3 --save 2>&1 | tail -3

# 安装 Redis
echo "📦 Installing redis..."
npm install redis --save 2>&1 | tail -3

echo ""
echo "=== Installation Complete ==="
echo ""
echo "You can now use:"
echo "  - SQLite backend: SESSION_BACKEND=sqlite node session-store-adapter.js"
echo "  - Redis backend: SESSION_BACKEND=redis node session-store-adapter.js"
echo ""
echo "Test commands:"
echo "  node impl/bin/sqlite-session-store.js test"
echo "  node impl/bin/redis-session-store.js check"
echo "  node impl/bin/session-store-adapter.js compare"
