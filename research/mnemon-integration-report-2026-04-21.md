# Mnemon 集成完成报告

集成时间：2026-04-21 00:53 Asia/Shanghai

---

## 集成步骤

### 1. 下载 Mnemon binary
```bash
curl -sL https://github.com/mnemon-dev/mnemon/releases/download/v0.1.1/mnemon_0.1.1_darwin_arm64.tar.gz | tar xz -C ~/Tools/
```

### 2. 部署到 OpenClaw（全局）
```bash
~/Tools/mnemon setup --target openclaw --global --yes
```

**输出**：
- Skill: `/Users/mac/.openclaw/skills/mnemon/SKILL.md`
- Hook: `/Users/mac/.openclaw/hooks/mnemon-prime/`
- Plugin: `/Users/mac/.openclaw/extensions/mnemon/`
- Prompts: `~/.mnemon/prompt/`
- Config: `~/.openclaw/openclaw.json` updated

### 3. 重启 OpenClaw Gateway
```bash
gateway restart
```

---

## 验证结果

### Status 检查
```bash
~/Tools/mnemon status
```

**结果**：
```json
{
  "by_category": {
    "decision": 1,
    "fact": 1,
    "preference": 1
  },
  "db_path": "/Users/mac/.mnemon/data/default/mnemon.db",
  "db_size_bytes": 81920,
  "deleted_insights": 0,
  "edge_count": 6,
  "oplog_count": 4,
  "top_entities": [
    {"entity": "用户", "count": 1},
    {"entity": "流程图", "count": 1},
    {"entity": "模板", "count": 1},
    {"entity": "UI", "count": 1},
    {"entity": "PRD", "count": 1},
    {"entity": "OpenClaw", "count": 1},
    {"entity": "Mnemon", "count": 1}
  ],
  "total_insights": 3
}
```

### Recall 测试
```bash
~/Tools/mnemon recall "PRD" --limit 5
```

**结果**：
- 成功返回 3 条相关记忆
- 第一条命中 PRD 模板创建（score=1）
- 自动 temporal edges 连接

### Link 测试
```bash
~/Tools/mnemon link <id1> <id2> --type semantic --weight 0.8
```

**结果**：
- 成功建立 semantic edge
- 支持自定义 metadata

---

## 安装位置

| 文件 | 路径 |
|---|---|
| Binary | ~/Tools/mnemon |
| Skill | ~/.openclaw/skills/mnemon/SKILL.md |
| Hook | ~/.openclaw/hooks/mnemon-prime/ |
| Plugin | ~/.openclaw/extensions/mnemon/ |
| Database | ~/.mnemon/data/default/mnemon.db |
| Prompts | ~/.mnemon/prompt/ |

---

## 核心能力

### 三个原语
1. **remember** - 存储新记忆
2. **link** - 建立关联
3. **recall** - 检索记忆

### Four-graph architecture
- Temporal graph（时序） - 自动创建
- Entity graph（实体） - 基于 entities 字段
- Causal graph（因果） - 需手动 link
- Semantic graph（语义） - 需手动 link 或 similarity

### Categories
- `preference` - 用户偏好
- `decision` - 决策
- `insight` - 洞察
- `fact` - 事实
- `context` - 上下文

---

## 使用方式

### Remember
```bash
mnemon remember "<fact>" --cat <cat> --imp <1-5> --entities "e1,e2" --source agent
```

### Recall
```bash
mnemon recall "<query>" --limit 10
```

### Link
```bash
mnemon link <id1> <id2> --type <type> --weight <0-1>
```

### Status
```bash
mnemon status
```

---

## 注意事项

1. **不要存储敏感信息**：密码、token、密钥等
2. **使用正确的 category**：preference/decision/insight/fact/context
3. **实体命名**：使用有意义的实体名，便于后续检索
4. **importance 等级**：1-5，越高越重要
5. **recall 查询**：关键词优于完整句子

---

## 与 OpenClaw 的集成

### Plugin hooks
- `before_prompt_build` - 在构建 prompt 前 recall
- `agent_end` - 在 agent 结束后 remember

### Skill
- OpenClaw 自动加载 skill
- 可通过 skill 调用 mnemon 命令

### Prompts
- `guide.md` - recall/remember 的决策流程
- `skill.md` - skill 使用说明

---

## 后续计划

### P0 - 本周
- ✅ Mnemon 集成完成
- 熟悉 remember/recall/link workflow
- 评估实际使用效果

### P1 - 本月
- 将关键决策和洞察存入 Mnemon
- 建立 memory-maintenance 与 Mnemon 的协作
- 评估是否替代/增强 MEMORY.md

### P2 - 季度
- 启用 embeddings（需要 Ollama）
- 评估 four-graph 的实际效果
- 跨项目/跨 session 记忆共享

---

_集成人：Claw_  
_集成时间：2026-04-21 00:53 Asia/Shanghai_