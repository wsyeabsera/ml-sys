---
description: Build the rs-tensor Rust project and run tests
---

Build the Rust project and report results.

## MCP tools used
- `cargo_exec` — run `cargo build` or `cargo run`

## Parameters
- $ARGUMENTS — "build", "run", or "test" (default: "build")

## Behavior
1. Run `cargo_exec` with the requested subcommand
2. If build succeeds, report success and binary location
3. If build fails, parse the error output and explain the issue
4. Suggest fixes for common errors (type mismatches, borrow checker, missing imports)
5. If "test" requested, run `cargo_exec` with appropriate arguments and summarize pass/fail
