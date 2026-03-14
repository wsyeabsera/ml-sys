# Playground Build Plan

## Phase 0 — Structured MCP tool output

**Goal:** rs-tensor MCP tools return structured JSON, not just human-readable strings. This is a prerequisite for the playground — without it, we'd be regex-parsing every tool response.

### Why first:
- Every other phase depends on being able to parse tool results.
- Doing this now means we never build the fragile regex parsers.
- It also benefits Claude Code / Cursor — structured output is better for any consumer.

### What to change:
For each tool, the MCP response should include **both** a human-readable `text` field and a structured `data` field. The MCP protocol supports returning multiple content blocks, so we can return text for humans and JSON for machines.

Example: `tensor_create("a", [1,2,3,4], [2,2])` currently returns:
```
"Created tensor 'a': shape=[2, 2], 4 elements"
```

Should return:
```json
[
  { "type": "text", "text": "Created tensor 'a': shape=[2, 2], 4 elements" },
  { "type": "text", "text": "{\"name\":\"a\",\"shape\":[2,2],\"data\":[1,2,3,4]}", "mimeType": "application/json" }
]
```

Or simpler: just return JSON as the text content and let the consumer parse it. The human-readable message is nice-to-have but the playground needs the structured data.

### Tools to update (priority order):
1. `tensor_create`, `tensor_inspect`, `tensor_list` — core tensor tools
2. `tensor_matmul`, `tensor_add`, `tensor_mul`, `tensor_transpose`, `tensor_reshape` — tensor ops
3. `autograd_expr`, `autograd_neuron` — autograd (return node/edge/gradient structures)
4. `attention_forward`, `mlp_forward` — higher-level ops
5. `gguf_inspect`, `llama_inspect` — model inspection (lower priority)

### Tests:
- `cargo test` for each modified tool: response parses as JSON, contains expected fields, human-readable text still present.
- Test in `rs-tensor/tests/mcp_structured_output.rs`.

### Deliverable:
Each tool returns a response with a parseable JSON structure. The playground can render these directly without guessing.

---

## Phase 1 — Prove the pipeline

**Goal:** Type an MCP tool call in the browser, see the structured result. End-to-end proof.

### Build:
1. **Bridge server** (`site/bridge/server.ts`, ~50 lines)
   - Socket.io server on port 3001
   - Spawns rs-tensor MCP binary as child process
   - Forwards tool calls via ack callbacks
   - No eval, no state
2. **Playground page** (`Playground.tsx`)
   - One textarea input, one "Run" button, one output area
   - Routes everything as MCP calls
   - Socket.io client connects to bridge
3. **Connection status** — shows connected/disconnected state
4. **Route** — add `/playground` to App.tsx and sidebar

### Tests:
**Automated (Vitest):**
- Bridge lifecycle: spawns MCP, emits "ready", handles tool calls, returns structured JSON.
- Bridge error handling: invalid tool name → clean error. Missing args → clean error. Not a crash or hang.
- Bridge reconnection: kill MCP process → bridge respawns it → new calls work.
- Concurrent calls: 5 rapid tool calls → all resolve correctly, no response mixing.
- Bridge shutdown: child process is killed, no orphans.

**Manual (chrome-devtools MCP):**
- Open `/playground`, see connected status, type a tool call, see result.

### Test files:
```
site/tests/bridge/mcp-lifecycle.test.ts
site/tests/bridge/protocol.test.ts
site/tests/bridge/reconnection.test.ts
site/tests/bridge/concurrent.test.ts
```

---

## Phase 2 — Web Worker eval + REPL shell

**Goal:** Feels like a terminal. TS eval works. History scrolls.

### Build:
1. **Web Worker** (`workers/eval-worker.ts`)
   - Persistent scope (variables survive across executions)
   - Receives code, evals, returns result
   - Catches errors cleanly
2. **useEvalWorker hook** — manages worker lifecycle, `sendEval(code) → Promise<result>`
3. **useRepl hook** — manages history, dispatches to eval worker or bridge based on auto-detection
4. **ReplInput** — CodeMirror with Shift+Enter to execute, auto-growing height, command history (Up/Down)
5. **ReplOutput** — scrolling list of input/output entries
6. **Auto-detection** — input starts with known MCP tool name → bridge, else → Web Worker
7. **useBridge hook** — Socket.io connection, blocks MCP calls when disconnected with clear error

### Tests:
**Automated (Vitest):**
- Worker eval: `2 + 2` → `4`. Expressions, statements, errors all handled.
- Worker scope: `const x = 10` then `x * 3` → `30`. Variables persist.
- Worker recovery: `throw new Error("boom")` → error result, next eval still works, scope intact.
- Worker edge cases: `undefined` result handled, very long output truncated, async expressions.
- Auto-detection: `tensor_create(...)` → MCP route. `2 + 2` → JS route. `const tensor_create = 5` → JS route.
- MCP shorthand parser: `tensor_create("a", [1,2,3,4], [2,2])` → correct structured tool call. Malformed input → clean error.

**Manual (chrome-devtools MCP):**
- Full REPL interaction: type JS, type MCP calls, see history scroll, Up/Down for command history.

### Test files:
```
site/tests/worker/eval.test.ts
site/tests/worker/scope.test.ts
site/tests/worker/recovery.test.ts
site/tests/lib/mcp-shorthand.test.ts
site/tests/lib/auto-detect.test.ts
```

---

## Phase 3 — Visualization

**Goal:** Tensor results render as grids, autograd as graphs. Not raw JSON.

### Build:
1. **result-parser.ts** — detect output type from structured JSON (tensor, graph, number, array, error)
2. **TensorViz** — compact tensor grid (extract rendering from ShapeExplorer)
3. **GraphViz** — inline 2D autograd graph (reuse GradientFlow/SimpleGraph patterns)
4. **Output routing** — ReplOutput picks the right renderer per result type
5. **Collapsible large outputs** — preview + "show more" for big tensors

### Tests:
**Automated (Vitest):**
- Result parser: tensor JSON → type "tensor". Graph JSON → type "graph". Number → "number". Error → "error".
- Result parser edge cases: empty object, null, missing fields → falls back to "text".

**Manual (chrome-devtools MCP):**
- Tensor viz renders correctly (screenshot + inspect).
- Graph viz renders nodes and edges.
- Large tensor collapses properly.

### Test files:
```
site/tests/lib/result-parser.test.ts
```

---

## Phase 4 — Persistence and polish

**Goal:** Actually enjoyable to use daily.

### Build:
1. **IndexedDB session storage** (via `idb`)
   - Auto-save commands as you type them
   - Restore command history on page load (greyed out, re-runnable)
   - Named sessions (optional)
2. **Clear** — `clear` command or Ctrl+L
3. **Loading indicator** — pulsing dot while executing
4. **Error styling** — red left border, clear messages
5. **MCP tool discovery** — fetch `tools/list` on connect, use for auto-detection
6. **Bridge reconnection UX** — smooth reconnection with status updates

---

## Cross-cutting: Observability MCP

**Built alongside Phase 1, evolved through all phases.** Not a separate phase — it grows with the bridge.

### Phase 1 addition:
- Bridge maintains a ring buffer of log entries (last 500) in memory.
- Structured logging: every MCP call, every Socket.io event, every error gets a log entry with timestamp, level, category, and structured data.
- Observability MCP endpoint: `--mcp` flag on the bridge starts a stdio MCP server that exposes `playground://status`, `playground://logs`, `playground_health` tool.
- Add to `.mcp.json` so Claude can connect.

### Phase 2 addition:
- `playground://messages` resource: recent message history (last 50 in/out).
- `playground_recent_errors` tool: last N errors with full context.

### Phase 4 addition:
- `playground_message_log` tool: filter by type, tool name, time range.
- `playground_restart_mcp` tool: restart the rs-tensor process.
- `/debug-playground` Claude skill: auto-checks health, recent errors, connection state.

### Test files:
```
site/tests/bridge/observability.test.ts     # Log buffer works, status resource returns valid data
```

---

## What's easy vs hard

### Easy
- Socket.io server with MCP child process (~50 lines)
- Web Worker with persistent eval scope
- CodeMirror React integration
- REPL history (just an array)
- Route/sidebar integration
- IndexedDB with `idb` wrapper
- Connection status indicator

### Hard
- **Phase 0: Modifying Rust tool output.** Need to touch every tool handler in rs-tensor. Not conceptually hard, just tedious. But it's the foundation — skip this and everything downstream is fragile.
- **Auto-detection accuracy.** Edge cases where input looks like a tool name but isn't. Escape hatch: prefix syntax if needed.
- **Visualization components.** Extracting reusable pieces from ShapeExplorer and GradientFlow. The logic exists but needs to be factored out into playground-friendly components.

### Not building (yet)
- TS ↔ MCP shared state (separate worlds for now)
- MCP tools as async functions in the worker (future idea, documented in architecture.md)
- Tab completion for tool names/args
- Notebook export/import
- esbuild-wasm for real TypeScript (MVP uses plain JS)

---

## Dependencies

**Frontend (site/package.json):**
```
socket.io-client
@uiw/react-codemirror
@codemirror/lang-javascript
idb
```

**Bridge (site/bridge/package.json):**
```
socket.io
@modelcontextprotocol/sdk
```

**Testing (site dev dependencies):**
```
vitest
```

**Later:**
```
esbuild-wasm    # TypeScript → JavaScript in the Web Worker
```
