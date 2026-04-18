---
name: roas-target-strategy
description: Recommend ROAS target strategy from recovery model, stage, and current performance. Use this whenever the user asks 设多少ROAS, ROAS目标怎么定, whether to raise/lower target, how strict early control should be, or wants target-setting guidance for testing, scaling, or stabilization.
---

# ROAS Target Strategy

Use this skill to convert recovery model + account stage + current performance into a practical ROAS target recommendation.

## What this skill answers

- What ROAS target range should we use?
- Should target ROAS be raised, lowered, or held?
- How strict should early-window control be?
- Is the current target choking delivery?
- Should we optimize mainly on D0, D1, D3, or D7?

## Expected inputs

Prefer these fields when available:
- recovery_model: fast-payback / medium-payback / long-payback
- optimization_stage: testing / scaling / stabilization
- current_target_roas
- actual_d0_roas
- actual_d1_roas
- actual_d3_roas
- actual_d7_roas
- delivery_status: limited / stable / expanding

## Core logic

### By recovery model
- **fast-payback**
  - can tolerate stricter early ROAS control
  - D0/D1 can heavily influence target setting
- **medium-payback**
  - use D1/D3 as main anchor
  - avoid overreacting to D0 noise
- **long-payback**
  - early strict ROAS often suppresses delivery too hard
  - use looser early target and judge more on D3/D7

### By stage
- **testing**
  - target should usually be looser to buy signal
- **scaling**
  - target should balance volume and quality
- **stabilization**
  - target can be stricter if model is already proven

## Decision patterns

### Lower target ROAS when
- delivery is constrained
- actual later-window ROAS is better than early-window ROAS
- product is long-payback or medium-payback with noisy D0

### Raise target ROAS when
- delivery is abundant but poor quality
- early and later windows both underperform
- account is spending into weak recovery with no later catch-up

### Hold target ROAS when
- delivery is stable
- actual recovery roughly matches model expectation
- changing target would likely create more noise than signal

## Output format

Always respond with:

### Target recommendation
- Recommended target ROAS range
- Action: raise / lower / hold
- Main control window

### Why
- Recovery model reason
- Stage reason
- Delivery reason

### Risk note
- What happens if target is too high
- What happens if target is too low

### Adjustment style
- aggressive / moderate / conservative
- whether to adjust immediately or wait for more data

## Recommended execution

When possible, run the bundled script:
- `node scripts/decide-roas-target.js <json-path>`

Use the script for deterministic recommendation, then explain in plain language.
