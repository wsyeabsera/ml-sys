# Chapter 3 — Phase 1 checklist and next steps

This chapter ties the **book** to the **roadmap**. The full learning arc and checklists live in **[ml-rust-project.md](ml-rust-project.md)**. Here we focus on Phase 1 and what to do next.

---

## Phase 1 — Tensor from scratch

Build a strided n-dimensional array with basic ops and correct memory layout.

| Task | Status |
|------|--------|
| `Tensor` struct: `Vec<f32>` + shape | Done |
| `new` constructor with invariant assertions | Partially done (we have `new`; we could add assertions that `data.len() == product(shape)`) |
| `get` for 2D (row-major index formula) | Not started |
| Generalize `get` to N dimensions → derive strides | Not started |
| Basic ops: add, mul (elementwise) | add done; mul not started |
| Reshape, transpose | Not started |

So far we have: a tensor with `data` and `shape`, `new`, and element-wise `add`. The next steps on the path are:

1. **`get` for 2D** — Implement indexing for a 2D tensor using the row-major formula: index = `i * cols + j` (or with strides: `i * strides[0] + j * strides[1]`).
2. **Strides and N-dimensional `get`** — Derive strides from shape (e.g. for shape `[2, 3]`, strides might be `[3, 1]` in row-major). Then implement `get` for an arbitrary number of indices so we can index into any dimension.
3. **Element-wise `mul`** — Same pattern as `add`: zip, map, collect.
4. **Reshape** — Return a new tensor that shares or reinterprets the same `data` with a different shape (product of new shape must match current size).
5. **Transpose** — Swap dimensions; layout/strides change accordingly.

---

## File layout

| File | Role |
|------|------|
| `src/bin/main.rs` | Entry point: creates tensors, calls ops, prints. |
| `src/bin/mcp.rs` | MCP server binary: wires `TensorServer` to stdio transport. |
| `src/tensor.rs` | `Tensor` struct and methods (`new`, `add`, and eventually `get`, `mul`, `reshape`, `transpose`). |
| `src/lib.rs` | Library root: re-exports `tensor` and `mcp` modules. |
| `src/mcp/mod.rs` | MCP server: tool implementations and `ServerHandler`. |
| `src/mcp/tools/` | Argument structs for MCP tools. |
| `docs/README.md` | This book’s table of contents and link to the roadmap. |
| `docs/01-getting-started.md` … `04-mcp-server.md` | Phase 1 chapters. |
| `docs/ml-rust-project.md` | **The roadmap**: phases, checklists, readings, notes. |

---

## Phase 1 reading

From the roadmap: **[Matrix Calculus You Need for Deep Learning](https://arxiv.org/abs/1802.01528)**. Useful when we do gradients and autograd later, and for intuition about shapes and layout.

---

*Back to [Table of contents](README.md#table-of-contents). For the full arc and later phases, see [ml-rust-project.md](ml-rust-project.md).*
