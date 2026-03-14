# Playground Build Plan

## Phase 1 — Prove the pipeline

**Goal:** Browser → WebSocket → Node bridge → stdio → rs-tensor MCP → result back. One cell, raw text output.

### What to build:
1. **Bridge server** (`site/bridge/`)
   - `package.json` with `ws` and `@modelcontextprotocol/sdk`
   - `server.ts`: WebSocket on port 3001, spawns rs-tensor binary, routes messages
   - `mcp-client.ts`: wraps the MCP stdio client — `initialize()`, `callTool(name, args)`
2. **Playground page** (`site/src/pages/Playground.tsx`)
   - One textarea (no CodeMirror yet — keep it simple)
   - A "Run" button
   - An output `<pre>` block
   - Hard-coded to send MCP tool calls (e.g., type `tensor_create("a", [1,2,3,4], [2,2])` and it calls the tool)
3. **Socket.io hook** (`site/src/hooks/useBridge.ts`)
   - Connect to `http://localhost:3001` via `socket.io-client`
   - `sendMcpCall(tool, args) → Promise<string>` using Socket.io ack callbacks
4. **Route** — add `/playground` to App.tsx

### Test it works:
- Start bridge: `cd site/bridge && npx tsx server.ts`
- Start site: `cd site && npm run dev`
- Open `/playground`, type `tensor_create("test", [1,2,3,4], [2,2])`, click Run
- See the MCP response text in the output area

### This tells us:
- The bridge can spawn and talk to the MCP process
- The browser can talk to the bridge
- The round-trip works end to end

---

## Phase 2 — Real editor and multi-cell

**Goal:** Feels like a notebook. CodeMirror, multiple cells, TS eval.

### What to build:
1. **Install CodeMirror** — `@uiw/react-codemirror` + `@codemirror/lang-javascript`
2. **CellEditor component** — wraps CodeMirror with JS/TS language, dark theme, Shift+Enter
3. **NotebookCell component** — editor + toolbar (run, delete, type toggle) + output area
4. **useNotebook hook** — manages array of cells, add/remove/reorder/execute
5. **TS eval on bridge** — `eval-context.ts`: persistent `vm.Context`, `runCode(code) → result`
6. **Cell type toggle** — switch between "TS" and "MCP" mode per cell

### Test it works:
- Create a TS cell: `const x = 42; x * 2` → output: `84`
- Create another TS cell: `x + 1` → output: `43` (shared state!)
- Create an MCP cell: `tensor_create("a", [1,2,3], [3])` → output: raw text
- Mix and match

---

## Phase 3 — Inline visualization

**Goal:** Tensor results render as grids, autograd results render as graphs.

### What to build:
1. **result-parser.ts** — detect output type (tensor, graph, scalar, error, text)
2. **TensorResultViz** — extract grid rendering from ShapeExplorer, show shape + colored data grid
3. **AutogradGraphViz** — reuse GradientFlow/SimpleGraph patterns for inline computation graphs
4. **CellOutput router** — pick the right renderer based on result type
5. **MCP DSL parser** (`mcp-dsl.ts`) — parse `tensor_create("a", ...)` shorthand into structured tool calls

### The hard part here:
MCP tools return human-readable strings like `"Created tensor 'a': shape=[2,2], data=[1,2,3,4]"`. Need regex to extract structured data for the viz. Longer term: modify the Rust tools to return structured JSON alongside the text.

---

## Phase 4 — Polish

**Goal:** Feels good to use daily.

### What to build:
1. **Keyboard shortcuts** — Shift+Enter (run + next), Cmd+Enter (run + stay), Up/Down navigation
2. **localStorage persistence** — save/load notebook state so you don't lose work on refresh
3. **Example notebooks** — pre-built notebooks loaded from JSON files:
   - "Tensor Basics" — create, reshape, transpose, matmul
   - "Build a Neuron" — autograd_expr, forward/backward
   - "Attention Mechanism" — attention_forward with different inputs
4. **Cell reordering** — drag or move-up/move-down buttons
5. **Reset button** — clear all state (vm context + MCP tensor store)
6. **Loading states** — spinner/pulse while cell is executing

---

## What's hard vs easy

### Easy
- Socket.io server in Node (~30 lines)
- CodeMirror React integration (well-documented single component)
- Rendering tensor grids (ShapeExplorer code exists)
- Route and sidebar integration (copy existing pattern)
- TS eval with `vm.runInContext()` (built into Node)
- localStorage save/load (JSON.stringify the cell array)

### Hard
- **Parsing MCP text output into structured data.** Tools return strings, not JSON. Need regex for each tool's output format. Fix: eventually modify Rust tools to also return structured data.
- **TS ↔ MCP shared state.** Keeping the vm context in sync with the MCP tensor store. MVP: one-way sync (MCP results injected into TS context as read-only `tensors` object).
- **TypeScript (not just JavaScript).** Node `vm` only runs JS. Need `esbuild.transform()` to strip type annotations. Adds one dependency but is sub-millisecond. MVP: just use plain JS.
- **Error isolation.** A thrown error in one cell shouldn't crash the bridge. Need try/catch everywhere in the eval path.

### Not worth building (yet)
- Autocomplete for MCP tool names (nice but not MVP)
- Cell output diffing / incremental updates
- Collaborative editing
- Exporting notebooks as files
- Running cells in parallel

---

## Dependencies to add

**Frontend (site/package.json):**
```
@uiw/react-codemirror
@codemirror/lang-javascript
socket.io-client
```

**Bridge (site/bridge/package.json — new):**
```
socket.io
@modelcontextprotocol/sdk
```

**Optional (Phase 2+):**
```
esbuild          # for TypeScript → JavaScript stripping in eval
```
