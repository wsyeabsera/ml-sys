# Cell Types and Execution Model

## Two cell types

### 1. TypeScript cells

Write real JavaScript/TypeScript. Evaluated in a shared `vm.Context` on the bridge server so variables persist across cells — just like Jupyter.

```typescript
// Cell 1
const weights = [0.5, -0.3, 0.8, 0.1];
const input = [1.0, 2.0, 3.0, 4.0];

// Cell 2 (can see weights and input from Cell 1)
const dot = weights.reduce((sum, w, i) => sum + w * input[i], 0);
dot  // → 2.3
```

**How it works:**
- Code is sent to the bridge server.
- Bridge runs it in `vm.runInContext()` with a persistent context object.
- The last expression's value is returned as the cell output.
- Errors are caught and returned as error output.

**TypeScript support:** Node's `vm` only runs JavaScript. For actual TypeScript syntax (type annotations, interfaces), use `esbuild.transform()` to strip types before eval. This is sub-millisecond and only adds `esbuild` as a bridge dependency. For the MVP, plain JavaScript works fine.

### 2. MCP tool cells

Call rs-tensor MCP tools directly. Two syntax options:

**Option A: Shorthand DSL** (feels like code)
```
tensor_create("a", [1, 2, 3, 4], [2, 2])
tensor_transpose("a", "a_T")
tensor_matmul("a", "a_T", "result")
tensor_inspect("result")
```

**Option B: Structured call** (explicit)
```json
{ "tool": "tensor_create", "args": { "name": "a", "data": [1,2,3,4], "shape": [2,2] } }
```

The shorthand DSL is nicer. The parser maps positional args to named args per tool (a static config). For example, `tensor_create(name, data, shape)` → `{ name, data, shape }`.

**How it works:**
- Cell content is parsed into a tool name + args.
- Bridge sends a JSON-RPC `tools/call` to the rs-tensor process over stdio.
- Result string is returned to the browser.
- If the result looks like tensor data, the frontend renders it as a viz.

## Shared state between cell types

This is the tricky part. The MCP server has its own tensor HashMap. The TS eval context is separate. We want them to talk to each other.

**MCP → TS direction:**
When an MCP tool creates or inspects a tensor, the bridge can inject the result into the vm context. For example, after `tensor_create("a", ...)`, the bridge calls `tensor_inspect("a")` and sets `context.tensors.a = { shape: [2,2], data: [1,2,3,4] }` in the vm. Then TS cells can do:

```typescript
// After MCP cell created tensor "a"
tensors.a.shape  // → [2, 2]
tensors.a.data   // → [1, 2, 3, 4]
```

**TS → MCP direction:**
Harder. If a TS cell computes `const myData = [1, 2, 3, 4]`, we'd need to send it to the MCP as a tensor. Could expose a helper in the vm context:

```typescript
await mcp.tensor_create("b", myData, [2, 2]);
```

This sends a message back to the bridge's MCP client. But for the MVP, keep it simple: TS cells do JS math, MCP cells do tensor ops. They share read access (TS can see MCP results) but don't need to write back.

## Cell state model

```typescript
type Cell = {
  id: string;
  type: "ts" | "mcp";
  code: string;
  output: CellOutput | null;
  status: "idle" | "running" | "done" | "error";
};

type CellOutput = {
  text: string;              // Raw text output (always present)
  structured?: unknown;      // Parsed JSON if available (for viz routing)
  vizType?: "tensor" | "graph" | "scalar" | "text";  // Hint for renderer
};
```

## Execution order

Cells execute **sequentially**, top to bottom, when you "Run All." Individual cells can be run standalone (Shift+Enter), but they may reference state from earlier cells. This matches Jupyter behavior — running cells out of order can give stale results.

## Available MCP tools for playground

These are the tools from the rs-tensor MCP that make sense in a playground:

| Tool | What it does | Good for playground? |
|------|-------------|---------------------|
| `tensor_create` | Create a named tensor with data and shape | Yes — core |
| `tensor_inspect` | Show tensor details | Yes — core |
| `tensor_matmul` | Matrix multiply two tensors | Yes — core |
| `tensor_add` / `tensor_mul` | Element-wise ops | Yes |
| `tensor_reshape` | Change shape | Yes |
| `tensor_transpose` | Transpose a tensor | Yes |
| `tensor_get` / `tensor_get_2d` | Index into tensor | Yes |
| `tensor_list` | List all tensors in store | Yes |
| `autograd_expr` | Build and differentiate a computation graph | Yes — key for learning |
| `autograd_neuron` | Run a single neuron forward + backward | Yes |
| `autograd_neuron_tensor` | Neuron with tensor ops | Yes |
| `attention_forward` | Run attention mechanism | Yes |
| `mlp_forward` | Run MLP forward pass | Yes |
| `gguf_inspect` | Inspect a GGUF model file | Maybe |
| `llama_load` / `llama_generate` | Load and run LLaMA | Maybe (heavy) |
| `cargo_exec` | Run arbitrary Rust code | Yes — escape hatch |
