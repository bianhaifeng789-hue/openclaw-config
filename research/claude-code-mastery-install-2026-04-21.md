# Claude Code Mastery & awesome-claude-md 安装报告

安装时间：2026-04-21 01:12 Asia/Shanghai

---

## 已安装内容

### 1. Claude Code Mastery
**来源**：https://github.com/TheDecipherist/claude-code-mastery

**安装位置**：
| 类型 | 数量 | 路径 |
|---|---|---|
| Hooks | 5 | ~/.openclaw/hooks/ |
| Skills | 2 | ~/.openclaw/skills/ |
| Commands | ~6 | ~/.openclaw/commands/ |
| Templates | 4 | ~/.openclaw/templates/claude-code-mastery/ |

**Hooks 列表**：
- `block-secrets.py` - 阻止访问 .env 和 credentials 文件
- `block-dangerous-commands.sh` - 阻止 rm -rf 等危险命令
- `after-edit.sh` - 文件编辑后运行 formatter
- `end-of-turn.sh` - turn 结束时 quality gate
- `notify.sh` - 桌面通知

**Skills 列表**：
- `commit-messages` - Conventional commit 生成
- `security-audit` - Vulnerability scanning checklist

**Templates 列表**：
- `global-claude.md` - 全局 CLAUDE.md 模板
- `project-claude.md` - 项目 CLAUDE.md 模板
- `settings.json` - Claude Code settings 模板
- `.gitignore` - Recommended ignore patterns

---

### 2. awesome-claude-md
**来源**：https://github.com/sx4im/awesome-claude-md

**安装位置**：`~/.openclaw/templates/`

**模板数量**：400+

**覆盖框架**：
- Frontend: Next.js, React, Vue, Angular, Astro, Svelte, Nuxt
- Backend: Django, Flask, FastAPI, Express, NestJS, Spring Boot
- Mobile: Flutter, React Native, SwiftUI, Kotlin
- DevOps: Kubernetes, Terraform, Ansible, Docker, GitHub Actions
- Languages: Python, TypeScript, Go, Rust, Java, Ruby, PHP
- 更多...

---

## 配置状态

### Hooks（可选激活）

已创建 OpenClaw 格式的 hooks 配置文件：
`~/.openclaw/workspace/hooks-config-mastery.json`

**配置内容**：
```json
{
  "hooks": [
    {
      "event": "PreToolUse",
      "matcher": {"toolName": "read|edit|write"},
      "command": "python3 ~/.openclaw/hooks/block-secrets.py",
      "description": "Block access to .env and credentials files"
    },
    {
      "event": "PreToolUse",
      "matcher": {"toolName": "exec"},
      "command": "~/.openclaw/hooks/block-dangerous-commands.sh",
      "description": "Block dangerous bash commands"
    },
    {
      "event": "PostToolUse",
      "matcher": {"toolName": "edit|write"},
      "command": "~/.openclaw/hooks/after-edit.sh",
      "description": "Run formatters after file edits"
    },
    {
      "event": "Stop",
      "command": "~/.openclaw/hooks/end-of-turn.sh",
      "description": "Quality gates at end of turn"
    }
  ],
  "enabled": true,
  "version": "1.2.0"
}
```

**激活方式**：
```bash
# 合并到现有 hooks 配置
cat ~/.openclaw/workspace/hooks-config-mastery.json | jq '.hooks' >> ~/.openclaw/workspace/hooks-config.json

# 或直接替换
cp ~/.openclaw/workspace/hooks-config-mastery.json ~/.openclaw/workspace/hooks-config.json
```

---

## 使用方式

### Templates（项目 CLAUDE.md）

**选择模板**：
```bash
# 列出所有可用模板
ls ~/.openclaw/templates/

# 复制到项目根目录
cp ~/.openclaw/templates/nextjs/CLAUDE.md ./CLAUDE.md
```

**常用模板**：
- `nextjs` - Next.js App Router 项目
- `react` - React 项目
- `django` - Django 项目
- `fastapi` - FastAPI 项目
- `express` - Express 项目
- `flutter` - Flutter 项目
- `kubernetes` - Kubernetes 项目

### Skills（OpenClaw）

**commit-messages skill**：
- 自动生成 conventional commit 消息
- 格式：`type(scope): description`

**security-audit skill**：
- 漏洞扫描 checklist
- 代码审查安全要点

---

## Commands（需适配）

Claude Code Mastery 的 commands 是 Claude Code 的 slash commands 格式：
- `/new-project`
- `/security-check`
- `/pre-commit`
- `/docs-lookup`

**OpenClaw 适配**：
- OpenClaw 使用 skills 而非 slash commands
- 需要将 commands 转换为 skills 格式
- 或保持 commands 目录供参考

---

## Hooks 警告

**block-secrets.py**：
- 阻止所有 .env 文件访问（包括 .env.example）
- 可能影响正常的配置文件操作
- 建议：修改 SENSITIVE_FILENAMES 列表，排除 .env.example

**block-dangerous-commands.sh**：
- 阻止 rm -rf、git push --force 等
- 可能影响正常的清理和重置操作
- 建议：测试后再激活

---

## 后续建议

1. **先测试 hooks**：在非关键项目上测试 hooks 行为
2. **修改 sensitive 列表**：根据项目需求调整 block-secrets.py
3. **选择模板**：根据项目技术栈选择合适的 CLAUDE.md 模板
4. **适配 commands**：将 slash commands 转换为 OpenClaw skills

---

## 源码位置

- Claude Code Mastery: `~/Tools/claude-code-mastery/`
- awesome-claude-md: `~/Tools/awesome-claude-md/`

---

_安装人：Claw_  
_安装时间：2026-04-21 01:12 Asia/Shanghai_