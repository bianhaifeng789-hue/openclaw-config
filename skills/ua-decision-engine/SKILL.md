---
name: ua-decision-engine
description: End-to-end UA decision engine that combines recovery model analysis, ROAS target strategy, account adjustment strategy, and campaign scaling advice. Use this whenever the user wants one-shot投放决策 from a report, asks for a complete UA judgment chain, or wants recovery model → target ROAS → account action → campaign action in one result.
---

# UA Decision Engine

Use this skill when the user does not want isolated analysis, but one integrated decision chain.

## What this skill does

This skill orchestrates four sub-capabilities:
1. recovery-model-analyzer
2. roas-target-strategy
3. account-adjustment-strategy
4. campaign-scaling-advisor

## Expected inputs

Two files work best:

### 1. account summary JSON
Contains:
- recovery_model or enough recovery data to infer it
- optimization_stage
- target_roas
- actual_d0_roas
- actual_d1_roas
- actual_d3_roas
- actual_d7_roas
- delivery_status
- spend_trend
- volume_signal

### 2. campaign CSV
Contains rows with:
- campaign
- target_roas
- actual_d1_roas
- actual_d3_roas
- actual_d7_roas
- delivery_status
- spend
- volume_signal
- age_days

## Workflow

1. Determine or read the recovery model.
2. Recommend target ROAS strategy.
3. Recommend account-level action.
4. Recommend campaign-level actions.
5. Merge everything into one actionable output.

## Output format

Always produce these sections:

### 1. Recovery model
- model type
- main optimization window
- short explanation

### 2. ROAS target strategy
- recommended target range
- raise / lower / hold
- why

### 3. Account action
- scale / hold / trim / stop-loss
- suggested budget move
- execution note

### 4. Campaign actions
- top campaigns to scale
- campaigns to hold/watch
- campaigns to trim/pause

### 5. Final operator summary
- the one thing to do now
- the main risk
- what to observe next

## Recommended execution

Run the bundled orchestrator script when possible:
- `node scripts/run-ua-decision-engine.js <account-json> <campaign-csv>`

Use the script to generate deterministic structure, then explain the result in plain language.
