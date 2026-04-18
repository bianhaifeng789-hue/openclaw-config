# Install Guide for Coding Agents

> **One-Line Setup**: 让 Coding Agent 自动完成 OpenClaw 安装和配置

## 交给 Coding Agent 安装

如果你在使用 Claude Code、Codex、Cursor、Windsurf 或其他 Coding Agent，直接把下面这句话发给它：

```text
Help me clone OpenClaw if needed, then bootstrap it for local development by following https://raw.githubusercontent.com/openclaw/openclaw/main/Install.md
```

这条提示词会让 Coding Agent：
1. Clone OpenClaw 仓库（如果需要）
2. 初始化本地开发环境
3. 安装必要依赖
4. 生成配置文件
5. 停在"下一条命令" + 缺少的配置

## What the Agent Will Do

### Step 1: Clone Repository

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Initialize Configuration

```bash
openclaw gateway init
```

这会创建：
- `gateway-config.yaml`（基础配置）
- `.env`（环境变量模板）

### Step 4: Configure Environment

Agent 会提示你提供：
- LLM Provider（OpenAI / Anthropic / Bailian）
- API Key
- Default Model

### Step 5: Start Gateway

```bash
openclaw gateway start
```

## Manual Setup（如果不用 Coding Agent）

### Prerequisites

- Node.js 18+
- npm 或 yarn

### Steps

```bash
# 1. Clone
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 2. Install
npm install

# 3. Init config
openclaw gateway init

# 4. Edit config
# 修改 gateway-config.yaml：
# - 设置 LLM provider
# - 添加 API key（或使用环境变量）

# 5. Start
openclaw gateway start

# 6. Verify
openclaw gateway status
```

## Configuration Example

### gateway-config.yaml

```yaml
agents:
  defaults:
    model: bailian/glm-5
    heartbeat:
      enabled: true
      interval: 1800000  # 30min

llm:
  providers:
    - name: bailian
      type: bailian
      models:
        - name: glm-5
          api_key: $BAILIAN_API_KEY

channels:
  - name: feishu
    enabled: true
    app_id: $FEISHU_APP_ID
    app_secret: $FEISHU_APP_SECRET
```

### .env

```bash
BAILIAN_API_KEY=your_api_key
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret

# MCP OAuth（可选）
MCP_OAUTH_CLIENT_ID=your_client_id
MCP_OAUTH_CLIENT_SECRET=your_client_secret
```

## Verification

```bash
# 检查 Gateway 状态
openclaw gateway status

# 检查配置
openclaw config show

# 测试 LLM 连接
openclaw llm test
```

## Next Steps

安装完成后：
1. 配置 Feishu channel（或其他 IM）
2. 配置 MCP servers（可选）
3. 配置 Skills（可选）
4. 开始使用！

## Troubleshooting

### Gateway won't start

```bash
# 检查日志
openclaw gateway logs

# 检查配置
openclaw config validate

# 重启
openclaw gateway restart
```

### LLM connection fails

```bash
# 检查 API key
openclaw llm test

# 检查 provider
openclaw llm providers
```

### Feishu not working

```bash
# 检查 app credentials
openclaw channel test feishu

# 查看飞书配置
openclaw config show channels
```

## Borrowed From

DeerFlow 2.0 - One-Line Agent Setup Philosophy

**关键借鉴**:
- 专为 Coding Agent 设计的提示词
- 自动 bootstrap + 停在缺少配置
- Hands-off Workflow（减少交互）

---

_创建时间: 2026-04-15_
_借鉴来源: https://github.com/bytedance/deer-flow_