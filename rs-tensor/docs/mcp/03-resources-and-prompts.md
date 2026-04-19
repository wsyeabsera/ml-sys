# Resources and prompts

## Resources (read-only)

Resources are listed by the MCP `resources/list` flow and read via `resources/read` with a **URI**.

Implementation: `rs-tensor/src/mcp/resources/mod.rs`.

### Static documentation (`docs://`)

| URI | File (under `rs-tensor/`) |
|-----|---------------------------|
| `docs://readme` | `docs/README.md` |
| `docs://getting-started` | `docs/01-getting-started.md` |
| `docs://big-picture` | `docs/02-the-big-picture.md` |
| `docs://codebase-and-next-steps` | `docs/03-codebase-and-next-steps.md` |
| `docs://mcp-server` | `docs/04-mcp-server.md` |
| `docs://roadmap` | `docs/ml-rust-project.md` |

MIME type: `text/markdown` for doc entries.

**Template:** `docs://{slug}` is advertised so clients can substitute `slug` (e.g. `getting-started`, `mcp-server`). Unknown slugs error at read time.

### Source (`source://`)

| URI | Content |
|-----|---------|
| `source://tensor.rs` | Full `src/tensor.rs` (Rust source) |

### Dynamic tensors (`tensor://`)

For each entry in the in-memory tensor map, the server exposes:

`tensor://{name}`

Reading returns pretty-printed JSON:

```json
{
  "name": "...",
  "shape": [...],
  "data": [...]
}
```

MIME type `application/json`. If the name is missing, you get an MCP invalid-params style error.

**Agent tip:** After `tensor_create`, you can either `tensor_inspect` or fetch `tensor://{name}` for the same data in a resource-shaped package.

---

## Prompts

Prompts are small **template messages** the client can pull to seed a user or assistant turn. Implementation: `rs-tensor/src/mcp/prompts/mod.rs`.

| Prompt name | Arguments | Purpose |
|-------------|-----------|---------|
| `explain_tensor_op` | `operation` (string) | Asks for a step-by-step explanation with a numeric example (2×3). |
| `debug_shape_mismatch` | `shape_a`, `shape_b`, `operation` | Asks why shapes conflict and how to fix (reshape, etc.). |
| `learning_guide` | (none) | Embeds **`docs/ml-rust-project.md`** (read at prompt time from relative path `docs/ml-rust-project.md`). If the server’s cwd is not the crate/repo root, the roadmap may fall back to `"Roadmap file not found."` |

**Operational note:** For `learning_guide`, run the MCP server with **current directory** set to `rs-tensor/` (or ensure `docs/ml-rust-project.md` resolves) so the roadmap loads correctly.

---

## How agents should use this

1. **Onboarding:** Fetch `docs://getting-started` + `docs://roadmap` (or use `learning_guide` prompt when cwd is correct).
2. **Debugging shapes:** Use `debug_shape_mismatch` or `explain_tensor_op` instead of inventing ad-hoc system text.
3. **Auditing state:** `tensor_list` + `tensor://` reads for JSON snapshots.

---

*Next: [04-agents-and-workflows.md](04-agents-and-workflows.md).*
