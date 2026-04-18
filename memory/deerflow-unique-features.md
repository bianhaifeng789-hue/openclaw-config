# DeerFlow 值得借鉴的功能分析

## 概览

```
DeerFlow 独特架构:
┌─────────────────────────────────────────────────────────────┐
│  🦌 DeerFlow Architecture                                     │
│                                                              │
│  核心差异:                                                    │
│  ───────────                                                 │
│  1. LangGraph Backend（Agent Runtime）                        │
│  2. 14 Middleware Chain（中间件链）                            │
│  3. OAP Guardrails（开放标准安全护栏）                          │
│  4. Skills System（Skills 加载器）                             │
│  5. Sandbox System（虚拟路径映射）                             │
│                                                              │
│  Skills 数量: 20                                              │
│  Middleware: 14                                               │
│  API Endpoints: 10+                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Middleware Chain（14 个中间件）

### DeerFlow 完整 Middleware 链

```
┌─────────────────────────────────────────────────────────────┐
│  🔗 Middleware Chain（14 个）                                  │
│                                                              │
│  #  Middleware              钩子             功能             │
│  ─────────────────────────────────────────────────────     │
│  0  ThreadData              before_agent     创建线程目录     │
│  1  Uploads                 before_agent     扫描上传文件     │
│  2  Sandbox                 before/after     获取/释放沙箱    │
│  3  DanglingToolCall        after_model      补缺失 ToolMsg   │
│  4  Guardrail               wrap_tool_call   工具调用审核     │
│  5  ToolErrorHandling       wrap_tool_call   工具错误处理     │
│  6  Summarization           after_model      上下文压缩      │
│  7  Todo                    after_model      任务追踪        │
│  8  Title                   after_model      自动标题        │
│  9  Memory                  after_agent      记忆入队        │
│  10 ViewImage               before_model     图片注入        │
│  11 SubagentLimit           after_model      Subagent 限制   │
│  12 LoopDetection           after_model      循环检测        │
│  13 Clarification           after_model      拦截澄清        │
│                                                              │
│  洋葱模型:                                                    │
│  ───────────                                                 │
│  before_agent → before_model → MODEL → after_model → after_agent │
│  正序执行 → 反序执行                                          │
│                                                              │
│  OpenClaw 可借鉴:                                             │
│  ───────────                                                 │
│  ✓ LoopDetection      → 循环检测（防止重复调用）               │
│  ✓ SubagentLimit      → Subagent 并发限制                     │
│  ✓ DanglingToolCall   → 修复不完整 tool calls                 │
│  ✓ LLMErrorHandling   → LLM 错误自动处理                      │
│  ✓ SandboxAudit       → Sandbox 操作审计                      │
│  ✓ DeferredToolFilter → 工具延迟过滤                          │
└─────────────────────────────────────────────────────────────┘
```

### LoopDetection Middleware

```python
# 核心逻辑
class LoopDetectionMiddleware(AgentMiddleware):
    """
    循环检测和打断
    
    策略:
    - 哈希 tool calls (name + args)
    - 滑动窗口追踪最近哈希
    - warn_threshold: 3 次相同调用 → 注入警告
    - hard_limit: 5 相同调用 → 强制停止
    
    作用:
    - 防止 agent 无限循环调用同一工具
    - P0 安全机制
    """
    
    def after_model(self, state, runtime):
        # 哈希 tool calls
        # 检测重复
        # 注入警告或强制停止
```

### SubagentLimit Middleware

```python
# 核心逻辑
class SubagentLimitMiddleware(AgentMiddleware):
    """
    Subagent 并发限制
    
    规则:
    - max_concurrent: 3（范围 2-4）
    - 截断超出限制的 task tool calls
    - 只保留前 N 个
    
    作用:
    - 防止 LLM 生成过多并行 subagent
    - 比 prompt-based 限制更可靠
    """
```

---

## 2. OAP Guardrails（开放标准安全护栏）

### OAP Passport 标准

```
┌─────────────────────────────────────────────────────────────┐
│  🛡️ OAP Guardrails（Open Agent Passport）                     │
│                                                              │
│  开放标准:                                                    │
│  ───────────                                                 │
│  - GitHub: aporthq/aport-spec                                │
│  - JSON Schema 定义                                           │
│  - 任何 OAP-compliant provider 都可用                         │
│                                                              │
│  Passport 结构:                                               │
│  ───────────                                                 │
│  {                                                           │
│    "spec_version": "oap/1.0",                                │
│    "status": "active",                                       │
│    "capabilities": [                                         │
│      {"id": "system.command.execute"},                       │
│      {"id": "data.file.read"},                               │
│      {"id": "data.file.write"}                               │
│    ],                                                        │
│    "limits": {                                               │
│      "system.command.execute": {                             │
│        "allowed_commands": ["git", "npm", "node"],           │
│        "blocked_patterns": ["rm -rf", "sudo"]                │
│      }                                                       │
│    }                                                         │
│  }                                                           │
│                                                              │
│  三种 Provider:                                               │
│  ───────────                                                 │
│  1. AllowlistProvider（零依赖）                               │
│  2. OAP Passport Provider（APort）                            │
│  3. Custom Provider（自定义）                                 │
│                                                              │
│  OpenClaw 可借鉴:                                             │
│  ───────────                                                 │
│  ✓ OAP Passport 标准                                          │
│  ✓ 多 Provider 支持                                           │
│  ✓ fail_closed 默认策略                                       │
│  ✓ GuardrailMiddleware wrap_tool_call                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Skills System（Skills 加载器）

### DeerFlow Skills 结构

```
┌─────────────────────────────────────────────────────────────┐
│  📚 Skills System                                             │
│                                                              │
│  目录结构:                                                    │
│  ───────────                                                 │
│  skills/                                                     │
│  ├── public/           # 公共 Skills（已提交）                │
│  │   ├── deep-research/                                      │
│  │   │   └── SKILL.md                                        │
│  │   ├── chart-visualization/                                │
│  │   │   ├── SKILL.md                                        │
│  │   │   ├── references/（26 个图表规范）                      │
│  │   │   └── scripts/generate.js                             │
│  │   └── ...                                                 │
│  └── custom/           # 自定义 Skills（gitignored）          │
│                                                              │
│  SKILL.md 格式:                                               │
│  ───────────                                                 │
│  ---                                                          │
│  name: PDF Processing                                        │
│  description: Handle PDF documents                           │
│  license: MIT                                                │
│  allowed-tools:                                              │
│    - read_file                                               │
│    - write_file                                              │
│    - bash                                                    │
│  ---                                                          │
│                                                              │
│  # Skill Instructions                                         │
│  Content injected into system prompt...                       │
│                                                              │
│  OpenClaw 可借鉴:                                             │
│  ───────────                                                 │
│  ✓ allowed-tools 限制                                         │
│  ✓ references 目录（规范文档）                                 │
│  ✓ scripts 执行脚本                                           │
│  ✓ templates 模板文件                                         │
│  ✓ license 字段                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Chart Visualization（26 种图表）

### AntV 图表可视化

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Chart Visualization（26 种）                               │
│                                                              │
│  图表类型:                                                    │
│  ───────────                                                 │
│  Time Series:                                                │
│  - generate_line_chart（趋势）                                │
│  - generate_area_chart（累积趋势）                            │
│  - generate_dual_axes_chart（双轴）                           │
│                                                              │
│  Comparisons:                                                │
│  - generate_bar_chart（分类）                                 │
│  - generate_column_chart                                      │
│  - generate_histogram_chart（频率分布）                       │
│                                                              │
│  Part-to-Whole:                                              │
│  - generate_pie_chart                                         │
│  - generate_treemap_chart（层级）                             │
│                                                              │
│  Relationships:                                              │
│  - generate_scatter_chart（相关）                             │
│  - generate_sankey_chart（流向）                              │
│  - generate_venn_chart（重叠）                                │
│                                                              │
│  Maps:                                                       │
│  - generate_district_map（区域）                              │
│  - generate_pin_map（点位）                                   │
│  - generate_path_map（路径）                                  │
│                                                              │
│  Hierarchies:                                                │
│  - generate_organization_chart                                │
│  - generate_mind_map                                         │
│                                                              │
│  Specialized:                                                │
│  - generate_radar_chart（多维）                               │
│  - generate_funnel_chart（漏斗）                              │
│  - generate_liquid_chart（进度）                              │
│  - generate_word_cloud_chart                                  │
│  - generate_boxplot_chart                                     │
│  - generate_violin_chart                                      │
│  - generate_network_graph                                     │
│  - generate_fishbone_diagram                                  │
│  - generate_flow_diagram                                      │
│  - generate_spreadsheet                                       │
│                                                              │
│  OpenClaw 可借鉴:                                             │
│  ───────────                                                 │
│  ✓ AntV 图表生成                                              │
│  ✓ references 规范文档                                        │
│  ✓ generate.js 脚本                                          │
│  ✓ 智能图表选择                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Podcast Generation（TTS 双人对话）

### 火山引擎 TTS

```
┌─────────────────────────────────────────────────────────────┐
│  🎙️ Podcast Generation                                         │
│                                                              │
│  核心功能:                                                    │
│  ───────────                                                 │
│  - 文本转双人对话播客                                          │
│  - 男/女主持交替对话                                           │
│  - 火山引擎 TTS API                                            │
│  - 支持 English/Chinese                                       │
│                                                              │
│  工作流:                                                      │
│  ───────────                                                 │
│  1. 创建 script.json                                          │
│     {                                                        │
│       "locale": "en",                                        │
│       "lines": [                                             │
│         {"speaker": "male", "paragraph": "..."},             │
│         {"speaker": "female", "paragraph": "..."}            │
│       ]                                                      │
│     }                                                        │
│                                                              │
│  2. 执行 generate.py                                          │
│     --script-file script.json                                │
│     --output-file podcast.mp3                                │
│     --transcript-file transcript.md                          │
│                                                              │
│  3. 输出:                                                     │
│     - podcast.mp3（音频）                                     │
│     - transcript.md（文字稿）                                 │
│                                                              │
│  OpenClaw 可借鉴:                                             │
│  ───────────                                                 │
│  ✓ 双人对话播客                                               │
│  ✓ script.json 结构                                          │
│  ✓ transcript.md 文字稿                                       │
│  ✓ "Hello Deer" 格式                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Video Generation（视频生成）

### 结构化 JSON Prompt

```
┌─────────────────────────────────────────────────────────────┐
│  🎬 Video Generation                                           │
│                                                              │
│  核心功能:                                                    │
│  ───────────                                                 │
│  - 结构化 JSON prompt                                          │
│  - 参考图片引导生成                                            │
│  - AIGC 视频生成                                               │
│                                                              │
│  Prompt 结构:                                                 │
│  ───────────                                                 │
│  {                                                           │
│    "title": "...",                                           │
│    "background": {                                           │
│      "description": "...",                                   │
│      "era": "1940s wartime Britain",                         │
│      "location": "London railway station"                    │
│    },                                                        │
│    "characters": ["Mrs. Pevensie", "Lucy"],                  │
│    "camera": {                                               │
│      "type": "Close-up two-shot",                            │
│      "movement": "Static with subtle handheld",              │
│      "angle": "Profile view",                                │
│      "focus": "Both faces in focus"                          │
│    },                                                        │
│    "dialogue": [...],                                        │
│    "audio": [...]                                            │
│  }                                                           │
│                                                              │
│  OpenClaw 可借鉴:                                             │
│  ───────────                                                 │
│  ✓ 结构化 JSON prompt                                          │
│  ✓ background/characters/camera/audio 分段                   │
│  ✓ 参考图片支持                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Data Analysis（DuckDB SQL）

### Excel/CSV 分析

```
┌─────────────────────────────────────────────────────────────┐
│  📈 Data Analysis                                              │
│                                                              │
│  核心功能:                                                    │
│  ───────────                                                 │
│  - DuckDB SQL 分析引擎                                        │
│  - Excel/CSV 文件处理                                         │
│  - 多表 JOIN                                                  │
│  - 统计摘要                                                   │
│  - 缓存系统                                                   │
│                                                              │
│  工作流:                                                      │
│  ───────────                                                 │
│  1. inspect → 查看结构                                        │
│  2. query → 执行 SQL                                          │
│  3. summary → 统计摘要                                        │
│  4. export → 导出结果                                         │
│                                                              │
│  OpenClaw 可借鉴:                                             │
│  ───────────                                                 │
│  ✓ DuckDB SQL 引擎                                            │
│  ✓ 缓存系统（SHA256 hash）                                    │
│  ✓ 多文件 JOIN                                                │
│  ✓ 统计摘要（mean/median/stddev）                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Memory System（TF-IDF + Context-aware）

### 记忆检索改进

```
┌─────────────────────────────────────────────────────────────┐
│  🧠 Memory System Improvements                                 │
│                                                              │
│  已实现:                                                      │
│  ───────────                                                 │
│  ✓ tiktoken token counting                                   │
│  ✓ Facts confidence ranking                                  │
│  ✓ max_injection_tokens budget                               │
│                                                              │
│  计划中:                                                      │
│  ───────────                                                 │
│  ⏳ TF-IDF similarity-based retrieval                         │
│  ⏳ current_context for context-aware scoring                 │
│  ⏳ weighted scoring: (similarity * 0.6) + (confidence * 0.4) │
│                                                              │
│  OpenClaw 可借鉴:                                             │
│  ───────────                                                 │
│  ✓ TF-IDF 相似度检索                                          │
│  ✓ 上下文感知评分                                              │
│  ✓ 加权评分策略                                                │
│  ✓ tiktoken token counting                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Sandbox System（虚拟路径映射）

### 虚拟路径架构

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Sandbox System                                             │
│                                                              │
│  虚拟路径映射:                                                 │
│  ───────────                                                 │
│  Virtual Path                Physical Path                   │
│  ─────────────────────────────────────────────             │
│  /mnt/user-data/workspace    .deer-flow/threads/{id}/workspace │
│  /mnt/user-data/uploads      .deer-flow/threads/{id}/uploads   │
│  /mnt/user-data/outputs      .deer-flow/threads/{id}/outputs   │
│  /mnt/skills                 deer-flow/skills/                 │
│                                                              │
│  Sandbox Provider:                                            │
│  ───────────                                                 │
│  - LocalSandboxProvider（开发）                               │
│  - AioSandboxProvider（Docker 生产）                          │
│                                                              │
│  OpenClaw 可借鉴:                                             │
│  ───────────                                                 │
│  ✓ 虚拟路径映射                                                │
│  ✓ 线程隔离目录                                                │
│  ✓ Sandbox Audit Middleware                                   │
│  ✓ Docker-based isolation                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Reflection System（反思系统）

### 行为反思

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 Reflection System                                          │
│                                                              │
│  核心功能:                                                    │
│  ───────────                                                 │
│  - resolve_class（类解析）                                    │
│  - resolve_variable（变量解析）                               │
│  - 动态加载                                                   │
│                                                              │
│  OpenClaw 已借鉴:                                             │
│  ───────────                                                 │
│  ✓ Reflection Skill（之前已创建）                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 总结：值得借鉴的功能

### 已实现（之前）

```
✅ Reflection
✅ Tracing
✅ AioSandbox
✅ Memory Enhanced
✅ Guardrails
✅ Deep Research
✅ PPT Generation
✅ Subagents
✅ 学术论文评审
✅ 新闻简报
✅ 前端设计
✅ 咨询分析
✅ Vercel 部署
✅ 惊喜功能
✅ Web 设计指南
✅ Skills 发现
✅ Bootstrap 增强
✅ InfoQuest
✅ Smart Trigger V3
```

### 新发现值得借鉴

```
⏳ LoopDetection Middleware（循环检测）
⏳ SubagentLimit Middleware（并发限制）
⏳ DanglingToolCall Middleware（不完整 tool calls）
⏳ LLMErrorHandling Middleware（LLM 错误处理）
⏳ SandboxAudit Middleware（Sandbox 审计）
⏳ Chart Visualization（26 种图表）
⏳ Podcast Generation（双人播客）
⏳ Video Generation（结构化 prompt）
⏳ Data Analysis（DuckDB SQL）
⏳ OAP Passport 标准
⏳ Memory TF-IDF（上下文感知）
⏳ allowed-tools 限制
```

---

_分析完成：2026-04-11_