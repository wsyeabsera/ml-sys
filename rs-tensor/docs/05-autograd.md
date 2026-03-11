# Chapter 5 — The autograd engine

## What is autograd?

When training a neural network, you need gradients — "if I nudge this weight, how does the output change?" Computing these by hand for a long chain of operations would be brutal. Autograd does it automatically:

1. **Forward pass**: compute the output, recording every operation in a graph.
2. **Backward pass**: walk the graph in reverse, applying the chain rule at each node.

The result: every input value gets a `.grad` field telling you how the final output changes with respect to that value.

## The `Value` type

Our autograd engine works on **scalars** (single `f32` values), inspired by Karpathy's [micrograd](https://www.youtube.com/watch?v=VMj-3S1tku0). Each `Value` is a node in the computation graph:

```rust
struct ValueData {
    data: f32,       // the number
    grad: f32,       // gradient (filled by backward)
    op: Op,          // what operation created this value
    label: String,   // for debugging
}

pub struct Value(Rc<RefCell<ValueData>>);
```

### Why `Rc<RefCell<...>>`?

This is the key Rust design choice. A computation graph has **shared ownership** — the value `a` might be used in both `a + b` and `a * c`. In garbage-collected languages this is free; in Rust we need:

- **`Rc`** (reference counting): multiple `Value` handles can point to the same node. When the last handle is dropped, the node is freed.
- **`RefCell`**: we need to mutate `.grad` during backward, even though multiple handles exist. `RefCell` gives us runtime-checked mutable borrows.

The trade-off: `Rc` is single-threaded (not `Send`/`Sync`), so our autograd values can't be shared across threads. That's fine for learning — real frameworks use `Arc` and more sophisticated graph management.

## Supported operations

| Operation | Forward | Local gradient (backward) |
|-----------|---------|--------------------------|
| `a + b` | `a.data + b.data` | `da = 1`, `db = 1` |
| `a * b` | `a.data * b.data` | `da = b.data`, `db = a.data` |
| `tanh(a)` | `a.data.tanh()` | `da = 1 - tanh(a)²` |

Each operation is recorded as an `Op` enum variant that stores references to the input values.

## How backward works

When you call `output.backward()`:

1. **Build topological order** — depth-first traversal from the output, visiting each node once. This ensures we process a node only after all its consumers.
2. **Set output gradient to 1.0** — "how does the output change with respect to itself? By 1."
3. **Walk in reverse** — for each node, look at its `Op`, compute the local gradients, and **accumulate** them into the input nodes. Accumulation (using `+=`) is critical — a value used in multiple places gets gradient contributions from all of them.

### Example: gradient accumulation

```
a = 2.0, b = 3.0
c = a * b       → c = 6.0
d = c + a       → d = 8.0
```

When we call `d.backward()`:
- `d.grad = 1.0` (seed)
- `d = c + a`: both `c` and `a` get `+= 1.0`
- `c = a * b`: `a` gets `+= b * c.grad = 3.0 * 1.0 = 3.0`, `b` gets `+= a * c.grad = 2.0 * 1.0 = 2.0`
- Final: `a.grad = 1.0 + 3.0 = 4.0` (from both paths), `b.grad = 2.0`

This is the chain rule in action.

## A single neuron

The classic test: `out = tanh(x1*w1 + x2*w2 + b)`.

```rust
let x1 = Value::new(2.0, "x1");
let w1 = Value::new(-3.0, "w1");
let x2 = Value::new(0.0, "x2");
let w2 = Value::new(1.0, "w2");
let b = Value::new(6.8814, "b");

let out = (&(&(&x1 * &w1) + &(&x2 * &w2)) + &b).tanh();
out.backward();
```

After backward, each weight has a gradient telling you: "to increase the output, adjust this weight in this direction." That's the foundation of gradient descent.

## MCP tools

The autograd engine is exposed through two MCP tools:

| Tool | What it does |
|------|-------------|
| `autograd_neuron` | Run a single neuron (`tanh(sum(xi*wi) + bias)`) and return output + all gradients. |
| `autograd_expr` | Build a custom computation graph from named values and operations, run backward, return all gradients. |

### Design choice: why not store `Value` in the server?

Unlike tensors, `Value` uses `Rc<RefCell<...>>` which isn't `Send` — it can't be held in a `tokio::Mutex` across `.await` points. So instead of persisting autograd state between tool calls, each tool builds the graph, runs forward + backward, and returns everything in one shot. This is actually cleaner: the computation graph is ephemeral by nature.

## Where the code lives

| File | Role |
|------|------|
| `src/autograd.rs` | `Value` struct, `Op` enum, operator overloads, `backward()`, tests. |
| `src/mcp/tools/autograd_ops.rs` | Argument structs for autograd MCP tools. |
| `src/mcp/tools/mod.rs` | Tool implementations (`autograd_neuron`, `autograd_expr`). |

## What's next

The remaining Phase 2 items:

1. **Extend to tensor-level gradients** — make `Tensor` operations track their computation graph so you can backprop through tensor ops (add, mul, matmul) rather than just scalars.

---

*Back to [Table of contents](README.md#table-of-contents). For the full arc, see [ml-rust-project.md](ml-rust-project.md).*
