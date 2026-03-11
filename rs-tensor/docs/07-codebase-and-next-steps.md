# Chapter 7 — Codebase and next steps

## File layout

| File | Role |
|------|------|
| `src/main.rs` | Program entry point: creates tensors, calls `add`, prints the result. |
| `src/tensor.rs` | The `Tensor` struct and its methods (`new`, `add`). |
| `docs/` | This book. `README.md` is the table of contents; `01-getting-started.md` through `07-codebase-and-next-steps.md` are the chapters. |

The **API docs** (`cargo doc`) are generated from the `///` and `//!` comments in `src/`. They’re the reference. This book is the narrative.

## Next steps (ideas)

As you extend the project, add new chapters or update existing ones so the book stays in sync.

- **More operations** — Subtract, scalar multiply, dot product. Each is a good chance to reuse the same iterator style or introduce new concepts.
- **2D and indexing** — Support shape `[rows, cols]` and maybe index with `tensor[[i, j]]` or a getter. That will touch on how we lay out data in the flat `Vec`.
- **Error handling** — Return `Result<Tensor, ShapeError>` instead of panicking on shape mismatch. That’s a good moment to introduce `Result` and `?` in the book.
- **Tests** — Add `#[cfg(test)]` modules in `tensor.rs` or integration tests in `tests/`. Document how you run tests and what you’re testing.

---

*Back to [Table of contents](README.md#table-of-contents).*
