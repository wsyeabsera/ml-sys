# Chapter 3 — Ownership and references

## The idea

In Rust, every value has a single **owner**. When you pass a value to a function by value, ownership moves and the caller can’t use it anymore. When you pass a **reference** (`&T`), you borrow: the function can read (or mutate, with `&mut T`) without taking ownership.

We use references so that methods can **read** our tensors without consuming them.

## Where we use it

### In `add`

In `src/tensor.rs`:

```rust
pub fn add(&self, other: &Tensor) -> Tensor
```

- **`&self`** — We borrow the tensor we’re called on. We don’t take ownership, so `t1` is still valid after `t1.add(&t2)`.
- **`other: &Tensor`** — We borrow the other tensor too; we only read from it.
- **`-> Tensor`** — We return a **new** tensor. We don’t modify `self` or `other`; we allocate a new `Tensor` with the summed data.

So in `main.rs`, when we write:

```rust
let t3 = t1.add(&t2);
```

`t1` and `t2` are still usable afterward because we only passed references. If `add` took `self` and `other` by value, they would be moved in and we couldn’t use them again.

### In `main`

When we call `Tensor::new(vec![1.0, 2.0, 3.0], vec![3])`, we pass ownership of those `Vec`s into the tensor. The tensor **owns** its `data` and `shape`; nothing else does.

## Takeaway

- **By value** → ownership moves; the caller loses the value.
- **By reference (`&T`)** → we borrow; the caller keeps the value and we can only read (or mutate with `&mut T`).

Next: [Chapter 4 — Debug and printing](04-debug-and-printing.md)
