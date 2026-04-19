---
name: memory-tfidf
description: "Context-aware memory facts retrieval using TF-IDF (borrowed from DeerFlow) Use when [memory tfidf] is needed."
---

# Memory TF-IDF Retrieval

**来源**: DeerFlow Memory System

## 核心概念

### TF-IDF (Term Frequency - Inverse Document Frequency)

**用途**: 根据当前对话上下文检索相关事实（facts）

**评分公式**:
```
final_score = similarity * 0.6 + confidence * 0.4
```

### 关键参数

- `max_injection_tokens`: 2000（默认）
- `confidence`: 0-1（事实置信度）
- `category`: context, user_preference, lesson, decision

## 实现

**脚本**: `impl/bin/memory-tfidf-retrieval.js`

**状态文件**: `state/memory-facts.json`

## 使用方法

### 添加事实

```bash
node impl/bin/memory-tfidf-retrieval.js add "用户偏好飞书交互" user_preference 0.9
```

### 检索相关事实

```bash
node impl/bin/memory-tfidf-retrieval.js retrieve "飞书交互优化" 2000
```

### 列出所有事实

```bash
node impl/bin/memory-tfidf-retrieval.js list
```

## 借鉴要点

### DeerFlow Memory 系统特点

1. **Context-aware retrieval**
   - 根据对话上下文动态检索相关事实
   - 而不是静态加载所有记忆

2. **Token budget管理**
   - max_injection_tokens限制注入量
   - 防止context膨胀

3. **Confidence ranking**
   - 事实按置信度排序
   - 高置信度事实优先注入

4. **Categories分类**
   - user: 用户画像
   - history: 历史记录
   - facts: 动态事实

## 与OpenClaw集成

### 心跳任务（新增）

```yaml
- name: memory-facts-check
  interval: 2h
  prompt: "Check state/memory-facts.json. If facts.length > 10, analyze and extract high-confidence facts (>=0.8) to MEMORY.md."
```

### AGENTS.md规则（新增）

```markdown
## Memory Facts管理

每2小时检查facts.json：
- 高置信度事实（>=0.8）→ 更新MEMORY.md
- 低置信度事实（<0.5）→ 标记待确认
- 重复事实 → 合并并提升置信度
```

---

_创建时间: 2026-04-15_