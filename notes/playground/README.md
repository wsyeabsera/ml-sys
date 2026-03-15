# Playground Notes

Interactive tools for experimenting with ML concepts in the browser, connected to the rs-tensor MCP.

## Current state (2026-03-15)

- **REPL** (`/playground`) — JS eval + MCP tools, output persistence, "Open in Visualizer" links.
- **Visualizer** (`/visualize`) — 6 rich viz types: tensor explorer, autograd graph, neuron graph, attention heatmap, MLP diagram, training loss curves.
- **Learning Arc** (`/learn/1-8`) — 8 chapters with TryThis, PredictExercise (18 exercises in ch3/4/5/7), mini projects.
- **Projects** (`/projects/and`, `/projects/xor`) — 2 guided training projects with exercises.
- **Training tools** — 6 new MCP tools: create_dataset, init_mlp, mse_loss, train_mlp, evaluate_mlp, mlp_predict.
- **Tool Reference** (`/reference`) — all 28 MCP tools documented across 7 categories.
- **Tests** — 78+ automated tests (parsers, eval engine, bridge integration).
- **Claude Skills** — quiz-me, walk-through-chapter, debug-my-understanding, experiment.

## Documents

- **[architecture.md](./architecture.md)** — REPL design: three layers, Web Worker, stateless bridge.
- **[build-plan.md](./build-plan.md)** — Phases 0-4 (all complete).
- **[ui-and-viz.md](./ui-and-viz.md)** — REPL interaction model, output rendering.
- **[testing-and-observability.md](./testing-and-observability.md)** — Test strategy, observability MCP design.
- **[chapter-rework.md](./chapter-rework.md)** — Chapter restructure plan, tone guide.
- **[visualizer.md](./visualizer.md)** — Rich viz page design (all phases complete).
- **[next-phase-training.md](./next-phase-training.md)** — Training tools (done), project pages (2 of 4 built).
- **[gap-analysis.md](./gap-analysis.md)** — Current gaps and fixes needed.
