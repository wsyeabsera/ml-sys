# Playground Notes

Interactive tools for experimenting with ML concepts in the browser, connected to the rs-tensor MCP.

## Current state

- **REPL** (`/playground`) — working. Terminal-style, JS eval + MCP tools, inline tensor/autograd viz, toolbar, settings, IndexedDB persistence.
- **Chapter rework** — planned. Restructure from 10 static chapters to 8 interactive ones with "Try this" buttons linking to REPL, mini projects, and personality.

## Key decisions

- **REPL is separate from docs.** Chapters link *to* the REPL via "Try this" buttons. The REPL has no doc content in it.
- **No IDE.** We considered a multi-file workspace and killed it — Cursor already does that better. The REPL is the unique thing.
- **Chapters become "LEARN" arc.** 8 chapters (down from 10), each ending with a mini project using the REPL.
- **Ch3 (Phase Recap) removed. Ch4 (MCP Server) moved to Misc.** Not learning content.

## Documents

- **[architecture.md](./architecture.md)** — REPL design: three layers, Web Worker, stateless bridge.
- **[build-plan.md](./build-plan.md)** — Phases 0-4 (all complete): structured MCP output, bridge, REPL, viz, persistence.
- **[ui-and-viz.md](./ui-and-viz.md)** — REPL interaction model, output rendering, keyboard shortcuts.
- **[testing-and-observability.md](./testing-and-observability.md)** — Test strategy, observability MCP design.
- **[chapter-rework.md](./chapter-rework.md)** — Chapter restructure: new arc, TryThis component, mini projects, tone guide.
