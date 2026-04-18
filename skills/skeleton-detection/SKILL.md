# skeleton-detection

## Description

Detect skeleton/template files with TODO markers and remind Agent to fill them in instead of creating new files.

## Usage

This skill is automatically triggered during Agent iterations to prevent a critical failure mode: Agent reads skeleton files but creates separate implementations, causing verifier tests to fail.

## How It Works

### Detection Markers

The skill scans workspace for these patterns:
- `TODO`
- `NotImplementedError`
- `FIXME`
- `PLACEHOLDER`
- `FILL IN`
- `YOUR CODE HERE`

### Trigger Conditions

- **Iteration 2-3**: Check after Agent has read files
- **One-time check**: Only triggers once per session
- **File types**: `.js`, `.ts`, `.py`, `.c`, `.cpp`, `.h`, `.java`, `.go`, `.rs`

### Warning Injection

When skeletons detected, injects mandatory warning:
```
⚠️ Skeleton Files Detected: X files with Y TODO markers

CRITICAL: These files contain TODO/NotImplementedError markers.
You MUST fill in these TODOs rather than creating separate implementations.
Verifier tests will import from these original files.

Action required:
  1. Read each skeleton file
  2. Fill in ALL TODO markers
  3. Remove NotImplementedError/pass statements
  4. Test the implementation

Do NOT create new files instead of filling these TODOs.
```

## Implementation

### Files

- `impl/bin/skeleton-detector.js`: Main detector implementation

### Key Methods

- `check()`: One-time check for skeleton files
- `scanForSkeletons()`: Grep-based file scanning
- `generateWarning()`: Generate reminder message
- `reset()`: Reset checked state for new iteration

### State File

- `state/skeleton-detection.json`: Detection history and stats

## When to Use

**Use this skill**:
- Agent reads existing files with TODO markers
- Task involves filling template/skeleton code
- Verifier tests import from specific files

**Don't use this skill**:
- Creating new files from scratch
- No skeleton files exist
- Agent already filled TODOs

## Integration

### Heartbeat Task

```yaml
- name: skeleton-detection-check
  interval: 30m
  priority: medium
  prompt: "Run skeleton-detector.js check to detect skeleton files. If skeletons found, send Feishu warning card."
```

### Agent Integration

Call `skeleton-detector.js check` at iteration start:
```javascript
const result = detector.check();
if (result && result.warning) {
  // Inject warning into Agent messages
}
```

## CLI Commands

```bash
# Check for skeleton files
node impl/bin/skeleton-detector.js check

# Show detector status
node impl/bin/skeleton-detector.js status

# Scan workspace manually
node impl/bin/skeleton-detector.js scan [workspace_dir]

# Reset checked state
node impl/bin/skeleton-detector.js reset
```

## Example Output

### Detection Found

```
⚠️ Skeleton files detected:
  
Skeleton Files Detected: 3 files with 12 TODO markers

  - src/api.py (5 markers)
    Line 10: TODO
    Line 25: NotImplementedError
  
  - lib/utils.js (4 markers)
    Line 15: TODO
    Line 30: FIXME
  
  - tests/test_main.py (3 markers)
    Line 8: TODO

Stats: {
  "totalScans": 1,
  "skeletonsFound": 3,
  "warningsSent": 1,
  "lastScan": 1776408356479
}
```

### No Skeletons

```
✅ No skeleton files detected
Stats: {
  "totalScans": 1,
  "skeletonsFound": 0,
  "warningsSent": 0,
  "lastScan": 1776408356479
}
```

## Benefits

1. **Prevent test failures**: Ensures Agent fills TODOs in correct files
2. **Save time**: Early warning prevents wasted iterations
3. **Improve quality**: Forces Agent to complete skeleton implementations
4. **Track history**: State file records all detections

## Source

Derived from Harness Engineering's `SkeletonDetectionMiddleware`:
https://github.com/lazyFrogLOL/Harness_Engineering

Reference: `middlewares.py` SkeletonDetectionMiddleware class