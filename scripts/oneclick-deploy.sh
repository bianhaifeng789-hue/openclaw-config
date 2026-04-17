#!/bin/bash
# OpenClaw Workspace-Dispatcher 一键部署脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/bianhaifeng789-hue/openclaw-config/main/scripts/oneclick-deploy.sh | bash

set -e

echo "================================"
echo "🚀 OpenClaw Workspace-Dispatcher 一键部署"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查系统
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ 此脚本仅支持 macOS${NC}"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️ Node.js 未安装，正在安装...${NC}"
    brew install node
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [[ "$NODE_VERSION" -lt 18 ]]; then
    echo -e "${RED}❌ Node.js 版本过低（需要 >= 18），当前: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"

# 检查 OpenClaw
if ! command -v openclaw &> /dev/null; then
    echo -e "${YELLOW}⚠️ OpenClaw 未安装，正在安装...${NC}"
    npm install -g openclaw
fi

echo -e "${GREEN}✅ OpenClaw 已安装${NC}"

# 配置变量（用户可自定义）
# ============================================
# ⚠️ 硬编码位置 - 根据你的环境修改以下变量
# ============================================

WORKSPACE_DIR="${HOME}/.openclaw/workspace-dispatcher"  # 工作目录
REPO_URL="https://github.com/bianhaifeng789-hue/openclaw-config.git"  # 仓库地址
BRANCH="main"  # 分支

# API 配置（可选，建议从 .env 文件读取）
# API_KEY=""  # ⚠️ 不要在这里硬编码 API Key
# BASE_URL="https://api.openai.com/v1"  # API Base URL
# MODEL="gpt-4o"  # 默认模型

# ============================================

echo -e "${BLUE}📦 克隆仓库...${NC}"

# 克隆或更新仓库
if [[ -d "$WORKSPACE_DIR" ]]; then
    echo -e "${YELLOW}⚠️ 工作目录已存在，正在更新...${NC}"
    cd "$WORKSPACE_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
else
    echo -e "${GREEN}✅ 克隆仓库到 $WORKSPACE_DIR${NC}"
    git clone "$REPO_URL" "$WORKSPACE_DIR"
    cd "$WORKSPACE_DIR"
fi

echo -e "${GREEN}✅ 仓库已就绪${NC}"

# 创建 .env 文件（如果不存在）
if [[ ! -f "$WORKSPACE_DIR/.env" ]]; then
    echo -e "${BLUE}📝 创建 .env 配置文件...${NC}"
    
    # 交互式配置
    echo ""
    echo -e "${YELLOW}请输入 API 配置（可选，留空使用默认值）:${NC}"
    
    read -p "API Key (直接回车跳过): " API_KEY_INPUT
    read -p "API Base URL (默认: https://api.openai.com/v1): " BASE_URL_INPUT
    read -p "Model (默认: gpt-4o): " MODEL_INPUT
    
    # 写入 .env
    cat > "$WORKSPACE_DIR/.env" << EOF
# OpenClaw Workspace-Dispatcher 配置
# 生成时间: $(date)

# API 配置
OPENAI_API_KEY=${API_KEY_INPUT:-""}
OPENAI_BASE_URL=${BASE_URL_INPUT:-"https://api.openai.com/v1"}
HARNESS_MODEL=${MODEL_INPUT:-"gpt-4o"}

# Harness 配置
MAX_HARNESS_ROUNDS=5
PASS_THRESHOLD=7.0
COMPRESS_THRESHOLD=80000
RESET_THRESHOLD=150000
MAX_AGENT_ITERATIONS=500
MAX_TOOL_ERRORS=5

# 工作空间
WORKSPACE=${WORKSPACE_DIR}
EOF
    
    echo -e "${GREEN}✅ .env 文件已创建${NC}"
else
    echo -e "${GREEN}✅ .env 文件已存在${NC}"
fi

# 复制 Skills 到 OpenClaw 全局目录
GLOBAL_SKILLS_DIR="${HOME}/.openclaw/skills"
TB2_SKILLS_DIR="$WORKSPACE_DIR/skills/tb2"

if [[ -d "$TB2_SKILLS_DIR" ]]; then
    echo -e "${BLUE}📦 复制 TB2 Skills 到全局目录...${NC}"
    
    if [[ ! -d "$GLOBAL_SKILLS_DIR" ]]; then
        mkdir -p "$GLOBAL_SKILLS_DIR"
    fi
    
    # 复制所有 TB2 skills
    for skill_dir in "$TB2_SKILLS_DIR"/*; do
        if [[ -d "$skill_dir" ]]; then
            skill_name=$(basename "$skill_dir")
            target_dir="$GLOBAL_SKILLS_DIR/$skill_name"
            
            if [[ ! -d "$target_dir" ]]; then
                cp -r "$skill_dir" "$target_dir"
                echo -e "${GREEN}  ✅ $skill_name${NC}"
            else
                echo -e "${YELLOW}  ⚠️ $skill_name 已存在（跳过）${NC}"
            fi
        fi
    done
    
    echo -e "${GREEN}✅ TB2 Skills 已复制${NC}"
fi

# 验证部署
echo ""
echo -e "${BLUE}🧪 验证部署...${NC}"

cd "$WORKSPACE_DIR"

# 测试核心脚本
if [[ -f "impl/bin/agent-loop.js" ]]; then
    node impl/bin/agent-loop.js test > /dev/null 2>&1 && \
        echo -e "${GREEN}✅ agent-loop.js${NC}" || \
        echo -e "${RED}❌ agent-loop.js${NC}"
fi

if [[ -f "impl/bin/tools-executor.js" ]]; then
    node impl/bin/tools-executor.js test > /dev/null 2>&1 && \
        echo -e "${GREEN}✅ tools-executor.js${NC}" || \
        echo -e "${RED}❌ tools-executor.js${NC}"
fi

if [[ -f "impl/bin/middlewares-executor.js" ]]; then
    node impl/bin/middlewares-executor.js test > /dev/null 2>&1 && \
        echo -e "${GREEN}✅ middlewares-executor.js${NC}" || \
        echo -e "${RED}❌ middlewares-executor.js${NC}"
fi

# 统计
echo ""
echo "================================"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo "================================"
echo ""
echo "📊 统计信息:"
echo "  - 工作目录: $WORKSPACE_DIR"
echo "  - Node.js 文件: $(ls impl/bin/*.js | wc -l | tr -d ' ')"
echo "  - Skills: $(find skills -name 'SKILL.md' | wc -l | tr -d ' ')"
echo "  - TB2 任务: $(cat impl/bin/tb2_tasks.json | grep 'category' | wc -l | tr -d ' ')"
echo ""
echo "⚠️ 硬编码位置说明:"
echo "  - impl/bin/agent-loop.js: WORKSPACE, API_KEY, BASE_URL, MODEL"
echo "  - impl/bin/tools-executor.js: WORKSPACE"
echo "  - impl/bin/profile-config.js: HOME, WORKSPACE"
echo "  - impl/bin/skills-registry.js: WORKSPACE/skills"
echo ""
echo "📝 配置文件:"
echo "  - .env 文件: $WORKSPACE_DIR/.env"
echo "  - 请根据需要修改 API 配置"
echo ""
echo "🎯 下一步:"
echo "  1. 编辑 .env 文件配置 API Key"
echo "  2. 运行测试: node impl/bin/test-tb2.js test"
echo "  3. 启动 Gateway: openclaw gateway start"
echo ""