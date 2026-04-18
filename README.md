# OpenClaw Workspace - Claude Code Patterns

我的 OpenClaw 配置，借鉴 Claude Code 核心机制。

## 目录结构

```
workspace/
├── MEMORY.md          # 长期记忆（不含敏感信息）
├── HEARTBEAT.md       # 心跳任务定义
├── AGENTS.md          # Agent 行为规范
├── SOUL.md            # AI 人格定义
├── USER.md            # 用户信息
├── TOOLS.md           # 工具配置
├── IDENTITY.md        # AI 身份
├── impl/              # 扩展实现
│   ├── utils/         # 300+ TypeScript 文件
│   └── bin/           # CLI 工具
│   └── package.json
└── skills/            # 自定义 Skills
```

## 部署步骤

### 1. 克隆仓库

```bash
git clone https://github.com/你的用户名/openclaw-config.git
cd openclaw-config
```

### 2. 安装依赖

```bash
cd impl
npm install
npm run build
```

### 3. 复制到 OpenClaw

```bash
cp -r . ~/.openclaw/workspace/
```

### 4. 配置飞书（需手动）

创建 `~/.openclaw/openclaw.json`：

```json
{
  "models": {
    "models": ["bailian/glm-5"]
  },
  "heartbeat": {
    "enabled": true,
    "every": "30m"
  },
  "plugins": ["feishu"],
  "channels": {
    "feishu": {
      "enabled": true,
      "accounts": {
        "default": {
          "appId": "你的appId",
          "appSecret": "你的appSecret",
          "connectionMode": "websocket"
        }
      }
    }
  }
}
```

### 5. 重启

```bash
openclaw gateway restart
```

## 功能

- ✅ 心跳自动调度（22 任务）
- ✅ 健康监控 + 自动修复
- ✅ 记忆系统（MEMORY.md + daily notes）
- ✅ 飞书卡片通知
- ✅ Notifier/Bridge/Analytics 服务

## Stats

- impl/utils: **300** TypeScript 文件
- skills: **530** workspace skills
- 编译状态: ✅ 成功

---

**注意**: `openclaw.json` 不上传，因为包含 appSecret。