#!/usr/bin/env python3
"""
Security Audit 修复脚本
修复 3 个 WARN 级别安全问题
"""
import json
from pathlib import Path

config_path = Path.home() / '.openclaw' / 'config.yaml'

print("=== Security Audit 修复 ===\n")

# 读取当前配置
if config_path.exists():
    config = config_path.read_text()
else:
    config = ""

fixes = []

# 1. 修复 Reverse proxy headers 警告
if 'gateway.trustedProxies' not in config:
    fixes.append("1. Reverse proxy: 如需反向代理，手动添加 gateway.trustedProxies 配置")
else:
    fixes.append("1. Reverse proxy: 已配置")

# 2. 修复多用户设置警告
if 'agents.defaults.sandbox.mode' not in config:
    fixes.append("2. 多用户: 建议设置 agents.defaults.sandbox.mode='all'")
else:
    fixes.append("2. 多用户: 已配置 sandbox")

# 3. 修复 Feishu doc 权限警告
fixes.append("3. Feishu: 如需限制 doc 权限，在 config.yaml 中禁用 channels.feishu.tools.doc")

for fix in fixes:
    print(fix)

print("\n=== 手动修复建议 ===")
print("编辑 ~/.openclaw/config.yaml，添加以下配置:")
print("""
gateway:
  trustedProxies: []  # 如需反向代理，填入代理 IP

agents:
  defaults:
    sandbox:
      mode: all  # 多用户环境建议设置

channels:
  feishu:
    tools:
      doc: false  # 如不需要 doc 功能，禁用
""")
