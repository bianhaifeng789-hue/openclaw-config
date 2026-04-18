# 模型调用与任务执行优化方案

## 瓶颈分析

### 1. 模型调用延迟
**现象**: 每次工具调用后等待模型响应，可能 10-30 秒
**原因**:
- LLM API 响应慢（网络 + 推理）
- 思考链(thinking)模式增加延迟
- 模型选择不当（复杂模型 vs 快速模型）

### 2. 任务执行阻塞
**现象**: 一个任务完成后才能开始下一个
**原因**:
- 串行执行，无法并行
- 长工具调用阻塞主线程
- 无后台执行机制

### 3. 上下文膨胀
**现象**: 随着对话进行，响应越来越慢
**原因**:
- Context window 越来越大
- 模型处理更多 tokens
- 没有及时压缩清理

---

## 优化方案矩阵

| 问题 | 方案 | 实施难度 | 效果 |
|------|------|---------|------|
| **模型响应慢** | 模型分级策略 | 低 | ⭐⭐⭐⭐ |
| **串行阻塞** | spawn 后台执行 | 中 | ⭐⭐⭐⭐⭐ |
| **上下文膨胀** | 自动压缩 | 中 | ⭐⭐⭐ |
| **重复查询** | 缓存机制 | 中 | ⭐⭐⭐ |
| **工具过多** | 工具过滤 | 低 | ⭐⭐ |

---

## 方案1: 模型分级策略

**核心思想**: 不同任务用不同模型

```yaml
# 建议配置
agents:
  dispatcher:
    # 快速模型（日常对话、简单任务）
    model_fast: bailian/glm-4-flash  # 或 gpt-4o-mini
    
    # 主模型（复杂分析、规划）
    model_main: bailian/glm-5
    
    # 深度模型（代码、推理）
    model_deep: claude-3-5-sonnet
    
    # 任务分级规则
    task_routing:
      simple_query: model_fast       # "你好"、"进度如何"
      file_operation: model_fast      # 读文件、写文件
      code_generation: model_deep     # 生成代码、分析代码
      planning: model_main            # 任务规划、分解
      deep_analysis: model_deep       # 深度研究、复杂推理
```

**效果预估**:
- 简单任务：10-30s → **2-5s**
- 文件操作：5-15s → **1-3s**
- 复杂任务：保持原有质量

---

## 方案2: spawn 后台执行

**核心思想**: 长任务不阻塞主线程

**当前模式**:
```
用户: 移植 DeerFlow
我: [执行 40 分钟] ← 主线程阻塞，无法聊天
我: 完成
```

**优化模式**:
```
用户: 移植 DeerFlow
我: 收到！开始后台执行（预估10分钟）
    你可以继续和我聊天。
    
    [spawn subagent 执行任务]
    
用户: 进度如何
我: 当前进度 60% (3/5)，正在创建 Skills

用户: 顺便帮我升级 OpenClaw
我: 好的，并行执行中...
    [spawn 另一个 subagent]

我: ✅ DeerFlow 移植完成
我: ✅ OpenClaw 升级完成
```

**实现**:
```javascript
// 长任务使用 spawn
sessions_spawn({
  task: "移植 DeerFlow 功能",
  runtime: "subagent",
  mode: "run",
  cleanup: "keep",
  timeoutSeconds: 900  // 15 分钟
});

// 主线程继续响应用户
```

**效果预估**:
- 主线程响应：40分钟阻塞 → **即时响应**
- 用户体验：焦虑等待 → **可控并行**

---

## 方案3: 工具调用优化

### 3.1 工具分组加载
**问题**: 100+ 工具全部加载，消耗上下文

**方案**: 按场景加载
```yaml
tool_groups:
  chat: [message, memory_search]           # 对话场景
  file: [read, write, edit, glob, grep]    # 文件操作
  web: [web_fetch, browser]                # 网络操作
  exec: [exec, process]                    # 命令执行
  
# 按场景自动切换
scene_routing:
  default: chat + file                     # 默认场景
  coding: file + exec                      # 编码场景
  research: web + file                     # 研究场景
```

### 3.2 工具调用合并
**问题**: 多次调用相同工具

**方案**: 一次调用多个操作
```javascript
// 旧模式（多次调用）
read("file1.txt");
read("file2.txt");
read("file3.txt");

// 新模式（合并调用）
read_batch(["file1.txt", "file2.txt", "file3.txt"]);
```

### 3.3 工具结果缓存
**问题**: 重复读取同一文件

**方案**: 缓存机制
```javascript
// 缓存读文件结果
const cache = new Map();
if (cache.has(filePath)) {
  return cache.get(filePath);  // 即时返回
}
```

---

## 方案4: 上下文管理优化

### 4.1 自动压缩阈值降低
**当前**: 167k (93%) → 触发压缩
**优化**: 100k (56%) → 触发压缩

**效果**: 保持上下文更精简，响应更快

### 4.2 工具结果自动清理
**当前**: 保留所有工具结果
**优化**: 只保留最近 5 次工具结果

```javascript
// 清理旧工具结果
if (toolResults.length > 5) {
  toolResults = toolResults.slice(-5);
}
```

### 4.3 消息历史精简
**当前**: 保留所有对话
**优化**: 摘要旧对话

```
旧对话: 100 条消息 → 摘要为 1 条
新对话: 保持完整
```

---

## 方案5: 模型参数优化

### 5.1 Thinking 模式控制
**问题**: thinking 增加延迟（额外 5-10s）

**方案**: 按需启用
```yaml
thinking:
  enabled: false             # 默认关闭
  triggers:
    - "深度分析"
    - "复杂推理"
    - "代码生成"
```

### 5.2 Temperature 调整
**问题**: 高 temperature 增加推理时间

**方案**: 快速模型用低 temperature
```yaml
model_fast:
  temperature: 0.3   # 快速响应
model_deep:
  temperature: 0.7   # 保持创造力
```

---

## 实施优先级

| 方案 | 优先级 | 实施方式 | 预估效果 |
|------|--------|---------|---------|
| 模型分级策略 | **P0** | 配置调整 | 简单任务响应提速 80% |
| spawn 后台执行 | **P0** | 代码调整 | 主线程即时响应 |
| 工具结果缓存 | **P1** | 代码调整 | 减少重复调用 |
| 自动压缩阈值 | **P1** | 配置调整 | 保持精简上下文 |
| Thinking 控制 | **P2** | 配置调整 | 减少不必要的思考 |

---

## 推荐立即实施

### 1. 模型分级策略（最快见效）

**配置修改**:
```yaml
# ~/.openclaw/agents/dispatcher/config.yaml
model: bailian/glm-4-flash  # 切换到快速模型

# 或保留主模型，但配置快速备用
models:
  fast: bailian/glm-4-flash
  main: bailian/glm-5
  
task_routing:
  simple_query: fast
  file_operation: fast
  planning: main
```

**效果**: 日常对话 10s → **2s**

### 2. spawn 后台执行（用户体验）

**代码示例**:
```javascript
// 长任务（>5分钟）自动 spawn
if (taskDuration > 5 * 60 * 1000) {
  sessions_spawn({
    task: taskDescription,
    runtime: "subagent",
    mode: "run"
  });
  
  // 主线程返回：开始执行，预估X分钟
}
```

---

## 性能对比预估

| 场景 | 现在 | 优化后 | 提升 |
|------|------|--------|------|
| 简单对话 | 10-15s | 2-3s | **80%** |
| 文件操作 | 5-10s | 1-2s | **70%** |
| 长任务执行 | 40min 阻塞 | 即时响应 | **∞** |
| 上下文膨胀 | 越来越慢 | 保持稳定 | **50%** |
| 重复查询 | 10s | 即时缓存 | **90%** |

---

_分析时间: 2026-04-15 12:05_