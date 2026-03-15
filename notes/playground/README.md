# Playground Notes

Interactive tools for experimenting with ML concepts in the browser, connected to the rs-tensor MCP.

## Current state

- **REPL** (`/playground`) — working. JS eval + MCP tools, output persistence, "Open in Visualizer" links.
- **Visualizer** (`/visualize`) — 5 rich viz types: tensor explorer, autograd graph, neuron graph, attention heatmap, MLP diagram.
- **Learning Arc** (`/learn/1-8`) — 8 chapters with TryThis, PredictExercise (18 exercises), mini projects, Claude prompts.
- **Tests** — 78 automated tests across parsers, eval engine, and bridge integration.
- **Claude Skills** — quiz-me, walk-through-chapter, debug-my-understanding, experiment.

## Next: Training & Projects

Documented in **[next-phase-training.md](./next-phase-training.md)**:
- 6 new MCP tools: create_dataset, init_mlp, mse_loss, train_mlp, evaluate_mlp, mlp_predict
- Training visualization (loss curves, dataset scatter plots)
- 4 project pages: Train AND, XOR Problem, Tiny Language Model, Attention Explorer
- Design decisions: in-place weight updates, MVP without streaming, both pages + skills

## All documents

- **[architecture.md](./architecture.md)** — REPL design: three layers, Web Worker, stateless bridge.
- **[build-plan.md](./build-plan.md)** — Phases 0-4 (all complete).
- **[ui-and-viz.md](./ui-and-viz.md)** — REPL interaction model, output rendering.
- **[testing-and-observability.md](./testing-and-observability.md)** — Test strategy, observability MCP design.
- **[chapter-rework.md](./chapter-rework.md)** — Chapter restructure plan, tone guide.
- **[visualizer.md](./visualizer.md)** — Rich viz page design (all phases complete).
- **[next-phase-training.md](./next-phase-training.md)** — Training tools, project pages, design decisions.
