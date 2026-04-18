#!/usr/bin/env python3
"""
OpenClaw 深度优化脚本 - 第十一轮
处理剩余优化点
"""
import os
import shutil
from pathlib import Path
import subprocess

workspace = Path('/Users/mar2game/.openclaw/workspace')
print("=== OpenClaw 深度优化 (第十一轮) ===\n")

# 1. 清理 impl/node_modules 中的重复 typescript
impl_node = workspace / 'impl' / 'node_modules'
if impl_node.exists():
    ts_dir = impl_node / 'typescript'
    if ts_dir.exists():
        size = sum(f.stat().st_size for f in ts_dir.rglob('*') if f.is_file())
        print(f"[1/5] impl/node_modules/typescript: {size/1024/1024:.1f} MB")
        print("  注意: 这是 impl 构建依赖，如需清理请手动确认")

# 2. 清理 .git 大文件 (可选 gc)
print("\n[2/5] Git 仓库优化:")
git_dir = workspace / '.git'
if git_dir.exists():
    pack_files = list(git_dir.glob('objects/pack/*.pack'))
    total_pack = sum(f.stat().st_size for f in pack_files)
    print(f"  Pack 文件: {len(pack_files)} 个, {total_pack/1024/1024:.1f} MB")
    print("  建议运行: git gc --aggressive")

# 3. 检查并清理空目录
print("\n[3/5] 空目录检查:")
empty_dirs = []
for root, dirs, files in os.walk(workspace):
    if '.git' in root or 'node_modules' in root:
        continue
    for d in dirs:
        dir_path = Path(root) / d
        try:
            if not any(dir_path.iterdir()):
                empty_dirs.append(dir_path)
        except:
            pass
print(f"  发现 {len(empty_dirs)} 个空目录")

# 4. 检查 skills 重复
print("\n[4/5] Skills 检查:")
skills_dir = workspace / 'skills'
skills = [d for d in skills_dir.iterdir() if d.is_dir()]
print(f"  总 Skills: {len(skills)} 个")

# 5. 检查大文件
print("\n[5/5] 大文件检查 (>5MB):")
large_files = []
for root, dirs, files in os.walk(workspace):
    if '.git' in root:
        continue
    for f in files:
        fpath = Path(root) / f
        try:
            if fpath.stat().st_size > 5 * 1024 * 1024:
                large_files.append((fpath, fpath.stat().st_size))
        except:
            pass

for f, size in sorted(large_files, key=lambda x: x[1], reverse=True)[:5]:
    print(f"  {f.relative_to(workspace)}: {size/1024/1024:.1f} MB")

print("\n=== 优化建议 ===")
print("1. 运行: git gc --aggressive  (清理 git 历史)")
print("2. 检查: impl/node_modules 是否可清理")
print("3. 考虑: 归档旧 memory 文件")
print("4. 可选: npm prune --omit=dev  (移除 dev 依赖)")
