# ml-sys

Machine learning systems and tooling.

## Projects

- **rs-tensor** — Rust tensor/linear algebra library (see [rs-tensor/](rs-tensor/)).

## Setup

- **Rust (rs-tensor):** `cd rs-tensor && cargo build`

## Docs (rs-tensor)

We build docs as we go so the project doubles as a learning resource.

- **API docs** (from code comments): from the `rs-tensor` directory run  
  `cargo doc --open`  
  to generate and open the API docs in the browser.
- **Learning guide** (concepts and “why”): [rs-tensor/docs/learning.md](rs-tensor/docs/learning.md)  
  explains ownership, iterators, `Debug`, and how the tensor code works for junior devs.
