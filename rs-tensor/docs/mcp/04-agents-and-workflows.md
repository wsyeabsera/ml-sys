# Agents and workflows

This document is for **you** (or another developer) building **Claude agents**, custom orchestrators, or MCP-driven scripts on a second machine. It does not assume a specific framework beyond “LLM + MCP tools”.

## Design principles

1. **Names are handles** — Every tensor the agent cares about must be created or produced as a **named** entry in the server store (`tensor_create`, or op results via `result_name`). The agent should track a small **symbol table** (on paper or in context): e.g. `X`, `W`, `b`, `loss_grad`.
2. **Order matters** — `train_mlp` depends on dataset tensors and `init_mlp` weight prefixes. Always call tools in a dependency order; verify errors and retry with corrected names.
3. **Minimize round-trips** — Batch logical steps in one assistant turn where your client allows multiple tool calls; still respect causal order (create before use).
4. **Verify with inspect** — After non-trivial ops, `tensor_inspect` or `tensor_list` catches shape mistakes early.

## Suggested system prompt (sketch)

You can paste/adapt this for a “tensor lab” subagent:

> You have access to the rs-tensor MCP tools. Tensor state lives **only in the MCP server process**; names are stable handles. Always use `tensor_create` or an op’s `result_name` before referring to a tensor. Prefer `tensor_inspect` after reshaping or matmul. For file paths, `read_file` is relative to the `rs-tensor` crate root. `cargo_exec` only accepts `"build"` or `"run"`. For LLaMA, you must `llama_load` a compatible GGUF first. If a tool errors, read the message and adjust shapes or paths — do not invent tensor names that were never created.

Tighten or relax based on your safety needs (file read / cargo).

## Workflow recipes

### A. Exploratory tensor math

1. `tensor_create` with small shapes.
2. `tensor_add` / `tensor_matmul` / … with explicit `result_name`.
3. `tensor_inspect` on results.

### B. Teach a concept (pedagogy)

1. `resources/read` `docs://big-picture` or chapter docs.
2. Optional: MCP prompt `explain_tensor_op` with `operation` = `matmul` | `reshape` | …
3. Ground with numeric `tensor_create` + `tensor_inspect`.

### C. XOR / toy classification

1. `create_dataset` with `type: xor`.
2. `init_mlp` with `architecture: [2, hidden, 1]` matching dataset widths.
3. `train_mlp` with the returned `*_inputs` / `*_targets` names.
4. `evaluate_mlp` then `mlp_predict` on manual inputs.

### D. CNN smoke test

1. `init_cnn` with a small spec matching your image size (see [limitations](05-limitations-and-troubleshooting.md) for shape math).
2. `tensor_create` input NCHW.
3. `cnn_forward` with the same model prefix.

### E. GGUF inspection (no LLaMA)

1. `gguf_inspect` on path.
2. `gguf_load_tensor` for a tensor name you need in Rust-side math (only if shapes/dtypes align with later ops).

### F. Full LLaMA (heavy)

1. Obtain a **Llama-format** GGUF with expected tensor names (see `LlamaModel::from_gguf` in `src/llama.rs`).
2. `llama_load` — may take significant RAM and time.
3. `llama_generate` with small `max_tokens` first.
4. `llama_inspect` to confirm config.

## Multi-agent split (optional)

- **Teacher agent:** resources + prompts + `read_file` on docs; avoids training tools.
- **Lab agent:** tensor + training tools only; same MCP server so they share the tensor store if using one process (be careful about concurrent writes — server uses a mutex, but logically separating tasks reduces confusion).

## Testing without Claude

- Use **Cursor / Claude Code** with MCP enabled (stdio config).
- Or hit **HTTP** mode with an MCP-compatible client/SDK and the same tool names.
- For CI-style checks, run `cargo test` in `rs-tensor` (library tests); MCP-specific integration tests can shell out to the binary if you add them later.

## Naming conventions (recommended)

- Prefix experiment names: `exp1_X`, `exp1_grad`, …
- Use **lower_snake_case** to match JSON examples and avoid spaces in `tensor://` URIs.

---

*Next: [05-limitations-and-troubleshooting.md](05-limitations-and-troubleshooting.md).*
