# Running and configuration

All commands assume the working directory is **`rs-tensor/`** (the crate that contains `Cargo.toml` for the MCP binary).

## Build the binary

```bash
cargo build --bin mcp
```

Release build:

```bash
cargo build --release --bin mcp
```

The executable is `target/debug/mcp` or `target/release/mcp`.

## Transport A — stdio (default)

With no HTTP bind configured, `src/bin/mcp.rs` serves MCP over **stdin/stdout**. This is what most desktop clients (Claude Code, Cursor-style MCP) expect: they spawn the process and speak JSON-RPC over pipes.

Example manual smoke (single `initialize` line):

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}' | ./target/debug/mcp
```

### Claude Code / Cursor-style config (stdio)

Use **`command` + `args` + `cwd`**, not `url`. Example shape (adjust `cwd` to your clone path):

```json
{
  "mcpServers": {
    "rs-tensor": {
      "command": "cargo",
      "args": ["run", "--bin", "mcp"],
      "cwd": "/path/to/ml-sys/rs-tensor"
    }
  }
}
```

For faster startup after you trust the binary, point `command` at `target/release/mcp` instead of `cargo run`.

## Transport B — HTTP (streamable)

If either:

- **`--http <addr>`** is passed (e.g. `--http 0.0.0.0:4001`), or  
- **`MCP_HTTP_BIND`** is set to a non-empty address,

then the server uses **streamable HTTP** instead of stdio. Implementation: `run_http` in `src/bin/mcp.rs`.

- **MCP endpoint:** `http://<bind>/mcp`
- **Health:** `GET /health` → plain text `ok`

Example:

```bash
MCP_HTTP_BIND=127.0.0.1:4001 ./target/release/mcp
# or
./target/release/mcp --http 127.0.0.1:4001
```

Repo root [`.mcp.json`](../../../.mcp.json) shows a client pointing at `http://127.0.0.1:4001/mcp`.

### Optional API key (HTTP)

If **`MCP_API_KEY`** is set to a non-empty string, requests to `/mcp` must include the key:

- Header **`x-api-key: <key>`**, or  
- Header **`Authorization: Bearer <key>`**

Otherwise the server returns **401**. If `MCP_API_KEY` is unset or empty, auth is disabled.

## Environment variables summary

| Variable | Effect |
|----------|--------|
| `MCP_HTTP_BIND` | If non-empty, same as `--http` (HTTP mode). |
| `MCP_API_KEY` | If non-empty, required for HTTP `/mcp` requests (see above). |

## Working directory matters

- **`read_file`** paths are relative to the **`rs-tensor/`** project root (the directory containing this crate’s `Cargo.toml`).
- **GGUF / LLaMA paths** in tools are passed to `std::fs::File::open`: use paths valid from the server’s current working directory, or absolute paths.

When spawning via `cargo run`, ensure **`cwd`** is `rs-tensor/` so relative paths and any code that assumes the crate root behave consistently.

## Process lifecycle

- One OS process = one tensor store + one optional LLaMA model.
- Restarting the process clears everything.
- HTTP mode uses a **stateless** streamable config (`stateful_mode: false` in code); each session implementation detail is handled by `rmcp` — still assume **fresh tensor store per server instance** unless you verify otherwise for your client.

---

*Next: [02-tools-reference.md](02-tools-reference.md).*
