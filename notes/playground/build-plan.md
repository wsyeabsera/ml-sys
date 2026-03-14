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

### Test:
```
Start bridge: cd site/bridge && npx tsx server.ts
Start site:   cd site && npm run dev
Open /playground
Type: tensor_create("a", [1,2,3,4], [2,2])
See: structured JSON response
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

### Test:
```
2 + 2                                       → 4 (Web Worker)
const x = 10                                → (no output, but x is now defined)
x * 3                                       → 30 (persistent scope!)
tensor_create("a", [1,2,3,4], [2,2])       → structured JSON (bridge)
Up arrow                                    → recalls previous command
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

### Test:
```
tensor_create("a", [1,2,3,4], [2,2])       → colored 2×2 grid with shape badge
autograd_expr(...)                           → node graph with gradients
[1,2,3].map(x => x*2)                       → syntax-highlighted JSON array
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

**Later:**
```
esbuild-wasm    # TypeScript → JavaScript in the Web Worker
```
