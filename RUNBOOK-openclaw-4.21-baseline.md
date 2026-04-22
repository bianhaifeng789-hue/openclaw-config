# RUNBOOK-openclaw-4.21-baseline.md

_Last updated: 2026-04-22 11:57 Asia/Shanghai_

## Purpose

This document captures the known-good baseline after upgrading OpenClaw to 2026.4.21 and repairing the local runtime enough for normal use.

## Current Baseline

- OpenClaw version: `2026.4.21`
- Install path: `~/.npm-global/lib/node_modules/openclaw`
- Workspace: `/Users/mac/.openclaw/workspace`
- Main config: `~/.openclaw/openclaw.json`
- Gateway mode: `local`
- Gateway URL: `ws://127.0.0.1:18789`
- Dashboard: `http://127.0.0.1:18789/`
- Gateway service: LaunchAgent installed and running
- Channel: Feishu enabled and working

## Confirmed Working

### Core runtime
- `openclaw --version` returns `2026.4.21`
- `openclaw status` shows gateway reachable and local
- `openclaw doctor --non-interactive` runs successfully without critical blocking errors
- `openclaw doctor --fix` completes successfully

### Messaging / channel
- Feishu channel is configured and shows `OK`
- Missing Feishu dependency issue was repaired by installing required package dependencies into the OpenClaw global install

### Memory
- Workspace memory files are present:
  - `MEMORY.md`
  - `memory/`
- Mnemon is installed and working
- `mnemon status` confirms persistent data exists and is readable
- Current mnemon state at time of baseline:
  - `total_insights: 12`
  - `edge_count: 178`
  - db path: `/Users/mac/.mnemon/data/default/mnemon.db`

### Automation
- Heartbeat is enabled at `30m`
- Cron/task system is active
- Recent heartbeat jobs are mostly succeeding

## Configuration Decisions

### Keep `openai` plugin entry
Do **not** keep removing `plugins.allow -> openai` unless the provider configuration is also changed.

Reason:
- OpenClaw 4.21 bundles an `openai` extension
- This environment actively configures and uses OpenAI-family provider entries/models
- Doctor / provider enable flows may automatically re-allowlist or re-enable the `openai` plugin entry

Interpretation:
- In this setup, `openai` reappearing is expected behavior, not necessarily config drift or corruption

### Keep built-in memory search disabled for now
Current config:
- `plugins.slots.memory = "none"`
- `agents.defaults.memorySearch.enabled = false`

Reasoning:
- File-based memory is already available
- Mnemon is already available and healthy
- Enabling another memory path now would increase complexity without a clear operational need

Recommendation:
- Continue using `MEMORY.md` + `memory/` + `mnemon`
- Revisit built-in memory search only if a unified retrieval layer becomes necessary later

## Known Non-Blocking Notices

These do not currently block normal operation:

- `mnemon` appears as hook-only compatibility in status/doctor output
- Some skills show missing requirements
- `AGENTS.md` bootstrap size is near configured limits
- Reverse proxy trust warning may appear if deep security review is run, but gateway is currently local loopback
- Feishu `doc` capability has normal permission-grant risk and should be considered a policy choice, not a breakage

## Repair Actions Performed

1. Upgraded OpenClaw from `2026.4.15` to `2026.4.21`
2. Verified new version installed
3. Repaired missing bundled/runtime dependencies including Feishu-related dependency resolution
4. Ran `openclaw doctor --fix`
5. Archived orphan session transcript files via doctor fix flow
6. Confirmed gateway, status, Feishu, mnemon, and task system are working
7. Investigated `openai` plugin reappearance and concluded it is expected under current provider usage

## Quick Validation Commands

```bash
openclaw --version
openclaw status
openclaw doctor --non-interactive
mnemon status
```

## If Something Breaks Again

Check in this order:

1. `openclaw --version`
2. `openclaw status`
3. `openclaw doctor --non-interactive`
4. `mnemon status`
5. Confirm `~/.openclaw/openclaw.json` still has:
   - `gateway.mode = local`
   - Feishu account config present
   - `plugins.entries.mnemon.enabled = true`

## Bottom Line

As of this baseline, the environment is considered **usable and stable enough for normal operation** on OpenClaw `2026.4.21`.
