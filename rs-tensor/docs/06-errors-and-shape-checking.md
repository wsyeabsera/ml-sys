# Chapter 6 — Errors and shape checking

## The idea

You can only add two tensors element-wise if they have the same shape. We enforce that at runtime and **panic** if the shapes don’t match. We also need to give the result tensor its own copy of the shape, which in Rust means we need to think about ownership.

## Shape check: `assert_eq!`

At the start of `add` in `src/tensor.rs`:

```rust
assert_eq!(self.shape, other.shape, "shape mismatch for add");
```

- **`assert_eq!(a, b, "message")`** — If `a` and `b` are equal, nothing happens. If they’re not equal, the program **panics**: it prints the message and stops.
- So we only continue if both tensors have the same shape. If a caller passes mismatched shapes, we fail fast with a clear error instead of producing wrong results or crashing later.

Panic is a simple way to handle “this should never happen” cases. Later we might switch to returning **`Result<T, E>`** so callers can handle errors without the process exiting.

## Why we `.clone()` the shape

When we build the result tensor we do:

```rust
Tensor::new(data, self.shape.clone())
```

We’re creating a **new** tensor that should have its own `data` and its own `shape`. We already built a new `data` vector. For `shape`, we have two options:

- **Use `self.shape` by reference** — Then the new tensor would borrow `self`’s shape. That would tie the new tensor’s lifetime to `self` and complicate the API. We’d have to deal with references in the struct.
- **Use `self.shape.clone()`** — We make a copy of the shape (a small `Vec<usize>`) and give it to the new tensor. The new tensor then **owns** its shape. No shared references, no lifetime issues.

So we **clone** the shape to keep ownership simple: each tensor owns its own `data` and `shape`. The cost is one small allocation for the shape vector, which is cheap for typical shapes.

## Takeaway

- **`assert_eq!`** is a quick way to enforce invariants and panic with a message when they’re violated.
- **`.clone()`** here gives the new tensor its own copy of the shape so we don’t have to share references or complicate the type.

Next: [Chapter 7 — Codebase and next steps](07-codebase-and-next-steps.md)
