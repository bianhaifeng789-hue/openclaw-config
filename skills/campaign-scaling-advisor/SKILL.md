---
name: campaign-scaling-advisor
description: Recommend campaign-level scaling actions from ROAS, delivery, volume, and maturity signals. Use this whenever the user asks 哪个campaign该放量, how to scale campaigns safely, whether a campaign is mature enough to expand, how much to raise budget, or wants campaign/adset level scaling advice instead of only account-level strategy.
---

# Campaign Scaling Advisor

Use this skill to make campaign-level scaling decisions.

## What this skill answers

- Which campaigns are ready to scale?
- Which campaigns should hold?
- Which campaigns should trim or pause?
- How much budget increase is reasonable?
- Which signal window should be trusted most before scaling?

## Expected inputs

Prefer CSV or tabular data with fields like:
- campaign
- target_roas
- actual_d0_roas
- actual_d1_roas
- actual_d3_roas
- actual_d7_roas
- delivery_status
- spend
- volume_signal
- age_days

## Core logic

### Scale when
- delivery is limited or stable
- recovery is above or near target on the main decision window
- campaign has enough age or maturity to justify expansion
- volume quality is stable

### Hold when
- signal is mixed
- campaign is too new
- recovery is acceptable but not strong enough for expansion

### Trim when
- campaign misses target meaningfully
- later-window catch-up is weak
- spend is meaningful enough to justify control

### Pause when
- campaign is clearly under target
- no meaningful catch-up appears
- maturity is enough to conclude the campaign is failing

## Default budget bands
- scale: +10% to +20%
- hold: 0%
- trim: -10% to -20%
- pause: -100%

Prefer smaller increases on newer campaigns.
Avoid large jumps unless the user explicitly wants aggressive scaling.

## Output format

Always provide:

### Campaign actions
For each campaign:
- action
- suggested budget change
- main decision window
- short reason

### Scaling summary
- best campaigns to expand
- campaigns to watch
- campaigns to cut

## Recommended execution

When possible, run the bundled script:
- `node scripts/advise-campaign-scaling.js <csv-path>`

Use the script for deterministic ranking, then explain the result in plain language.
