---
name: recovery-model-analyzer
description: Analyze ad recovery/payback model from CSV or tabular performance data. Use this whenever the user asks about 回收模型, payback, D0/D1/D3/D7 recovery, ROAS windows, whether a product is fast-payback or long-payback, or wants a basis for setting ROAS targets and account adjustment strategy.
---

# Recovery Model Analyzer

Use this skill to turn raw投放/变现数据 into a recovery-model judgment that can support ROAS setting and account adjustment.

## What this skill does

It answers these practical questions:
- Is the product a fast-payback or long-payback model?
- How much revenue is recovered by D0 / D1 / D3 / D7?
- Which window is the first meaningful optimization window?
- Is the current data enough to support strict ROAS control?
- What ROAS target style is implied by the recovery curve?

## Expected inputs

Best input is a CSV with columns like:
- country
- campaign
- spend
- d0_revenue
- d1_revenue
- d3_revenue
- d7_revenue

Variations are acceptable if the meaning is still clear.

## Workflow

1. Read the CSV or table.
2. Normalize fields into spend and cumulative recovery windows.
3. Calculate ROAS for each window that exists.
4. Judge whether recovery is:
   - fast-payback
   - medium-payback
   - long-payback
5. Explain which optimization window should control bidding most strongly.
6. Output practical implications for ROAS target setting.

## Classification guide

Use this default logic unless the user gives a custom model:

- **fast-payback**
  - D0 or D1 already recovers a large share of target revenue
  - early-window ROAS is strong enough to guide bidding directly
- **medium-payback**
  - D0 noisy, D1 meaningful, D3 clearer
  - bidding should not overreact to same-day volatility
- **long-payback**
  - D0/D1 weak, D3/D7 much more informative
  - strict early ROAS targets will likely choke delivery

## Output format

Always structure the answer like this:

### Recovery model summary
- Model type
- Main evidence
- Most useful optimization window

### Window ROAS
- D0
- D1
- D3
- D7

### Practical interpretation
- What the curve says about payback speed
- Whether early ROAS is reliable enough
- Main risk in over-controlling too early

### ROAS setting implication
- Suitable target style
- Which window should dominate account decisions
- Whether the account should optimize aggressively or loosely early on

## When data is incomplete

If only D0/D1 exists, say confidence is limited.
If spend is missing, do not infer ROAS blindly.
If revenue windows are incremental rather than cumulative, state that clearly and convert only when safe.

## Recommended execution

When possible, run the bundled script:
- `node scripts/analyze-recovery.js <csv-path>`

Use the script for deterministic calculation, then explain the result in plain language.
