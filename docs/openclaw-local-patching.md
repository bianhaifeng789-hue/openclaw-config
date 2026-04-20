# OpenClaw 本地 dist 补丁方案

这个目录放的是“可持续”的本地补丁定义，不再把一次性逻辑硬编码进单个脚本。

## 目标

用于修补已安装的 `~/.npm-global/lib/node_modules/openclaw` 包内的 dist 文件，适合这类情况：

- 上游暂时还没合并修复
- 需要在本机升级后快速重打补丁
- dist 文件名带 hash，不能写死文件名

## 结构

- `scripts/apply-openclaw-patches.py`
  - 通用补丁执行器
  - 根据 patch spec 自动查找目标文件并执行替换
- `scripts/openclaw-patches/*.patchspec.json`
  - 每个补丁一个 spec
  - 定义匹配条件、已打标记、替换内容

## 用法

### 检查将要作用到哪些文件

```bash
npm run patch:openclaw:check
```

### 实际应用所有补丁

```bash
npm run patch:openclaw
```

### 指定安装目录

```bash
python3 scripts/apply-openclaw-patches.py --all --root ~/.npm-global/lib/node_modules/openclaw
```

## 升级后自动重打建议

推荐两种方式，按侵入性从低到高：

### 方案 A，升级后手工补一次

适合偶发升级，最稳。

```bash
npm install -g openclaw@latest
cd ~/.openclaw/workspace
npm run patch:openclaw
```

### 方案 B，本机包装成升级脚本

新建一个本地脚本，比如：

```bash
#!/usr/bin/env bash
set -euo pipefail
npm install -g openclaw@latest
cd ~/.openclaw/workspace
npm run patch:openclaw
openclaw gateway restart
```
```

这样以后统一走这个脚本升级。

## 设计原则

- 不写死 hash 文件名，改为 glob 查找
- 先检查 `alreadyPatched`，保证可重复执行
- 文件结构变化时直接失败，避免 silent corruption
- patch spec 独立存放，后续继续加补丁也容易

## 当前补丁

### toolresult-compaction

目的：把高风险的 `exec` / `read` 大文本 tool result 做更激进的持久化压缩，降低 session context 被大输出污染的风险。
