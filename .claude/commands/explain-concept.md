---
description: Pick a concept from the ml-sys learning arc and get a deep explanation with examples
---

Explain a concept from the rs-tensor learning arc in depth.

## MCP tools used
- `read_file` — read relevant source files and documentation
- `tensor_create`, `tensor_inspect` — create live examples to illustrate concepts
- `autograd_expr` — demonstrate autograd concepts with live computation

## Parameters
- $ARGUMENTS — the concept to explain (e.g., "strides", "backward pass", "Rc<RefCell>", "matmul gradient", "row-major layout")

## Behavior
1. Read the relevant doc chapter and source code using `read_file`
2. Explain the concept in plain language, focusing on WHY not just WHAT
3. Create a live example using MCP tools to demonstrate the concept
4. Ask the user a question to check understanding before moving on
5. Connect the concept to the bigger picture (how it matters at scale)
