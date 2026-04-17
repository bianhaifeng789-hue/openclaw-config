#!/bin/bash
# OpenClaw一键部署脚本
# 用于在其他Mac上快速部署完整的OpenClaw配置
#
# 使用方法:
#   bash scripts/oneclick-setup.sh
#
# 前置条件:
#   1. 已安装Node.js (>= 18)
#   2. 已安装OpenClaw (npm install -g openclaw)
#   3. 已配置GitHub SSH密钥

set -e

echo "================================"
echo "🚀 OpenClaw一键部署脚本"
echo "================================"
echo ""

# 检查前置条件
echo "📋 检查前置条件..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js ${NODE_VERSION}"

# 检查OpenClaw
if ! command -v openclaw &> /dev/null; then
    echo "❌ OpenClaw未安装"
    echo "正在安装OpenClaw..."
    npm install -g openclaw
fi

OPENCLAW_VERSION=$(openclaw --version 2>&1 | head -1)
echo "✅ OpenClaw ${OPENCLAW_VERSION}"

# 检查Git
if ! command -v git &> /dev/null; then
    echo "❌ Git未安装"
    echo "请先安装Git: https://git-scm.com/"
    exit 1
fi

echo "✅ Git已安装"
echo ""

# 设置工作目录
WORKSPACE_DIR="$HOME/.openclaw/workspace"

echo "📦 设置工作目录..."
echo "目标: ${WORKSPACE_DIR}"

# 检查是否已存在
if [ -d "$WORKSPACE_DIR" ]; then
    echo "⚠️  工作目录已存在"
    echo "正在备份旧目录..."
    BACKUP_DIR="${WORKSPACE_DIR}.backup.$(date +%Y%m%d%H%M%S)"
    mv "$WORKSPACE_DIR" "$BACKUP_DIR"
    echo "✅ 已备份到: ${BACKUP_DIR}"
fi

# 创建工作目录
mkdir -p "$WORKSPACE_DIR"
echo "✅ 工作目录已创建"
echo ""

# 克隆配置仓库
echo "📥 克隆OpenClaw配置仓库..."
REPO_URL="git@github.com:bianhaifeng789-hue/openclaw-config.git"

if git clone "$REPO_URL" "$WORKSPACE_DIR"; then
    echo "✅ 配置仓库已克隆"
else
    echo "❌ 克隆失败"
    echo "请检查:"
    echo "  1. GitHub SSH密钥是否配置"
    echo "  2. 仓库是否存在: ${REPO_URL}"
    exit 1
fi

echo ""

# 安装依赖
echo "📦 安装Node.js依赖..."
cd "$WORKSPACE_DIR"

if [ -f "package.json" ]; then
    npm install
    echo "✅ 依赖已安装"
else
    echo "⚠️  无package.json，跳过依赖安装"
fi

echo ""

# 创建必要目录
echo "📁 创建必要目录..."
mkdir -p "$HOME/.openclaw/config"
mkdir -p "$HOME/.openclaw/logs"
mkdir -p "$WORKSPACE_DIR/memory"
mkdir -p "$WORKSPACE_DIR/state"
mkdir -p "$WORKSPACE_DIR/memory/.dreams"
echo "✅ 目录已创建"
echo ""

# 检查配置文件
echo "🔧 检查配置文件..."

CONFIG_FILE="$HOME/.openclaw/config/gateway-config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "⚠️  gateway-config.yaml不存在"
    echo "正在从示例创建..."
    
    # 尝试从OpenClaw安装目录复制示例
    EXAMPLE_CONFIG="/opt/homebrew/lib/node_modules/openclaw/dist/config/gateway-config.example.yaml"
    if [ -f "$EXAMPLE_CONFIG" ]; then
        cp "$EXAMPLE_CONFIG" "$CONFIG_FILE"
        echo "✅ 已从示例创建配置文件"
    else
        echo "⚠️  示例配置不存在，请手动配置"
        echo "运行: node $WORKSPACE_DIR/impl/bin/setup-wizard.js run"
    fi
else
    echo "✅ gateway-config.yaml已存在"
fi

echo ""

# 初始化状态文件
echo "📊 初始化状态文件..."

STATE_FILES=(
    "heartbeat-state.json"
    "circuit-breaker-state.json"
    "token-usage-state.json"
    "memory-signals.json"
    "loop-detection.json"
    "api-health-server.json"
)

for STATE_FILE in "${STATE_FILES[@]}"; do
    STATE_PATH="$WORKSPACE_DIR/state/$STATE_FILE"
    if [ ! -f "$STATE_PATH" ]; then
        echo '{}' > "$STATE_PATH"
        echo "✅ 已初始化: $STATE_FILE"
    else
        echo "✅ 已存在: $STATE_FILE"
    fi
done

echo ""

# 运行Doctor诊断
echo "🏥 运行Doctor诊断..."
node "$WORKSPACE_DIR/impl/bin/doctor.js"
echo ""

# 启动Gateway
echo "🚀 启动OpenClaw Gateway..."
if openclaw gateway status &> /dev/null; then
    echo "✅ Gateway已运行"
else
    echo "正在启动Gateway..."
    openclaw gateway start
    sleep 3
    echo "✅ Gateway已启动"
fi

echo ""

# 启动API Health Server
echo "🏥 启动API Health Server..."
if [ -f "$WORKSPACE_DIR/impl/bin/api-health-server.js" ]; then
    node "$WORKSPACE_DIR/impl/bin/api-health-server.js" &
    sleep 2
    echo "✅ API Health Server已启动 (端口8001)"
else
    echo "⚠️  api-health-server.js不存在，跳过"
fi

echo ""

# 显示部署结果
echo "================================"
echo "🎉 OpenClaw部署完成!"
echo "================================"
echo ""
echo "📊 部署统计:"
echo ""
echo "  Skills:    $(ls $WORKSPACE_DIR/skills/*/SKILL.md 2>/dev/null | wc -l | tr -d ' ')"
echo "  Scripts:   $(ls $WORKSPACE_DIR/impl/bin/*.js 2>/dev/null | wc -l | tr -d ' ')"
echo "  心跳任务:  $(grep -c 'name:' $WORKSPACE_DIR/HEARTBEAT.md 2>/dev/null || echo 0)"
echo ""
echo "📍 关键路径:"
echo ""
echo "  工作目录:  $WORKSPACE_DIR"
echo "  Gateway:   http://127.0.0.1:18789"
echo "  API健康:   http://127.0.0.1:8001/api/health"
echo ""
echo "📖 快速命令:"
echo ""
echo "  Doctor诊断:  node $WORKSPACE_DIR/impl/bin/doctor.js"
echo "  Gateway状态: openclaw gateway status"
echo "  心跳检查:   node $WORKSPACE_DIR/impl/bin/heartbeat-cli.js check"
echo ""
echo "✅ 部署成功! OpenClaw已就绪。"