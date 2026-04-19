# rs-tensor MCP — documentation index

This folder is the **handbook** for the `rs-tensor-mcp` server: what it can do, how to run it, how to wire it into Claude (or other MCP clients), and how to design **agents** that use tensors, training, and inference tools safely.

The shorter **Chapter 4** intro in the learning book is still [../04-mcp-server.md](../04-mcp-server.md). Use this directory when you need depth: full tool lists, HTTP auth, agent patterns, and caveats.

---

## Read order

| Doc | Audience | Contents |
|-----|----------|----------|
| [00-overview.md](00-overview.md) | Everyone | Capabilities, mental model, what “state” means |
| [01-running-and-configuration.md](01-running-and-configuration.md) | Operators | stdio vs HTTP, env vars, health check, client config |
| [02-tools-reference.md](02-tools-reference.md) | Agent authors | All **36 tools** by category, parameters, dependencies |
| [03-resources-and-prompts.md](03-resources-and-prompts.md) | Agent + IDE | `docs://`, `tensor://`, prompts, learning content |
| [04-agents-and-workflows.md](04-agents-and-workflows.md) | Agent builders | Workflows, system prompts, multi-step patterns, testing |
| [05-limitations-and-troubleshooting.md](05-limitations-and-troubleshooting.md) | Debugging | Paths, `cargo run`, LLaMA/GGUF, known quirks |

---

## Quick facts

- **Server name (MCP):** `rs-tensor-mcp` (from `get_info`)
- **Binary:** `cargo run --bin mcp` (from `rs-tensor/`)
- **Transports:** stdio (default) or HTTP streamable (`--http` / `MCP_HTTP_BIND`)
- **State:** In-memory named tensors + optional one loaded LLaMA model per process

---

## Related repo files

| Path | Role |
|------|------|
| `rs-tensor/src/bin/mcp.rs` | Entry: stdio or HTTP |
| `rs-tensor/src/mcp/mod.rs` | `TensorServer`, capabilities |
| `rs-tensor/src/mcp/tools/mod.rs` | Tool implementations |
| `rs-tensor/src/mcp/resources/mod.rs` | Resources (`docs://`, `tensor://`, …) |
| `rs-tensor/src/mcp/prompts/mod.rs` | MCP prompts |
| `.mcp.json` (repo root) | Example HTTP client URL |
| `.claude/settings.json` | Example Claude Code stdio spawn (adjust `cwd`) |

---

*For the learning arc and roadmap, see [../ml-rust-project.md](../ml-rust-project.md).*
