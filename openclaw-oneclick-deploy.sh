#!/bin/bash
# OpenClaw 一键部署脚本
# 适用于所有Mac，从GitHub直接clone完整配置

set -e  # 遇错即停

echo "=========================================="
echo "  OpenClaw Workspace 一键部署"
echo "  GitHub: bianhaifeng789-hue/openclaw-config"
echo "=========================================="

# 配置
REPO_URL="https://github.com/bianhaifeng789-hue/openclaw-config.git"
WORKSPACE_DIR="$HOME/.openclaw/workspace"

# 1. 备份现有配置（如有）
if [ -d "$WORKSPACE_DIR" ]; then
  BACKUP_DIR="$WORKSPACE_DIR.backup.$(date +%Y%m%d_%H%M%S)"
  echo ""
  echo "📦 备份现有配置到: $BACKUP_DIR"
  mv "$WORKSPACE_DIR" "$BACKUP_DIR"
fi

# 2. Clone仓库
echo ""
echo "⬇️  Clone仓库..."
mkdir -p "$HOME/.openclaw"
git clone "$REPO_URL" "$WORKSPACE_DIR"
cd "$WORKSPACE_DIR"

# 3. 验证关键文件
echo ""
echo "🔍 验证关键文件..."

check_file() {
  if [ -f "$1" ]; then
    echo "  ✅ $1"
    return 0
  else
    echo "  ❌ $1 缺失"
    return 1
  fi
}

check_file "impl/bin/heartbeat-cli.js"
check_file "impl/bin/auto-trigger-cli.js"

UTILS_COUNT=$(find impl/utils -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
if [ "$UTILS_COUNT" -ge "300" ]; then
  echo "  ✅ impl/utils: $UTILS_COUNT 个TS文件"
else
  echo "  ⚠️  impl/utils: $UTILS_COUNT 个TS文件（预期300+）"
fi

DIST_COUNT=$(find impl/dist -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
if [ "$DIST_COUNT" -ge "300" ]; then
  echo "  ✅ impl/dist: $DIST_COUNT 个编译文件"
else
  echo "  ⚠️  impl/dist: $DIST_COUNT 个编译文件（预期300+）"
fi

SKILLS_COUNT=$(find skills -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
echo "  ✅ skills: $SKILLS_COUNT 个"

# 4. 检查package.json（如果impl有）
if [ -f "impl/package.json" ]; then
  echo ""
  echo "📦 安装依赖并编译..."
  cd impl
  npm install
  npm run build 2>/dev/null || echo "编译已完成或无需编译"
  cd ..
fi

# 5. 重启Gateway
echo ""
echo "🔄 重启 OpenClaw Gateway..."
openclaw gateway restart

echo ""
echo "=========================================="
echo "  ✅ 部署完成"
echo "=========================================="
echo ""
echo "验证命令:"
echo "  node ~/.openclaw/workspace/impl/bin/heartbeat-cli.js status"
echo "  openclaw status"
echo ""