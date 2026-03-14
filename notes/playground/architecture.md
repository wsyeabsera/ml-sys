# Playground Architecture

## The problem

We have an rs-tensor MCP server with all the ML tools (tensors, autograd, attention, GGUF, LLaMA). We have a React learning site. We want to experiment interactively — run code, see results, visualize tensors — without leaving the browser. Like Jupyter, but for our project.

## Why we need a bridge

The MCP server uses **stdio transport** — it reads JSON-RPC from stdin and writes to stdout. A browser can't spawn processes. So we need a thin server-side process that:

1. Speaks **WebSocket** to the browser (browser-friendly).
2. Speaks **stdio** to the rs-tensor MCP binary (spawns it as a child process).
3. Can also **evaluate TypeScript/JavaScript** for TS cells (Node's `vm` module).

This is the "bridge server" — a small Node.js process (~150 lines) that sits between browser and MCP.

## Architecture diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (React App on Vite dev server, port 5173)            │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  /playground page                                       │  │
│  │                                                         │  │
│  │  Cell 1 [CodeMirror]  →  Output: text / tensor viz      │  │
│  │  Cell 2 [CodeMirror]  →  Output: autograd graph          │  │
│  │  Cell 3 [CodeMirror]  →  Output: JSON / error            │  │
│  │   ...                                                    │  │
│  └───────────────┬────────────────────────────────────────┘  │
│                  │ WebSocket (Socket.io on localhost:3001)             │
└──────────────────┼────────────────────────────────────────────┘
                   │
┌──────────────────┼────────────────────────────────────────────┐
│  Bridge Server (Node.js, port 3001)                            │
│                  │                                             │
│  ┌───────────────▼───────────────┐                            │
│  │  WebSocket handler             │                            │
│  │  - receives cell execution     │                            │
│  │  - routes to TS eval or MCP    │                            │
│  └───────┬──────────────┬────────┘                            │
│          │              │                                      │
│  ┌───────▼──────┐  ┌───▼──────────────────┐                  │
│  │  TS Evaluator │  │  MCP Client           │                  │
│  │  (vm.Context, │  │  (spawns rs-tensor    │                  │
│  │   shared      │  │   binary, sends       │                  │
│  │   across      │  │   JSON-RPC over       │                  │
│  │   cells)      │  │   stdin/stdout)       │                  │
│  └──────────────┘  └───────────────────────┘                  │
│                              │ stdio                           │
└──────────────────────────────┼─────────────────────────────────┘
                               │
┌──────────────────────────────┼─────────────────────────────────┐
│  rs-tensor MCP (Rust binary)  │                                 │
│  - tensor ops, autograd, attention, gguf, llama                 │
│  - same binary Claude Code / Cursor already uses                │
└────────────────────────────────────────────────────────────────┘
```

## Wire protocol (browser <-> bridge via Socket.io)

Socket.io instead of raw WebSocket. Why:
- **Auto-reconnection** — bridge restarts (rebuilt rs-tensor, server crash) and the browser reconnects without page refresh.
- **Acknowledgement callbacks** — `socket.emit("eval", data, (result) => ...)` gives us request/response for free. No manual message ID tracking.
- **Event-based API** — `socket.on("result")`, `socket.on("ready")` instead of parsing a generic `onmessage` handler.
- Negligible bundle size difference for a learning project.

```typescript
// Browser → Bridge (events with ack callbacks)
socket.emit("eval", { cellId, code }, (response) => ...);
socket.emit("mcp_call", { cellId, tool, args }, (response) => ...);
socket.emit("reset");

// Bridge → Browser (server-pushed events)
socket.on("ready")                    // MCP spawned and initialized
socket.on("cell_stream", { cellId, chunk })  // Optional: streaming output

// Ack response shape (same for eval and mcp_call)
type AckResponse =
  | { ok: true; output: string; structured?: unknown }
  | { ok: false; error: string };
```

The ack pattern is perfect here — the browser sends a cell execution request and gets the result back in the same callback. No need for separate "result" events or message ID matching.

## Bridge server file structure

```
site/bridge/
  package.json          # deps: socket.io, @modelcontextprotocol/sdk
  server.ts             # Entry: Socket.io server + message routing
  mcp-client.ts         # Spawn rs-tensor, JSON-RPC over stdio
  eval-context.ts       # vm.Context management, TS cell eval
  protocol.ts           # Shared message types (also used by frontend)
```

## Why Node.js for the bridge

- We already have a Node/TS toolchain for the site.
- Node can spawn the rs-tensor binary and pipe stdio.
- Node's `vm` module gives us a shared JS context for cells (like Jupyter's kernel).
- The `@modelcontextprotocol/sdk` package has `StdioClientTransport` ready to use.
- Socket.io gives us reconnection, ack callbacks, and event routing out of the box.

## Alternative considered: SSE transport in Rust

We could add `transport-sse` to the Rust MCP server and have the browser talk to it directly over HTTP/SSE. This eliminates the bridge but:
- Requires modifying the Rust binary to serve HTTP.
- Loses TypeScript eval (would need browser-side eval, which is more limited).
- More work for less flexibility.

**Decision:** Node bridge for now. Revisit SSE if the bridge becomes a bottleneck.

## How the Vite dev server and bridge coexist

- Vite runs on port 5173 (or whatever it's configured to).
- Bridge runs on port 3001.
- The browser connects to the bridge via `Socket.io on localhost:3001`.
- In development, you run both: `npm run dev` (Vite) and `npm run bridge` (Node bridge).
- Later, could add a Vite plugin or `concurrently` script to start both at once.
