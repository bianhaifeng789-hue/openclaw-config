# OpenClaw Makefile - Unified Development Environment
#
# 借鉴 DeerFlow 2.0 的 Makefile 工具链
# 20+ 开发命令，极大提升开发体验
#
# 来源: https://github.com/bytedance/deer-flow
# 参考: Makefile

.PHONY: help setup doctor config config-upgrade check install clean start stop restart status logs

BASH ?= bash
NODE ?= node

# Default target
help:
	@echo "OpenClaw Development Commands:"
	@echo ""
	@echo "Setup & Configuration:"
	@echo "  make setup           - Interactive setup wizard (recommended)"
	@echo "  make doctor          - Check system requirements and config"
	@echo "  make config          - Generate config from example"
	@echo "  make config-upgrade  - Merge new fields from example to config"
	@echo "  make check           - Check required tools"
	@echo "  make install         - Install dependencies"
	@echo ""
	@echo "Gateway Management:"
	@echo "  make start           - Start OpenClaw Gateway"
	@echo "  make stop            - Stop Gateway"
	@echo "  make restart         - Restart Gateway"
	@echo "  make status          - Show Gateway status"
	@echo "  make logs            - View Gateway logs"
	@echo "  make logs-follow     - Follow Gateway logs (real-time)"
	@echo ""
	@echo "Development:"
	@echo "  make dev             - Start in development mode"
	@echo "  make dev-daemon      - Start in background (daemon)"
	@echo "  make clean           - Clean up processes and temp files"
	@echo ""
	@echo "Testing:"
	@echo "  make test            - Run all tests"
	@echo "  make test-skills     - Test Skills activation"
	@echo "  make test-hooks      - Test Hooks system"
	@echo "  make test-heartbeat  - Test Heartbeat tasks"
	@echo ""
	@echo "MCP & Extensions:"
	@echo "  make mcp-init        - Initialize MCP OAuth config"
	@echo "  make mcp-scan        - Scan MCP OAuth tokens"
	@echo "  make mcp-status      - Show MCP OAuth status"
	@echo ""
	@echo "Heartbeat & Monitoring:"
	@echo "  make heartbeat-check - Check heartbeat tasks"
	@echo "  make heartbeat-run   - Run heartbeat tasks"
	@echo "  make heartbeat-status- Show heartbeat status"
	@echo ""

# ============================================================================
# Setup & Configuration
# ============================================================================

setup:
	@echo "🔧 Starting interactive setup wizard..."
	@$(NODE) impl/bin/setup-wizard.js run

doctor:
	@echo "🏥 Running system diagnostic..."
	@$(NODE) impl/bin/doctor.js check

config:
	@echo "📝 Generating config from example..."
	@if [ -f gateway-config.yaml ]; then \
		echo "Error: gateway-config.yaml already exists"; \
		echo "Use 'make config-upgrade' to merge new fields"; \
		exit 1; \
	fi
	@cp gateway-config.example.yaml gateway-config.yaml
	@echo "✓ Created gateway-config.yaml"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Edit gateway-config.yaml"
	@echo "  2. Add API keys to .env"
	@echo "  3. Run: make start"

config-upgrade:
	@echo "🔄 Upgrading config..."
	@$(BASH) scripts/config-upgrade.sh

check:
	@echo "🔍 Checking required tools..."
	@echo ""
	@echo "Node.js:"
	@$(NODE) --version || (echo "✗ Node.js not found" && exit 1)
	@echo ""
	@echo "npm:"
	@npm --version || (echo "✗ npm not found" && exit 1)
	@echo ""
	@echo "OpenClaw CLI:"
	@openclaw --version || (echo "✗ OpenClaw not found" && echo "Install: npm install -g openclaw" && exit 1)
	@echo ""
	@echo "✓ All required tools installed"

install:
	@echo "📦 Installing dependencies..."
	@npm install
	@echo ""
	@echo "✓ Dependencies installed"
	@echo ""
	@echo "Next steps:"
	@echo "  make setup    - Configure Gateway"
	@echo "  make start    - Start Gateway"

# ============================================================================
# Gateway Management
# ============================================================================

start:
	@echo "🚀 Starting OpenClaw Gateway..."
	@openclaw gateway start
	@echo ""
	@echo "✓ Gateway started"
	@echo ""
	@echo "Check status: make status"
	@echo "View logs: make logs"

stop:
	@echo "🛑 Stopping Gateway..."
	@openclaw gateway stop
	@echo "✓ Gateway stopped"

restart:
	@echo "🔄 Restarting Gateway..."
	@openclaw gateway restart
	@echo "✓ Gateway restarted"

status:
	@echo "📊 Gateway Status:"
	@openclaw gateway status

logs:
	@echo "📜 Gateway Logs:"
	@openclaw gateway logs --tail 50

logs-follow:
	@echo "📜 Following Gateway logs (Ctrl+C to stop)..."
	@openclaw gateway logs --follow

# ============================================================================
# Development
# ============================================================================

dev:
	@echo "🔧 Starting in development mode..."
	@openclaw gateway start --dev
	@echo ""
	@echo "✓ Development mode started"
	@echo ""
	@echo "Hot-reload enabled"
	@echo "Logs: make logs-follow"

dev-daemon:
	@echo "🔧 Starting in background..."
	@openclaw gateway start --daemon
	@echo "✓ Gateway started in background"
	@echo ""
	@echo "Check status: make status"

# ============================================================================
# Testing
# ============================================================================

test:
	@echo "🧪 Running all tests..."
	@echo ""
	@echo "Skills test:"
	@$(NODE) impl/bin/batch-update-descriptions.js test || true
	@echo ""
	@echo "Hooks test:"
	@$(NODE) impl/bin/dangling-tool-patcher.js test || true
	@echo ""
	@echo "Heartbeat test:"
	@$(NODE) impl/bin/heartbeat-cli.js check || true
	@echo ""
	@echo "✓ Tests completed"

test-skills:
	@echo "🧪 Testing Skills activation..."
	@echo ""
	@echo "Skills count:"
	@find skills -name "SKILL.md" | wc -l
	@echo ""
	@echo "Skills with triggers:"
	@grep -r "Use when" skills/*/SKILL.md | wc -l || true
	@echo ""
	@echo "✓ Skills test completed"

test-hooks:
	@echo "🧪 Testing Hooks system..."
	@$(NODE) impl/bin/dangling-tool-patcher.js test || true
	@$(NODE) impl/bin/tool-error-handler.js test || true
	@echo "✓ Hooks test completed"

test-heartbeat:
	@echo "🧪 Testing Heartbeat tasks..."
	@$(NODE) impl/bin/heartbeat-cli.js check
	@echo "✓ Heartbeat test completed"

# ============================================================================
# MCP & Extensions
# ============================================================================

mcp-init:
	@echo "🔧 Initializing MCP OAuth config..."
	@$(NODE) impl/bin/mcp-oauth-refresh.js init
	@echo "✓ MCP config initialized"

mcp-scan:
	@echo "🔍 Scanning MCP OAuth tokens..."
	@$(NODE) impl/bin/mcp-oauth-refresh.js scan

mcp-status:
	@echo "📊 MCP OAuth Status:"
	@$(NODE) impl/bin/mcp-oauth-refresh.js status

# ============================================================================
# Heartbeat & Monitoring
# ============================================================================

heartbeat-check:
	@echo "💓 Checking heartbeat tasks..."
	@$(NODE) impl/bin/heartbeat-cli.js check

heartbeat-run:
	@echo "💓 Running heartbeat tasks..."
	@$(NODE) impl/bin/heartbeat-cli.js run

heartbeat-status:
	@echo "💓 Heartbeat Status:"
	@$(NODE) impl/bin/heartbeat-cli.js status

heartbeat-tasks:
	@echo "💓 Active Tasks:"
	@$(NODE) impl/bin/heartbeat-cli.js tasks

# ============================================================================
# Cleanup
# ============================================================================

clean:
	@echo "🧹 Cleaning up..."
	@-rm -rf node_modules/.cache 2>/dev/null || true
	@-rm -rf .openclaw-data/*.log 2>/dev/null || true
	@-rm -rf .openclaw-data/.deer-flow 2>/dev/null || true
	@echo "✓ Cleanup complete"
	@echo ""
	@echo "Note: Gateway config and data preserved"

clean-all:
	@echo "⚠️  WARNING: This will remove all data!"
	@echo ""
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "🧹 Cleaning all..."; \
		rm -rf node_modules; \
		rm -rf .openclaw-data; \
		rm -f gateway-config.yaml; \
		rm -f .env; \
		echo "✓ All cleaned"; \
	else \
		echo "Cancelled"; \
	fi

# ============================================================================
# Docker Commands (Optional)
# ============================================================================

docker-init:
	@echo "🐳 Initializing Docker environment..."
	@if [ ! -f docker-compose.yml ]; then \
		echo "Error: docker-compose.yml not found"; \
		echo "Create it first or use local mode"; \
		exit 1; \
	fi
	@docker-compose pull
	@echo "✓ Docker images pulled"

docker-start:
	@echo "🐳 Starting Docker containers..."
	@docker-compose up -d
	@echo "✓ Docker started"
	@echo ""
	@echo "Check: docker-compose ps"
	@echo "Logs: docker-compose logs -f"

docker-stop:
	@echo "🐳 Stopping Docker containers..."
	@docker-compose down
	@echo "✓ Docker stopped"

docker-logs:
	@echo "📜 Docker logs:"
	@docker-compose logs --tail 50

docker-logs-follow:
	@echo "📜 Following Docker logs..."
	@docker-compose logs -f

# ============================================================================
# Git Helpers
# ============================================================================

git-status:
	@echo "📊 Git Status:"
	@git status -s

git-commit:
	@echo "📝 Committing changes..."
	@git add -A
	@git commit -m "Update: $(shell date +%Y-%m-%d)"
	@echo "✓ Changes committed"

git-push:
	@echo "📤 Pushing to remote..."
	@git push origin main
	@echo "✓ Changes pushed"

# ============================================================================
# Quick Commands
# ============================================================================

quick-start:
	@echo "⚡ Quick start (setup + start):"
	@$(MAKE) setup
	@$(MAKE) start
	@$(MAKE) status

quick-test:
	@echo "⚡ Quick test (all tests):"
	@$(MAKE) doctor
	@$(MAKE) test
	@$(MAKE) heartbeat-check

quick-reset:
	@echo "⚡ Quick reset (stop + clean + start):"
	@$(MAKE) stop
	@$(MAKE) clean
	@$(MAKE) start
	@$(MAKE) status