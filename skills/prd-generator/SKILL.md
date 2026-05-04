---
name: prd-generator
description: 从逆向分析输入生成开发导向 PRD。将逆向产物（feature-spec-input、api-contracts、monetization-impl 等）转化为结构化 PRD 文档。适用于竞品分析后写需求、功能对标写方案、技术调研后落地文档。
---

# PRD 生成技能

当用户提到 **写 PRD、生成需求文档、产品文档、需求规格、功能文档** 时，使用本技能。

---

## 1. 适用场景
- 竞品逆向后生成 PRD
- 功能对标后写方案
- 技术调研后落地文档
- 从逆向输入文件批量生成 PRD 章节

---

## 2. 输入来源

### 2.1 逆向输入文件（artifacts/<包名>/reverse-for-prd/）
```
reverse-for-prd/
├── product-positioning.md         # 产品定位输入
├── feature-spec-input.md          # 功能规格输入
├── page-spec-input.md             # 页面级规格输入
├── api-contracts.md               # API / 数据契约
├── monetization-impl.md           # 广告与变现实现
├── permissions-compliance.md      # 权限与合规
├── technical-architecture.md      # 技术架构与约束
├── code-reuse-notes.md            # 可复现实现建议
└── reverse-evidence-index.md     # 证据索引
```

### 2.2 模板文件
- `PRD-template-advanced.md` — 高级 PRD 模板

### 2.3 其他输入
- Google Play 页面信息
- 用户调研结论
- 数据分析结论
- 设计稿 / 原型链接

---

## 3. 生成流程

### Phase 1: 收集输入
```bash
# 检查逆向输入文件是否完整
scripts/play-to-prd.sh reverse-status <包名>
scripts/play-to-prd.sh ensure-reverse-dirs <包名>
```

### Phase 2: 章节映射
将逆向输入映射到 PRD 章节：

| PRD 章节 | 主要输入来源 |
|---------|-------------|
| 背景与对标矩阵 | product-positioning.md + reverse-evidence-index.md |
| 核心功能规格 | feature-spec-input.md |
| 页面级规格 | page-spec-input.md |
| 技术方案与约束 | technical-architecture.md |
| API / 数据契约 | api-contracts.md |
| 商业化策略 | monetization-impl.md |
| 权限 / 合规 | permissions-compliance.md |
| 开发复现建议 | code-reuse-notes.md |

### Phase 3: 生成文档
```bash
# 使用模板初始化
scripts/play-to-prd.sh init-prd <项目名>
```

### Phase 4: 融合逆向结论
在 PRD 正文显式引用证据：
- 标注来源文件和代码路径
- 区分事实 / 推断 / 建议
- 不确定项标注"待验证"

---

## 4. 质量标准

### 4.1 章节完整性
- 一到十四章：正式 PRD 正文，不能压缩
- 十五章：逆向分析（固定子模块）
- 十六章：相关文档索引

### 4.2 功能规格深度
- 功能目标
- 前置条件
- 主流程
- 异常流程
- 业务规则
- 状态定义
- 埋点
- 验收标准
- 逆向证据引用

### 4.3 流程图要求
至少覆盖：
- 主业务流程
- 权限分支流程
- 关键执行流程
- 广告插入流程
- 异常 / 兜底流程

### 4.4 代码复现标准
- 关键数据结构
- 关键函数签名
- 核心 API 用法
- 接近 Kotlin 的伪代码
- 状态流转关系
- 推荐工程目录结构

---

## 5. 输出位置
```
plans/prd/<项目名>.md
```

---

## 6. 飞书同步（可选）
```bash
# 创建飞书文档
feishu_doc action=create title="<项目名> PRD" folder_token=<目标文件夹>

# 写入内容
feishu_doc action=write doc_token=<token> content=<PRD内容>
```

---

## 7. 联动技能
- `google-play-to-prd` — 端到端流水线
- `apk-reverse-analysis` — 逆向输入来源
- `competitive-analysis` — 多竞品对比
- `gap-analysis` — 差距分析

---

_更新时间：2026-05-04 Asia/Shanghai_