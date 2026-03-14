# Playground Architecture

## Context

This is part of the `ml-sys` learning project. We have:
- **rs-tensor**: a Rust tensor library with an MCP server exposing tools for tensor ops, autograd, attention, GGUF, and LLaMA (stdio transport, spawned as a child process).
- **site**: a React learning site (Vite + TypeScript + Tailwind + framer-motion) with 10 chapters and viz components (ShapeExplorer, GradientFlow, ComputationGraph3D, etc.).

The playground is a new page in the React site that lets you call these MCP tools interactively and see results rendered inline.

## Design principles

1. **UI and logic are separate.** React components know nothing about eval or MCP. They receive results and render them.
2. **Browser owns all state.** Code, history, eval context — all in the browser. Server side is stateless.
3. **The bridge is dumb.** It only proxies MCP calls over stdio. No eval, no state, no logic.
4. **TypeScript runs in a Web Worker.** Isolated from the main thread, can't crash the page, no server round-trip.
5. **MCP tools return structured JSON.** We modify the Rust tools (Phase 0) so the playground doesn't have to parse human-readable strings.

## Three layers

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: UI (React)                                             │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  REPL Component                                            │  │
│  │  - Input editor (CodeMirror, Shift+Enter to execute)       │  │
│  │  - Output history (scrolling list of results)              │  │
│  │  - Viz renderers (tensor grids, graphs, text)              │  │
│  │  - Connection status indicator                             │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│                         │ calls                                   │
│  ┌──────────────────────▼────────────────────────────────────┐  │
│  │  Layer 2: Execution Engine (all in browser)                │  │
│  │                                                            │  │
│  │  ┌──────────────────┐  ┌───────────────────────────────┐ │  │
│  │  │  Web Worker       │  │  MCP Client (Socket.io)       │ │  │
│  │  │  - TS/JS eval     │  │  - sends tool calls to bridge │ │  │
│  │  │  - persistent     │  │  - receives structured JSON   │ │  │
│  │  │    scope across   │  │  - auto-reconnects            │ │  │
│  │  │    executions     │  │  - blocked when disconnected  │ │  │
│  │  └──────────────────┘  └──────────────┬────────────────┘ │  │
│  └───────────────────────────────────────┼────────────────────┘  │
└──────────────────────────────────────────┼───────────────────────┘
                                           │ Socket.io
┌──────────────────────────────────────────┼───────────────────────┐
│  Layer 3: MCP Proxy (Node.js, stateless)  │                       │
│                                           │                       │
│  ┌────────────────────────────────────────▼───────────────────┐  │
│  │  Socket.io server                                          │  │
│  │  - receives tool call requests                             │  │
│  │  - forwards to rs-tensor MCP over stdio                    │  │
│  │  - returns structured JSON results                         │  │
│  │  - NO eval, NO state, NO logic                             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │ stdio                              │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │  rs-tensor MCP (Rust binary, child process)                 │  │
│  │  - tensor ops, autograd, attention, gguf, llama             │  │
│  │  - tools return structured JSON (modified in Phase 0)       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Why Web Worker for eval, not server-side

Original plan had the Node bridge running `vm.runInContext()` for TypeScript cells. Problems with that:
- The bridge becomes stateful (holds a vm context per session).
- Every keystroke round-trips to the server.
- Bridge crash = lost eval state.
- Mixes two concerns (MCP proxying and code execution) in one process.

Web Worker is better because:
- **Isolated.** A bad eval can't freeze the page — worst case the worker crashes and we restart it.
- **No round-trip.** Eval is instant (no network hop to the bridge).
- **Stateless bridge.** Bridge is now just a pipe — trivial to restart, no session state.
- **Persistent scope.** The worker stays alive across executions, so `const x = 42` in one command is visible in the next.
- **TypeScript support.** Bundle `esbuild-wasm` in the worker to strip types before eval (later, not MVP).

## The bridge: as simple as possible

The bridge should be **so dumb that crashing and restarting it has no consequence** beyond a brief reconnection. The only state it holds is the MCP child process, and if that dies, it respawns it.

```
site/bridge/
  package.json              # socket.io, @modelcontextprotocol/sdk
  server.ts                 # ~50 lines: Socket.io + MCP child process
  protocol.ts               # Shared types (also imported by frontend)
```

Start as a separate process (`npx tsx site/bridge/server.ts`). Move to a Vite plugin later if the extra process becomes annoying.

## Socket.io protocol

```typescript
// Browser → Bridge (with ack callbacks)
socket.emit("mcp_call", { tool: string, args: Record<string, unknown> },
  (response: { ok: true, result: ToolResult } | { ok: false, error: string }) => ...
);
socket.emit("reset");  // Restart MCP process

// Bridge → Browser (server-pushed events)
io.emit("ready");        // MCP process spawned and initialized
io.emit("disconnected"); // MCP process died (bridge will respawn)
```

## Connection status and error handling

The playground must handle three states:

| State | What the user sees | What works |
|-------|-------------------|------------|
| **Connected** | Green dot / "Connected" | Everything |
| **Bridge down** | Yellow banner: "Bridge not connected — MCP tools unavailable" | TS eval still works, MCP calls blocked with clear error |
| **MCP process died** | Red flash, then auto-recovery | Bridge respawns MCP, brief interruption |

MCP calls attempted while disconnected should immediately return an error: "Bridge not connected. Start the bridge server and try again." Never silently queue or drop requests.

## TS and MCP: separate worlds (for now)

TypeScript eval and MCP tool calls are **independent**. The Web Worker has its own JS scope. The MCP has its own tensor store in Rust. They don't share state.

This means: `tensor_create("a", ...)` creates a tensor on the Rust side, but `a` in the next TS eval is undefined.

This is fine for the MVP. You use TS for JS math and MCP for tensor ops. They're two tools in the same REPL, not one unified environment.

### Future idea: MCP tools as async functions in the worker

One day, we could expose MCP tools as async functions inside the Web Worker:

```typescript
// In the worker, MCP tools are available as async functions
const result = await mcp.tensor_create("a", [1,2,3,4], [2,2]);
console.log(result.shape); // [2, 2]

// Everything is JS — no separate "MCP mode"
const transposed = await mcp.tensor_transpose("a", "a_T");
```

This would mean the worker sends messages to the main thread, which proxies to the bridge. No auto-detection needed — everything is just JS with MCP tools as async imports.

**Not building this now** — it's a bigger lift (worker ↔ main thread message protocol for async calls). But it's the cleanest long-term model. Documented here so we remember.

## Storage: IndexedDB

Using IndexedDB (via `idb` wrapper, ~1KB) instead of localStorage:
- No 5-10MB size limit.
- Stores structured data (no JSON.stringify/parse for everything).
- Async API (non-blocking).

### What we store

**Code inputs only.** We save the commands you typed, not the outputs. Outputs are ephemeral — re-run to regenerate them. This keeps storage small and avoids stale output problems.

```typescript
// IndexedDB schema
interface Session {
  id: string;
  name: string;          // e.g., "autograd experiments"
  commands: string[];     // ordered list of inputs
  createdAt: number;
  updatedAt: number;
}
```

On page load: restore the last session's commands into the history (shown as greyed-out entries). User can re-run them or start fresh.

**Optional future feature:** also store outputs for full session snapshots. But that's additive — start without it.

## What lives where

| Concern | Where | Why |
|---------|-------|-----|
| Code / command history | Browser (IndexedDB) | Persists across refreshes, no server |
| TS/JS evaluation | Browser (Web Worker) | Instant, isolated, no round-trip |
| MCP tool calls | Bridge → rs-tensor (stdio) | Can't spawn processes from browser |
| Tensor store | rs-tensor MCP process (Rust) | The "database" — only server-side state |
| Output rendering | Browser (React components) | UI concern, stays in UI layer |
| Connection state | Browser (Socket.io auto-manages) | Built-in reconnection |

## File structure

```
site/
  bridge/
    package.json              # socket.io, @modelcontextprotocol/sdk
    server.ts                 # ~50 lines: Socket.io + MCP child process
    protocol.ts               # Shared types

  src/
    pages/
      Playground.tsx           # Page component, renders the REPL

    components/playground/
      Repl.tsx                 # The REPL: input + output history
      ReplInput.tsx            # CodeMirror editor, Shift+Enter to run
      ReplOutput.tsx           # Single output entry (routes to right viz)
      ConnectionStatus.tsx     # Green/yellow/red connection indicator
      TensorViz.tsx            # Tensor shape + data grid
      GraphViz.tsx             # Autograd computation graph

    workers/
      eval-worker.ts           # Web Worker: persistent JS scope, evals code

    hooks/
      useBridge.ts             # Socket.io connection, sendMcpCall()
      useEvalWorker.ts         # Web Worker lifecycle, sendEval()
      useRepl.ts               # REPL state: history, execute dispatch
      useSession.ts            # IndexedDB session persistence

    lib/
      protocol.ts              # Message types (shared with bridge)
      result-parser.ts         # Detect output type for viz routing
      mcp-shorthand.ts         # Parse tensor_create(...) → tool call
      db.ts                    # IndexedDB setup via idb
```
