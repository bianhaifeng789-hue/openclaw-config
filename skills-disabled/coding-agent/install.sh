#!/bin/bash
set -e

echo "🤖 Installing Coding Agent Skill for OpenClaw..."

SKILL_DIR="$HOME/.openclaw/workspace/skills/coding-agent"

# Check if we're in the right directory
if [ ! -f "$SKILL_DIR/package.json" ]; then
    echo "❌ Error: Cannot find coding-agent skill directory"
    exit 1
fi

cd "$SKILL_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building..."
npm run build

# Create symlink for global access
if [ -d "$HOME/.npm-global/bin" ]; then
    ln -sf "$SKILL_DIR/dist/index.js" "$HOME/.npm-global/bin/coding-agent"
    echo "✅ Created symlink in ~/.npm-global/bin/coding-agent"
fi

echo ""
echo "✅ Coding Agent installed successfully!"
echo ""
echo "Usage:"
echo "  coding-agent              # Start interactive mode"
echo "  npx coding-agent          # Alternative start method"
echo ""
echo "Available commands (inside the app):"
echo "  /commit                   # Create AI-generated commit"
echo "  /review [pr-number]       # Review code changes"
echo "  /doctor                   # Diagnose project issues"
echo "  /edit <file> <instruction># Edit file with preview"
echo "  /diff <file>              # Show pending diff"
echo "  /status                   # Git status"
echo "  /help                     # Show all commands"
echo ""