# Playground Notes

Interactive tools for experimenting with ML concepts in the browser, connected to the rs-tensor MCP.

## Current state

- **REPL** (`/playground`) — working. JS eval + MCP tools, basic tensor/autograd viz, toolbar, settings, IndexedDB persistence.
- **Learning Arc** (`/learn/1-8`) — 8 chapters rewritten with TryThis buttons, mini projects, floating Claude prompts.
- **Tool Reference** (`/reference`) — expandable docs for every MCP tool.
- **Claude Skills** — 5 commands in `.claude/commands/` (quiz, walkthrough, debug, experiment, run-neuron).
- **Visualizer** — planned, not built. Rich interactive viz for complex MCP results.

## Documents

- **[architecture.md](./architecture.md)** — REPL design: three layers, Web Worker, stateless bridge.
- **[build-plan.md](./build-plan.md)** — Phases 0-4 (all complete): structured MCP output, bridge, REPL, viz, persistence.
- **[ui-and-viz.md](./ui-and-viz.md)** — REPL interaction model, output rendering, keyboard shortcuts.
- **[testing-and-observability.md](./testing-and-observability.md)** — Test strategy, observability MCP design.
- **[chapter-rework.md](./chapter-rework.md)** — Chapter restructure plan, tone guide, mini projects.
- **[visualizer.md](./visualizer.md)** — Rich viz page: attention heatmaps, autograd graphs, MLP diagrams from real MCP data.
