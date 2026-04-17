#!/bin/bash
# Skills格式转换脚本
# 将workspace skills转换为OpenClaw兼容格式

WORKSPACE_SKILLS="$HOME/.openclaw/workspace/skills"
CONVERTED="$HOME/.openclaw/workspace/skills-converted"

mkdir -p "$CONVERTED"

# 转换函数
convert_skill() {
  local skill_dir="$1"
  local skill_name=$(basename "$skill_dir")
  local skill_md="$skill_dir/SKILL.md"
  
  if [ ! -f "$skill_md" ]; then
    return
  fi
  
  # 提取第一行作为description
  local first_line=$(head -1 "$skill_md" | sed 's/^# //')
  local description="$first_line"
  
  # 创建目标目录
  local target_dir="$CONVERTED/$skill_name"
  mkdir -p "$target_dir"
  
  # 创建OpenClaw兼容的SKILL.md
  cat > "$target_dir/SKILL.md" << EOF
---
name: $skill_name
description: "$description"
metadata:
  {
    "openclaw":
      {
        "emoji": "⚙️",
        "source": "claude-code-pattern",
      },
  }
---
EOF
  
  # 追加原内容（去掉第一行标题）
  tail -n +2 "$skill_md" >> "$target_dir/SKILL.md"
  
  echo "Converted: $skill_name"
}

# 批量转换
for skill_dir in "$WORKSPACE_SKILLS"/*; do
  if [ -d "$skill_dir" ]; then
    convert_skill "$skill_dir"
  fi
done

echo "Total converted: $(ls -1 "$CONVERTED" | wc -l) skills"