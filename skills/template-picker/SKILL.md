---
name: template-picker
description: 根据项目类型、技术栈、团队偏好，从 ~/.openclaw/templates/ 中快速推荐最合适的模板。适用于“我要做个什么项目，用什么模板最好”这类场景。输出推荐理由、备选项和使用方式。
---

# Template Picker

当用户提到 **选模板、推荐模板、项目起步模板、CLAUDE.md 模板、脚手架参考、这个项目适合什么模板** 时，使用本技能。

## 目标
把 400+ 模板压缩成少量高质量推荐，减少用户搜索成本。

---

## 输入
支持输入：
- 项目类型（Web / API / SaaS / AI / Mobile / Infra）
- 技术栈（Next.js / FastAPI / Flutter / LangChain 等）
- 约束条件（想快、想稳、偏简单、偏企业级、是否要 AI、是否要订阅/支付）
- 团队偏好（TS / Python / Go / Rust）

如果输入不完整，优先补齐这 4 件事：
1. 做什么产品
2. 前后端偏好
3. 是否要 AI / 支付 / Auth
4. 想要“最快上线”还是“长期可维护”

---

## 输出格式
至少给出：
1. **主推荐模板**（1 个）
2. **备选模板**（2-3 个）
3. **为什么这么选**
4. **适用场景 / 不适用场景**
5. **如何开始使用**

推荐输出结构：

```markdown
# 模板推荐

## 主推荐
- template-name
- 理由

## 备选
- template-a: 适合什么情况
- template-b: 适合什么情况

## 怎么选
- 如果你重视速度 → 选 A
- 如果你重视扩展性 → 选 B
- 如果你重视 AI 集成 → 选 C

## 使用方式
```bash
cp -R ~/.openclaw/templates/<template> ./template-<template>
```
```

---

## 推荐规则

### 1. Web App
- 默认优先：`nextjs`, `react-vite`, `vue-vite`, `sveltekit`, `nuxt`
- 如果要 SEO / 全栈 / SaaS：优先 `nextjs`
- 如果要轻量前端：优先 `react-vite` / `vue-vite`

### 2. API / Backend
- 默认优先：`python-fastapi`, `nestjs`, `fastify`, `express-typescript`, `go-api`
- 如果要 AI / Python 数据生态：优先 `python-fastapi`
- 如果要企业 TS：优先 `nestjs`
- 如果要轻量高性能：优先 `fastify` / `go-api`

### 3. AI / LLM
- 默认优先：`vercel-ai`, `openai-sdk`, `anthropic-sdk`, `langchain-python`, `llamaindex`, `rag-pipeline`
- 如果是 AI Web 产品：`nextjs` + `vercel-ai`
- 如果是 AI API：`python-fastapi` + `langchain-python`
- 如果是 RAG：`rag-pipeline` + `qdrant` / `weaviate`

### 4. SaaS
- 默认优先：`saas-fullstack`, `nextjs`, `supabase-nextjs`, `clerk-nextjs`, `stripe-integration`
- 如果要最快起步：`nextjs` + `clerk-nextjs` + `stripe-integration`
- 如果要后端轻：`supabase-nextjs`

### 5. Mobile
- 默认优先：`flutter`, `react-native-expo`, `expo-router`, `jetpack-compose`, `swift-ios`
- 跨平台优先：`flutter`
- JS 团队优先：`react-native-expo`
- 原生 Android 优先：`jetpack-compose`

### 6. Infra / DevOps
- 默认优先：`docker-compose`, `kubernetes`, `terraform`, `github-actions`, `prometheus-grafana`
- 本地开发优先：`docker-compose`
- 云基础设施优先：`terraform`
- 观测优先：`prometheus-grafana`

---

## 组合推荐规则

### 常见组合
- **AI SaaS** → `nextjs` + `vercel-ai` + `clerk-nextjs` + `stripe-integration`
- **内容产品** → `nextjs` + `supabase-nextjs` + `shadcn-ui`
- **API 产品** → `python-fastapi` + `postgres/pgvector`
- **移动增长产品** → `flutter` + `firebase-functions`
- **RAG 系统** → `python-fastapi` + `langchain-python` + `qdrant`

---

## 决策原则

推荐时不要只看技术栈，要看：
- 上线速度
- 团队熟悉度
- 长期维护成本
- AI / 支付 / Auth 等配套需求
- 是否需要 SEO / SSR / CMS / Dashboard

---

## 禁止事项
- 不要一次甩给用户 10+ 模板不做判断
- 不要只按流行度推荐，不看场景
- 不要忽略配套模板（如 Auth / Payment / AI SDK）

---

## 使用索引
优先参考：
- `templates-index.md`
- `~/.openclaw/templates/`

---

## 示例

### 示例 1
用户："我要做个 AI SaaS Web 产品"
推荐：
- 主推荐：`nextjs`
- 搭配：`vercel-ai`, `clerk-nextjs`, `stripe-integration`
- 理由：全栈、SEO、适合 SaaS、AI 集成成熟

### 示例 2
用户："我要做个 Python 的 AI API"
推荐：
- 主推荐：`python-fastapi`
- 备选：`flask`, `litestar`
- 搭配：`langchain-python`, `llamaindex`

### 示例 3
用户："我要快速做个移动端 MVP"
推荐：
- 主推荐：`flutter`
- 备选：`react-native-expo`
- 理由：跨平台、开发快、适合 MVP
