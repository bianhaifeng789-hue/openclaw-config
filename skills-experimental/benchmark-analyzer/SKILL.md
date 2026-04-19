# benchmark-analyzer

## Description

Analyze benchmark test results with failure classification, statistics reporting, and retry command generation.

## Usage

This skill is used to analyze Terminal-Bench 2.0 or other benchmark test results, classify failures, generate statistics, and provide retry recommendations.

## How It Works

### Failure Classification

The analyzer classifies failures into these categories:

| Type | Description |
|------|-------------|
| `rate_limit` | API rate limit exceeded (429) |
| `timeout` | Agent or task timed out |
| `missing_tool` | Required tool/command not found |
| `missing_module` | Python module not installed |
| `docker_conflict` | Docker container name conflict |
| `api_error` | API connection error |
| `instant_exit` | Agent exited immediately (<10s) |
| `task_failure` | Task logic failed |
| `other_exception` | Unclassified exception |

### Analysis Process

1. **Read job directory**: Find all trial subdirectories
2. **Parse results**: Extract reward, duration, task_name
3. **Classify failures**: Analyze exception.txt and result.json
4. **Generate stats**: Pass rate, failure breakdown, timing
5. **Retry command**: Generate harbor retry command (excluding timeouts)

## Implementation

### Files

- `impl/bin/benchmark-analyzer.js`: Main analyzer script

### Key Functions

- `classifyFailure(trialDir)`: Determine failure type
- `analyzeJob(jobDir, failedOnly)`: Analyze all trials
- `generateRetryCmd(trials, jobDir)`: Create retry command
- `generateStats(trials)`: JSON statistics output

## When to Use

**Use this skill**:
- After running benchmark tests
- Need to understand failure patterns
- Want retry recommendations
- Generate test reports

**Don't use this skill**:
- No benchmark results to analyze
- Real-time monitoring (use heartbeat instead)

## Integration

### Heartbeat Task

```yaml
- name: benchmark-analysis-check
  interval: 6h
  priority: low
  prompt: "Run benchmark-analyzer.js on latest job directory. Report failure stats and retry recommendations."
```

### CLI Commands

```bash
# Analyze job directory
node impl/bin/benchmark-analyzer.js jobs/2026-04-17__15-00-00

# Show only failed tasks
node impl/bin/benchmark-analyzer.js jobs/... --failed-only

# Generate retry command
node impl/bin/benchmark-analyzer.js jobs/... --retry-cmd

# Output JSON stats
node impl/bin/benchmark-analyzer.js jobs/... --json
```

## Example Output

### Analysis Report

```
============================================================
JOB: 2026-04-17__15-00-00
============================================================
Total: 89  Passed: 45  Failed: 44  Rate: 50.6%

FAILURE BREAKDOWN:
  timeout              : 15 tasks
    - circuit-fibsqrt
    - compile-compcert
    ...
  rate_limit           : 10 tasks
    - frontend-design
    ...
  task_failure         : 19 tasks
    ...

ALL TASKS (89):
  ✅ chess-best-move                          120s
  ✅ distribution-search                       85s
  ❌ circuit-fibsqrt                          N/A [timeout]
  ❌ frontend-design                          15s  [rate_limit]
  ...
```

### Retry Command

```
RETRY COMMAND (29 tasks, excluding timeouts):

harbor run -d "terminal-bench@2.0" \
  --agent-import-path benchmarks.harbor_agent:HarnessAgent \
  -k 1 \
  --n-concurrent 1 \
  --agent-setup-timeout-multiplier 2 \
  --max-retries 3 \
  --retry-include DaytonaError \
  --retry-include AgentSetupTimeoutError \
  --retry-include AddTestsDirError \
  --task-name frontend-design \
  --task-name distribution-search \
  ...
```

### JSON Stats

```json
{
  "summary": {
    "total": 89,
    "passed": 45,
    "failed": 44,
    "passRate": "50.6%"
  },
  "failures": {
    "timeout": 15,
    "rate_limit": 10,
    "task_failure": 19
  },
  "timing": {
    "avgDuration": 85,
    "minDuration": 15,
    "maxDuration": 1200
  },
  "timestamp": 1776409234567
}
```

## Benefits

1. **Insight into failures**: Understand why tasks failed
2. **Retry optimization**: Exclude tasks unlikely to pass on retry
3. **Performance analysis**: Identify slow tasks
4. **Reporting**: Generate statistics for documentation

## Advanced Usage

### Custom Failure Classification

Extend `classifyFailure()` to detect additional patterns:

```javascript
if (text.includes('out of memory')) {
  return 'memory_limit';
}
if (text.includes('disk full')) {
  return 'disk_space';
}
```

### Integration with CI/CD

```yaml
- name: Analyze results
  run: |
    node impl/bin/benchmark-analyzer.js jobs/latest --json > stats.json
    
- name: Check pass rate
  run: |
    PASS_RATE=$(cat stats.json | jq -r '.summary.passRate' | sed 's/%//')
    if [ "$PASS_RATE" -lt 50 ]; then
      echo "Pass rate too low: $PASS_RATE%"
      exit 1
    fi
```

## Source

Derived from Harness Engineering's `analyze_results.py`:
https://github.com/lazyFrogLOL/Harness_Engineering

Reference: `scripts/analyze_results.py`