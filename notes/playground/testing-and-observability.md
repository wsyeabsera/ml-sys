# Testing and Observability

## Philosophy

We're vibecoding, but we want confidence in the **invisible parts** — the bridge, the worker, the protocol, the plumbing. If something breaks, we want to know *where* and *why* without `console.log` spelunking.

- **React components: skip unit tests.** We have the chrome-devtools MCP — we can screenshot, inspect DOM, check console errors, audit performance in real time. That's better than snapshot tests.
- **Bridge, worker, protocol, parsers: test properly.** These are the parts where bugs are silent and hard to find visually.
- **Observability MCP: build it.** An MCP server that exposes the playground's internal state so Claude can help debug issues by inspecting logs, connection status, message history, and worker state.

## What to test

### 1. Bridge server (highest priority)

This is the scariest part — child processes, stdio pipes, Socket.io framing. If this breaks, nothing works and the error could be anywhere.

**Test with:** Vitest, running against the actual bridge server (spawn it in beforeAll, tear down in afterAll). These are integration tests, not mocks.

```
tests/bridge/
  mcp-lifecycle.test.ts     # MCP process spawns, initializes, handles tool calls
  reconnection.test.ts      # MCP process dies, bridge respawns it, client reconnects
  protocol.test.ts          # Malformed messages, missing args, unknown tools → clean errors
  concurrent.test.ts        # Multiple rapid tool calls don't interleave or deadlock
```

**What to assert:**
- Bridge starts and emits "ready" event
- Tool call round-trips correctly (send tensor_create, get structured JSON back)
- MCP process crash → bridge detects, respawns, emits "disconnected" then "ready"
- Invalid tool name → clean error response, not a crash
- Missing args → clean error, not a hang
- Multiple rapid calls → all resolve correctly (no response mixing)
- Bridge shutdown → MCP child process is killed (no orphans)

### 2. Web Worker eval (high priority)

The worker is isolated but stateful. Need to verify scope persistence, error recovery, and message protocol.

**Test with:** Vitest. The worker logic can be tested as a plain module (extract the eval function, test it directly without the worker message layer).

```
tests/worker/
  eval.test.ts              # Basic eval: expressions, statements, errors
  scope.test.ts             # Variable persistence across evals
  recovery.test.ts          # Eval throws → worker still alive, scope intact
  edge-cases.test.ts        # Infinite loops (timeout), undefined results, async
```

**What to assert:**
- `2 + 2` → `4`
- `const x = 10` then `x * 3` → `30` (scope persists)
- `throw new Error("boom")` → error result, next eval still works
- `undefined` result → handled cleanly (no output, not "undefined" string)
- `[1,2,3].map(x => x*2)` → `[2,4,6]` (complex expressions work)
- Very long output → truncated or handled (no OOM)

### 3. Protocol and parsers (medium priority)

Pure functions, easy to test, high value. These are the "glue" that can silently corrupt data.

**Test with:** Vitest, pure unit tests.

```
tests/lib/
  mcp-shorthand.test.ts    # Parse DSL → structured tool call
  result-parser.test.ts     # Detect output type from structured JSON
  auto-detect.test.ts       # Input routing: MCP tool name vs JS expression
```

**What to assert for MCP shorthand parser:**
- `tensor_create("a", [1,2,3,4], [2,2])` → `{ tool: "tensor_create", args: { name: "a", data: [1,2,3,4], shape: [2,2] } }`
- `tensor_inspect("a")` → `{ tool: "tensor_inspect", args: { name: "a" } }`
- `autograd_expr(...)` → correct arg mapping
- Malformed input → clear parse error, not silent corruption
- Edge cases: strings with parens, nested arrays, trailing commas

**What to assert for result parser:**
- `{ shape: [2,2], data: [1,2,3,4] }` → type "tensor"
- `{ nodes: [...], edges: [...] }` → type "graph"
- `42` → type "number"
- `"hello"` → type "string"
- `{ error: "..." }` → type "error"

**What to assert for auto-detection:**
- `tensor_create(...)` → MCP route
- `2 + 2` → JS route
- `const tensor_create = 5` → JS route (it's an assignment, not a call)
- `tensor_create` alone (no parens) → JS route? Or error? Define the behavior.

### 4. Structured MCP output (Phase 0)

When we modify the Rust tools to return JSON, add tests in rs-tensor.

**Test with:** `cargo test` in the rs-tensor crate.

```
rs-tensor/tests/
  mcp_structured_output.rs   # Each tool returns valid JSON alongside text
```

**What to assert:**
- Each tool's response can be parsed as JSON
- JSON contains the expected fields (shape, data, nodes, edges, etc.)
- Human-readable text is still present (backwards compatible)
- Error responses are also structured

## What NOT to test

- React component rendering (use chrome-devtools MCP instead)
- CSS/styling (visual, use screenshots)
- CodeMirror behavior (well-tested library, don't re-test it)
- Socket.io internals (well-tested library)
- Framer-motion animations

## Observability MCP

A small MCP server that exposes the playground's internal state. Claude (or us via tools) can inspect what's happening without digging through logs.

### Why an MCP, not just console.log

- Claude can read MCP resources/tools directly — it can't read browser console output unless we use chrome-devtools MCP.
- Structured data, not string parsing.
- Can build skills on top: "/debug-playground" that automatically checks status, recent errors, message history.
- The observability MCP reads from the bridge (where the interesting failures happen), not from the browser.

### What it exposes

**Resources:**
- `playground://status` — bridge connection state, MCP process state (pid, uptime, alive), Socket.io client count
- `playground://logs` — last N log entries with timestamps, levels, and structured data
- `playground://messages` — recent message history (last 50 messages in/out with timestamps)
- `playground://worker` — worker state (alive, last eval time, scope variable names)

**Tools:**
- `playground_health` — quick health check: bridge up? MCP alive? Any recent errors?
- `playground_recent_errors` — last N errors with full context (which tool call failed, what the input was, stack trace)
- `playground_message_log` — filter message history by type, tool name, time range
- `playground_restart_mcp` — restart the rs-tensor MCP process (recovery tool)

### Where it runs

The observability MCP is a **second mode of the bridge server**, not a separate process. The bridge already has all the state we want to expose. Add MCP server capability alongside the Socket.io server.

Alternatively: a separate lightweight MCP binary that reads from a shared log file or IPC channel. But co-locating with the bridge is simpler — it directly accesses the bridge's internal state.

### Architecture

```
Bridge Server (Node.js)
  ├── Socket.io server (port 3001)     → serves the playground browser
  ├── MCP stdio client                  → talks to rs-tensor
  ├── Internal state store              → logs, messages, status
  └── MCP stdio server (observability)  → Claude Code connects to this
        ├── playground://status
        ├── playground://logs
        ├── playground://messages
        └── playground_health tool
```

Claude Code's `.mcp.json` gets a new entry:
```json
"playground-debug": {
  "command": "npx",
  "args": ["tsx", "site/bridge/server.ts", "--mcp"],
  "cwd": "/Users/yab/Projects/ml-sys"
}
```

Or if the bridge is already running, the observability MCP connects to it via IPC/HTTP rather than embedding in the same process.

### Log format

```typescript
interface LogEntry {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  category: "bridge" | "mcp" | "socket" | "eval";
  message: string;
  data?: unknown;    // structured context
}
```

The bridge maintains a ring buffer of the last 500 log entries in memory. The observability MCP reads from this buffer. No files, no external logging system.

### Skills we can build on top

Once the observability MCP exists:

- **`/debug-playground`** — "Check playground health. Read status, recent errors, last few messages. Diagnose what's wrong."
- **`/replay-session`** — "Read message history, re-execute the failing sequence, identify where it broke."
- **`/inspect-bridge`** — "Show me the bridge state: how many clients connected, is the MCP process alive, what's the last tool call that went through."

## Test file structure

```
site/
  tests/
    bridge/
      mcp-lifecycle.test.ts
      reconnection.test.ts
      protocol.test.ts
      concurrent.test.ts
    worker/
      eval.test.ts
      scope.test.ts
      recovery.test.ts
    lib/
      mcp-shorthand.test.ts
      result-parser.test.ts
      auto-detect.test.ts
  vitest.config.ts            # Vitest config for the playground tests

rs-tensor/
  tests/
    mcp_structured_output.rs  # Rust tests for Phase 0
```

## Test runner

**Vitest** for everything TypeScript (bridge, worker, parsers). It's already the standard for Vite projects, has good worker support, and runs fast.

**cargo test** for the Rust-side structured output tests.

No Playwright/Cypress for now — the chrome-devtools MCP covers E2E visual verification better for our workflow (Claude can screenshot and check).
