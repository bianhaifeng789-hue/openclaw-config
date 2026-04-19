# Session Maintenance

This workspace keeps session maintenance separate from the main heartbeat scheduler.

## Scripts
- `impl/bin/session-housekeeping.js`
  - `status`: inspect session directory
  - `run`: remove old `.checkpoint.*` / `.reset.*` files older than configured retention
- `impl/bin/session-pressure.js`
  - report session context pressure with warn/alert/critical thresholds

## Config
See `config/session-maintenance.json`.

## Suggested usage
- Manual checks during debugging
- Dedicated cron/task runner later if needed
- Keep out of formal heartbeat to avoid mixing context-governance and liveness checks
