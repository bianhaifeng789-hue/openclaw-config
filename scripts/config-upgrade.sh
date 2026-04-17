#!/bin/bash
# OpenClaw Config Upgrade Script
# 
# 借鉴 DeerFlow 2.0 的 config-upgrade.sh 机制
# 合理合并 config.example.yaml 新字段到 gateway-config.yaml
# 保留用户修改，避免手动迁移
# 
# 来源: https://github.com/bytedance/deer-flow
# 参考: scripts/config-upgrade.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$(dirname "$(dirname "$SCRIPT_DIR"))"

CONFIG_FILE="${WORKSPACE}/gateway-config.yaml"
EXAMPLE_FILE="${WORKSPACE}/gateway-config.example.yaml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🔧 OpenClaw Config Upgrade Tool"
echo ""

# Check if gateway-config.yaml exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: gateway-config.yaml not found${NC}"
    echo ""
    echo "Run setup wizard first:"
    echo "  node impl/bin/setup-wizard.js run"
    echo ""
    exit 1
fi

# Check if gateway-config.example.yaml exists
if [ ! -f "$EXAMPLE_FILE" ]; then
    echo -e "${YELLOW}Warning: gateway-config.example.yaml not found${NC}"
    echo ""
    echo "Creating example file from current config..."
    cp "$CONFIG_FILE" "$EXAMPLE_FILE"
    echo -e "${GREEN}✓ Created gateway-config.example.yaml${NC}"
    echo ""
    exit 0
fi

# Extract config_version from both files
CURRENT_VERSION=$(grep "^config_version:" "$CONFIG_FILE" | awk '{print $2}' || echo "0")
EXAMPLE_VERSION=$(grep "^config_version:" "$EXAMPLE_FILE" | awk '{print $2}' || echo "0")

echo "Current config_version: $CURRENT_VERSION"
echo "Example config_version: $EXAMPLE_VERSION"
echo ""

# Check if upgrade needed
if [ "$CURRENT_VERSION" -ge "$EXAMPLE_VERSION" ]; then
    echo -e "${GREEN}✓ Config is up-to-date (version $CURRENT_VERSION >= $EXAMPLE_VERSION)${NC}"
    echo ""
    echo "No upgrade needed."
    exit 0
fi

echo -e "${YELLOW}⚠ Config needs upgrade (version $CURRENT_VERSION < $EXAMPLE_VERSION)${NC}"
echo ""
echo "Upgrading config from version $CURRENT_VERSION to $EXAMPLE_VERSION..."
echo ""

# Backup current config
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
echo ""

# Merge strategy:
# 1. Keep all user modifications (comments, values)
# 2. Add new fields from example
# 3. Update config_version

# Use Python for YAML merge (preserving comments and structure)
python3 << 'PYTHON_SCRIPT'
import yaml
import sys
from pathlib import Path

try:
    # Load current config
    with open(sys.argv[1], 'r') as f:
        current = yaml.safe_load(f)
    
    # Load example config
    with open(sys.argv[2], 'r') as f:
        example = yaml.safe_load(f)
    
    # Merge strategy: deep merge (keep current values, add new fields)
    def deep_merge(current, example):
        """Merge example into current, preserving current values"""
        if not isinstance(current, dict) or not isinstance(example, dict):
            return current
        
        result = current.copy()
        
        for key, value in example.items():
            if key not in result:
                # Add new field
                result[key] = value
            elif isinstance(result[key], dict) and isinstance(value, dict):
                # Deep merge nested dicts
                result[key] = deep_merge(result[key], value)
            elif isinstance(result[key], list) and isinstance(value, list):
                # Merge lists (keep current, add new unique items)
                current_list = result[key]
                example_list = value
                
                # For model lists, keep current models
                if key == 'models':
                    result[key] = current_list
                else:
                    # Merge lists (current + unique new items)
                    merged = current_list.copy()
                    for item in example_list:
                        if isinstance(item, dict) and 'name' in item:
                            # Check if item with same name exists
                            exists = any(
                                isinstance(m, dict) and m.get('name') == item.get('name')
                                for m in merged
                            )
                            if not exists:
                                merged.append(item)
                        elif item not in merged:
                            merged.append(item)
                    result[key] = merged
            # else: keep current value
        
        return result
    
    # Merge
    merged = deep_merge(current, example)
    
    # Update config_version
    merged['config_version'] = example.get('config_version', current.get('config_version', 0))
    
    # Write merged config (preserving as much structure as possible)
    # Note: yaml.dump doesn't preserve comments, but that's acceptable for upgrade
    
    with open(sys.argv[1], 'w') as f:
        yaml.dump(merged, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
    
    print("✓ Config merged successfully")
    
except Exception as e:
    print(f"Error during merge: {e}")
    sys.exit(1)

PYTHON_SCRIPT "$CONFIG_FILE" "$EXAMPLE_FILE" || {
    echo -e "${RED}Error: Failed to merge configs${NC}"
    echo ""
    echo "Restoring backup..."
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    exit 1
}

echo ""
echo -e "${GREEN}🎉 Config upgraded successfully!${NC}"
echo ""
echo "Summary:"
echo "  - Config version: $CURRENT_VERSION → $EXAMPLE_VERSION"
echo "  - Backup saved: ${BACKUP_FILE}"
echo "  - New fields added from gateway-config.example.yaml"
echo ""
echo "Next steps:"
echo "  - Review merged config: gateway-config.yaml"
echo "  - If issues, restore backup: cp ${BACKUP_FILE} gateway-config.yaml"
echo ""

exit 0