---
name: account-adjustment-strategy
description: Recommend account adjustment actions from ROAS targets, actual recovery, delivery state, and stage. Use this whenever the user asks 怎么调账户, whether to scale/cut/hold, how to adjust budgets, when to stop loss, when not to change too often, or wants practical account动作建议 instead of just model analysis.
---

# Account Adjustment Strategy

Use this skill to turn performance state into account actions.

## What this skill answers

- Should the account scale, cut, hold, or stop-loss?
- How should budget be adjusted?
- Is delivery being choked by controls?
- Is spend quality too weak to keep buying?
- Should the team wait for more data instead of changing too often?

## Expected inputs

Prefer these fields when available:
- recovery_model
- optimization_stage
- target_roas
- actual_d0_roas
- actual_d1_roas
- actual_d3_roas
- actual_d7_roas
- delivery_status
- spend_trend: up / flat / down
- volume_signal: weak / stable / strong

## Action definitions

- **scale**
  - increase budget carefully because recovery quality supports expansion
- **hold**
  - keep structure stable and avoid unnecessary noise
- **trim**
  - reduce budget or tighten control because quality is slipping
- **stop-loss**
  - cut aggressively because recovery is too weak with little evidence of catch-up

## Core decision logic

### Choose scale when
- delivery is stable or constrained for artificial reasons
- later-window ROAS shows healthy catch-up
- model and stage support more volume

### Choose hold when
- signal is mixed
- data window is still immature
- recent changes were already significant
- changing again would add noise

### Choose trim when
- quality is below target
- later windows help somewhat but not enough
- account still has some value but should not expand

### Choose stop-loss when
- multiple windows are weak
- no meaningful catch-up appears
- spend continues but recovery model is breaking

## Budget guidance

Use simple action bands by default:
- **scale**: +10% to +20%
- **hold**: 0%
- **trim**: -10% to -20%
- **stop-loss**: -30% to -100%

Prefer smaller changes in testing and noisy conditions.
Prefer moderate changes in scaling.
Avoid repeated same-day edits unless the signal is very clear.

## Output format

Always respond with:

### Recommended action
- scale / hold / trim / stop-loss
- suggested budget adjustment
- main decision window

### Why
- recovery reason
- delivery reason
- stage reason

### Execution note
- change now or wait
- whether frequent edits are risky
- what to monitor next

## Recommended execution

When possible, run the bundled script:
- `node scripts/decide-account-action.js <json-path>`

Use the script for deterministic recommendation, then explain in plain language.
