#!/usr/bin/env node
/**
 * OpenClaw Academic Paper Review Generator
 * 
 * 借鉴 DeerFlow 2.0 的 academic-paper-review skill
 * 生成学术论文评审模板
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '..', '..', 'templates');
const TEMPLATE_FILE = path.join(TEMPLATE_DIR, 'academic-paper-review-template.md');

/**
 * Paper Review Template
 */
const REVIEW_TEMPLATE = `# Academic Paper Review

## Metadata
- **Title**: {{title}}
- **Authors**: {{authors}}
- **Year**: {{year}}
- **Venue**: {{venue}}
- **DOI**: {{doi}}

## Executive Summary
[2-3 sentence summary of paper and your assessment]

---

## Phase 1: Structure Extraction

### Title & Abstract
- **Title**: [Paper title - what does it suggest?]
- **Abstract Summary**: [Key claims in abstract]

### Introduction
- **Problem Statement**: [What problem does paper address?]
- **Motivation**: [Why is this problem important?]
- **Contribution Claims**: [What do authors claim to contribute?]
  - Claim 1: [First claim]
  - Claim 2: [Second claim]
  - Claim 3: [Third claim]

### Methodology
- **Approach**: [What approach/method do they use?]
- **Dataset**: [What data do they use?]
  - Size: [Dataset size]
  - Source: [Where from?]
  - Split: [Train/test/validation]
- **Evaluation**: [How do they evaluate?]
  - Metrics: [What metrics?]
  - Baselines: [What baselines compared?]
  - Setup: [Experimental setup]

### Results
- **Key Findings**: [Main results]
  - Finding 1: [First finding]
  - Finding 2: [Second finding]
- **Performance**: [Performance numbers]
  - Metric 1: [Value]
  - Metric 2: [Value]
- **Comparison**: [vs baselines]
  - vs Baseline 1: [+X% improvement]
  - vs Baseline 2: [+Y% improvement]

### Conclusion
- **Summary**: [What did they conclude?]
- **Future Work**: [What's next?]
- **Limitations Admitted**: [What limitations do they acknowledge?]

---

## Phase 2: Methodology Critique

### Strengths
- **Strength 1**: [Strong aspect]
- **Strength 2**: [Strong aspect]
- **Strength 3**: [Strong aspect]

### Weaknesses
- **Weakness 1**: [Weak aspect]
- **Weakness 2**: [Weak aspect]
- **Weakness 3**: [Weak aspect]

### Concerns
- **Concern 1**: [Specific concern]
- **Concern 2**: [Specific concern]

### Reproducibility Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| Code available | [Yes/No/Partial] | [Link if available] |
| Dataset available | [Yes/No/Partial] | [Link if available] |
| Hyperparameters documented | [Yes/No] | [Notes] |
| Implementation details | [Yes/No/Partial] | [Notes] |

**Reproducibility Score**: [1-5]
- 5: Fully reproducible (code + data + params)
- 4: Mostly reproducible (minor gaps)
- 3: Partially reproducible (missing components)
- 2: Limited reproducibility (significant gaps)
- 1: Not reproducible (no code/data)

---

## Phase 3: Contribution Assessment

### Novelty
**Grade**: [A/B/C/D/F]

**Explanation**:
- [Why this grade?]
- [Is this truly novel or derivative?]

### Significance
**Grade**: [A/B/C/D/F]

**Explanation**:
- [Why this grade?]
- [Does this matter to the field?]

### Impact
**Grade**: [A/B/C/D/F]

**Explanation**:
- [Why this grade?]
- [Who benefits? How widely applicable?]

### Relevance
**Grade**: [A/B/C/D/F]

**Explanation**:
- [Why this grade?]
- [Is this timely? Addressing current challenges?]

### Overall Contribution Grade

**Grade**: [A/B/C/D/F]

**Grading Criteria**:
- **A**: Breakthrough contribution (novel + significant + high impact)
- **B**: Significant contribution (novel + meaningful impact)
- **C**: Incremental contribution (some novelty, moderate impact)
- **D**: Minor contribution (limited novelty/impact)
- **F**: No meaningful contribution (derivative or insignificant)

---

## Phase 4: Limitation Identification

### Scope Limitations
- [What's outside paper scope?]
- [What did they deliberately not address?]

### Assumptions Made
- **Assumption 1**: [First assumption]
- **Assumption 2**: [Second assumption]
- [Are these assumptions reasonable?]

### Generalization Concerns
- [Can results generalize to other domains?]
- [Are there domain-specific constraints?]
- [What conditions needed for generalization?]

### Future Work Needed
- **Work 1**: [What's left undone?]
- **Work 2**: [What's next step?]
- **Work 3**: [Long-term direction]

### Unacknowledged Limitations
- [Limitations authors didn't mention]
- [Potential issues with approach]
- [Hidden constraints]

---

## Recommendation

### Decision
**Recommendation**: [Accept / Reject / Revise]

### Confidence
**Confidence Level**: [1-5]
- 5: Very confident (expert in this area)
- 4: Confident (familiar with area)
- 3: Moderate confidence (some background)
- 2: Limited confidence (new to area)
- 1: Low confidence (unfamiliar)

### Key Reasons
1. **Reason 1**: [Primary reason for recommendation]
2. **Reason 2**: [Secondary reason]
3. **Reason 3**: [Additional reason]

---

## Detailed Comments

### Major Comments
[Detailed major comments on paper]

### Minor Comments
[Detailed minor comments on paper]

### Questions for Authors
1. **Question 1**: [First question]
2. **Question 2**: [Second question]
3. **Question 3**: [Third question]

---

## Review Summary

| Aspect | Assessment |
|--------|------------|
| Structure | [Clear/Unclear] |
| Methodology | [Sound/Flawed] |
| Contribution | [A/B/C/D/F] |
| Reproducibility | [1-5] |
| Limitations | [Well-acknowledged/Hidden] |

**Overall Recommendation**: [Accept/Reject/Revise]
**Confidence**: [1-5]

---

Reviewed by: OpenClaw Academic Review Workflow
Date: {{date}}
`;

/**
 * Generate review template
 */
function generateTemplate(outputPath = null) {
  const template = REVIEW_TEMPLATE.replace('{{date}}', new Date().toISOString().split('T')[0]);
  
  if (outputPath) {
    fs.writeFileSync(outputPath, template);
    console.log(`✓ Template saved to: ${outputPath}`);
  }
  
  return template;
}

/**
 * Create templates directory
 */
function ensureTemplateDir() {
  if (!fs.existsSync(TEMPLATE_DIR)) {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'generate';

if (command === 'generate') {
  ensureTemplateDir();
  const template = generateTemplate(TEMPLATE_FILE);
  console.log('');
  console.log('Academic Paper Review Template:');
  console.log('================================');
  console.log('');
  console.log(template);
} else if (command === 'save') {
  const outputPath = args[1] || TEMPLATE_FILE;
  ensureTemplateDir();
  generateTemplate(outputPath);
} else if (command === 'help') {
  console.log('Usage: academic-review-generator.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  generate - Generate and display template');
  console.log('  save [path] - Save template to file');
  console.log('  help - Show this help');
} else {
  console.log('Unknown command:', command);
  console.log('Run: node academic-review-generator.js help');
}

module.exports = { generateTemplate, REVIEW_TEMPLATE };