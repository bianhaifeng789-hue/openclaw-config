# Harness Engineering 差异清单

## 🔴 完全缺失的文件（需要移植）

### 1. 配置文件
| 原始文件 | 本地状态 | 重要性 | 备注 |
|---------|---------|--------|------|
| `.env.template` | ❌ 缺失 | 🔥 高 | API 配置模板，用户复制后填入 key |
| `requirements.txt` | ❌ 缺失 | 🔸 中 | Python 依赖列表（openai, tiktoken, playwright） |

### 2. Profiles 目录
| 原始文件 | 本地状态 | 重要性 | 备注 |
|---------|---------|--------|------|
| `profiles/__init__.py` | ❌ 缺失 | 🔹 低 | Python 包初始化文件（Node.js 不需要） |
| `profiles/base.py` | ⚠️ 简化 | 🔥 高 | 缺少 ProfileConfig 类、resolve() 方法、环境变量优先级 |

### 3. Benchmarks 目录
| 原始文件 | 本地状态 | 重要性 | 备注 |
|---------|---------|--------|------|
| `benchmarks/README.md` | ❌ 缺失 | 🔹 低 | Benchmark 使用说明 |
| `benchmarks/harbor_agent.py` | ✅ 已移植 | - | 已移植为 harbor-adapter.js |
| `benchmarks/tb2_tasks.json` | ✅ 已移植 | - | 已复制 |

### 4. Scripts 目录
| 原始文件 | 本地状态 | 重要性 | 备注 |
|---------|---------|--------|------|
| `scripts/analyze_results.py` | ❌ 缺失 | 🔸 中 | TB2 结果分析脚本（失败分类 + 重试命令生成） |

### 5. Skills 目录
| 原始文件 | 本地状态 | 重要性 | 备注 |
|---------|---------|--------|------|
| `skills/*` (36个) | ✅ 已移植 | - | 已复制到 skills/tb2/ 目录 |

---

## 🟡 功能缺失（已移植但简化）

### 1. config.py → config-cli.js
| 功能 | 原始 | 本地 | 差异 |
|------|------|------|------|
| `.env` 加载 | ✅ `_load_dotenv()` | ✅ `loadDotenv()` | **相同** |
| 配置验证 | ✅ 验证函数 | ✅ `validate()` | **相同** |
| 配置生成 | ❌ 无 | ✅ `env` 命令 | **本地新增** |

### 2. skills.py → skills-registry.js
| 功能 | 原始 | 本地 | 差异 |
|------|------|------|------|
| Frontmatter 解析 | ✅ `_parse_frontmatter()` | ✅ `_parseFrontmatter()` | **相同** |
| Skill 发现 | ✅ `_discover()` | ✅ `_discover()` | **相同** |
| Catalog Prompt | ✅ `build_catalog_prompt()` | ✅ `buildCatalogPrompt()` | **相同** |

### 3. logger.py → logger-cli.js
| 功能 | 原始 | 本地 | 差异 |
|------|------|------|------|
| ANSI 颜色类 | ✅ `class C` | ✅ `class C` | **相同** |
| Agent 样式映射 | ✅ `AGENT_STYLES` | ✅ `AGENT_STYLES` | **相同** |
| 自定义格式化器 | ✅ `HarnessFormatter` | ✅ `HarnessFormatter` | **相同** |
| 消息分类 | ✅ 详细分类 | ✅ 详细分类 | **相同** |

### 4. profiles/base.py → profiles-cli.js
| 功能 | 原始 | 本地 | 差异 |
|------|------|------|------|
| `AgentConfig` 类 | ✅ dataclass | ⚠️ 简化对象 | **缺少 dataclass 特性** |
| `ProfileConfig` 类 | ✅ dataclass + resolve() | ❌ 缺失 | **🔥 重要缺失** |
| 环境变量优先级 | ✅ `PROFILE_<NAME>_<KEY>` | ❌ 缺失 | **🔥 重要缺失** |
| `format_build_task()` | ✅ 方法 | ⚠️ 简化 | **缺少完整逻辑** |
| `extract_score()` | ✅ 正则解析 | ✅ `extractScore()` | **相同** |
| `resolve_task_timeout()` | ✅ 方法 | ❌ 缺失 | **🔥 重要缺失** |
| `resolve_time_allocation()` | ✅ 方法 | ❌ 缺失 | **🔥 重要缺失** |

### 5. prompts.py → prompts-cli.js
| 功能 | 原始 | 本地 | 差异 |
|------|------|------|------|
| PLANNER_SYSTEM | ✅ 完整提示词 | ✅ 简化版本 | **⚠️ 缺少详细说明** |
| BUILDER_SYSTEM | ✅ 完整提示词 | ✅ 简化版本 | **⚠️ 缺少详细说明** |
| EVALUATOR_SYSTEM | ✅ 完整提示词 | ✅ 简化版本 | **⚠️ 缺少详细说明** |
| CONTRACT_BUILDER_SYSTEM | ✅ 完整提示词 | ✅ 简化版本 | **⚠️ 缺少详细说明** |
| CONTRACT_REVIEWER_SYSTEM | ✅ 完整提示词 | ✅ 简化版本 | **⚠️ 缺少详细说明** |

---

## 🟢 OpenClaw 独有功能（Harness Engineering 没有）

| 文件 | 功能 | 备注 |
|------|------|------|
| `HEARTBEAT.md` | 39 个心跳任务 | OpenClaw 特有 |
| `AGENTS.md` | Agent 工作空间指南 | OpenClaw 特有 |
| `SOUL.md` | Agent 身份定义 | OpenClaw 特有 |
| `USER.md` | 用户画像 | OpenClaw 特有 |
| `IDENTITY.md` | Agent 身份配置 | OpenClaw 特有 |
| `MEMORY.md` | 持久记忆 | OpenClaw 特有 |
| `impl/bin/*.js` (124个) | 完整脚本库 | 远超原始仓库（6个 Python 文件） |
| `skills/harness-*` | OpenClaw 自定义技能 | 原始仓库没有 |
| 飞书集成 | 消息/卡片/反应 | 原始仓库没有 |

---

## 📊 文件数量对比

| 目录 | Harness Engineering | OpenClaw | 差异 |
|------|---------------------|---------|------|
| 核心文件 (*.py → *.js) | 6 | 11 | OpenClaw 多（包含额外功能） |
| Profiles | 5 | 1（内置） | OpenClaw 简化合并 |
| Skills | 36 | 36 + 7 自定义 | OpenClaw 更多 |
| Benchmarks | 3 | 1 | OpenClaw 缺少 2 个文档 |
| Scripts | 1 | 0 | OpenClaw 缺少分析脚本 |
| 配置文件 | 2 | 0 | OpenClaw 缺少模板 |
| **总计** | **56** | **124+** | OpenClaw 远超 |

---

## 🔥 高优先级缺失（必须补充）

### 1. `.env.template` - 用户配置模板
```bash
# Copy this file to .env and fill in your values:
#   cp .env.template .env

# --- API Configuration ---
OPENAI_API_KEY=sk-your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
HARNESS_MODEL=gpt-4o

# --- Workspace ---
HARNESS_WORKSPACE=./workspace

# --- Harness Tuning (optional) ---
MAX_HARNESS_ROUNDS=5
PASS_THRESHOLD=7.0
COMPRESS_THRESHOLD=80000
RESET_THRESHOLD=150000
MAX_AGENT_ITERATIONS=500
```

### 2. `ProfileConfig` 类 - 配置优先级系统
```javascript
// 缺失功能：
// - 环境变量优先级：PROFILE_<NAME>_<KEY>
// - resolve() 方法
// - 时间预算分配
// - 任务超时解析
```

### 3. `profiles/base.py` 的完整方法
```javascript
// 缺失方法：
// - format_build_task(user_prompt, round_num, prev_feedback, score_history)
// - resolve_task_timeout(user_prompt)
// - resolve_time_allocation(user_prompt)
```

### 4. `prompts.py` 的完整提示词
```javascript
// 当前版本缺少：
// - PLANNER_SYSTEM 的详细规则
// - BUILDER_SYSTEM 的技术指南
// - EVALUATOR_SYSTEM 的测试流程
// - CONTRACT 系统提示词
```

---

## 🔸 中优先级缺失（可选补充）

### 1. `requirements.txt` - 依赖声明
虽然 Node.js 不需要 Python 依赖，但可以创建 `package.json` 作为替代：
```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "playwright": "^1.40.0"
  }
}
```

### 2. `scripts/analyze_results.js` - 结果分析
移植 `analyze_results.py` 的功能：
- 失败分类（rate_limit, timeout, missing_tool 等）
- 重试命令生成

### 3. `benchmarks/README.md` - 使用说明
说明如何在 OpenClaw 运行 TB2 benchmark

---

## 🔹 低优先级缺失（忽略）

### 1. `profiles/__init__.py`
Python 包初始化文件，Node.js 不需要

### 2. `benchmarks/harbor_agent.py`
已移植为 `harbor-adapter.js`，原始文件保留作为参考

---

## 总结

**核心差距**：
1. ✅ Skills（36个 TB2 任务） - **已修复**，移到 `skills/tb2/`
2. 🔥 `.env.template` - **需要创建**
3. 🔥 `ProfileConfig` 类和 resolve() 方法 - **需要补充**
4. 🔥 完整的 prompts.py 提示词 - **需要补充详细版本**
5. 🔸 `analyze_results` 脚本 - **可选**
6. 🔸 `benchmarks/README.md` - **可选**

**OpenClaw 优势**：
- 124 个脚本 vs 原始 6 个
- 39 个心跳任务 vs 原始 0 个
- 飞书集成 vs 原始无
- MEMORY.md 持久记忆系统 vs 原始无

---

创建时间：2026-04-17
状态：需要补充高优先级缺失