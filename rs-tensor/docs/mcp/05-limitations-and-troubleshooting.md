# Limitations and troubleshooting

## Tensor store

- **Ephemeral:** Restarting the MCP process drops all tensors and unloads LLaMA.
- **`tensor_list` completeness:** Some intermediate tensors produced by ops may not appear in every list implementation path; if a name is missing from the list but operations succeed, use `tensor_inspect` or `tensor://{name}` to confirm existence.
- **Concurrency:** The store is behind `tokio::sync::Mutex`. Concurrent tool calls are serialized; heavy training still blocks other ops on that server instance.

## Paths

- **`read_file`:** Relative to **`rs-tensor/`** (the crate root), not the monorepo root (unless your tree matches that layout). Example: use `Cargo.toml`, `src/tensor.rs`, `docs/README.md`.
- **GGUF paths (`gguf_*`, `llama_load`):** Passed to the OS `open`. Prefer **absolute paths** for reproducibility, or ensure the server’s **cwd** matches what you intend for relative paths.

## `cargo_exec`

- Only **`build`** and **`run`** are allowed.
- **`cargo run`** without `default-run` in `Cargo.toml` fails when multiple binaries exist (`main`, `mcp`, `generate`). The tool does not pass `--bin`; fix by using `cargo build` or extending the MCP tool in code if you need `cargo run --bin …`.

## Datasets

- `create_dataset` documents `spiral`, but the implementation may reject unknown types — stick to **`and`**, **`or`**, **`xor`**, **`circle`** until the code and docs match.

## LLaMA / GGUF

- **`gguf_inspect` / `gguf_load_tensor`** work on arbitrary valid GGUF files (subject to parser support).
- **`llama_load` requires a full Llama-compatible GGUF**: metadata keys such as `llama.embedding_length`, `llama.block_count`, and tensor names like `token_embd.weight`, `blk.0.attn_q.weight`, etc. A minimal test GGUF used only for parser tests will **not** load as LLaMA.
- **`llama_generate`** needs a loaded model; tokenization for `prompt` text is naive (whitespace split + vocab lookup) — see `src/mcp/tools/mod.rs` around `llama_generate`.

## CNN / `cnn_forward`

- `init_cnn` stores weights with predictable prefixes (`{name}_conv{i}_weight`, `{name}_fc{i}_weight`, …).
- `cnn_forward` reconstructs the forward path by scanning for those tensors; complex architectures must match what the forward pass actually implements (conv → relu → optional pool per layer block, then flatten, then FC). If layer geometry is wrong, you’ll get explicit errors (e.g. FC input features mismatch).

## HTTP mode

- Set **`MCP_API_KEY`** in production so `/mcp` is not world-writable on your LAN.
- Health check **`GET /health`** is outside the key middleware (no key required).

## Cursor / streamable HTTP / Cloudflare Tunnel

If the MCP client logs **SSE stream** or **Internal Server Error** when using a **remote HTTPS** URL (e.g. Cloudflare quick tunnel):

1. Confirm the server process is up and **`GET https://<host>/health`** returns `ok`.
2. Confirm the tunnel forwards to the same port as **`MCP_HTTP_BIND`** (e.g. `4001`).
3. If the server uses **`MCP_API_KEY`**, add matching **`headers`** in `.mcp.json` (see [01-running-and-configuration.md](01-running-and-configuration.md)).
4. Try **`http://127.0.0.1:4001/mcp`** on the machine running the server to isolate tunnel vs. app issues.
5. Streamable HTTP + SSE behavior can differ by client version; upgrading Cursor or switching to **stdio** (`command` + `cargo run --bin mcp`) avoids HTTP/SSE entirely for local work.

## Prompt `learning_guide`

- Reads `docs/ml-rust-project.md` via a **relative path** from the server process cwd. If the roadmap is empty or wrong, run the server with **`cwd = rs-tensor/`**.

---

## Quick diagnostic checklist

| Symptom | Check |
|---------|--------|
| `Tensor 'foo' not found` | Call `tensor_create` or op with `result_name` first; typo in name. |
| Shape mismatch | `tensor_inspect` both inputs; use `tensor_reshape` or fix matmul inner dims. |
| `read_file` not found | Path relative to `rs-tensor/`, not repo root. |
| LLaMA missing metadata | File is not a full Llama export; use `gguf_inspect` to see keys. |
| 401 on HTTP | Set `x-api-key` or `Authorization: Bearer` to match `MCP_API_KEY`. |

---

*Back to [README.md](README.md) index.*
