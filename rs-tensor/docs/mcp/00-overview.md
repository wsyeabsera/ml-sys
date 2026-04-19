# Overview — what this MCP server is

## Purpose

The **rs-tensor MCP server** exposes the **rs-tensor** Rust crate through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/): tools an LLM client can discover and call, plus optional **resources** (files, tensors as JSON) and **prompts** (starter messages for teaching/debugging).

Think of it as a **remote brain for tensors**: create named tensors, run ops, train small MLPs, run CNN forward passes, inspect GGUF files, and (if you provide a compatible model) run LLaMA inference — all driven by structured JSON over MCP instead of writing Rust in the loop.

## Capabilities (protocol level)

The server advertises:

- **Tools** — primary surface (create tensors, matmul, training, etc.)
- **Resources** — read-only URIs for markdown chapters, `tensor.rs`, and live `tensor://{name}` snapshots
- **Prompts** — `explain_tensor_op`, `debug_shape_mismatch`, `learning_guide`

Implementation: `rs-tensor/src/mcp/mod.rs` (`ServerCapabilities`).

## Mental model: named handles

MCP calls are **stateless JSON in / JSON out**. You cannot pass a Rust `Tensor` by reference across calls. The server therefore keeps a **process-local map**:

`name: String → Tensor`

Tools take names (e.g. `a`, `b`, `result_name`) and read/write this store. Names are the **only stable handles** your agent should rely on between tool calls.

A second piece of state is optional:

- **At most one LLaMA model** loaded from GGUF (`llama_load`), plus vocabulary for tokenization.

## What runs where

- **Your agent** (Claude, another LLM, or a script using an MCP SDK) decides *which* tool to call and with *what* arguments.
- **The MCP server process** holds tensors and the optional LLaMA weights in RAM.
- **No automatic persistence:** restarting the server clears all named tensors and unloads the model.

## When to use which surface

| Goal | Prefer |
|------|--------|
| Quick tensor math | Tools: `tensor_create`, `tensor_add`, `tensor_matmul`, … |
| Teach concepts / roadmap | Resources: `docs://…` or prompt `learning_guide` |
| Inspect live tensor JSON | Resource `tensor://{name}` after `tensor_create` |
| Build or run the crate | `cargo_exec` (limited subcommands; see limitations doc) |
| Full LLaMA inference | `llama_load` + `llama_generate` (requires real Llama GGUF) |

## Security note

Tools can **read files under the `rs-tensor` project** (`read_file`) and run **`cargo build` / `cargo run`** (`cargo_exec`). Treat the server as trusted with respect to that working tree. HTTP mode can enforce an API key; see [01-running-and-configuration.md](01-running-and-configuration.md).

---

*Next: [01-running-and-configuration.md](01-running-and-configuration.md).*
