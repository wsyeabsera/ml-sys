---
description: Create and manipulate tensors interactively via the rs-tensor MCP server
---

Tensor Playground: an interactive session for creating, inspecting, and operating on tensors.

## MCP tools used
- `tensor_create` — create named tensors from data + shape
- `tensor_inspect` — show shape, strides, data
- `tensor_list` — list all tensors in memory
- `tensor_add`, `tensor_mul`, `tensor_matmul` — operations
- `tensor_reshape`, `tensor_transpose` — shape manipulation
- `tensor_get`, `tensor_get_2d` — element access

## Parameters
- $ARGUMENTS — free-form description of what tensors to create or operations to perform

## Behavior
1. Parse the user's request to determine which tensors to create and what operations to run
2. Create tensors via `tensor_create`, naming them descriptively
3. Run requested operations, showing intermediate results via `tensor_inspect`
4. After each operation, display the result tensor's shape, strides, and data
5. If the user asks to "explore" a shape, create a tensor and show how reshape/transpose change it
6. Explain what's happening at each step — this is a learning tool, not just a calculator
