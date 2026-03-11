# ml-sys

Machine learning systems and tooling.

## Projects

- **rs-tensor** — Rust tensor/linear algebra library (see [rs-tensor/](rs-tensor/)).

## Setup

- **Rust (rs-tensor):** `cd rs-tensor && cargo build`

## Docs (rs-tensor)

We build docs as we go; the project follows a learning arc (tensor → autograd → inference → curiosity).

- **Roadmap**: [rs-tensor/docs/ml-rust-project.md](rs-tensor/docs/ml-rust-project.md) — phases, checklists, readings, notes.
- **Learning book**: [rs-tensor/docs/README.md](rs-tensor/docs/README.md) — table of contents; chapters 1–3 cover Phase 1 (tensor from scratch). New chapters added as we move into Phase 2+.
- **API docs**: from the `rs-tensor` directory run `cargo doc --open` to generate docs from code comments.
