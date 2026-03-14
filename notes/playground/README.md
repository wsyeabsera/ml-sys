# Playground Notes

A REPL-style playground in the React site, connected to the rs-tensor MCP.

Write JS expressions or call MCP tools directly. Results render inline as text, tensor grids, or autograd graphs. Like a terminal, but with viz.

## Key decisions

- **REPL, not notebook.** Append-only, no stale state, no cell management.
- **Web Worker for JS eval.** Isolated, instant, no server round-trip. Persistent scope across executions.
- **Stateless bridge.** Node process that only proxies MCP calls over stdio. No eval, no state.
- **Structured MCP output (Phase 0).** Modify Rust tools to return JSON so the playground can render viz without regex parsing.
- **IndexedDB for persistence.** Save commands only, not outputs. Re-run to regenerate.
- **TS and MCP are separate worlds.** For now. Future idea: MCP tools as async functions in the worker.
- **Socket.io** for browser-bridge communication. Auto-reconnection, ack callbacks.
- **Shift+Enter to execute.** Enter adds newlines. No ambiguity.
- **No React component tests.** Use chrome-devtools MCP for visual/UI verification instead.
- **Test the invisible parts.** Bridge, worker, protocol, parsers — properly tested with Vitest.
- **Observability MCP.** Exposes bridge logs, status, message history so Claude can debug the playground.

## Documents

- **[architecture.md](./architecture.md)** — Three-layer design (UI → Execution Engine → MCP Proxy), Web Worker eval, stateless bridge, connection handling, file structure.
- **[build-plan.md](./build-plan.md)** — Phase 0 (structured MCP output) through Phase 4 (polish), what's hard vs easy, dependencies.
- **[ui-and-viz.md](./ui-and-viz.md)** — REPL interaction model, auto-detection, output rendering, tensor/graph viz, CodeMirror setup, keyboard shortcuts, IndexedDB persistence.
- **[testing-and-observability.md](./testing-and-observability.md)** — Test strategy (bridge, worker, parsers), observability MCP design (logs, status, message history), skills for debugging.
