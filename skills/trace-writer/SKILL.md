# trace-writer

## Description

Record Agent events to JSONL trace files for debugging, performance analysis, and issue reproduction.

## Usage

This skill provides structured event logging during Agent execution, capturing iteration progress, tool calls, LLM responses, and state transitions.

## How It Works

### Event Types

| Event | Description | Data Fields |
|-------|-------------|-------------|
| `iteration` | Agent iteration count | `n`, `tokens` |
| `llm_response` | LLM response details | `content`, `tool_calls`, `finish_reason` |
| `tool_call` | Tool execution | `tool`, `args`, `result` |
| `checkpoint` | State checkpoint | Custom data |
| `reset` | Context reset | `reason`, `tokens_before`, `tokens_after` |
| `compaction` | Context compression | `level`, `tokens_before`, `tokens_after` |
| `error` | Error event | `error_type`, `message`, `stack` |
| `warning` | Warning event | `warning_type`, `message` |
| `custom` | Custom event | Custom data |

### Trace File Format

**Location**: `{WORKSPACE}/traces/_trace_{agent_name}.jsonl`

**Format**: Each line is a JSON object:
```json
{
  "t": 12,
  "agent": "builder",
  "event": "tool_call",
  "tool": "write_file",
  "args": "{\"path\":\"test.js\"}",
  "result": "Wrote 150 chars"
}
```

### Time Tracking

- `t`: Relative time in seconds since trace start
- Absolute timestamps in stats

## Implementation

### Files

- `impl/bin/trace-writer.js`: Main trace writer implementation

### Key Methods

- `write(eventType, data)`: Write event to JSONL
- `iteration(n, tokens)`: Record iteration
- `llmResponse(content, toolCalls, finishReason)`: Record LLM response
- `toolCall(name, args, result)`: Record tool execution
- `compaction(level, before, after)`: Record compression
- `reset(reason, before, after)`: Record reset
- `error/warning(...)`: Record errors/warnings
- `readTrace()`: Read trace file contents
- `clearTrace()`: Clear trace file

### Fallback

If workspace not writable, falls back to:
`{impl/bin/../..}/traces/_trace_{agent_name}.jsonl`

## When to Use

**Use this skill**:
- Debug Agent behavior issues
- Analyze performance bottlenecks
- Reproduce specific failures
- Benchmark Harbor tests

**Don't use this skill**:
- Normal Agent execution (always enabled)
- No debugging needed

## Integration

### Agent Integration

```javascript
const trace = new TraceWriter('builder');

// Record events
trace.iteration(1, 50000);
trace.llmResponse(content, toolCalls, 'stop');
trace.toolCall('read_file', {path: 'test.js'}, 'content...');
trace.compaction(0, 60000, 30000);
```

### Performance Analysis

```bash
# Show all trace stats
node impl/bin/trace-writer.js stats

# Read specific agent trace
node impl/bin/trace-writer.js read builder

# Clear traces
node impl/bin/trace-writer.js clear
```

## CLI Commands

```bash
# Show statistics for all trace files
node impl/bin/trace-writer.js stats

# Read trace for specific agent
node impl/bin/trace-writer.js read [agent_name]

# Clear all traces or specific agent
node impl/bin/trace-writer.js clear [agent_name]

# Demo trace writing
node impl/bin/trace-writer.js demo
```

## Example Output

### Stats Output

```
Trace Files Statistics:

builder:
  Events: 150
  Duration: 45s
  File: /path/to/traces/_trace_builder.jsonl

planner:
  Events: 30
  Duration: 12s
  File: /path/to/traces/_trace_planner.jsonl
```

### Read Output

```
Trace for builder:
Events: 150

[0s] iteration
{
  "t": 0,
  "agent": "builder",
  "event": "iteration",
  "n": 1,
  "tokens": 50000
}

[5s] llm_response
{
  "t": 5,
  "agent": "builder",
  "event": "llm_response",
  "content": "I will help you build...",
  "tool_calls": ["read_file", "write_file"],
  "finish_reason": "stop"
}

[8s] tool_call
{
  "t": 8,
  "agent": "builder",
  "event": "tool_call",
  "tool": "read_file",
  "args": "{\"path\":\"spec.md\"}",
  "result": "Product specification..."
}

... and 147 more events
```

## Benefits

1. **Debug visibility**: See every Agent decision and action
2. **Performance analysis**: Identify slow tool calls or LLM responses
3. **Issue reproduction**: Exact sequence of events for debugging
4. **Benchmark integration**: Harbor captures trace via stderr
5. **Session history**: Post-mortem analysis of Agent behavior

## Advanced Usage

### Custom Events

```javascript
trace.custom('milestone', {
  phase: 'planning_complete',
  decisions: ['use_react', 'single_file']
});
```

### Reading Traces Programmatically

```javascript
const trace = writer.readTrace();

// Analyze tool usage
const toolCalls = trace.filter(e => e.event === 'tool_call');
const toolsUsed = {};
for (const call of toolCalls) {
  toolsUsed[call.tool] = (toolsUsed[call.tool] || 0) + 1;
}

console.log('Tool usage:', toolsUsed);
```

### Performance Metrics

```javascript
const trace = writer.readTrace();

// Calculate iteration times
const iterations = trace.filter(e => e.event === 'iteration');
const avgIterationTime = iterations.length > 1 ?
  (iterations[iterations.length-1].t - iterations[0].t) / iterations.length : 0;

console.log('Avg iteration time:', avgIterationTime, 's');
```

## Source

Derived from Harness Engineering's `TraceWriter`:
https://github.com/lazyFrogLOL/Harness_Engineering

Reference: `agents.py` TraceWriter class