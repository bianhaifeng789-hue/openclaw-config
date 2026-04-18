---
name: academic-paper-review
description: Systematic academic paper review workflow with structure extraction, methodology critique, and contribution assessment. Use when reviewing academic papers, analyzing research methodology, or evaluating paper contributions.
---

# Academic Paper Review - 学术论文系统评审

借鉴 DeerFlow 2.0 的 academic-paper-review skill。

## Why Systematic Review

学术论文评审需要系统性方法：
- **Structure extraction** - 论文结构解析
- **Methodology critique** - 方法论批判
- **Contribution assessment** - 贡献评估
- **Limitation identification** - 局限性识别

**DeerFlow 机制**:
- Structured review workflow
- Section-by-section analysis
- Contribution grading
- Limitation identification

## Review Workflow

### Phase 1: Structure Extraction

**目标**: 解析论文结构

**步骤**:
1. Identify title, authors, abstract
2. Extract introduction structure
3. Parse methodology sections
4. Extract results/findings
5. Identify conclusion structure

**输出**:
```markdown
## Paper Structure

- Title: [Paper title]
- Authors: [Author list]
- Abstract: [Summary]

### Introduction
- Problem statement: [What problem?]
- Motivation: [Why important?]
- Contribution claim: [What they claim]

### Methodology
- Approach: [Their approach]
- Dataset: [What data?]
- Evaluation: [How evaluated?]

### Results
- Key findings: [Main results]
- Metrics: [Performance metrics]
- Comparison: [vs baseline]

### Conclusion
- Summary: [Main takeaway]
- Future work: [What's next?]
```

### Phase 2: Methodology Critique

**目标**: 评估方法论质量

**检查维度**:
| Dimension | Questions |
|-----------|-----------|
| **Soundness** | Is methodology sound? |
| **Reproducibility** | Can others reproduce? |
| **Dataset quality** | Is dataset appropriate? |
| **Evaluation rigor** | Is evaluation rigorous? |
| **Ethics** | Any ethical concerns? |

**输出**:
```markdown
## Methodology Critique

### Strengths
- [Strong aspect 1]
- [Strong aspect 2]

### Weaknesses
- [Weak aspect 1]
- [Weak aspect 2]

### Concerns
- [Concern 1]
- [Concern 2]

### Reproducibility Score: [1-5]
- Code available: [Yes/No]
- Dataset available: [Yes/No]
- Hyperparameters documented: [Yes/No]
```

### Phase 3: Contribution Assessment

**目标**: 评估论文贡献

**评估标准**:
1. **Novelty** - Is this new?
2. **Significance** - Does it matter?
3. **Impact** - Who benefits?
4. **Relevance** - Is it timely?

**贡献等级**:
| Grade | Description |
|-------|-------------|
| **A** | Breakthrough contribution |
| **B** | Significant contribution |
| **C** | Incremental contribution |
| **D** | Minor contribution |
| **F** | No meaningful contribution |

**输出**:
```markdown
## Contribution Assessment

### Novelty: [A/B/C/D/F]
- [Explanation]

### Significance: [A/B/C/D/F]
- [Explanation]

### Impact: [A/B/C/D/F]
- [Explanation]

### Overall Grade: [A/B/C/D/F]
```

### Phase 4: Limitation Identification

**目标**: 识别局限性

**检查维度**:
| Dimension | Questions |
|-----------|-----------|
| **Scope** | What's outside scope? |
| **Assumptions** | What assumptions made? |
| **Generalization** | Can results generalize? |
| **Future work** | What's left undone? |

**输出**:
```markdown
## Limitations

### Scope Limitations
- [Limitation 1]
- [Limitation 2]

### Assumptions
- [Assumption 1]
- [Assumption 2]

### Generalization Concerns
- [Concern 1]
- [Concern 2]

### Future Work Needed
- [Work 1]
- [Work 2]
```

## Review Template

**完整评审模板**:
```markdown
# Academic Paper Review

## Metadata
- Title: [Paper title]
- Authors: [Authors]
- Year: [Year]
- Venue: [Conference/Journal]

## Executive Summary
[2-3 sentence summary of paper and your assessment]

## Structure Extraction
[Phase 1 output]

## Methodology Critique
[Phase 2 output]

## Contribution Assessment
[Phase 3 output]

## Limitations
[Phase 4 output]

## Recommendation
- Accept / Reject / Revise
- Confidence: [1-5]

## Detailed Comments
[Detailed reviewer comments]

---

Reviewed by: OpenClaw Academic Review Workflow
Date: [Date]
```

## Usage

**触发条件**:
- "Review this paper: [paper content]"
- "Analyze methodology of [paper]"
- "Evaluate contribution of [paper]"

**示例**:
```
User: Review this paper: [paste paper abstract]

OpenClaw:
# Academic Paper Review

## Metadata
- Title: [Extracted title]
- Authors: [Extracted authors]

## Executive Summary
[Generated summary]

## Structure Extraction
[Structure analysis]

## Methodology Critique
[Methodology assessment]

## Contribution Assessment
[Contribution grading]

## Limitations
[Limitation identification]

## Recommendation
[Accept/Reject/Revise with confidence]
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Systematic** | Structured review workflow |
| **Comprehensive** | Covers all dimensions |
| **Objective** | Standardized grading |
| **Efficient** | Faster than manual |

## Borrowed From

DeerFlow 2.0 - academic-paper-review skill

**关键借鉴**:
- 4-phase review workflow
- Structure extraction
- Methodology critique
- Contribution grading (A-F)
- Limitation identification

---

_创建时间: 2026-04-15_
_借鉴来源: https://github.com/bytedance/deer-flow_